import { UNIRedux, UNISpectra } from "@cassidy/unispectra";
import { defineCommand, defineEntry } from "@cass/define";
import {
  createCanvas,
  GlobalFonts,
  Path2D,
} from "@napi-rs/canvas";
import fs from "fs";
import path from "path";
import os from "os";

const COLORS = [
  { key: "red",    name: "Rouge", emoji: "🔴", hex: "#ef4444", dark: "#991b1b", start: 0,  home: [[1,6],[2,6],[3,6],[4,6],[5,6],[6,6]],       yard: [[2,2],[4,2],[2,4],[4,4]]     },
  { key: "yellow", name: "Jaune", emoji: "🟡", hex: "#facc15", dark: "#a16207", start: 13, home: [[8,1],[8,2],[8,3],[8,4],[8,5],[8,6]],       yard: [[10,2],[12,2],[10,4],[12,4]] },
  { key: "green",  name: "Vert",  emoji: "🟢", hex: "#22c55e", dark: "#166534", start: 26, home: [[13,8],[12,8],[11,8],[10,8],[9,8],[8,8]],   yard: [[10,10],[12,10],[10,12],[12,12]] },
  { key: "blue",   name: "Bleu",  emoji: "🔵", hex: "#3b82f6", dark: "#1e40af", start: 39, home: [[6,13],[6,12],[6,11],[6,10],[6,9],[6,8]],   yard: [[2,10],[4,10],[2,12],[4,12]]  },
];

const TRACK = [
  [1,6],[2,6],[3,6],[4,6],[5,6],[6,5],[6,4],[6,3],[6,2],[6,1],[6,0],[7,0],[8,0],
  [8,1],[8,2],[8,3],[8,4],[8,5],[9,6],[10,6],[11,6],[12,6],[13,6],[14,6],[14,7],[14,8],
  [13,8],[12,8],[11,8],[10,8],[9,8],[8,9],[8,10],[8,11],[8,12],[8,13],[8,14],[7,14],[6,14],
  [6,13],[6,12],[6,11],[6,10],[6,9],[5,8],[4,8],[3,8],[2,8],[1,8],[0,8],[0,7],[0,6],
];

const SAFE_TRACK_INDEXES = new Set([0,8,13,21,26,34,39,47]);
const GAME_EXPIRE_TIME = 45 * 60 * 1000;
const activeGames = new Map<string, any>();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function randomDice() { return Math.floor(Math.random() * 6) + 1; }
function diceEmoji(n: number) { return ["","1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣"][n] || String(n); }

function cleanupExpiredGames() {
  const now = Date.now();
  for (const game of activeGames.values()) {
    if (now - game.updatedAt > GAME_EXPIRE_TIME) endGame(game);
  }
}

function endGame(game: any) {
  activeGames.delete(game.key);
}

function endGamesForThread(threadID: string, senderID: string): number {
  let ended = 0;
  for (const game of [...activeGames.values()]) {
    if (game.threadID === threadID && game.players.some((p: any) => p.id === senderID)) {
      endGame(game); ended++;
    }
  }
  return ended;
}

function createGame(threadID: string, rawPlayers: any[], teamMode: boolean, commandName: string, botGame: boolean, bet = 0) {
  const players = rawPlayers.map((player, index) => ({
    ...player,
    color: COLORS[index].key,
    emoji: COLORS[index].emoji,
    colorData: COLORS[index],
    tokens: [-1, -1, -1, -1],
    finished: 0,
    team: teamMode ? (index % 2 === 0 ? "A" : "B") : null,
  }));
  const key = botGame ? `${threadID}:${rawPlayers[0].id}` : threadID;
  const humanCount = rawPlayers.filter((p) => !p.bot).length;
  return {
    id: `${threadID}_${Date.now()}`,
    key, botGame, threadID, commandName, players, teamMode,
    turnIndex: 0, phase: "roll", lastRoll: null, legalMoves: [],
    moveCount: 0, captures: [], log: ["Partie créée"],
    replyMessageID: null, updatedAt: Date.now(), startedAt: Date.now(),
    bet, pot: bet * humanCount, prizePerWinner: 0, winners: [],
  };
}

function getLegalMoves(player: any, roll: number): number[] {
  const moves: number[] = [];
  player.tokens.forEach((progress: number, index: number) => {
    if (progress === 57) return;
    if (progress === -1 && roll === 6) moves.push(index);
    else if (progress >= 0 && progress + roll <= 57) moves.push(index);
  });
  return moves;
}

function getTokenPosition(player: any, progress: number) {
  if (progress < 0) return null;
  if (progress <= 51) {
    const trackIndex = (player.colorData.start + progress) % TRACK.length;
    const [col, row] = TRACK[trackIndex];
    return { zone: "track", trackIndex, col, row };
  }
  if (progress <= 56) {
    const [col, row] = player.colorData.home[progress - 52];
    return { zone: "home", col, row };
  }
  return { zone: "finish", col: 7, row: 7 };
}

