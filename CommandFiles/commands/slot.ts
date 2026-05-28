import { UNIRedux } from "@cassidy/unispectra";
import { defineCommand, defineEntry } from "@cass/define";

// ─── Constants ────────────────────────────────────────────────────────────────

const SYMBOLS = ["🍎", "🍍", "🍇", "🍊", "🍌", "⭐", "🔥", "💎", "7️⃣"];
const MAX_BET = 50_000;
const MAX_PLAYS_PER_HOUR = 10;
const ONE_HOUR = 60 * 60 * 1000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCash(n: number): string {
  return `$${Math.floor(n).toLocaleString("en-US")}`;
}

function spinReels(): string[] {
  const lose = Math.random() < 0.40;

  if (lose) {
    let reels: string[];
    do {
      reels = Array.from({ length: 3 }, () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
    } while (reels[0] === reels[1] || reels[1] === reels[2] || reels[0] === reels[2]);
    return reels;
  }

  const jackpot = Math.random() < 0.05;
  const sym = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];

  if (jackpot) {
    return [sym, sym, sym];
  }

  let other: string;
  do { other = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]; } while (other === sym);
  return [sym, sym, other].sort(() => Math.random() - 0.5);
}

function getMultiplier(reels: string[]): number {
  const counts = reels.reduce<Record<string, number>>((a, c) => {
    a[c] = (a[c] || 0) + 1;
    return a;
  }, {});
  const max = Math.max(...Object.values(counts));
  return max === 3 ? 5 : max === 2 ? 2 : 0;
}

// ─── Command ──────────────────────────────────────────────────────────────────

const command = defineCommand({
  meta: {
    name: "slot",
    otherNames: ["slots", "sl"],
    description: "🎰 Play the slot machine and win coins",
    version: "1.0.0",
    author: "Christus",
    category: "Game",
    usage: "{prefix}{name} <amount>",
    role: 0,
    noPrefix: false,
    waitingTime: 0,
    requirement: "3.0.0",
    icon: "🎰",
  },
  style: {
    title: "🎰 Slot Machine",
    titleFont: "bold",
    contentFont: "fancy",
  },

  entry: defineEntry(async (ctx) => {
    const { input, output, money, api } = ctx;

    const args = input.arguments ?? [];
    const bet = parseInt(args[0]);

    // ── Validate bet ─────────────────────────────────────────────────────────
    if (!bet || bet <= 0) {
      return api.shareContact(
        `❌ Enter a valid bet amount.\nUsage: slot <amount>`,
        input.sid,
        input.tid
      );
    }

    // ── Fetch user data ──────────────────────────────────────────────────────
    let userData: any;
    try {
      userData = await money.getItem(input.senderID);
      if (!userData) throw new Error("not found");
    } catch {
      return api.shareContact(
        `❌ Could not retrieve your data. Please try again.`,
        input.sid,
        input.tid
      );
    }

    const isAdmin = input.isAdmin;
    const userMoney: number = userData.money ?? 0;
    const userName: string = userData.name ?? "Player";

    // ── Balance check ────────────────────────────────────────────────────────
    if (!isAdmin && bet > userMoney) {
      return api.shareContact(
        `💸 Not enough balance!\nYour balance: ${formatCash(userMoney)}`,
        input.sid,
        input.tid
      );
    }

    // ── Max bet check ────────────────────────────────────────────────────────
    if (!isAdmin && bet > MAX_BET) {
      return api.shareContact(
        `❌ Maximum bet is ${formatCash(MAX_BET)}.`,
        input.sid,
        input.tid
      );
    }

    // ── Hourly limit check ───────────────────────────────────────────────────
    const now = Date.now();
    const slotData: { lastPlay: number; count: number } =
      userData.slotData ?? { lastPlay: 0, count: 0 };

    if (now - slotData.lastPlay > ONE_HOUR) {
      slotData.count = 0;
      slotData.lastPlay = now;
    }

    if (!isAdmin && slotData.count >= MAX_PLAYS_PER_HOUR) {
      const remaining = Math.ceil((ONE_HOUR - (now - slotData.lastPlay)) / 60_000);
      return api.shareContact(
        `⏳ Hourly limit reached!\nTry again in ${remaining} minute(s).`,
        input.sid,
        input.tid
      );
    }

    // ── Update play counter ──────────────────────────────────────────────────
    slotData.count++;
    slotData.lastPlay = slotData.lastPlay || now;
    await money.setItem(input.senderID, { slotData });

    // ── Spin ─────────────────────────────────────────────────────────────────
    const reels = spinReels();
    const multiplier = getMultiplier(reels);
    const winAmount = multiplier ? bet * multiplier : 0;
    const profit = isAdmin ? winAmount : winAmount - bet;
    const newBalance = userMoney + profit;

    await money.setItem(input.senderID, { money: newBalance });

    const isJackpot = multiplier === 5;
    const isWin = profit > 0;

    // ── Build result message ─────────────────────────────────────────────────
    let msg = `🎰 SLOT MACHINE\n`;
    msg += `━━━━━━━━━\n`;
    msg += `[ ${reels[0]} | ${reels[1]} | ${reels[2]} ]\n`;
    msg += `━━━━━━━━━\n`;
    msg += `👤 Player: ${userName}\n`;
    msg += `💰 Bet: ${formatCash(bet)}\n`;

    if (isJackpot) {
      msg += `\n🎉 JACKPOT! x5 WIN!\n`;
      msg += `✅ Won: +${formatCash(winAmount)}\n`;
    } else if (isWin) {
      msg += `\n🎊 PAIR! x2 WIN!\n`;
      msg += `✅ Won: +${formatCash(winAmount)}\n`;
    } else {
      msg += `\n💔 No match — Better luck next time!\n`;
      msg += `❌ Lost: -${formatCash(bet)}\n`;
    }

    msg += `💳 Balance: ${formatCash(newBalance)}`;
    msg += `\n⏱️ Plays this hour: ${slotData.count}/${MAX_PLAYS_PER_HOUR}`;

    return api.shareContact(msg, input.sid, input.tid);
  }),
});

const style = command.style;

export default command;
    
