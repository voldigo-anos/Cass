// @ts-check
import { createCanvas, loadImage, registerFont } from "canvas";
import axios from "axios";
import fs from "fs-extra";
import path from "path";
import os from "os";

/* ================================================================
   FONTS  (graceful — skip if files absent)
   ================================================================ */
const FONT_DIR = path.join(__dirname, "assets", "font");
for (const [file, opts] of [
  ["BeVietnamPro-Bold.ttf",     { family: "BeVietnamPro-Bold" }],
  ["BeVietnamPro-Regular.ttf",  { family: "BeVietnamPro-Regular" }],
  ["BeVietnamPro-SemiBold.ttf", { family: "BeVietnamPro-SemiBold" }],
] as const) {
  try { registerFont(path.join(FONT_DIR, file), opts); } catch {}
}

/* ================================================================
   META / STYLE
   ================================================================ */
export const meta: CommandMeta = {
  name: "pair",
  otherNames: ["love", "couple"],
  description: "💕 Crée une image romantique pour un duo — matching par genre automatique",
  author: "Christus (GoatBot → Cassidy port)",
  version: "1.0.0",
  usage: "{prefix}pair [@mention | uid | theme]",
  category: "Fun",
  role: 0,
  noPrefix: false,
  waitingTime: 10,
  requirement: "3.0.0",
  icon: "💕",
};

export const style: CommandStyle = {
  title: "💕 Romantic Pair",
  titleFont: "bold",
  contentFont: "fancy",
};

export const langs = {
  en: {
    processing:   "💫 Creating your romantic pair...",
    noTarget:     "❌ No suitable user found for pairing. Try mentioning someone or ensure there are other users in the group!",
    noUserInfo:   "❌ Unable to fetch user information. Please try again!",
    result:       "💕 {message} 💕\n\n♥ {name1} ♡ {name2} ♥\n💖 Compatibility: {pct}%\n🎨 Theme: {theme}",
    error:        "❌ An error occurred while creating the romantic pair: {err}",
    help:         "pair - Random gender-based pair from group\npair @mention - Pair with mentioned user\npair <uid> - Pair with user ID\npair <theme> - Use a specific theme\n\nAvailable themes: paradise, cosmic, enchanted, royal, sunset, ocean",
  },
  fr: {
    processing:   "💫 Création de votre paire romantique...",
    noTarget:     "❌ Aucun utilisateur trouvé pour le jumelage. Mentionnez quelqu'un ou assurez-vous qu'il y a d'autres membres dans le groupe !",
    noUserInfo:   "❌ Impossible de récupérer les informations utilisateur. Réessayez !",
    result:       "💕 {message} 💕\n\n♥ {name1} ♡ {name2} ♥\n💖 Compatibilité : {pct}%\n🎨 Thème : {theme}",
    error:        "❌ Une erreur s'est produite lors de la création de la paire : {err}",
    help:         "pair - Paire aléatoire par genre\npair @mention - Avec un utilisateur mentionné\npair <uid> - Par identifiant\npair <thème> - Thème choisi\n\nThèmes disponibles : paradise, cosmic, enchanted, royal, sunset, ocean",
  },
};

/* ================================================================
   THEME DATA
   ================================================================ */
type Theme = {
  name: string;
  background: (ctx: any, w: number, h: number) => void;
  heartColor: string; textColor: string; shadowColor: string;
  accentColor: string; secondary: string;
};