function applyMove(game: any, playerIndex: number, tokenIndex: number, roll: number) {
  const player = game.players[playerIndex];
  const before = player.tokens[tokenIndex];
  const next = before === -1 ? 0 : before + roll;
  player.tokens[tokenIndex] = next;
  game.moveCount++;
  if (next === 57) {
    player.finished++;
    game.log.unshift(`${player.emoji} ${player.name} a ramené le pion ${tokenIndex + 1} à la maison.`);
    return;
  }
  const position = getTokenPosition(player, next);
  if (!position || position.zone !== "track" || SAFE_TRACK_INDEXES.has(position.trackIndex)) return;
  for (const enemy of game.players) {
    if (enemy === player) continue;
    if (game.teamMode && enemy.team === player.team) continue;
    enemy.tokens.forEach((ep: number, ei: number) => {
      const ePos = getTokenPosition(enemy, ep);
      if (ePos && ePos.zone === "track" && ePos.trackIndex === position.trackIndex) {
        enemy.tokens[ei] = -1;
        game.captures.push({ by: player.name, victim: enemy.name });
        game.log.unshift(`${player.emoji} ${player.name} a capturé le pion ${ei + 1} de ${enemy.emoji} ${enemy.name}.`);
      }
    });
  }
}

function chooseBotMove(game: any, playerIndex: number, legal: number[], roll: number): number {
  const player = game.players[playerIndex];
  let best = legal[0], bestScore = -999;
  for (const tokenIndex of legal) {
    const progress = player.tokens[tokenIndex];
    const next = progress === -1 ? 0 : progress + roll;
    let score = next;
    if (progress === -1) score += 20;
    if (next === 57) score += 100;
    const pos = getTokenPosition(player, next);
    if (pos && pos.zone === "track") {
      for (const enemy of game.players) {
        if (enemy === player) continue;
        if (game.teamMode && enemy.team === player.team) continue;
        if (enemy.tokens.some((t: number) => {
          const ep = getTokenPosition(enemy, t);
          return ep && ep.zone === "track" && ep.trackIndex === pos.trackIndex;
        })) score += 60;
      }
      if (SAFE_TRACK_INDEXES.has(pos.trackIndex)) score += 8;
    }
    if (score > bestScore) { bestScore = score; best = tokenIndex; }
  }
  return best;
}

function nextTurn(game: any, roll: number) {
  if (roll !== 6) game.turnIndex = (game.turnIndex + 1) % game.players.length;
  game.phase = "roll"; game.lastRoll = null; game.legalMoves = [];
}

function afterHumanMove(game: any) {
  nextTurn(game, game.lastRoll);
  game.phase = "roll"; game.lastRoll = null; game.legalMoves = [];
}

function getWinner(game: any): string | null {
  if (game.teamMode) {
    const tA = game.players.filter((p: any) => p.team === "A");
    const tB = game.players.filter((p: any) => p.team === "B");
    if (tA.every((p: any) => p.tokens.every((t: number) => t === 57))) return "L'équipe Rouge + Vert remporte la partie 2v2 !";
    if (tB.every((p: any) => p.tokens.every((t: number) => t === 57))) return "L'équipe Jaune + Bleu remporte la partie 2v2 !";
    return null;
  }
  const winner = game.players.find((p: any) => p.tokens.every((t: number) => t === 57));
  return winner ? `${winner.emoji} ${winner.name} remporte Ludo Royal !` : null;
}

async function payoutWinner(game: any, money: any) {
  if (!game.bet || !game.pot || !money) return;
  let winners: any[] = [];
  if (game.teamMode) {
    const tA = game.players.filter((p: any) => p.team === "A");
    const tB = game.players.filter((p: any) => p.team === "B");
    if (tA.every((p: any) => p.tokens.every((t: number) => t === 57))) winners = tA.filter((p: any) => !p.bot);
    else if (tB.every((p: any) => p.tokens.every((t: number) => t === 57))) winners = tB.filter((p: any) => !p.bot);
  } else {
    const w = game.players.find((p: any) => p.tokens.every((t: number) => t === 57) && !p.bot);
    if (w) winners = [w];
  }
  if (!winners.length) return;
  const prize = Math.floor(game.pot / winners.length);
  game.prizePerWinner = prize;
  game.winners = winners;
  for (const w of winners) {
    try {
      const ud = await money.getItem(w.id);
      await money.setItem(w.id, { money: (ud?.money || 0) + prize });
    } catch {}
  }
}

async function refundBets(game: any, money: any) {
  if (!game.bet || !money) return;
  for (const p of game.players.filter((p: any) => !p.bot)) {
    try {
      const ud = await money.getItem(p.id);
      await money.setItem(p.id, { money: (ud?.money || 0) + game.bet });
    } catch {}
  }
}

function buildWinMessage(game: any, baseMsg: string): string {
  if (!game.bet || !game.prizePerWinner) return `🏆 ${baseMsg}`;
  const names = (game.winners || []).map((w: any) => w.name).join(" & ");
  return `🏆 ${baseMsg}\n💰 ${names} remporte $${game.prizePerWinner.toLocaleString()} !`;
}

