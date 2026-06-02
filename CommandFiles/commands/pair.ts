import { UNIRedux, UNISpectra } from "@cassidy/unispectra";
import { defineCommand, defineEntry } from "@cass/define";
import { createCanvas, loadImage } from "@napi-rs/canvas";

// ══════════════════════════════════════════════════════════════════════════════
// ─── THEMES ───────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

const THEMES: Record<string, any> = {
  paradise: {
    name: "Paradise Love",
    bg: (ctx: any, w: number, h: number) => {
      const g = ctx.createRadialGradient(w/2,h/2,0,w/2,h/2,Math.max(w,h));
      g.addColorStop(0,"#ffb3d9"); g.addColorStop(0.3,"#ff6bb3");
      g.addColorStop(0.6,"#e056fd"); g.addColorStop(1,"#7c3aed");
      ctx.fillStyle = g; ctx.fillRect(0,0,w,h);
    },
    heart: "#ff1744", text: "#ffffff", shadow: "rgba(255,23,68,0.9)",
    accent: "#ff69b4", secondary: "#ffc0cb",
  },
  cosmic: {
    name: "Cosmic Romance",
    bg: (ctx: any, w: number, h: number) => {
      const g = ctx.createLinearGradient(0,0,w,h);
      g.addColorStop(0,"#667eea"); g.addColorStop(0.2,"#764ba2");
      g.addColorStop(0.5,"#f093fb"); g.addColorStop(0.8,"#f5576c");
      g.addColorStop(1,"#4facfe");
      ctx.fillStyle = g; ctx.fillRect(0,0,w,h);
    },
    heart: "#ff6b9d", text: "#ffffff", shadow: "rgba(255,107,157,0.9)",
    accent: "#c471ed", secondary: "#a8edea",
  },
  enchanted: {
    name: "Enchanted Garden",
    bg: (ctx: any, w: number, h: number) => {
      const g = ctx.createLinearGradient(0,0,0,h);
      g.addColorStop(0,"#ffecd2"); g.addColorStop(0.3,"#fcb69f");
      g.addColorStop(0.6,"#ff9a9e"); g.addColorStop(1,"#fecfef");
      ctx.fillStyle = g; ctx.fillRect(0,0,w,h);
    },
    heart: "#e91e63", text: "#ffffff", shadow: "rgba(233,30,99,0.9)",
    accent: "#f8bbd9", secondary: "#ffd1dc",
  },
  royal: {
    name: "Royal Love",
    bg: (ctx: any, w: number, h: number) => {
      const g = ctx.createLinearGradient(0,0,0,h);
      g.addColorStop(0,"#667eea"); g.addColorStop(0.3,"#764ba2");
      g.addColorStop(0.7,"#9932cc"); g.addColorStop(1,"#4b0082");
      ctx.fillStyle = g; ctx.fillRect(0,0,w,h);
    },
    heart: "#ffd700", text: "#ffffff", shadow: "rgba(255,215,0,0.9)",
    accent: "#dda0dd", secondary: "#e6e6fa",
  },
  sunset: {
    name: "Dreamy Sunset",
    bg: (ctx: any, w: number, h: number) => {
      const g = ctx.createLinearGradient(0,0,0,h);
      g.addColorStop(0,"#ff9a9e"); g.addColorStop(0.5,"#fecfef");
      g.addColorStop(1,"#ff6b6b");
      ctx.fillStyle = g; ctx.fillRect(0,0,w,h);
    },
    heart: "#ff1744", text: "#ffffff", shadow: "rgba(255,23,68,0.9)",
    accent: "#ff4081", secondary: "#ffb6c1",
  },
  ocean: {
    name: "Ocean Dreams",
    bg: (ctx: any, w: number, h: number) => {
      const g = ctx.createLinearGradient(0,0,0,h);
      g.addColorStop(0,"#667eea"); g.addColorStop(0.5,"#764ba2");
      g.addColorStop(1,"#a8edea");
      ctx.fillStyle = g; ctx.fillRect(0,0,w,h);
    },
    heart: "#ff6b9d", text: "#ffffff", shadow: "rgba(255,107,157,0.9)",
    accent: "#4facfe", secondary: "#87ceeb",
  },
};

const MESSAGES = [
  "Love is in the air", "Perfect match made in heaven",
  "Two hearts beating as one", "Love conquers all",
  "Soulmates found", "Forever and always",
  "Love blooms eternal", "Hearts intertwined",
  "Cupid's perfect shot", "Written in the stars",
  "Magical love story", "Sweet romance",
];