const THEMES: Record<string, Theme> = {
  paradise: {
    name: "Paradise Love",
    background: (ctx, w, h) => {
      const g = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, Math.max(w, h));
      g.addColorStop(0, "#ffb3d9"); g.addColorStop(0.3, "#ff6bb3");
      g.addColorStop(0.6, "#e056fd"); g.addColorStop(1, "#7c3aed");
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    },
    heartColor: "#ff1744", textColor: "#ffffff", shadowColor: "rgba(255,23,68,0.9)",
    accentColor: "#ff69b4", secondary: "#ffc0cb",
  },
  cosmic: {
    name: "Cosmic Romance",
    background: (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, "#667eea"); g.addColorStop(0.2, "#764ba2");
      g.addColorStop(0.5, "#f093fb"); g.addColorStop(0.8, "#f5576c"); g.addColorStop(1, "#4facfe");
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    },
    heartColor: "#ff6b9d", textColor: "#ffffff", shadowColor: "rgba(255,107,157,0.9)",
    accentColor: "#c471ed", secondary: "#a8edea",
  },
  enchanted: {
    name: "Enchanted Garden",
    background: (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#ffecd2"); g.addColorStop(0.3, "#fcb69f");
      g.addColorStop(0.6, "#ff9a9e"); g.addColorStop(1, "#fecfef");
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    },
    heartColor: "#e91e63", textColor: "#ffffff", shadowColor: "rgba(233,30,99,0.9)",
    accentColor: "#f8bbd9", secondary: "#ffd1dc",
  },
  royal: {
    name: "Royal Love",
    background: (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#667eea"); g.addColorStop(0.3, "#764ba2");
      g.addColorStop(0.7, "#9932cc"); g.addColorStop(1, "#4b0082");
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    },
    heartColor: "#ffd700", textColor: "#ffffff", shadowColor: "rgba(255,215,0,0.9)",
    accentColor: "#dda0dd", secondary: "#e6e6fa",
  },
  sunset: {
    name: "Dreamy Sunset",
    background: (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#ff9a9e"); g.addColorStop(0.3, "#fecfef");
      g.addColorStop(0.7, "#fecfef"); g.addColorStop(1, "#ff6b6b");
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    },
    heartColor: "#ff1744", textColor: "#ffffff", shadowColor: "rgba(255,23,68,0.9)",
    accentColor: "#ff4081", secondary: "#ffb6c1",
  },
  ocean: {
    name: "Ocean Dreams",
    background: (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#667eea"); g.addColorStop(0.5, "#764ba2"); g.addColorStop(1, "#a8edea");
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    },
    heartColor: "#ff6b9d", textColor: "#ffffff", shadowColor: "rgba(255,107,157,0.9)",
    accentColor: "#4facfe", secondary: "#87ceeb",
  },
};

const THEME_KEYS = Object.keys(THEMES);

const ROMANTIC_MESSAGES = [
  "Love is in the air", "Perfect match made in heaven", "Two hearts beating as one",
  "Love conquers all", "Soulmates found", "Forever and always",
  "Love blooms eternal", "Hearts intertwined", "Love takes flight",
  "Cupid's perfect shot", "Destined to be together", "Written in the stars",
  "Magical love story", "Sweet romance", "Moonlight serenade",
];

const SYMBOLS = ["♥","♡","♦","♧","♠","♣","♢","◊","◈","✦","✧","✩","✪","✫","✬","✭","✮","✯","✰","✱","✲","✳","✴","✵","✶","✷","✸","✹","✺","✻","✼","✽","✾","✿","❀","❁","❂","❃","❅","❆","❇"];

const SPECIAL_PERCENTAGES = [88,92,95,97,89,93,96,98,99,91,94,87,90,100];

/* ================================================================
   ENTRY
   ================================================================ */