function formatDetails(game: any, body: string): string {
  const current = game.players[game.turnIndex];
  const elapsed = Math.floor((Date.now() - game.startedAt) / 60000);
  const mode = game.teamMode ? "2v2 Équipes" : `${game.players.length} joueurs`;
  const lines: string[] = [];
  lines.push(`🎲 LUDO ROYAL — ${mode}`);
  lines.push(`⏱ ${elapsed}min | Mouvements: ${game.moveCount} | Captures: ${game.captures.length}`);
  if (game.bet > 0) lines.push(`💰 Mise: $${game.bet.toLocaleString()} | Cagnotte: $${game.pot.toLocaleString()}`);
  lines.push("━━━━━━━━━━━━━━━━━━━━━━");
  if (game.lastRoll) {
    const label = game.lastRoll === 6 ? `${diceEmoji(6)} 6 — TOUR SUPPLÉMENTAIRE !` : `${diceEmoji(game.lastRoll)} (${game.lastRoll})`;
    lines.push(`🎲 Dé: ${label}`);
  }
  if (current) {
    if (current.bot) lines.push(`🤖 Tour: ${current.name} [BOT] réfléchit...`);
    else lines.push(`👑 Tour: ${current.name}`);
    if (game.phase === "move") lines.push(`⚡ Choisissez le pion: ${game.legalMoves.map((i: number) => i + 1).join(" ou ")}`);
    else lines.push(`⚡ Répondez "roll" pour lancer le dé`);
  }
  lines.push("━━━━━━━━━━━━━━━━━━━━━━");
  lines.push("📊 Scores:");
  game.players.forEach((p: any, idx: number) => {
    const home = p.tokens.filter((t: number) => t === 57).length;
    const onBoard = p.tokens.filter((t: number) => t >= 0 && t < 57).length;
    const inYard = p.tokens.filter((t: number) => t === -1).length;
    const caps = game.captures.filter((c: any) => c.by === p.name).length;
    const bar = "█".repeat(home) + "░".repeat(4 - home);
    const arrow = idx === game.turnIndex ? " ◄" : "";
    lines.push(`${p.emoji} ${p.name}${p.bot ? " [BOT]" : ""}${arrow}`);
    lines.push(`   [${bar}] ${home}/4 maison | Plateau: ${onBoard} Départ: ${inYard}${caps > 0 ? ` Captures: ${caps}` : ""}`);
  });
  if (game.captures.length > 0) {
    lines.push("━━━━━━━━━━━━━━━━━━━━━━");
    lines.push(`⚔️ Captures: ${game.captures.slice(-3).map((c: any) => `${c.by}→${c.victim}`).join(", ")}`);
  }
  if (game.log.length > 1) {
    lines.push("━━━━━━━━━━━━━━━━━━━━━━");
    lines.push("📜 Derniers mouvements:");
    game.log.slice(1, 4).forEach((l: string) => { if (l) lines.push(`• ${l.slice(0, 90)}`); });
  }
  lines.push("━━━━━━━━━━━━━━━━━━━━━━");
  lines.push(body);
  return lines.join("\n");
}

function roundRect(ctx: any, x: number, y: number, w: number, h: number, r: number, fill?: string, stroke?: string, lw?: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke && lw) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
}

function drawStar(ctx: any, cx: number, cy: number, radius: number, fill: string) {
  ctx.save(); ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 === 0 ? radius : radius / 2.4;
    ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
  }
  ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.restore();
}