const LOVE_PERCENTAGES = [87,88,89,90,91,92,93,94,95,96,97,98,99,100];
const SYMBOLS = ["♥","♡","♦","♧","✦","✧","✩","✪","✫","✬","✭","✮","✯","✰","✱","✲","✳","✴","✵","✶","✷","✸","✹","✺","✻","✼","✽","✾","✿","❀","❁","❂","❃","❅","❆","❇"];

// ══════════════════════════════════════════════════════════════════════════════
// ─── DRAW HELPERS ─────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

function roundRect(ctx: any, x: number, y: number, w: number, h: number, r: number) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r);
  ctx.closePath();
}

function drawHeart(ctx: any, x: number, y: number, size: number, color: string, glow = 20) {
  ctx.shadowColor = color; ctx.shadowBlur = glow * 2;
  ctx.fillStyle = color; ctx.globalAlpha = 0.3;
  for (let i = 0; i < 3; i++) {
    const s = size + i * 5;
    ctx.beginPath();
    ctx.moveTo(x,y+s/4);
    ctx.bezierCurveTo(x,y,x-s/2,y,x-s/2,y+s/4);
    ctx.bezierCurveTo(x-s/2,y+s/2,x,y+s,x,y+s);
    ctx.bezierCurveTo(x,y+s,x+s/2,y+s/2,x+s/2,y+s/4);
    ctx.bezierCurveTo(x+s/2,y,x,y,x,y+s/4);
    ctx.fill();
  }
  ctx.globalAlpha = 1; ctx.shadowBlur = glow;
  ctx.beginPath();
  ctx.moveTo(x,y+size/4);
  ctx.bezierCurveTo(x,y,x-size/2,y,x-size/2,y+size/4);
  ctx.bezierCurveTo(x-size/2,y+size/2,x,y+size,x,y+size);
  ctx.bezierCurveTo(x,y+size,x+size/2,y+size/2,x+size/2,y+size/4);
  ctx.bezierCurveTo(x+size/2,y,x,y,x,y+size/4);
  ctx.fillStyle = color; ctx.fill();
  const gl = ctx.createLinearGradient(x-size/4,y,x+size/4,y+size);
  gl.addColorStop(0,"rgba(255,255,255,0.8)"); gl.addColorStop(1,"rgba(255,255,255,0.1)");
  ctx.fillStyle = gl; ctx.shadowBlur = 0; ctx.fill();
  ctx.shadowColor = "transparent"; ctx.shadowBlur = 0;
}

function drawStar(ctx: any, x: number, y: number, size: number) {
  ctx.save(); ctx.translate(x,y); ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    ctx.lineTo(Math.cos((18+i*72)/180*Math.PI)*size, Math.sin((18+i*72)/180*Math.PI)*size);
    ctx.lineTo(Math.cos((54+i*72)/180*Math.PI)*size/2, Math.sin((54+i*72)/180*Math.PI)*size/2);
  }
  ctx.closePath(); ctx.fill(); ctx.restore();
}

function drawSparkle(ctx: any, x: number, y: number, size: number, theme: any) {
  ctx.shadowColor = "rgba(255,255,255,0.8)"; ctx.shadowBlur = size;
  ctx.fillStyle = `rgba(255,255,255,${0.7+Math.random()*0.3})`;
  const r = Math.floor(Math.random() * 3);
  if (r === 0) drawStar(ctx, x, y, size);
  else if (r === 1) { ctx.beginPath(); ctx.moveTo(x,y-size); ctx.lineTo(x+size,y); ctx.lineTo(x,y+size); ctx.lineTo(x-size,y); ctx.closePath(); ctx.fill(); }
  else { ctx.beginPath(); ctx.arc(x,y,size,0,Math.PI*2); ctx.fill(); }
  ctx.shadowColor = "transparent"; ctx.shadowBlur = 0;
}

function drawFloatingElements(ctx: any, w: number, h: number, theme: any) {
  for (let i = 0; i < 80; i++) {
    const x = Math.random()*w, y = Math.random()*h;
    const size = 4+Math.random()*20;
    ctx.globalAlpha = 0.2+Math.random()*0.6;
    if (i%4===0) {
      ctx.font = `${size}px sans-serif`;
      ctx.fillStyle = theme.accent;
      ctx.fillText(SYMBOLS[Math.floor(Math.random()*SYMBOLS.length)], x, y);
    } else if (i%3===0) {
      drawHeart(ctx, x, y, size, i%2===0 ? theme.heart : theme.accent, 10);
    } else {
      drawSparkle(ctx, x, y, size, theme);
    }
  }
  ctx.globalAlpha = 1;
}