export async function entry(ctx: CommandContext) {
  const { input, output, args, api, langParser } = ctx;
  const getLang = langParser.createGetLang(langs);

  if (!args[0] || args[0] === "help") return output.reply(getLang("help"));

  /* ── choose theme ── */
  const themeKey =
    args[0] && THEME_KEYS.includes(args[0].toLowerCase())
      ? args[0].toLowerCase()
      : THEME_KEYS[Math.floor(Math.random() * THEME_KEYS.length)];
  const theme = THEMES[themeKey];

  const loading = await output.reply(getLang("processing"));

  try {
    /* ── resolve target ── */
    const id1 = input.senderID;
    const id2 = await resolveTarget(api, input, args);
    if (!id2) {
      await output.unsend(loading.messageID);
      return output.reply(getLang("noTarget"));
    }

    /* ── fetch user info ── */
    const [info1, info2] = await Promise.all([
      api.getUserInfo(id1),
      api.getUserInfo(id2),
    ]);
    if (!info1[id1] || !info2[id2]) {
      await output.unsend(loading.messageID);
      return output.reply(getLang("noUserInfo"));
    }

    const name1 = info1[id1].name as string;
    const name2 = info2[id2].name as string;
    const pct   = SPECIAL_PERCENTAGES[Math.floor(Math.random() * SPECIAL_PERCENTAGES.length)];
    const msg   = ROMANTIC_MESSAGES[Math.floor(Math.random() * ROMANTIC_MESSAGES.length)];

    /* ── download avatars ── */
    const tmpDir  = os.tmpdir();
    const pathAvt1 = path.join(tmpDir, `pair_avt1_${Date.now()}.png`);
    const pathAvt2 = path.join(tmpDir, `pair_avt2_${Date.now()}.png`);
    const pathImg  = path.join(tmpDir, `pair_result_${Date.now()}.png`);

    const [avt1Data, avt2Data] = await Promise.all([
      axios.get(`https://graph.facebook.com/${id1}/picture?width=500&height=500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" }),
      axios.get(`https://graph.facebook.com/${id2}/picture?width=500&height=500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" }),
    ]);
    await fs.writeFile(pathAvt1, Buffer.from(avt1Data.data));
    await fs.writeFile(pathAvt2, Buffer.from(avt2Data.data));

    /* ── render canvas ── */
    const buffer = await renderPair({ theme, name1, name2, pct, msg, pathAvt1, pathAvt2 });
    await fs.writeFile(pathImg, buffer);
    await fs.remove(pathAvt1);
    await fs.remove(pathAvt2);

    /* ── send result ── */
    await output.unsend(loading.messageID);

    const body = getLang("result")
      .replace("{message}", msg)
      .replace("{name1}",   name1)
      .replace("{name2}",   name2)
      .replace("{pct}",     String(pct))
      .replace("{theme}",   theme.name);

    await output.reply({
      body,
      mentions: [
        { tag: name1, id: id1 },
        { tag: name2, id: id2 },
      ],
      attachment: fs.createReadStream(pathImg),
    } as any);

    fs.remove(pathImg).catch(() => {});

  } catch (err: any) {
    console.error("[pair]", err);
    await output.unsend(loading.messageID).catch(() => {});
    output.reply(getLang("error").replace("{err}", err?.message ?? String(err)));
  }
}

/* ================================================================
   TARGET RESOLUTION  (reply > mention > uid arg > random by gender)
   ================================================================ */
async function resolveTarget(api: any, input: CommandContext["input"], args: string[]): Promise<string | null> {
  /* 1 — reply */
  if ((input as any).messageReply?.senderID) return (input as any).messageReply.senderID;

  /* 2 — mention */
  const mentionIDs = Object.keys(input.mentions ?? {});
  if (mentionIDs.length > 0) return mentionIDs[0];

  /* 3 — raw UID as argument */
  const uidArg = args.find(a => /^\d{10,}$/.test(a));
  if (uidArg) return uidArg;

  /* 4 — random from thread, prefer opposite gender */
  try {
    const threadInfo = await api.getThreadInfo(input.threadID);
    if (!threadInfo?.userInfo) return null;

    const botID = api.getCurrentUserID();
    let candidates = (threadInfo.userInfo as any[]).filter(
      u => u.id !== input.senderID && u.id !== botID
    );
    if (!candidates.length) return null;

    /* Try gender-based filtering */
    try {
      const myInfo    = await api.getUserInfo(input.senderID);
      const myGender  = myInfo[input.senderID]?.gender;
      if (myGender) {
        const opposite: any[] = [];
        for (const c of candidates) {
          try {
            const ci = await api.getUserInfo(c.id);
            const cg = ci[c.id]?.gender;
            if ((myGender === 1 && cg === 2) || (myGender === 2 && cg === 1)) {
              opposite.push(c);
            }
          } catch {}
        }
        if (opposite.length) candidates = opposite;
      }
    } catch {}

    return candidates[Math.floor(Math.random() * candidates.length)].id;
  } catch {
    return null;
  }
}

/* ================================================================
   CANVAS RENDERER
   ================================================================ */
async function renderPair({
  theme, name1, name2, pct, msg, pathAvt1, pathAvt2,
}: {
  theme: Theme; name1: string; name2: string;
  pct: number; msg: string; pathAvt1: string; pathAvt2: string;
}): Promise<Buffer> {
  const W = 1400, H = 800;
  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext("2d") as any;
  ctx.imageSmoothingEnabled = true;

  theme.background(ctx, W, H);
  drawRomanticPattern(ctx, W, H, theme);
  drawFloatingElements(ctx, W, H, theme);
  drawMagicalBorder(ctx, W, H, theme);

  const [avt1, avt2] = await Promise.all([loadImage(pathAvt1), loadImage(pathAvt2)]);

  const avSize = 220, avY = 220;
  const av1X = 180, av2X = W - 180 - avSize;

  drawMagicalAvatarFrame(ctx, av1X, avY, avSize, theme);
  drawMagicalAvatarFrame(ctx, av2X, avY, avSize, theme);

  for (const [img, ax] of [[avt1, av1X], [avt2, av2X]] as const) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(ax + avSize / 2, avY + avSize / 2, avSize / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, ax, avY, avSize, avSize);
    ctx.restore();
  }

  /* Central heart */
  const hx = W / 2, hy = avY + avSize / 2;
  drawHeart(ctx, hx - 30, hy - 30, 60, theme.heartColor, 30);

  /* Connection lines */
  ctx.strokeStyle = theme.accentColor; ctx.lineWidth = 6;
  ctx.shadowColor = theme.accentColor; ctx.shadowBlur = 15;
  ctx.setLineDash([15, 10]);
  ctx.beginPath();
  ctx.moveTo(av1X + avSize, hy); ctx.lineTo(hx - 30, hy);
  ctx.moveTo(hx + 30, hy);      ctx.lineTo(av2X, hy);
  ctx.stroke();
  ctx.setLineDash([]); ctx.shadowBlur = 0;

  /* Connection hearts along lines */
  for (let i = 0; i < 6; i++) {
    const t = i / 5;
    const x1 = av1X + avSize + t * (hx - 30 - av1X - avSize);
    const x2 = hx + 30 + t * (av2X - hx - 30);
    drawHeart(ctx, x1 - 6, hy - 6, 12, theme.secondary, 8);
    drawHeart(ctx, x2 - 6, hy - 6, 12, theme.secondary, 8);
  }

  /* Texts */
  drawText(ctx, theme.name,            W / 2, 120, 48, theme);
  drawText(ctx, "♥ Love Connection ♥", W / 2, 180, 38, theme);
  drawText(ctx, name1,  av1X + avSize / 2, avY + avSize + 80, 32, theme);
  drawText(ctx, name2,  av2X + avSize / 2, avY + avSize + 80, 32, theme);
  drawText(ctx, msg,    W / 2, 580, 36, theme);

  /* Love bar */
  drawLoveBar(ctx, pct, W / 2 - 250, 620, 500, 50, theme);
  drawText(ctx, "♦ Eternal Love ♦", W / 2, 700, 30, theme);

  /* Final scattered symbols */
  const syms = ["♥","♡","♦","♧","✦","✧"];
  for (let i = 0; i < 25; i++) {
    ctx.font = `${15 + Math.random() * 10}px Arial`;
    ctx.globalAlpha = 0.6 + Math.random() * 0.4;
    ctx.fillStyle = theme.accentColor;
    ctx.fillText(syms[Math.floor(Math.random() * syms.length)],
      50 + Math.random() * (W - 100), 50 + Math.random() * (H - 100));
  }
  ctx.globalAlpha = 1;

  return canvas.toBuffer("image/png");
}