function drawDiceFace(ctx: any, x: number, y: number, size: number, value: number | null) {
  const r = 18;
  ctx.save(); ctx.shadowColor = "#000000aa"; ctx.shadowBlur = 14; ctx.shadowOffsetY = 6;
  roundRect(ctx, x, y, size, size, r, value === 6 ? "#fef9c3" : "#f8fafc"); ctx.restore();
  const bc = value === 6 ? "#b45309" : value ? "#3b82f6" : "#64748b";
  roundRect(ctx, x, y, size, size, r, undefined, bc, value === 6 ? 5 : 3);
  if (!value) {
    ctx.fillStyle = "#94a3b8"; ctx.font = `bold ${Math.floor(size * 0.52)}px sans-serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("?", x + size / 2, y + size / 2 + 2); ctx.textAlign = "left"; ctx.textBaseline = "alphabetic"; return;
  }
  const dc = value === 6 ? "#92400e" : "#1e3a8a", dotR = size * 0.085, p = size * 0.26, m = size * 0.5;
  const dotMap: Record<number, [number, number][]> = {
    1: [[m, m]], 2: [[p, p], [size - p, size - p]], 3: [[p, p], [m, m], [size - p, size - p]],
    4: [[p, p], [size - p, p], [p, size - p], [size - p, size - p]],
    5: [[p, p], [size - p, p], [m, m], [p, size - p], [size - p, size - p]],
    6: [[p, p * 0.85], [size - p, p * 0.85], [p, m], [size - p, m], [p, size - p * 0.85], [size - p, size - p * 0.85]],
  };
  ctx.fillStyle = dc;
  for (const [dx, dy] of (dotMap[value] || [])) {
    ctx.beginPath(); ctx.arc(x + dx, y + dy, dotR, 0, Math.PI * 2); ctx.fill();
  }
}

function drawCell(ctx: any, bx: number, by: number, cell: number, col: number, row: number, fill: string) {
  ctx.fillStyle = fill; ctx.fillRect(bx + col * cell, by + row * cell, cell, cell);
  ctx.strokeStyle = "#1f293733"; ctx.lineWidth = 1; ctx.strokeRect(bx + col * cell, by + row * cell, cell, cell);
}

function drawToken(ctx: any, cx: number, cy: number, color: any, number: number, finished: boolean) {
  ctx.save(); ctx.shadowColor = "#00000088"; ctx.shadowBlur = 8; ctx.shadowOffsetY = 5;
  ctx.beginPath(); ctx.arc(cx, cy, 25, 0, Math.PI * 2);
  ctx.fillStyle = color.hex; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = "#fff"; ctx.stroke();
  ctx.shadowColor = "transparent";
  ctx.fillStyle = finished ? "#fde68a" : "#fff"; ctx.font = "bold 21px sans-serif";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(finished ? "★" : String(number), cx, cy + 1);
  ctx.restore(); ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
}

function getStackOffset(index: number, total: number) {
  if (total === 1) return { x: 0, y: 0 };
  const angle = (Math.PI * 2 * index) / total;
  const r = total > 2 ? 15 : 11;
  return { x: Math.cos(angle) * r, y: Math.sin(angle) * r };
}

function renderGame(game: any, banner: string): Buffer {
  const canvas = createCanvas(1200, 1600);
  const ctx = canvas.getContext("2d") as any;
  const bx = 75, by = 175, cell = 70;

  const grad = ctx.createLinearGradient(0, 0, 0, 1600);
  grad.addColorStop(0, "#0f172a"); grad.addColorStop(0.35, "#1e1b4b");
  grad.addColorStop(0.7, "#1a1035"); grad.addColorStop(1, "#0f172a");
  ctx.fillStyle = grad; ctx.fillRect(0, 0, 1200, 1600);

  ctx.save(); ctx.globalAlpha = 0.04;
  [[100,150,180],[1100,200,220],[600,800,300],[200,1450,160],[950,1500,200],[600,1600,250]].forEach(([cx,cy,r]) => {
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fillStyle = "#fff"; ctx.fill();
  }); ctx.restore();

  roundRect(ctx, 60, 25, 1080, 135, 30, "#ffffff15", "#ffffff40", 2);
  const diceSize = 110, diceX = 1090 - diceSize, diceY = 32;
  drawDiceFace(ctx, diceX, diceY, diceSize, game.lastRoll);
  ctx.fillStyle = "#f1f5f9"; ctx.font = "bold 46px sans-serif"; ctx.fillText("LUDO ROYAL", 85, 83);
  const mode = game.teamMode ? "2v2 Équipes" : `${game.players.length} joueurs`;
  ctx.font = "bold 20px sans-serif"; ctx.fillStyle = "#a5b4fc";
  ctx.fillText(`${mode}  |  ${game.moveCount} moves  |  ${game.captures.length} captures`, 85, 112);
  const btext = banner.length > 70 ? banner.slice(0, 68) + "…" : banner;
  ctx.font = "bold 22px sans-serif"; ctx.fillStyle = "#fde68a"; ctx.fillText(btext, 85, 144);

  ctx.save(); ctx.shadowColor = "#000000aa"; ctx.shadowBlur = 35; ctx.shadowOffsetY = 20;
  roundRect(ctx, bx - 10, by - 10, cell * 15 + 20, cell * 15 + 20, 34, "#f8fafc"); ctx.restore();

  for (let row = 0; row < 15; row++) for (let col = 0; col < 15; col++) drawCell(ctx, bx, by, cell, col, row, "#fff7ed");
  for (const [col, row] of TRACK) drawCell(ctx, bx, by, cell, col, row, "#ffffff");
  for (const idx of SAFE_TRACK_INDEXES) {
    const [col, row] = TRACK[idx];
    drawCell(ctx, bx, by, cell, col, row, "#fef3c7");
    drawStar(ctx, bx + col * cell + cell / 2, by + row * cell + cell / 2, 18, "#b45309");
  }
  ctx.strokeStyle = "#111827"; ctx.lineWidth = 3; ctx.strokeRect(bx, by, cell * 15, cell * 15);

  const drawYard = (color: any, cOff: number, rOff: number) => {
    const px = bx + cOff * cell, py = by + rOff * cell;
    roundRect(ctx, px + 10, py + 10, cell * 6 - 20, cell * 6 - 20, 26, color.hex, color.dark, 5);
    roundRect(ctx, px + 62, py + 62, cell * 4 - 54, cell * 4 - 54, 28, "#fffaf0", "#ffffff", 4);
    for (const [tc, tr] of color.yard) {
      const cx2 = bx + tc * cell + cell / 2, cy2 = by + tr * cell + cell / 2;
      ctx.save(); ctx.globalAlpha = 0.38;
      ctx.beginPath(); ctx.arc(cx2, cy2, 24, 0, Math.PI * 2);
      ctx.fillStyle = color.dark; ctx.fill(); ctx.restore();
    }
  };
  drawYard(COLORS[0], 0, 0); drawYard(COLORS[1], 9, 0);
  drawYard(COLORS[2], 9, 9); drawYard(COLORS[3], 0, 9);

  for (const color of COLORS) for (const [col, row] of color.home) drawCell(ctx, bx, by, cell, col, row, color.hex);
  const triangles: [number, number, number, number, number, number, string][] = [
    [bx+6*cell,by+6*cell, bx+9*cell,by+6*cell, bx+7.5*cell,by+7.5*cell, COLORS[1].hex] as any,
    [bx+9*cell,by+6*cell, bx+9*cell,by+9*cell, bx+7.5*cell,by+7.5*cell, COLORS[2].hex] as any,
    [bx+9*cell,by+9*cell, bx+6*cell,by+9*cell, bx+7.5*cell,by+7.5*cell, COLORS[3].hex] as any,
    [bx+6*cell,by+9*cell, bx+6*cell,by+6*cell, bx+7.5*cell,by+7.5*cell, COLORS[0].hex] as any,
  ];
  for (const [x1,y1,x2,y2,x3,y3,clr] of triangles as any[]) {
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.lineTo(x3,y3);
    ctx.closePath(); ctx.fillStyle = clr; ctx.fill();
  }
  ctx.fillStyle = "#ffffff"; ctx.font = "bold 40px sans-serif"; ctx.textAlign = "center";
  ctx.fillText("HOME", bx + 7.5 * cell, by + 7.65 * cell); ctx.textAlign = "left";

  for (const color of COLORS) {
    const [col, row] = TRACK[color.start];
    drawCell(ctx, bx, by, cell, col, row, color.hex);
    ctx.fillStyle = "#fff"; ctx.font = "bold 28px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("GO", bx + col * cell + cell / 2, by + row * cell + cell / 2 + 10);
    ctx.textAlign = "left";
  }

  const positions = new Map<string, any[]>();
  game.players.forEach((player: any) => {
    player.tokens.forEach((progress: number, tokenIndex: number) => {
      let col: number, row: number;
      if (progress === -1) { [col, row] = player.colorData.yard[tokenIndex]; }
      else {
        const pos = getTokenPosition(player, progress);
        col = pos.col; row = pos.row;
      }
      const key = `${col},${row}`;
      if (!positions.has(key)) positions.set(key, []);
      positions.get(key)!.push({ player, tokenIndex, progress });
    });
  });
  for (const [key, tokens] of positions.entries()) {
    const [col, row] = key.split(",").map(Number);
    tokens.forEach((token: any, idx: number) => {
      const off = getStackOffset(idx, tokens.length);
      const cx2 = bx + col * cell + cell / 2 + off.x;
      const cy2 = by + row * cell + cell / 2 + off.y;
      drawToken(ctx, cx2, cy2, token.player.colorData, token.tokenIndex + 1, token.progress === 57);
    });
  }

  const panelY = 1244, panelH = 340;
  roundRect(ctx, 60, panelY, 1080, panelH, 30, "#ffffff12", "#ffffff35", 2);
  const currentIdx = game.turnIndex;
  game.players.forEach((player: any, index: number) => {
    const col = index % 2, row2 = Math.floor(index / 2);
    const cardX = 75 + col * 545, cardY = panelY + 12 + row2 * 106, cardW = 520, cardH = 92;
    const isCurrent = index === currentIdx;
    if (isCurrent) {
      ctx.save(); ctx.shadowColor = player.colorData.hex; ctx.shadowBlur = 20;
      roundRect(ctx, cardX - 3, cardY - 3, cardW + 6, cardH + 6, 18, undefined, player.colorData.hex, 4);
      ctx.restore();
    }
    const cardBg = isCurrent ? player.colorData.hex + "55" : "#ffffff18";
    roundRect(ctx, cardX, cardY, cardW, cardH, 16, cardBg, player.colorData.hex + "88", 2);
    ctx.beginPath(); ctx.arc(cardX + 22, cardY + 22, 10, 0, Math.PI * 2);
    ctx.fillStyle = player.colorData.hex; ctx.fill();
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = "#f8fafc"; ctx.font = "bold 21px sans-serif";
    ctx.fillText((player.name.slice(0, 18) + (player.bot ? " BOT" : "")), cardX + 40, cardY + 30);
    if (isCurrent) {
      ctx.font = "bold 16px sans-serif"; ctx.fillStyle = "#fde68a";
      ctx.textAlign = "right"; ctx.fillText("VOTRE TOUR", cardX + cardW - 14, cardY + 30); ctx.textAlign = "left";
    }
    const home = player.tokens.filter((t: number) => t === 57).length;
    const onBoard = player.tokens.filter((t: number) => t >= 0 && t < 57).length;
    const inYard = player.tokens.filter((t: number) => t === -1).length;
    const caps = game.captures.filter((c: any) => c.by === player.name).length;
    ctx.font = "18px sans-serif"; ctx.fillStyle = "#cbd5e1";
    ctx.fillText(`Maison: ${home}/4`, cardX + 12, cardY + 56);
    ctx.fillText(`Plateau: ${onBoard}`, cardX + 130, cardY + 56);
    ctx.fillText(`Départ: ${inYard}`, cardX + 235, cardY + 56);
    if (caps > 0) { ctx.fillStyle = "#fca5a5"; ctx.fillText(`Captures: ${caps}`, cardX + 330, cardY + 56); }
    for (let ti = 0; ti < 4; ti++) {
      const prog = player.tokens[ti], dotX = cardX + 12 + ti * 28, dotY = cardY + 75, dotR = 9;
      ctx.beginPath(); ctx.arc(dotX, dotY, dotR, 0, Math.PI * 2);
      if (prog === 57) {
        ctx.fillStyle = "#fde68a"; ctx.fill(); ctx.strokeStyle = "#b45309"; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = "#92400e"; ctx.font = "bold 11px sans-serif";
        ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("H", dotX, dotY + 1);
        ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
      } else if (prog === -1) {
        ctx.fillStyle = "#334155"; ctx.fill(); ctx.strokeStyle = player.colorData.hex + "88"; ctx.lineWidth = 2; ctx.stroke();
      } else {
        ctx.fillStyle = player.colorData.hex; ctx.fill(); ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = "#fff"; ctx.font = "bold 10px sans-serif";
        ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(String(ti + 1), dotX, dotY + 1);
        ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
      }
    }
  });

  const logY = panelY + 228;
  roundRect(ctx, 75, logY, 1065, 100, 16, "#ffffff0a", "#ffffff25", 1);
  ctx.fillStyle = "#94a3b8"; ctx.font = "bold 16px sans-serif"; ctx.fillText("DERNIERS MOUVEMENTS", 100, logY + 22);
  ctx.font = "18px sans-serif";
  game.log.slice(0, 3).forEach((line: string, i: number) => {
    ctx.fillStyle = i === 0 ? "#e2e8f0" : "#64748b";
    ctx.fillText(line.replace(/[^\x20-\x7E]/g, "").trim().slice(0, 90), 100, logY + 46 + i * 22);
  });

  return canvas.toBuffer("image/png");
}

async function publishState(output: any, api: any, game: any, body: string, prevMsgID?: string) {
  game.updatedAt = Date.now();
  const details = formatDetails(game, body);

  if (prevMsgID) {
    try { await output.unsend(prevMsgID); } catch {}
  }

  let stream: any = null;
  try {
    const buf = renderGame(game, body);
    const tmpPath = path.join(os.tmpdir(), `ludo_${game.id}_${Date.now()}.png`);
    fs.writeFileSync(tmpPath, buf);
    stream = fs.createReadStream(tmpPath);
    stream.on("close", () => { try { fs.unlinkSync(tmpPath); } catch {} });
  } catch (err) {
    console.error("[Ludo] Canvas error:", err);
  }

  const replyOpts: any = { body: details };
  if (stream) replyOpts.attachment = stream;

  const info = await output.reply(replyOpts);
  game.replyMessageID = info?.messageID ?? null;
  return info;
}

const HELP_TEXT =
  `🎲 LUDO ROYAL\n` +
  `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
  `Modes:\n` +
  `• ludo bot — 1v1 contre un bot\n` +
  `• ludo bot 3 — contre 2 bots\n` +
  `• ludo bot 4 — contre 3 bots\n` +
  `• ludo 1v1 @joueur — 2 joueurs\n` +
  `• ludo 1v1v1 @p2 @p3 — 3 joueurs\n` +
  `• ludo 1v1v1v1 @p2 @p3 @p4 — 4 joueurs\n` +
  `• ludo 2v2 @p2 @p3 @p4 — équipes\n` +
  `• ludo stop — terminer la partie\n` +
  `• ludo status — afficher le plateau\n\n` +
  `Paris (multijoueur):\n` +
  `• ludo 1v1 @joueur 500 — 500$ de mise\n` +
  `• ludo 1v1v1 @p2 @p3 1000 — 1000$ chacun\n\n` +
  `Comment jouer:\n` +
  `1. Répondez "roll" pour lancer le dé\n` +
  `2. Si plusieurs pions peuvent bouger, répondez 1, 2, 3 ou 4\n` +
  `3. Un 6 permet de sortir un pion et rejouer\n` +
  `4. Marchez sur un adversaire pour le capturer\n` +
  `5. Ramenez vos 4 pions à la maison pour gagner\n` +
  `★ Les cases étoiles protègent contre la capture`;

const command = defineCommand({
  meta: {
    name: "ludo",
    otherNames: ["ludoking", "ludogame"],
    description: "🎲 Jeu de Ludo complet — multijoueur, bots, paris, plateau Canvas",
    version: "2.0.0",
    author: "Christus",
    category: "Game",
    usage: "{prefix}{name} help",
    role: 0,
    noPrefix: false,
    waitingTime: 3,
    requirement: "3.0.0",
    icon: "🎲",
  },
  style: {
    title: "🎲 Ludo Royal",
    titleFont: "bold",
    contentFont: "fancy",
  },

  entry: defineEntry(async (ctx) => {
    const { input, output, money, api } = ctx;
    cleanupExpiredGames();
    const args = input.arguments ?? [];
    const mode = (args[0] || "").toLowerCase();

    if (!mode || mode === "help" || mode === "aide") {
      return output.replyStyled({ body: HELP_TEXT }, style);
    }

    if (mode === "stop" || mode === "end") {
      const ended = endGamesForThread(input.threadID, input.senderID);
      if (!ended) return output.replyStyled({ body: "❌ Aucune partie de Ludo en cours pour vous." }, style);
      return output.replyStyled({ body: `✅ ${ended} partie(s) terminée(s).` }, style);
    }

    if (mode === "status") {
      for (const game of activeGames.values()) {
        if (game.threadID === input.threadID && game.players.some((p: any) => p.id === input.senderID)) {
          await publishState(output, api, game, "📊 État du plateau");
          return;
        }
      }
      return output.replyStyled({ body: "❌ Aucune partie de Ludo en cours pour vous." }, style);
    }

    // Start game
    const getUserName = async (uid: string) => {
      try {
        const info = await api.getUserInfo(uid);
        return info?.[uid]?.name || "Joueur";
      } catch { return "Joueur"; }
    };

    const senderName = await getUserName(input.senderID);
    let playerCount = 2, teamMode = false, isBotGame = false;

    if (mode === "1v1") playerCount = 2;
    else if (mode === "1v1v1") playerCount = 3;
    else if (mode === "1v1v1v1") playerCount = 4;
    else if (mode === "2v2") { playerCount = 4; teamMode = true; }
    else if (mode === "bot" || mode === "bots") {
      isBotGame = true;
      playerCount = Math.min(4, Math.max(2, parseInt(args[1], 10) || 2));
    } else {
      return output.replyStyled({ body: HELP_TEXT }, style);
    }

    // FIXED: Better mention extraction - similar to busy command
    const mentions = (input as any).mentions ?? {};
    const mentionedIDs = Object.keys(mentions);
    
    // Filter out the sender and empty mentions
    const validMentionedIDs = mentionedIDs.filter(id => id && id !== input.senderID);
    
    const players: any[] = [{ id: input.senderID, name: senderName, bot: false }];

    // Check if we need to extract mentions from command arguments for 2v2 mode
    if (mode === "2v2" && validMentionedIDs.length === 0) {
      // Try to extract from args for 2v2 mode
      const mentionPattern = /@\[(\d+)\]/g;
      const content = input.body || "";
      const matches = [...content.matchAll(mentionPattern)];
      for (let i = 1; i <= 3 && matches[i]; i++) {
        const uid = matches[i][1];
        if (uid && uid !== input.senderID && !players.some(p => p.id === uid)) {
          const name = await getUserName(uid);
          players.push({ id: uid, name, bot: false });
        }
      }
    }
    
    // Add mentioned users
    for (let i = 0; i < Math.min(validMentionedIDs.length, playerCount - 1); i++) {
      const id = validMentionedIDs[i];
      if (!players.some(p => p.id === id)) {
        const name = await getUserName(id);
        players.push({ id, name, bot: false });
      }
    }
    
    // Fill remaining slots with bots
    while (players.length < playerCount) {
      players.push({ id: `bot_${players.length}_${Date.now()}`, name: `Bot Royal ${players.length}`, bot: true });
    }

    // Bet extraction - look for numbers in args after the mode
    let betAmount = 0;
    if (!isBotGame) {
      for (let i = 1; i < args.length; i++) {
        const arg = args[i];
        if (arg && /^\d+$/.test(arg) && parseInt(arg, 10) > 0) {
          betAmount = parseInt(arg, 10);
          break;
        }
      }
    }
    
    if (betAmount > 0) {
      for (const p of players.filter((p) => !p.bot)) {
        const ud: any = await money.getItem(p.id).catch(() => null);
        if ((ud?.money || 0) < betAmount) {
          return output.replyStyled({ body: `💸 ${p.name} n'a pas assez d'argent !\nNécessaire: $${betAmount.toLocaleString()} | Balance: $${(ud?.money || 0).toLocaleString()}` }, style);
        }
      }
      for (const p of players.filter((p) => !p.bot)) {
        const ud: any = await money.getItem(p.id).catch(() => null);
        await money.setItem(p.id, { money: (ud?.money || 0) - betAmount });
      }
    }

    const game = createGame(input.threadID, players, teamMode, "ludo", isBotGame, betAmount);
    activeGames.set(game.key, game);

    const betInfo = betAmount > 0 ? ` | Cagnotte: $${game.pot.toLocaleString()}` : "";
    const startMsg = `🎲 LUDO ROYAL commence !${betInfo} Répondez "roll" quand c'est votre tour.`;
    const initMsg = await publishState(output, api, game, startMsg);

    let safetyB = 0;
    while (activeGames.get(game.key) === game && game.players[game.turnIndex]?.bot && safetyB < 30) {
      safetyB++;
      await sleep(900);
      const player = game.players[game.turnIndex];
      const roll = randomDice();
      const legal = getLegalMoves(player, roll);
      game.lastRoll = roll; game.legalMoves = legal;
      if (!legal.length) { game.log.unshift(`${player.name} [BOT] a fait ${roll} → aucun mouvement.`); nextTurn(game, roll); continue; }
      const ti = chooseBotMove(game, game.turnIndex, legal, roll);
      applyMove(game, game.turnIndex, ti, roll);
      game.log.unshift(`${player.name} [BOT] a fait ${roll} → T${ti + 1}`);
      nextTurn(game, roll);
    }

    if (activeGames.get(game.key) === game && !game.players[game.turnIndex]?.bot) {
      const firstHuman = game.players[game.turnIndex];
      const firstMsg = await publishState(output, api, game, `C'est à ${firstHuman.name} de jouer — répondez "roll".`);
      game.replyMessageID = firstMsg?.messageID;

      if (firstMsg) {
        registerReply(firstMsg, game, output, api, money);
      }
    }
  }),
});

function registerReply(msg: any, game: any, output: any, api: any, money: any) {
  if (!msg?.atReply) return;

  msg.atReply(async (replyCtx: any) => {
    if (!activeGames.has(game.key) || activeGames.get(game.key).id !== game.id) return;

    const current = game.players[game.turnIndex];
    if (!current || current.bot) return;

    if (replyCtx.input.senderID !== current.id) {
      const errMsg = await replyCtx.output.reply(`❌ Ce n'est pas votre tour ! C'est à ${current.name}.`);
      if (errMsg?.atReply) registerReply(errMsg, game, replyCtx.output, api, money);
      return;
    }

    const inputText = (replyCtx.input.body || "").trim().toLowerCase();

    if (inputText === "stop" || inputText === "end") {
      if (game.bet > 0) await refundBets(game, money);
      endGame(game);
      return replyCtx.output.reply("🛑 Partie de Ludo terminée. Paris remboursés.");
    }

    if (game.phase === "roll") {
      if (!["roll", "r", "dice", "🎲"].includes(inputText)) {
        const ph = await publishState(replyCtx.output, api, game, `${current.name}, répondez "roll" pour lancer le dé.`);
        if (ph) registerReply(ph, game, replyCtx.output, api, money);
        return;
      }

      const roll = randomDice();
      const legal = getLegalMoves(current, roll);
      game.lastRoll = roll; game.legalMoves = legal;

      if (!legal.length) {
        game.log.unshift(`${current.emoji} ${current.name} a fait ${roll} → aucun mouvement.`);
        nextTurn(game, roll);
        const nm = await publishState(replyCtx.output, api, game, `${current.emoji} ${current.name} a fait ${diceEmoji(roll)} : aucun pion ne peut bouger.`);
        if (nm) await runBotsAndRegister(nm, game, replyCtx.output, api, money);
        return;
      }

      if (legal.length === 1) {
        applyMove(game, game.turnIndex, legal[0], roll);
        const winMsg = getWinner(game);
        if (winMsg) {
          await payoutWinner(game, money);
          const fm = buildWinMessage(game, winMsg);
          endGame(game);
          await publishState(replyCtx.output, api, game, fm);
          return;
        }
        afterHumanMove(game);
        const nm = await publishState(replyCtx.output, api, game, `${current.name} a fait ${diceEmoji(roll)} et déplacé le pion ${legal[0] + 1}.`);
        if (nm) await runBotsAndRegister(nm, game, replyCtx.output, api, money);
        return;
      }

      game.phase = "move";
      const ph = await publishState(replyCtx.output, api, game, `${current.name} a fait ${diceEmoji(roll)} ! Choisissez un pion : ${legal.map((i: number) => i + 1).join(", ")}`);
      if (ph) registerReply(ph, game, replyCtx.output, api, money);
      return;
    }

    if (game.phase === "move") {
      const tokenNumber = parseInt(inputText.replace(/[^1-4]/g, ""), 10);
      if (!tokenNumber || !game.legalMoves.includes(tokenNumber - 1)) {
        const ph = await publishState(replyCtx.output, api, game, `Choisissez un pion déplaçable : ${game.legalMoves.map((i: number) => i + 1).join(", ")}`);
        if (ph) registerReply(ph, game, replyCtx.output, api, money);
        return;
      }
      applyMove(game, game.turnIndex, tokenNumber - 1, game.lastRoll);
      const winMsg = getWinner(game);
      if (winMsg) {
        await payoutWinner(game, money);
        const fm = buildWinMessage(game, winMsg);
        endGame(game);
        await publishState(replyCtx.output, api, game, fm);
        return;
      }
      afterHumanMove(game);
      const nm = await publishState(replyCtx.output, api, game, `${current.name} a déplacé le pion ${tokenNumber}.`);
      if (nm) await runBotsAndRegister(nm, game, replyCtx.output, api, money);
    }
  });
}

async function runBotsAndRegister(msg: any, game: any, output: any, api: any, money: any) {
  let safety = 0;
  while (activeGames.get(game.key) === game && game.players[game.turnIndex]?.bot && safety < 30) {
    safety++;
    const player = game.players[game.turnIndex];
    await sleep(900);
    const roll = randomDice();
    const legal = getLegalMoves(player, roll);
    game.lastRoll = roll; game.legalMoves = legal;
    if (!legal.length) { game.log.unshift(`${player.name} [BOT] a fait ${roll} → aucun mouvement.`); nextTurn(game, roll); continue; }
    const ti = chooseBotMove(game, game.turnIndex, legal, roll);
    applyMove(game, game.turnIndex, ti, roll);
    const winMsg = getWinner(game);
    if (winMsg) {
      await payoutWinner(game, money);
      const fm = buildWinMessage(game, winMsg);
      endGame(game);
      await publishState(output, api, game, fm);
      return;
    }
    game.log.unshift(`${player.name} [BOT] a fait ${roll} → T${ti + 1}`);
    nextTurn(game, roll);
  }
  if (activeGames.get(game.key) === game && !game.players[game.turnIndex]?.bot) {
    const next = game.players[game.turnIndex];
    const nm = await publishState(output, api, game, `C'est à ${next.name} de jouer — répondez "roll".`);
    if (nm) registerReply(nm, game, output, api, money);
  }
}

const style = command.style;
export default command;