function drawBorder(ctx: any, w: number, h: number, theme: any) {
  const bw = 30;
  [[12,theme.secondary,20],[8,theme.accent,15],[6,theme.heart,10]].forEach(([lw,color,blur]:any) => {
    ctx.strokeStyle = color; ctx.lineWidth = lw;
    ctx.shadowColor = color; ctx.shadowBlur = blur;
    ctx.setLineDash([20,15]);
    ctx.strokeRect(bw/4,bw/4,w-bw/2,h-bw/2);
    ctx.setLineDash([]);
  });
  ctx.shadowColor = "transparent"; ctx.shadowBlur = 0;
  drawHeart(ctx,bw,bw,35,theme.heart,25);
  drawHeart(ctx,w-bw-35,bw,35,theme.heart,25);
  drawHeart(ctx,bw,h-bw-35,35,theme.heart,25);
  drawHeart(ctx,w-bw-35,h-bw-35,35,theme.heart,25);
  for (let x = bw+100; x < w-bw-100; x += 100) {
    ctx.font = "25px sans-serif"; ctx.fillStyle = theme.heart;
    ctx.fillText("♥", x, bw/2+10); ctx.fillText("♥", x, h-bw/2+10);
  }
}

function drawText(ctx: any, text: string, x: number, y: number, size: number, theme: any) {
  ctx.font = `bold ${size}px sans-serif`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  [
    {blur:30,ox:8,oy:8,color:"rgba(0,0,0,0.5)"},
    {blur:20,ox:6,oy:6,color:theme.shadow},
    {blur:15,ox:4,oy:4,color:theme.accent},
    {blur:10,ox:2,oy:2,color:theme.heart},
  ].forEach(({blur,ox,oy,color}) => {
    ctx.shadowColor=color; ctx.shadowBlur=blur;
    ctx.shadowOffsetX=ox; ctx.shadowOffsetY=oy;
    ctx.fillStyle=theme.text; ctx.fillText(text,x,y);
  });
  ctx.shadowColor="transparent"; ctx.shadowBlur=0; ctx.shadowOffsetX=0; ctx.shadowOffsetY=0;
  const g = ctx.createLinearGradient(x-100,y-size/2,x+100,y+size/2);
  g.addColorStop(0,theme.text); g.addColorStop(0.5,"#ffffff"); g.addColorStop(1,theme.text);
  ctx.fillStyle=g; ctx.fillText(text,x,y);
  ctx.strokeStyle=theme.heart; ctx.lineWidth=2; ctx.strokeText(text,x,y);
}

function drawLoveBar(ctx: any, pct: number, x: number, y: number, w: number, h: number, theme: any) {
  ctx.shadowColor=theme.accent; ctx.shadowBlur=20;
  ctx.fillStyle="rgba(0,0,0,0.3)"; roundRect(ctx,x-5,y-5,w+10,h+10,20); ctx.fill();
  ctx.shadowBlur=0;
  ctx.fillStyle="rgba(255,255,255,0.2)"; roundRect(ctx,x,y,w,h,15); ctx.fill();
  const barW = (w*pct)/100;
  const gBar = ctx.createLinearGradient(x,y,x+w,y);
  gBar.addColorStop(0,theme.heart); gBar.addColorStop(0.3,theme.accent);
  gBar.addColorStop(0.7,theme.secondary); gBar.addColorStop(1,theme.heart);
  ctx.fillStyle=gBar; ctx.shadowColor=theme.heart; ctx.shadowBlur=25;
  roundRect(ctx,x,y,barW,h,15); ctx.fill();
  const shine = ctx.createLinearGradient(x,y,x,y+h);
  shine.addColorStop(0,"rgba(255,255,255,0.8)"); shine.addColorStop(0.5,"rgba(255,255,255,0.3)"); shine.addColorStop(1,"rgba(255,255,255,0.1)");
  ctx.fillStyle=shine; ctx.shadowBlur=0; roundRect(ctx,x,y,barW,h/3,15); ctx.fill();
  ctx.strokeStyle=theme.heart; ctx.lineWidth=4; ctx.shadowColor=theme.heart; ctx.shadowBlur=15;
  roundRect(ctx,x,y,w,h,15); ctx.stroke();
  ctx.shadowColor="transparent"; ctx.shadowBlur=0;
  drawText(ctx,`${pct}%`,x+w/2,y+h/2,24,theme);
  for (let i = 0; i < 8; i++) {
    drawHeart(ctx, x+(i*w/7)+Math.random()*20, y-15-Math.random()*10, 8, theme.accent, 8);
  }
}