/* ================================================================
   DRAW HELPERS  (identical logic to original, TypeScript-clean)
   ================================================================ */
function drawHeart(ctx: any, x: number, y: number, size: number, color: string, glow = 20) {
  ctx.shadowColor = color; ctx.shadowBlur = glow * 2;
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.3;
  for (let i = 0; i < 3; i++) {
    const s = size + i * 5;
    ctx.beginPath();
    ctx.moveTo(x, y + s/4);
    ctx.bezierCurveTo(x, y, x - s/2, y, x - s/2, y + s/4);
    ctx.bezierCurveTo(x - s/2, y + s/2, x, y + s, x, y + s);
    ctx.bezierCurveTo(x, y + s, x + s/2, y + s/2, x + s/2, y + s/4);
    ctx.bezierCurveTo(x + s/2, y, x, y, x, y + s/4);
    ctx.fill();
  }
  ctx.globalAlpha = 1; ctx.shadowBlur = glow;
  ctx.beginPath();
  ctx.moveTo(x, y + size/4);
  ctx.bezierCurveTo(x, y, x - size/2, y, x - size/2, y + size/4);
  ctx.bezierCurveTo(x - size/2, y + size/2, x, y + size, x, y + size);
  ctx.bezierCurveTo(x, y + size, x + size/2, y + size/2, x + size/2, y + size/4);
  ctx.bezierCurveTo(x + size/2, y, x, y, x, y + size/4);
  ctx.fill();
  const shine = ctx.createLinearGradient(x - size/4, y, x + size/4, y + size);
  shine.addColorStop(0, "rgba(255,255,255,0.8)"); shine.addColorStop(1, "rgba(255,255,255,0.1)");
  ctx.fillStyle = shine; ctx.shadowBlur = 0; ctx.fill();
  ctx.shadowColor = "transparent"; ctx.shadowBlur = 0;
}

