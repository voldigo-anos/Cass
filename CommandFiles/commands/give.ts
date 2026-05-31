import axios from "axios";
import { UNIRedux, UNISpectra } from "@cassidy/unispectra";
import { defineCommand, defineEntry } from "@cass/define";

// ══════════════════════════════════════════════════════════════════════════════
// ─── HELPERS ──────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

function formatMoney(n: number): string {
  if (isNaN(n) || n === null || n === undefined) return "$0";
  n = Number(n);
  if (!isFinite(n)) return "$∞";
  const scales = [
    { value: 1e18, suffix: "Qi" }, { value: 1e15, suffix: "Qa" },
    { value: 1e12, suffix: "T"  }, { value: 1e9,  suffix: "B"  },
    { value: 1e6,  suffix: "M"  }, { value: 1e3,  suffix: "K"  },
  ];
  const s = scales.find(x => Math.abs(n) >= x.value);
  if (s) {
    const sc = (n / s.value).toFixed(2);
    return `$${sc.endsWith(".00") ? sc.slice(0, -3) : sc}${s.suffix}`;
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

async function getAvatarImage(uid: string, usersDB: any): Promise<any> {
  // 1. usersDB.userMeta.image (best source)
  try {
    await usersDB.ensureUserInfo(uid);
    const u = await usersDB.getItem(uid);
    const url = u?.userMeta?.image;
    if (url) {
      const img = await CanvCass.loadImage(url);
      if (img) return img;
    }
  } catch {}

  // 2. saveUserInfo + retry
  try {
    await usersDB.saveUserInfo(uid);
    const u = await usersDB.getItem(uid);
    const url = u?.userMeta?.image;
    if (url) {
      const img = await CanvCass.loadImage(url);
      if (img) return img;
    }
  } catch {}

  // 3. FB graph direct
  try {
    const url = `https://graph.facebook.com/${uid}/picture?width=256&height=256`;
    const img = await CanvCass.loadImage(url);
    if (img) return img;
  } catch {}

  return null;
}

function drawCircularImage(
  canv: typeof CanvCass.prototype,
  img: any,
  cx: number,
  cy: number,
  radius: number
) {
  const ctx = (canv as any)["_CanvCass__context"] ??
              (canv as any)["#context"] ??
              (canv as any).context;

  if (!ctx) return;

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(img, cx - radius, cy - radius, radius * 2, radius * 2);
  ctx.restore();
}

// ══════════════════════════════════════════════════════════════════════════════
// ─── COMMAND ──────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

const command = defineCommand({
  meta: {
    name: "give",
    otherNames: ["gift", "donate", "pay"],
    description: "🎁 Donne de l'argent à un autre utilisateur (sans taxe, sans limite)",
    version: "3.0.0",
    author: "Christus",
    category: "Economy",
    usage:
      "{prefix}{name} @user <montant>\n" +
      "Exemples: give @John 1k · give @Marie 2.5m",
    role: 0,
    noPrefix: false,
    waitingTime: 5,
    requirement: "3.0.0",
    icon: "🎁",
  },
  style: {
    title: "🎁 Give Money",
    titleFont: "bold",
    contentFont: "fancy",
  },

  entry: defineEntry(async (ctx) => {
    const { input, output, money, usersDB } = ctx;
    const args = input.arguments ?? [];

    // ── Resolve target ─────────────────────────────────────────────────────
    const mentions  = (input as any).mentions ?? {};
    const targetID: string | null =
      Object.keys(mentions)[0] ||
      (input as any).messageReply?.senderID ||
      null;

    const amountArg = args.find((a) => /^[\d,.]+[kmbtq]?$/i.test(a));
    const amount    = parseAmount(amountArg || "");

    // ── Validations ────────────────────────────────────────────────────────
    if (!targetID) {
      return output.replyStyled(
        {
          body:
            `${UNIRedux.arrow} give ⚠️\n\n` +
            `Usage: give @utilisateur <montant>\n` +
            `${UNISpectra.arrowFromT} Exemple: give @John 500 ou give @Marie 1k`,
        },
        style
      );
    }

    if (targetID === input.senderID) {
      return output.replyStyled(
        { body: `${UNIRedux.arrow} give ❌\n\nVous ne pouvez pas vous donner de l'argent à vous-même.` },
        style
      );
    }

    if (isNaN(amount) || amount <= 0) {
      return output.replyStyled(
        {
          body:
            `${UNIRedux.arrow} give ❌\n\n` +
            `Montant invalide. Utilisez des nombres positifs.\n` +
            `${UNISpectra.arrowFromT} Exemples: 500, 1k, 2.5m, 1b`,
        },
        style
      );
    }

    // ── Load both users ────────────────────────────────────────────────────
    const [senderData, receiverData] = await Promise.all([
      money.getItem(input.senderID).catch(() => null),
      money.getItem(targetID).catch(() => null),
    ]);

    if (!receiverData) {
      return output.replyStyled(
        { body: `${UNIRedux.arrow} give ❌\n\nUtilisateur introuvable dans la base de données.` },
        style
      );
    }

    const senderMoney: number   = (senderData as any)?.money ?? 0;
    const receiverMoney: number = (receiverData as any)?.money ?? 0;

    if (senderMoney < amount) {
      return output.replyStyled(
        {
          body:
            `${UNIRedux.arrow} give ❌\n\n` +
            `Fonds insuffisants.\n` +
            `${UNISpectra.arrowFromT} Vous avez ${formatMoney(senderMoney)}, besoin de ${formatMoney(amount)}.`,
        },
        style
      );
    }

    // ── Execute transfer ───────────────────────────────────────────────────
    const newSenderMoney   = senderMoney - amount;
    const newReceiverMoney = receiverMoney + amount;

    await Promise.all([
      money.setItem(input.senderID, { money: newSenderMoney }),
      money.setItem(targetID, { money: newReceiverMoney }),
    ]);

    const senderName   = (senderData as any)?.name || "Expéditeur";
    const receiverName = (receiverData as any)?.name || "Destinataire";

    // ── Canvas ─────────────────────────────────────────────────────────────
    try {
      // 900 × 500 canvas — same ratio as balance.ts
      const canv = new CanvCass(900, 500);
      await canv.drawBackground();

      // ── Dark overlay container ──────────────────────────────────────────
      const container = CanvCass.createRect({
        centerX: canv.centerX,
        centerY: canv.centerY,
        width:   canv.width,
        height:  canv.height / 1.1,
      });

      canv.drawBox({
        rect: container,
        fill: "rgba(0, 0, 0, 0.55)",
      });

      // ── Title ───────────────────────────────────────────────────────────
      canv.drawText("💝 TRANSFERT RÉUSSI 💝", {
        x:        canv.centerX,
        y:        container.top + 60,
        align:    "center",
        fill:     "#EC4899",
        fontType: "cbold",
        size:     42,
      });

      // ── Amount box ──────────────────────────────────────────────────────
      const amtBox = CanvCass.createRect({
        centerX: canv.centerX,
        centerY: container.top + 150,
        width:   420,
        height:  70,
      });

      canv.drawBox({
        rect:   amtBox,
        fill:   "rgba(16, 185, 129, 0.25)",
        stroke: "#10B981",
        strokeWidth: 2,
      });

      canv.drawText(formatMoney(amount), {
        x:        canv.centerX,
        y:        amtBox.centerY + 2,
        align:    "center",
        fill:     "#10B981",
        fontType: "cbold",
        size:     38,
      });

      // ── Avatar circles ───────────────────────────────────────────────────
      // Sender (left)
      const senderCX  = 220;
      const receiverCX = 680;
      const avatarCY  = 300;
      const radius    = 75;

      // Ring border for sender
      canv.drawCircle([senderCX, avatarCY], radius + 6, {
        stroke: "#6366F1",
        strokeWidth: 4,
      });

      // Ring border for receiver
      canv.drawCircle([receiverCX, avatarCY], radius + 6, {
        stroke: "#EC4899",
        strokeWidth: 4,
      });

      // Load and draw avatars
      const [senderImg, receiverImg] = await Promise.all([
        getAvatarImage(input.senderID, usersDB),
        getAvatarImage(targetID, usersDB),
      ]);

      if (senderImg) {
        await canv.drawImage(senderImg, senderCX - radius, avatarCY - radius, {
          width:  radius * 2,
          height: radius * 2,
          clipTo: (() => {
            const path = new Path2D();
            path.arc(senderCX, avatarCY, radius, 0, Math.PI * 2);
            return path;
          })(),
        });
      } else {
        canv.drawCircle([senderCX, avatarCY], radius, { fill: "#6366F1" });
        canv.drawText(senderName[0]?.toUpperCase() || "?", {
          x: senderCX, y: avatarCY + 2,
          align: "center", fill: "white", fontType: "cbold", size: 60,
        });
      }

      if (receiverImg) {
        await canv.drawImage(receiverImg, receiverCX - radius, avatarCY - radius, {
          width:  radius * 2,
          height: radius * 2,
          clipTo: (() => {
            const path = new Path2D();
            path.arc(receiverCX, avatarCY, radius, 0, Math.PI * 2);
            return path;
          })(),
        });
      } else {
        canv.drawCircle([receiverCX, avatarCY], radius, { fill: "#EC4899" });
        canv.drawText(receiverName[0]?.toUpperCase() || "?", {
          x: receiverCX, y: avatarCY + 2,
          align: "center", fill: "white", fontType: "cbold", size: 60,
        });
      }

      // ── Arrow ────────────────────────────────────────────────────────────
      canv.drawText("➡️", {
        x: canv.centerX, y: avatarCY + 2,
        align: "center", fill: "#F59E0B", fontType: "cbold", size: 52,
      });

      // ── Names ────────────────────────────────────────────────────────────
      const truncate = (s: string, max = 14) =>
        s.length > max ? s.slice(0, max - 1) + "…" : s;

      canv.drawText(truncate(senderName), {
        x: senderCX, y: avatarCY + radius + 30,
        align: "center", fill: "rgba(255,255,255,0.85)", fontType: "cbold", size: 26,
      });

      canv.drawText(truncate(receiverName), {
        x: receiverCX, y: avatarCY + radius + 30,
        align: "center", fill: "rgba(255,255,255,0.85)", fontType: "cbold", size: 26,
      });

      // ── Footer balances ───────────────────────────────────────────────────
      canv.drawText(`${truncate(senderName, 10)}: ${formatMoney(newSenderMoney)}`, {
        x: 50, y: container.bottom - 20,
        align: "left", fill: "rgba(255,255,255,0.5)", fontType: "cbold", size: 20,
      });

      canv.drawText(`${truncate(receiverName, 10)}: ${formatMoney(newReceiverMoney)}`, {
        x: canv.right - 50, y: container.bottom - 20,
        align: "right", fill: "rgba(255,255,255,0.5)", fontType: "cbold", size: 20,
      });

      // ── Send ─────────────────────────────────────────────────────────────
      const body =
        `${UNIRedux.charm} ${senderName} a donné ${formatMoney(amount)} à ${receiverName} !\n\n` +
        `${UNISpectra.arrow} ${senderName}: ${formatMoney(newSenderMoney)}\n` +
        `${UNISpectra.arrow} ${receiverName}: ${formatMoney(newReceiverMoney)}`;

      return output.reply({
        body,
        attachment: await canv.toStream(),
      });

    } catch (canvErr) {
      // Canvas failed — fallback to text only
      console.error("[give canvas]", canvErr);

      return output.replyStyled(
        {
          body:
            `${UNIRedux.charm} TRANSFERT RÉUSSI 💝\n\n` +
            `${UNISpectra.arrow} ${senderName} → ${receiverName}\n\n` +
            `💸 Montant: ${formatMoney(amount)}\n\n` +
            `${UNISpectra.arrow} ${senderName}: ${formatMoney(newSenderMoney)}\n` +
            `${UNISpectra.arrow} ${receiverName}: ${formatMoney(newReceiverMoney)}`,
        },
        style
      );
    }
  }),
});

const style = command.style;
export default command;
    