function drawAvatarFrame(ctx: any, x: number, y: number, size: number, theme: any) {
  const cx = x+size/2, cy = y+size/2, r = size/2;
  [[r+25,10,theme.secondary,25],[r+18,8,theme.accent,20],[r+12,6,theme.heart,15],[r+6,4,"#ffffff",10]].forEach(([rad,lw,color,blur]:any)=>{
    ctx.strokeStyle=color; ctx.lineWidth=lw; ctx.shadowColor=color; ctx.shadowBlur=blur;
    ctx.beginPath(); ctx.arc(cx,cy,rad,0,Math.PI*2); ctx.stroke();
  });
  ctx.shadowColor="transparent"; ctx.shadowBlur=0;
  for (let i = 0; i < 12; i++) {
    const angle=(i*Math.PI*2)/12;
    const dx=cx+Math.cos(angle)*(r+35), dy=cy+Math.sin(angle)*(r+35);
    if (i%3===0) drawHeart(ctx,dx-8,dy-8,16,theme.heart,15);
    else if (i%3===1) { ctx.font="20px sans-serif"; ctx.fillStyle=theme.accent; ctx.fillText(SYMBOLS[Math.floor(Math.random()*SYMBOLS.length)],dx,dy); }
    else drawSparkle(ctx,dx,dy,6,theme);
  }
  ctx.strokeStyle=theme.heart; ctx.lineWidth=3;
  ctx.globalAlpha=0.7; ctx.shadowColor=theme.heart; ctx.shadowBlur=30;
  ctx.beginPath(); ctx.arc(cx,cy,r+40,0,Math.PI*2); ctx.stroke();
  ctx.globalAlpha=1; ctx.shadowBlur=0;
}