function drawText(ctx: any, text: string, x: number, y: number, size: number, theme: Theme) {
  ctx.font = `bold ${size}px BeVietnamPro-Bold, Arial, sans-serif`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  const shadows = [
    { blur:30, ox:8, oy:8, color:"rgba(0,0,0,0.5)" },
    { blur:20, ox:6, oy:6, color:theme.shadowColor },
    { blur:15, ox:4, oy:4, color:theme.accentColor },
    { blur:10, ox:2, oy:2, color:theme.heartColor },
  ];
  for (const s of shadows) {
    ctx.shadowColor = s.color; ctx.shadowBlur = s.blur;
    ctx.shadowOffsetX = s.ox; ctx.shadowOffsetY = s.oy;
    ctx.fillStyle = theme.textColor; ctx.fillText(text, x, y);
  }
  ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
  const g = ctx.createLinearGradient(x - 100, y - size/2, x + 100, y + size/2);
  g.addColorStop(0, theme.textColor); g.addColorStop(0.5, "#ffffff"); g.addColorStop(1, theme.textColor);
  ctx.fillStyle = g; ctx.fillText(text, x, y);
  ctx.strokeStyle = theme.heartColor; ctx.lineWidth = 2; ctx.strokeText(text, x, y);
}

function drawLoveBar(ctx: any, pct: number, x: number, y: number, w: number, h: number, theme: Theme) {
  ctx.shadowColor = theme.accentColor; ctx.shadowBlur = 20;
  ctx.fillStyle = "rgba(0,0,0,0.3)"; rrect(ctx, x-5, y-5, w+10, h+10, 20); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(255,255,255,0.2)"; rrect(ctx, x, y, w, h, 15); ctx.fill();
  const bw = (w * pct) / 100;
  const g = ctx.createLinearGradient(x, y, x + w, y);
  g.addColorStop(0, theme.heartColor); g.addColorStop(0.3, theme.accentColor);
  g.addColorStop(0.7, theme.secondary); g.addColorStop(1, theme.heartColor);
  ctx.fillStyle = g; ctx.shadowColor = theme.heartColor; ctx.shadowBlur = 25;
  rrect(ctx, x, y, bw, h, 15); ctx.fill();
  const shine = ctx.createLinearGradient(x, y, x, y + h);
  shine.addColorStop(0, "rgba(255,255,255,0.8)"); shine.addColorStop(0.5, "rgba(255,255,255,0.3)"); shine.addColorStop(1, "rgba(255,255,255,0.1)");
  ctx.fillStyle = shine; ctx.shadowBlur = 0; rrect(ctx, x, y, bw, h/3, 15); ctx.fill();
  ctx.strokeStyle = theme.heartColor; ctx.lineWidth = 4;
  ctx.shadowColor = theme.heartColor; ctx.shadowBlur = 15;
  rrect(ctx, x, y, w, h, 15); ctx.stroke();
  ctx.shadowColor = "transparent"; ctx.shadowBlur = 0;
  drawText(ctx, `${pct}%`, x + w/2, y + h/2, 24, theme);
  for (let i = 0; i < 8; i++) drawHeart(ctx, x + i*(w/7) + Math.random()*20, y-15-Math.random()*10, 8, theme.accentColor, 8);
}

