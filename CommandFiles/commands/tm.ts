import { UNIRedux, UNISpectra } from "@cassidy/unispectra";
import { defineCommand, defineEntry } from "@cass/define";

// ══════════════════════════════════════════════════════════════════════════════
// ─── CONSTANTS ────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

const DAILY_LIMIT  = 5;
const TIMEZONE     = "Asia/Dhaka";

// ══════════════════════════════════════════════════════════════════════════════
// ─── HELPERS ──────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

function formatMoney(n: number): string {
  if (isNaN(n) || n === null || n === undefined) return "$0";
  n = Number(n);
  if (n === Infinity)  return "∞$";
  if (n === -Infinity) return "-∞$";
  if (!isFinite(n))    return "NaN$";
  const scales = [
    { value: 1e18, suffix: "Qi" }, { value: 1e15, suffix: "Qa" },
    { value: 1e12, suffix: "T"  }, { value: 1e9,  suffix: "B"  },
    { value: 1e6,  suffix: "M"  }, { value: 1e3,  suffix: "K"  },
  ];
  const s = scales.find(x => Math.abs(n) >= x.value);
  if (s) {
    const sc = (n / s.value).toFixed(2);
    return `${n < 0 ? "-" : ""}${sc.endsWith(".00") ? sc.slice(0, -3) : sc}${s.suffix}$`;
  }
  return `$${n.toLocaleString("en-US")}`;
}

function parseAmount(input: string): number {
  if (!input || typeof input !== "string") return NaN;
  const match = input.trim().toLowerCase().match(/^([\d,.]+)\s*([kmbtq]?)$/i);
  if (!match) return NaN;
  let val = parseFloat(match[1].replace(/,/g, "."));
  const mul: Record<string, number> = { k: 1e3, m: 1e6, b: 1e9, t: 1e12, q: 1e15 };
  if (match[2] && mul[match[2]]) val *= mul[match[2]];
  return isNaN(val) ? NaN : Math.floor(val);
}

function getCurrentDate(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: TIMEZONE });
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ══════════════════════════════════════════════════════════════════════════════
// ─── COMMAND ──────────────════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