async function buildPairCanvas(
  name1: string, name2: string,
  avatarUrl1: string, avatarUrl2: string,
  themeName: string, lovePct: number, message: string
): Promise<Buffer> {
  const theme = THEMES[themeName] || THEMES.paradise;
  const W = 1400, H = 800;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d") as any;

  // Background
  theme.bg(ctx, W, H);

  // Pattern
  for (let i = 0; i < 30; i++) {
    ctx.font = `${12+Math.random()*18}px sans-serif`;
    ctx.fillStyle = theme.secondary;
    ctx.globalAlpha = 0.3+Math.random()*0.4;
    ctx.fillText(["♥","♡","♦","♧","✦","✧"][Math.floor(Math.random()*6)], Math.random()*W, Math.random()*H);
  }
  ctx.globalAlpha = 1;

  // Floating elements
  drawFloatingElements(ctx, W, H, theme);

  // Border
  drawBorder(ctx, W, H, theme);

  // Load avatars
  let av1: any, av2: any;
  try { av1 = await loadImage(avatarUrl1); } catch {}
  try { av2 = await loadImage(avatarUrl2); } catch {}

  const avSize = 220, av1X = 180, av2X = W-180-avSize, avY = 220;

  // Frames
  drawAvatarFrame(ctx, av1X, avY, avSize, theme);
  drawAvatarFrame(ctx, av2X, avY, avSize, theme);

  // Draw circular avatars
  if (av1) {
    ctx.save();
    ctx.beginPath(); ctx.arc(av1X+avSize/2, avY+avSize/2, avSize/2, 0, Math.PI*2); ctx.clip();
    ctx.drawImage(av1, av1X, avY, avSize, avSize);
    ctx.restore();
  } else {
    ctx.fillStyle = theme.heart;
    ctx.beginPath(); ctx.arc(av1X+avSize/2, avY+avSize/2, avSize/2, 0, Math.PI*2); ctx.fill();
    drawText(ctx, name1[0]?.toUpperCase()||"?", av1X+avSize/2, avY+avSize/2, 80, theme);
  }

  if (av2) {
    ctx.save();
    ctx.beginPath(); ctx.arc(av2X+avSize/2, avY+avSize/2, avSize/2, 0, Math.PI*2); ctx.clip();
    ctx.drawImage(av2, av2X, avY, avSize, avSize);
    ctx.restore();
  } else {
    ctx.fillStyle = theme.accent;
    ctx.beginPath(); ctx.arc(av2X+avSize/2, avY+avSize/2, avSize/2, 0, Math.PI*2); ctx.fill();
    drawText(ctx, name2[0]?.toUpperCase()||"?", av2X+avSize/2, avY+avSize/2, 80, theme);
  }

  // Central heart
  const hx = W/2, hy = avY+avSize/2;
  drawHeart(ctx, hx-30, hy-30, 60, theme.heart, 30);

  // Connection lines
  ctx.strokeStyle=theme.accent; ctx.lineWidth=6;
  ctx.shadowColor=theme.accent; ctx.shadowBlur=15; ctx.setLineDash([15,10]);
  ctx.beginPath();
  ctx.moveTo(av1X+avSize, avY+avSize/2); ctx.lineTo(hx-30, hy);
  ctx.moveTo(hx+30, hy); ctx.lineTo(av2X, avY+avSize/2);
  ctx.stroke(); ctx.setLineDash([]); ctx.shadowBlur=0;

  // Small hearts on lines
  for (let i = 0; i < 6; i++) {
    const t = i/5;
    const x1 = av1X+avSize + t*(hx-30-(av1X+avSize));
    const x2 = hx+30 + t*(av2X-(hx+30));
    drawHeart(ctx,x1-6,avY+avSize/2-6,12,theme.secondary,8);
    drawHeart(ctx,x2-6,avY+avSize/2-6,12,theme.secondary,8);
  }

  // Texts
  drawText(ctx, theme.name,        W/2, 120, 48, theme);
  drawText(ctx, "♥ Love Connection ♥", W/2, 180, 38, theme);
  drawText(ctx, name1,  av1X+avSize/2, avY+avSize+80, 32, theme);
  drawText(ctx, name2,  av2X+avSize/2, avY+avSize+80, 32, theme);
  drawText(ctx, message, W/2, 580, 36, theme);

  // Love bar
  drawLoveBar(ctx, lovePct, W/2-250, 620, 500, 50, theme);
  drawText(ctx, "♦ Eternal Love ♦", W/2, 700, 30, theme);

  // Final symbols
  for (let i = 0; i < 25; i++) {
    ctx.font = `${15+Math.random()*10}px sans-serif`;
    ctx.globalAlpha = 0.6+Math.random()*0.4;
    ctx.fillStyle = theme.accent;
    ctx.fillText(["♥","♡","♦","♧","✦","✧"][Math.floor(Math.random()*6)], 50+Math.random()*(W-100), 50+Math.random()*(H-100));
  }
  ctx.globalAlpha = 1;

  return canvas.toBuffer("image/png");
}

// ══════════════════════════════════════════════════════════════════════════════
// ─── COMMAND ──────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