function drawMagicalAvatarFrame(ctx: any, x: number, y: number, size: number, theme: Theme) {
  const cx = x + size/2, cy = y + size/2, r = size/2;
  for (const ring of [
    { r: r+25, lw:10, c:theme.secondary, blur:25 },
    { r: r+18, lw:8,  c:theme.accentColor, blur:20 },
    { r: r+12, lw:6,  c:theme.heartColor, blur:15 },
    { r: r+6,  lw:4,  c:"#ffffff", blur:10 },
  ]) {
    ctx.strokeStyle = ring.c; ctx.lineWidth = ring.lw;
    ctx.shadowColor = ring.c; ctx.shadowBlur = ring.blur;
    ctx.beginPath(); ctx.arc(cx, cy, ring.r, 0, Math.PI*2); ctx.stroke();
  }
  ctx.shadowColor = "transparent"; ctx.shadowBlur = 0;
  for (let i = 0; i < 12; i++) {
    const angle = (i * Math.PI * 2) / 12;
    const dx = cx + Math.cos(angle) * (r + 35);
    const dy = cy + Math.sin(angle) * (r + 35);
    if      (i % 3 === 0) drawHeart(ctx, dx-8, dy-8, 16, theme.heartColor, 15);
    else if (i % 3 === 1) { ctx.font="20px Arial"; ctx.fillStyle=theme.accentColor; ctx.fillText(SYMBOLS[Math.floor(Math.random()*SYMBOLS.length)], dx, dy); }
    else                  drawSparkle(ctx, dx, dy, 6, theme);
  }
  ctx.strokeStyle = theme.heartColor; ctx.lineWidth = 3;
  ctx.globalAlpha = 0.7; ctx.shadowColor = theme.heartColor; ctx.shadowBlur = 30;
  ctx.beginPath(); ctx.arc(cx, cy, r+40, 0, Math.PI*2); ctx.stroke();
  ctx.globalAlpha = 1; ctx.shadowBlur = 0;
}

function drawFloatingElements(ctx: any, W: number, H: number, theme: Theme) {
  for (let i = 0; i < 80; i++) {
    const x = Math.random()*W, y = Math.random()*H, size = 4 + Math.random()*20;
    ctx.globalAlpha = 0.2 + Math.random()*0.6;
    if      (i % 4 === 0) { ctx.font=`${size}px Arial`; ctx.fillStyle=theme.accentColor; ctx.fillText(SYMBOLS[Math.floor(Math.random()*SYMBOLS.length)], x, y); }
    else if (i % 3 === 0) drawHeart(ctx, x, y, size, i%2===0 ? theme.heartColor : theme.accentColor, 10);
    else                  drawSparkle(ctx, x, y, size, theme);
  }
  ctx.globalAlpha = 1;
}