const command = defineCommand({
  meta: {
    name: "triplematch",
    otherNames: ["tm", "match3"],
    description: "🎰 Jeu de grille 3×3 — alignez des lignes pour gagner x1, x2 ou JACKPOT (x5)!",
    version: "1.9.0",
    author: "Christus",
    category: "Game",
    usage:
      "{prefix}{name} <mise> — jouer (ex: 5000, 1k)\n" +
      "{prefix}{name} top — classement des meilleurs",
    role: 0,
    noPrefix: false,
    waitingTime: 5,
    requirement: "3.0.0",
    icon: "🎰",
  },
  style: {
    title: "🎰 Triple Match",
    titleFont: "bold",
    contentFont: "fancy",
  },

  entry: defineEntry(async (ctx) => {
    const { input, output, money, api } = ctx;
    const args = input.arguments ?? [];

    // ── TOP leaderboard ────────────────────────────────────────────────────
    if (args[0]?.toLowerCase() === "top") {
      const allCache = await money.getAllCache();
      const sorted = Object.entries(allCache)
        .map(([, u]: [string, any]) => u)
        .filter((u: any) => (u.tmwin1 || 0) > 0)
        .sort((a: any, b: any) => (b.tmwin1 || 0) - (a.tmwin1 || 0))
        .slice(0, 5);

      if (sorted.length === 0) {
        return output.replyStyled(
          { body: `${UNIRedux.charm} Triple Match 📭\n\nAucun gagnant pour le moment.` },
          style
        );
      }

      const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];
      const lines = sorted.map((u: any, i: number) =>
        `${medals[i]} ${u.name || "Joueur"} — 🏅 ${u.tmwin1} victoire(s)`
      ).join("\n");

      return output.replyStyled(
        {
          body:
            `${UNIRedux.charm} 🏆 TOP 5 TRIPLE MATCH\n\n` +
            `━━━━━━━━━━━━━━━━━━━━\n${lines}`,
        },
        style
      );
    }

    // ── Validate bet ───────────────────────────────────────────────────────
    const bet = parseAmount(args[0]);
    if (isNaN(bet) || bet <= 0) {
      return output.replyStyled(
        {
          body:
            `${UNIRedux.arrow} Triple Match ⚠️\n\n` +
            `Mise invalide.\n` +
            `${UNISpectra.arrowFromT} Exemple: \`tm 5000\` ou \`tm 1k\`\n\n` +
            `Multiplicateurs:\n` +
            `• 1ère ligne → ×1\n` +
            `• 2ème ligne → ×2\n` +
            `• 3ème ligne → 🎉 JACKPOT ×5\n\n` +
            `📅 Limite: ${DAILY_LIMIT} parties/jour`,
        },
        style
      );
    }

    // ── Load user data ─────────────────────────────────────────────────────
    let userData: any = await money.getItem(input.senderID);
    if (!userData) userData = { money: 0, name: "Joueur" };
    if (!userData.tmData) userData.tmData = { dailyDate: "", dailyCount: 0, playCount: 0 };

    // ── Daily limit check ──────────────────────────────────────────────────
    const today      = getCurrentDate();
    const tmData     = userData.tmData;
    const sameDay    = today === tmData.dailyDate;
    const curCount   = sameDay ? (tmData.dailyCount || 0) : 0;

    if (curCount >= DAILY_LIMIT) {
      return output.replyStyled(
        {
          body:
            `${UNIRedux.arrow} Triple Match ⏰\n\n` +
            `Limite quotidienne atteinte: ${DAILY_LIMIT} parties/jour.\nRevenez demain!`,
        },
        style
      );
    }

    // ── Balance check ──────────────────────────────────────────────────────
    const userMoney: number = userData.money ?? 0;
    if (userMoney < bet) {
      return output.replyStyled(
        {
          body:
            `${UNIRedux.arrow} Triple Match ❌\n\n` +
            `Solde insuffisant.\n` +
            `${UNISpectra.arrowFromT} Vous avez ${formatMoney(userMoney)}, besoin de ${formatMoney(bet)}.`,
        },
        style
      );
    }

    // ── Generate grid ──────────────────────────────────────────────────────
    const EMOJIS      = ["✅", "❌"];
    const matchedRows: number[] = [];
    const winChance   = Math.random();
    let matchCount    = winChance <= 0.4 ? Math.floor(Math.random() * 3) + 1 : 0;

    while (matchedRows.length < matchCount) {
      const row = Math.floor(Math.random() * 3);
      if (!matchedRows.includes(row)) matchedRows.push(row);
    }

    const buildRow = (i: number): string[] =>
      matchedRows.includes(i)
        ? ["✅", "✅", "✅"]
        : Array.from({ length: 3 }, () => EMOJIS[Math.floor(Math.random() * 2)]);

    const grid = [buildRow(0), buildRow(1), buildRow(2)];

    // ── Compute result ─────────────────────────────────────────────────────
    let resultText      = "";
    let totalMultiplier = 0;

    for (let i = 0; i < 3; i++) {
      const matched = grid[i].every((c) => c === "✅");
      if (matched) {
        if (i === 0) { resultText += `✅ 1ère ligne alignée (×1)\n`;          totalMultiplier += 1; }
        if (i === 1) { resultText += `✅ 2ème ligne alignée (×2)\n`;          totalMultiplier += 2; }
        if (i === 2) { resultText += `🎉 3ème ligne alignée — JACKPOT (×5)\n`; totalMultiplier += 5; }
      } else {
        const ord = i === 0 ? "ère" : "ème";
        resultText += `❌ ${i + 1}${ord} ligne non alignée\n`;
      }
    }

    const won        = bet * totalMultiplier;
    const newBalance = userMoney - bet + won;

    // ── Update data ────────────────────────────────────────────────────────
    if (totalMultiplier > 0) userData.tmwin1 = (userData.tmwin1 || 0) + 1;
    userData.tmData = {
      dailyDate:  today,
      dailyCount: curCount + 1,
      playCount:  (tmData.playCount || 0) + 1,
    };
    await money.setItem(input.senderID, {
      money:  newBalance,
      tmwin1: userData.tmwin1 || 0,
      tmData: userData.tmData,
    });

    // ── Build messages ─────────────────────────────────────────────────────
    const prizeText = totalMultiplier > 0
      ? `💰 Multiplicateur: ×${totalMultiplier}\n💰 Gain: ${formatMoney(won)}`
      : `😢 Aucun alignement — Perte: ${formatMoney(bet)}`;

    const gridRow = (row: string[]) => `│ ${row[0]} │ ${row[1]} │ ${row[2]} │`;

    const anim1 =
      `🎰 Rotation des symboles...\n\n` +
      `┌─────────────┐\n│ ⏳ │ ⏳ │ ⏳ │\n│ ⏳ │ ⏳ │ ⏳ │\n│ ⏳ │ ⏳ │ ⏳ │\n└─────────────┘`;

    const anim2 =
      `🎰 Rotation...\n\n` +
      `┌─────────────┐\n${gridRow(grid[0])}\n│ ⏳ │ ⏳ │ ⏳ │\n│ ⏳ │ ⏳ │ ⏳ │\n└─────────────┘`;

    const anim3 =
      `🎰 Rotation...\n\n` +
      `┌─────────────┐\n${gridRow(grid[0])}\n${gridRow(grid[1])}\n│ ⏳ │ ⏳ │ ⏳ │\n└─────────────┘`;

    const final =
      `🎰 GRILLE FINALE\n\n` +
      `┌─────────────┐\n${gridRow(grid[0])}\n${gridRow(grid[1])}\n${gridRow(grid[2])}\n└─────────────┘\n\n` +
      `${resultText}\n${prizeText}\n\n` +
      `💵 Solde: ${formatMoney(newBalance)}\n` +
      `🕹️ Parties aujourd'hui: ${curCount + 1}/${DAILY_LIMIT}\n` +
      `📊 Total parties: ${userData.tmData.playCount}`;

    // ── Animated reveal ────────────────────────────────────────────────────
    const initMsg = await output.reply({ body: anim1 });
    await delay(1000);
    await api.editMessage(anim2, initMsg.messageID);
    await delay(1000);
    await api.editMessage(anim3, initMsg.messageID);
    await delay(1000);
    await api.editMessage(final, initMsg.messageID);
  }),
});

const style = command.style;
export default command;
  