const command = defineCommand({
  meta: {
    name: "pair",
    otherNames: ["pairing", "love", "lovematch"],
    description: "💘 Crée une image romantique entre deux membres avec détection de genre",
    version: "2.0.0",
    author: "Christus",
    category: "Fun",
    usage:
      "{prefix}{name} — random group pairing\n" +
      "{prefix}{name} @mention — pair with someone\n" +
      "{prefix}{name} <theme> — specify theme\n" +
      "Themes: paradise · cosmic · enchanted · royal · sunset · ocean",
    role: 0,
    noPrefix: false,
    waitingTime: 20,
    requirement: "3.0.0",
    icon: "💘",
  },
  style: {
    title: "💘 Pair",
    titleFont: "bold",
    contentFont: "fancy",
  },

  entry: defineEntry(async (ctx) => {
    const { input, output, api, usersDB } = ctx;
    const args = input.arguments ?? [];

    const themeNames = Object.keys(THEMES);
    const themeArg = args.find((a) => themeNames.includes(a.toLowerCase()));
    const themeName = themeArg ? themeArg.toLowerCase() : themeNames[Math.floor(Math.random() * themeNames.length)];

    // ── Loading ─────────────────────────────────────────────────────────────
    const loading = await output.replyStyled(
      { body: `${UNIRedux.charm} Pair 💫\n\n⏳ Création de votre paire romantique...` },
      style
    );

    try {
      const senderID = input.senderID;

      // ── Resolve target ─────────────────────────────────────────────────────
      const mentions = (input as any).mentions ?? {};
      const replyID  = (input as any).messageReply?.senderID;
      let targetID: string | null = Object.keys(mentions)[0] || replyID || null;

      if (!targetID) {
        // Random member from thread with gender-based matching
        try {
          const threadInfo = await api.getThreadInfo(input.threadID);
          const botID      = api.getCurrentUserID();
          let candidates   = (threadInfo.participantIDs ?? []).filter(
            (id: string) => id !== senderID && id !== botID
          );

          if (candidates.length === 0) {
            await output.unsend(loading.messageID);
            return output.replyStyled(
              { body: `${UNIRedux.arrow} Pair ❌\n\nAucun autre membre dans ce groupe.` },
              style
            );
          }

          // Try gender-based matching
          try {
            const senderInfo = await api.getUserInfo(senderID);
            const senderGender = senderInfo?.[senderID]?.gender;
            if (senderGender) {
              const opposite: string[] = [];
              for (const cid of candidates) {
                try {
                  const cInfo = await api.getUserInfo(cid);
                  const cGender = cInfo?.[cid]?.gender;
                  if ((senderGender === 1 && cGender === 2) || (senderGender === 2 && cGender === 1)) {
                    opposite.push(cid);
                  }
                } catch {}
              }
              if (opposite.length > 0) candidates = opposite;
            }
          } catch {}

          targetID = candidates[Math.floor(Math.random() * candidates.length)];
        } catch {
          await output.unsend(loading.messageID);
          return output.replyStyled(
            { body: `${UNIRedux.arrow} Pair ❌\n\nImpossible de trouver un partenaire. Mentionnez quelqu'un.` },
            style
          );
        }
      }

      if (!targetID) {
        await output.unsend(loading.messageID);
        return output.replyStyled(
          { body: `${UNIRedux.arrow} Pair ❌\n\nAucun utilisateur trouvé pour le jumelage.` },
          style
        );
      }

      // ── Get names via usersDB ─────────────────────────────────────────────
      await Promise.all([
        (usersDB as any).ensureUserInfo(senderID).catch(() => {}),
        (usersDB as any).ensureUserInfo(targetID).catch(() => {}),
      ]);

      const [db1, db2] = await Promise.all([
        (usersDB as any).getItem(senderID).catch(() => null),
        (usersDB as any).getItem(targetID).catch(() => null),
      ]);

      const name1 = db1?.userMeta?.name || db1?.name || "User 1";
      const name2 = db2?.userMeta?.name || db2?.name || "User 2";

      // ── Get avatar URLs via usersDB.userMeta.image ────────────────────────
      let av1Url = db1?.userMeta?.image || `https://graph.facebook.com/${senderID}/picture?width=500&height=500`;
      let av2Url = db2?.userMeta?.image || `https://graph.facebook.com/${targetID}/picture?width=500&height=500`;

      // Fallback: saveUserInfo + retry
      if (!db1?.userMeta?.image) {
        try {
          await (usersDB as any).saveUserInfo(senderID);
          const fresh = await (usersDB as any).getItem(senderID);
          if (fresh?.userMeta?.image) av1Url = fresh.userMeta.image;
        } catch {}
      }
      if (!db2?.userMeta?.image) {
        try {
          await (usersDB as any).saveUserInfo(targetID);
          const fresh = await (usersDB as any).getItem(targetID);
          if (fresh?.userMeta?.image) av2Url = fresh.userMeta.image;
        } catch {}
      }

      // ── Build canvas ──────────────────────────────────────────────────────
      const lovePct = LOVE_PERCENTAGES[Math.floor(Math.random() * LOVE_PERCENTAGES.length)];
      const message = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];

      const imgBuffer = await buildPairCanvas(name1, name2, av1Url, av2Url, themeName, lovePct, message);

      await output.unsend(loading.messageID);

      return output.reply({
        body:
          `💕 ${message} 💕\n\n` +
          `${UNISpectra.arrow} ♥ ${name1} ♡ ${name2} ♥\n` +
          `${UNISpectra.arrowFromT} 💖 Compatibilité: ${lovePct}%\n` +
          `${UNISpectra.arrowFromT} 🎨 Thème: ${THEMES[themeName].name}`,
        attachment: imgBuffer,
      });

    } catch (err: any) {
      await output.unsend(loading.messageID).catch(() => {});
      console.error("[pair]", err);
      return output.replyStyled(
        {
          body:
            `${UNIRedux.arrow} Pair ❌\n\n` +
            `Erreur lors de la création de l'image.\n` +
            `${UNISpectra.arrowFromT} ${err?.message ?? "Unknown error"}`,
        },
        style
      );
    }
  }),
});

const style = command.style;
export default command;