function drawSparkle(ctx: any, x: number, y: number, size: number, theme: Theme) {
  ctx.shadowColor = "rgba(255,255,255,0.8)"; ctx.shadowBlur = size;
  ctx.fillStyle = `rgba(255,255,255,${0.7 + Math.random()*0.3})`;
  const pick = Math.floor(Math.random() * 5);
  if (pick === 0) { /* star */
    ctx.save(); ctx.translate(x, y); ctx.beginPath();
    for (let i=0;i<5;i++) {
      ctx.lineTo(Math.cos((18+i*72)/180*Math.PI)*size, Math.sin((18+i*72)/180*Math.PI)*size);
      ctx.lineTo(Math.cos((54+i*72)/180*Math.PI)*size/2, Math.sin((54+i*72)/180*Math.PI)*size/2);
    }
    ctx.closePath(); ctx.fill(); ctx.restore();
  } else if (pick === 1) { /* diamond */
    ctx.beginPath(); ctx.moveTo(x,y-size); ctx.lineTo(x+size,y); ctx.lineTo(x,y+size); ctx.lineTo(x-size,y); ctx.closePath(); ctx.fill();
  } else if (pick === 2) { /* circle */
    ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI*2); ctx.fill();
  } else if (pick === 3) { /* cross */
    const lw = size/3;
    ctx.fillRect(x-size, y-lw/2, size*2, lw); ctx.fillRect(x-lw/2, y-size, lw, size*2);
  } else { /* triangle */
    ctx.beginPath(); ctx.moveTo(x,y-size); ctx.lineTo(x-size,y+size); ctx.lineTo(x+size,y+size); ctx.closePath(); ctx.fill();
  }
  ctx.shadowColor = "transparent"; ctx.shadowBlur = 0;
}

function drawRomanticPattern(ctx: any, W: number, H: number, theme: Theme) {
  const pats = ["♥","♡","♦","♧","✦","✧"];
  for (let i = 0; i < 30; i++) {
    ctx.font = `${12 + Math.random()*18}px Arial`;
    ctx.fillStyle = theme.secondary;
    ctx.globalAlpha = 0.3 + Math.random()*0.4;
    ctx.fillText(pats[Math.floor(Math.random()*pats.length)], Math.random()*W, Math.random()*H);
  }
  ctx.globalAlpha = 1;
}

function drawMagicalBorder(ctx: any, W: number, H: number, theme: Theme) {
  const bw = 30;
  ctx.shadowColor = theme.accentColor; ctx.shadowBlur = 20;
  ctx.strokeStyle = theme.secondary; ctx.lineWidth = 12;
  ctx.setLineDash([20, 15]); ctx.strokeRect(bw/4, bw/4, W-bw/2, H-bw/2); ctx.setLineDash([]);
  ctx.strokeStyle = theme.accentColor; ctx.lineWidth = 8; ctx.shadowBlur = 15;
  ctx.strokeRect(bw/2, bw/2, W-bw, H-bw);
  ctx.strokeStyle = theme.heartColor; ctx.lineWidth = 6; ctx.shadowBlur = 10;
  ctx.strokeRect(bw*2/3, bw*2/3, W-bw*4/3, H-bw*4/3);
  ctx.shadowColor = "transparent"; ctx.shadowBlur = 0;
  const cs = 35;
  drawHeart(ctx, bw, bw, cs, theme.heartColor, 25);
  drawHeart(ctx, W-bw-cs, bw, cs, theme.heartColor, 25);
  drawHeart(ctx, bw, H-bw-cs, cs, theme.heartColor, 25);
  drawHeart(ctx, W-bw-cs, H-bw-cs, cs, theme.heartColor, 25);
  const edgeSyms = ["♥","♡","♦","◊"];
  for (let x = bw+100; x < W-bw-100; x += 100) {
    const s = edgeSyms[Math.floor(Math.random()*edgeSyms.length)];
    ctx.font="25px Arial"; ctx.fillStyle=theme.heartColor;
    ctx.fillText(s, x, bw/2+10); ctx.fillText(s, x, H-bw/2+10);
  }
  for (let y = bw+100; y < H-bw-100; y += 100) {
    const s = edgeSyms[Math.floor(Math.random()*edgeSyms.length)];
    ctx.font="25px Arial"; ctx.fillStyle=theme.heartColor;
    ctx.fillText(s, bw/2, y); ctx.fillText(s, W-bw/2, y);
  }
}

/* ── rounded rect helper ── */
function rrect(ctx: any, x: number, y: number, w: number, h: number, r: number) {
  if (w < 2*r) r = w/2;
  if (h < 2*r) r = h/2;
  ctx.beginPath();
  ctx.moveTo(x+r, y); ctx.arcTo(x+w, y, x+w, y+h, r);
  ctx.arcTo(x+w, y+h, x, y+h, r); ctx.arcTo(x, y+h, x, y, r);
  ctx.arcTo(x, y, x+w, y, r); ctx.closePath();
}
