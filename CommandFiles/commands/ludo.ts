// @ts-check
import { createCanvas, registerFont } from "canvas";
import fs from "fs-extra";
import path from "path";
import os from "os";

/* ============================================================
   FONTS  (register only if files exist — graceful fallback)
   ============================================================ */
const FONT_DIR = path.join(__dirname, "assets/font");
for (const [file, opts] of [
  ["NotoSans-Bold.ttf",     { family: "LudoFont", weight: "bold" }],
  ["NotoSans-Regular.ttf",  { family: "LudoFont", weight: "normal" }],
  ["NotoSans-SemiBold.ttf", { family: "LudoFont", weight: "600" }],
] as const) {
  try { registerFont(path.join(FONT_DIR, file), opts); } catch {}
}

/* ============================================================
   META / STYLE
   ============================================================ */
export const meta: CommandMeta = {
  name: "ludo",
  otherNames: ["ludoking", "ludogame"],
  description: "🎲 Jeu de Ludo complet — plateau Canvas, multijoueur, bots et paris",
  author: "Christus (GoatBot → Cassidy by port)",
  version: "1.0.0",
  usage: "{prefix}ludo [bot|1v1|1v1v1|1v1v1v1|2v2|stop|status]",
  category: "Games",
  role: 0,
  noPrefix: false,
  waitingTime: 3,
  requirement: "3.0.0",
  icon: "🎲",
  cmdType: "cplx_g",
  isGame: true,
};

export const style: CommandStyle = {
  title: "🎲 Ludo Royal",
  titleFont: "bold",
  contentFont: "none",
};

/* ============================================================
   BOARD CONSTANTS
   ============================================================ */
const COLORS = [
  { key: "red",    name: "Rouge", emoji: "🔴", hex: "#ef4444", dark: "#991b1b", start: 0,
    home: [[1,6],[2,6],[3,6],[4,6],[5,6],[6,6]], yard: [[2,2],[4,2],[2,4],[4,4]] },
  { key: "yellow", name: "Jaune", emoji: "🟡", hex: "#facc15", dark: "#a16207", start: 13,
    home: [[8,1],[8,2],[8,3],[8,4],[8,5],[8,6]], yard: [[10,2],[12,2],[10,4],[12,4]] },
  { key: "green",  name: "Vert",  emoji: "🟢", hex: "#22c55e", dark: "#166534", start: 26,
    home: [[13,8],[12,8],[11,8],[10,8],[9,8],[8,8]], yard: [[10,10],[12,10],[10,12],[12,12]] },
  { key: "blue",   name: "Bleu",  emoji: "🔵", hex: "#3b82f6", dark: "#1e40af", start: 39,
    home: [[6,13],[6,12],[6,11],[6,10],[6,9],[6,8]], yard: [[2,10],[4,10],[2,12],[4,12]] },
] as const;

const TRACK: [number, number][] = [
  [1,6],[2,6],[3,6],[4,6],[5,6],[6,5],[6,4],[6,3],[6,2],[6,1],[6,0],[7,0],[8,0],
  [8,1],[8,2],[8,3],[8,4],[8,5],[9,6],[10,6],[11,6],[12,6],[13,6],[14,6],[14,7],[14,8],
  [13,8],[12,8],[11,8],[10,8],[9,8],[8,9],[8,10],[8,11],[8,12],[8,13],[8,14],[7,14],[6,14],
  [6,13],[6,12],[6,11],[6,10],[6,9],[5,8],[4,8],[3,8],[2,8],[1,8],[0,8],[0,7],[0,6],
];

const SAFE_INDEXES = new Set([0, 8, 13, 21, 26, 34, 39, 47]);
const EXPIRE_MS = 45 * 60 * 1000;

/* ============================================================
   ACTIVE GAMES STORE  (module-level singleton)
   ============================================================ */
const activeGames = new Map<string, LudoGame>();

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

/* ============================================================
   TYPES
   ============================================================ */
interface LudoPlayer {
  id: string;
  name: string;
  bot: boolean;
  color: string;
  emoji: string;
  colorData: typeof COLORS[number];
  tokens: number[];   // -1 = yard, 0-56 = track/home path, 57 = finished
  finished: number;
  team: "A" | "B" | null;
}

interface LudoGame {
  id: string;
  key: string;
  threadID: string;
  players: LudoPlayer[];
  teamMode: boolean;
  botGame: boolean;
  turnIndex: number;
  phase: "roll" | "move";
  lastRoll: number | null;
  legalMoves: number[];
  moveCount: number;
  captures: { by: string; victim: string }[];
  log: string[];
  replyMessageID: string | null;
  updatedAt: number;
  startedAt: number;
  bet: number;
  pot: number;
  prizePerWinner: number;
  winners?: LudoPlayer[];
}

/* ============================================================
   ENTRY — main command handler
   ============================================================ */
export async function entry(ctx: CommandContext) {
  cleanExpired();
  const { input, output, args, money } = ctx;
  const mode = (args[0] || "").toLowerCase();

  /* ── help ── */
  if (!mode || mode === "help") {
    return output.reply(buildHelp());
  }

  /* ── stop ── */
  if (mode === "stop" || mode === "end") {
    const n = stopGamesFor(input.threadID, input.senderID);
    if (!n) return output.reply("❌ Aucune partie de Ludo en cours pour vous.");
    return output.reply(`✅ ${n} partie(s) terminée(s).`);
  }

  /* ── status ── */
  if (mode === "status") {
    for (const game of activeGames.values()) {
      if (game.threadID === input.threadID &&
          game.players.some(p => p.id === input.senderID)) {
        await sendState(output, game, "📊 État du plateau");
        return;
      }
    }
    return output.reply("❌ Aucune partie de Ludo en cours pour vous.");
  }

  /* ── new game ── */
  await startGame(ctx);
}

/* ============================================================
   REPLY — in-game interactions
   ============================================================ */
export async function reply(ctx: CommandContext & { repObj: any }) {
  cleanExpired();
  const { input, output, repObj, money } = ctx;
  const game: LudoGame | undefined = activeGames.get(repObj.gameKey ?? repObj.threadID);
  if (!game || game.id !== repObj.gameID) return;

  const current = game.players[game.turnIndex];
  if (!current || current.bot) return;

  if (input.senderID !== current.id) {
    return output.reply(`❌ Ce n'est pas votre tour ! C'est à ${current.name}.`);
  }

  const text = (input.body || "").trim().toLowerCase();

  if (text === "stop" || text === "end") {
    if (game.bet > 0) await refundBets(game, money);
    killGame(game);
    return output.reply("🛑 Partie terminée. Paris remboursés.");
  }

  if (game.phase === "roll") {
    if (!["roll", "r", "dice", "🎲"].includes(text)) {
      await sendState(output, game, `${current.name}, répondez "roll" pour lancer le dé.`);
      return;
    }
    await doRoll(output, game, money, input);
    return;
  }

  if (game.phase === "move") {
    const pick = parseInt(text.replace(/[^1-4]/g, ""), 10);
    if (!pick || !game.legalMoves.includes(pick - 1)) {
      await sendState(output, game,
        `Choisissez un pion : ${game.legalMoves.map(i => i + 1).join(", ")}`);
      return;
    }
    applyMove(game, game.turnIndex, pick - 1, game.lastRoll!);
    afterMove(game);
    const win = checkWinner(game);
    if (win) {
      await payWinner(game, money);
      killGame(game);
      await sendState(output, game, buildWinMsg(game, win));
      return;
    }
    await sendState(output, game, `${current.name} a déplacé le pion ${pick}.`);
    await runBots(output, game, money, input);
  }
}

/* ============================================================
   GAME LIFECYCLE
   ============================================================ */
async function startGame(ctx: CommandContext) {
  const { input, output, args, money } = ctx;
  const senderID = input.senderID;
  const threadID = input.threadID;
  const mode = (args[0] || "").toLowerCase();

  let playerCount = 2, teamMode = false, botGame = false;
  if      (mode === "1v1")       playerCount = 2;
  else if (mode === "1v1v1")     playerCount = 3;
  else if (mode === "1v1v1v1")   playerCount = 4;
  else if (mode === "2v2")     { playerCount = 4; teamMode = true; }
  else if (mode === "bot" || mode === "bots") {
    botGame = true;
    playerCount = Math.min(4, Math.max(2, parseInt(args[1], 10) || 2));
  } else {
    return output.reply(buildHelp());
  }

  /* Resolve human name */
  const myName = await resolveName(money, senderID);
  const players: Omit<LudoPlayer, "color"|"emoji"|"colorData"|"tokens"|"finished"|"team">[] =
    [{ id: senderID, name: myName, bot: false }];

  /* Mentioned players */
  const mentions = Object.keys(input.mentions || {}).filter(id => id !== senderID);
  for (let i = 0; i < Math.min(mentions.length, playerCount - 1); i++) {
    const name = await resolveName(money, mentions[i]);
    players.push({ id: mentions[i], name, bot: false });
  }

  /* Fill bots */
  while (players.length < playerCount) {
    players.push({ id: `bot_${players.length}_${Date.now()}`, name: `Bot Royal ${players.length}`, bot: true });
  }

  /* Bet */
  let bet = 0;
  if (!botGame) {
    const betArg = args.find(a => /^\d+$/.test(a) && parseInt(a, 10) > 0);
    if (betArg) bet = parseInt(betArg, 10);
  }

  if (bet > 0) {
    for (const p of players.filter(p => !p.bot)) {
      const ud = await money.getItem(p.id);
      if ((ud?.money ?? 0) < bet) {
        return output.reply(
          `💸 ${p.name} n'a pas assez d'argent !\nNécessaire : $${bet.toLocaleString()} | Balance : $${(ud?.money ?? 0).toLocaleString()}`
        );
      }
    }
    for (const p of players.filter(p => !p.bot)) {
      const ud = await money.getItem(p.id);
      await money.setItem(p.id, { money: (ud.money || 0) - bet });
    }
  }

  const game = buildGame(threadID, players as any, teamMode, botGame, bet);
  activeGames.set(game.key, game);

  const betInfo = bet > 0 ? ` | Cagnotte : $${game.pot.toLocaleString()}` : "";
  await sendState(output, game, `🎲 LUDO ROYAL a commencé !${betInfo} Répondez "roll" quand c'est votre tour.`, input);
  await runBots(output, game, money, input);
}

function buildGame(
  threadID: string,
  rawPlayers: { id: string; name: string; bot: boolean }[],
  teamMode: boolean,
  botGame: boolean,
  bet: number
): LudoGame {
  const players: LudoPlayer[] = rawPlayers.map((p, i) => ({
    ...p,
    color:     COLORS[i].key,
    emoji:     COLORS[i].emoji,
    colorData: COLORS[i],
    tokens:    [-1, -1, -1, -1],
    finished:  0,
    team:      teamMode ? (i % 2 === 0 ? "A" : "B") : null,
  }));

  const key = botGame ? `${threadID}:${rawPlayers[0].id}` : threadID;
  const humanCount = rawPlayers.filter(p => !p.bot).length;
  return {
    id: `${threadID}_${Date.now()}`,
    key, threadID, players, teamMode, botGame,
    turnIndex: 0, phase: "roll", lastRoll: null, legalMoves: [],
    moveCount: 0, captures: [], log: ["Partie créée"],
    replyMessageID: null,
    updatedAt: Date.now(), startedAt: Date.now(),
    bet, pot: bet * humanCount, prizePerWinner: 0,
  };
}

function killGame(game: LudoGame) {
  activeGames.delete(game.key);
}

function cleanExpired() {
  const now = Date.now();
  for (const g of activeGames.values()) {
    if (now - g.updatedAt > EXPIRE_MS) killGame(g);
  }
}

function stopGamesFor(threadID: string, senderID: string) {
  let n = 0;
  for (const g of [...activeGames.values()]) {
    if (g.threadID === threadID && g.players.some(p => p.id === senderID)) {
      killGame(g); n++;
    }
  }
  return n;
}

/* ============================================================
   DICE & MOVE LOGIC
   ============================================================ */
function d6() { return Math.floor(Math.random() * 6) + 1; }
function diceEmoji(n: number) { return ["","1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣"][n] ?? String(n); }

function legalMoves(player: LudoPlayer, roll: number): number[] {
  return player.tokens.reduce<number[]>((acc, prog, i) => {
    if (prog === 57) return acc;
    if (prog === -1 && roll === 6) acc.push(i);
    else if (prog >= 0 && prog + roll <= 57) acc.push(i);
    return acc;
  }, []);
}

function applyMove(game: LudoGame, playerIdx: number, tokenIdx: number, roll: number) {
  const player = game.players[playerIdx];
  const before = player.tokens[tokenIdx];
  const next   = before === -1 ? 0 : before + roll;
  player.tokens[tokenIdx] = next;
  game.moveCount++;
  if (next === 57) {
    player.finished++;
    game.log.unshift(`${player.emoji} ${player.name} a ramené le pion ${tokenIdx + 1} à la maison.`);
    return;
  }
  const pos = tokenPos(player, next);
  if (!pos || pos.zone !== "track" || SAFE_INDEXES.has(pos.trackIdx)) return;
  for (const enemy of game.players) {
    if (enemy === player) continue;
    if (game.teamMode && enemy.team === player.team) continue;
    enemy.tokens.forEach((ep, ei) => {
      const epos = tokenPos(enemy, ep);
      if (epos?.zone === "track" && epos.trackIdx === pos.trackIdx) {
        enemy.tokens[ei] = -1;
        enemy.finished = enemy.tokens.filter(t => t === 57).length;
        game.captures.push({ by: player.name, victim: enemy.name });
        game.log.unshift(`${player.emoji} ${player.name} a capturé le pion ${ei + 1} de ${enemy.emoji} ${enemy.name}.`);
      }
    });
  }
}

function botChoose(game: LudoGame, playerIdx: number, legal: number[], roll: number): number {
  const player = game.players[playerIdx];
  let best = legal[0], bestScore = -999;
  for (const ti of legal) {
    const prog = player.tokens[ti];
    const next = prog === -1 ? 0 : prog + roll;
    let score = next;
    if (prog === -1) score += 20;
    if (next === 57) score += 100;
    const pos = tokenPos(player, next);
    if (pos?.zone === "track") {
      for (const e of game.players) {
        if (e === player) continue;
        if (game.teamMode && e.team === player.team) continue;
        if (e.tokens.some(t => tokenPos(e, t)?.trackIdx === pos.trackIdx)) score += 60;
      }
      if (SAFE_INDEXES.has(pos.trackIdx)) score += 8;
    }
    if (score > bestScore) { bestScore = score; best = ti; }
  }
  return best;
}

function nextTurn(game: LudoGame, roll: number) {
  if (roll !== 6) game.turnIndex = (game.turnIndex + 1) % game.players.length;
  game.phase = "roll";
  game.lastRoll = null;
  game.legalMoves = [];
}

function afterMove(game: LudoGame) {
  nextTurn(game, game.lastRoll!);
  game.phase = "roll";
  game.lastRoll = null;
  game.legalMoves = [];
}

function checkWinner(game: LudoGame): string | null {
  if (game.teamMode) {
    const A = game.players.filter(p => p.team === "A");
    const B = game.players.filter(p => p.team === "B");
    if (A.every(p => p.tokens.every(t => t === 57)))
      return "🏆 L'équipe Rouge + Vert remporte la bataille 2v2 !";
    if (B.every(p => p.tokens.every(t => t === 57)))
      return "🏆 L'équipe Jaune + Bleu remporte la bataille 2v2 !";
    return null;
  }
  const w = game.players.find(p => p.tokens.every(t => t === 57));
  return w ? `🏆 ${w.emoji} ${w.name} remporte Ludo Royal !` : null;
}

function tokenPos(player: LudoPlayer, progress: number) {
  if (progress < 0) return null;
  if (progress <= 51) {
    const trackIdx = (player.colorData.start + progress) % TRACK.length;
    const [col, row] = TRACK[trackIdx];
    return { zone: "track" as const, trackIdx, col, row };
  }
  if (progress <= 56) {
    const [col, row] = player.colorData.home[progress - 52];
    return { zone: "home" as const, trackIdx: -1, col, row };
  }
  return { zone: "finish" as const, trackIdx: -1, col: 7, row: 7 };
}

/* ============================================================
   BOT RUNNER
   ============================================================ */
async function doRoll(output: CommandContext["output"], game: LudoGame, money: any, input?: any) {
  const player = game.players[game.turnIndex];
  const roll = d6();
  const legal = legalMoves(player, roll);
  game.lastRoll = roll;
  game.legalMoves = legal;

  if (!legal.length) {
    game.log.unshift(`${player.emoji} ${player.name} a fait ${roll} → aucun mouvement.`);
    nextTurn(game, roll);
    await sendState(output, game,
      `${player.emoji} ${player.name} a fait ${diceEmoji(roll)} : aucun pion ne peut bouger.`, input);
    await runBots(output, game, money, input);
    return;
  }

  if (legal.length === 1) {
    applyMove(game, game.turnIndex, legal[0], roll);
    afterMove(game);
    const win = checkWinner(game);
    if (win) {
      await payWinner(game, money);
      killGame(game);
      await sendState(output, game, buildWinMsg(game, win), input);
      return;
    }
    await sendState(output, game,
      `${player.name} a fait ${diceEmoji(roll)} et déplacé le pion ${legal[0] + 1}.`, input);
    await runBots(output, game, money, input);
    return;
  }

  game.phase = "move";
  await sendState(output, game,
    `${player.name} a fait ${diceEmoji(roll)} ! Choisissez un pion : ${legal.map(i => i + 1).join(", ")}`, input);
}

async function runBots(output: CommandContext["output"], game: LudoGame, money: any, input?: any) {
  let safety = 0;
  while (
    activeGames.get(game.key) === game &&
    game.players[game.turnIndex]?.bot &&
    safety < 30
  ) {
    safety++;
    const player = game.players[game.turnIndex];
    await sleep(900);
    const roll  = d6();
    const legal = legalMoves(player, roll);
    game.lastRoll   = roll;
    game.legalMoves = legal;
    if (!legal.length) {
      game.log.unshift(`${player.name} [BOT] a fait ${roll} → aucun mouvement.`);
      nextTurn(game, roll);
      continue;
    }
    const chosen = botChoose(game, game.turnIndex, legal, roll);
    applyMove(game, game.turnIndex, chosen, roll);
    const win = checkWinner(game);
    if (win) {
      await payWinner(game, money);
      killGame(game);
      await sendState(output, game, buildWinMsg(game, win), input);
      return;
    }
    game.log.unshift(`${player.name} [BOT] a fait ${roll} → T${chosen + 1}`);
    nextTurn(game, roll);
    if (!game.players[game.turnIndex]?.bot) {
      await sendState(output, game,
        `${player.name} a joué. C'est maintenant à ${game.players[game.turnIndex].name}.`, input);
      return;
    }
  }
  if (activeGames.get(game.key) === game && !game.players[game.turnIndex]?.bot) {
    await sendState(output, game,
      `C'est à ${game.players[game.turnIndex].name} de jouer — répondez "roll".`, input);
  }
}

/* ============================================================
   MONEY
   ============================================================ */
async function payWinner(game: LudoGame, money: any) {
  if (!game.bet || !game.pot || !money) return;
  let winners: LudoPlayer[] = [];
  if (game.teamMode) {
    const A = game.players.filter(p => p.team === "A");
    const B = game.players.filter(p => p.team === "B");
    if (A.every(p => p.tokens.every(t => t === 57))) winners = A.filter(p => !p.bot);
    else if (B.every(p => p.tokens.every(t => t === 57))) winners = B.filter(p => !p.bot);
  } else {
    const w = game.players.find(p => p.tokens.every(t => t === 57) && !p.bot);
    if (w) winners = [w];
  }
  if (!winners.length) return;
  const prize = Math.floor(game.pot / winners.length);
  game.prizePerWinner = prize;
  game.winners = winners;
  for (const w of winners) {
    try {
      const ud = await money.getItem(w.id);
      await money.setItem(w.id, { money: (ud.money || 0) + prize });
    } catch {}
  }
}

async function refundBets(game: LudoGame, money: any) {
  if (!game.bet || !money) return;
  for (const p of game.players.filter(p => !p.bot)) {
    try {
      const ud = await money.getItem(p.id);
      await money.setItem(p.id, { money: (ud.money || 0) + game.bet });
    } catch {}
  }
}

function buildWinMsg(game: LudoGame, base: string) {
  if (!game.bet || !game.prizePerWinner) return base;
  const names = (game.winners || []).map(w => w.name).join(" & ");
  return `${base}\n💰 ${names} remporte $${game.prizePerWinner.toLocaleString()} !`;
}

/* ============================================================
   OUTPUT  — send board image + text
   ============================================================ */
async function sendState(
  output: CommandContext["output"],
  game: LudoGame,
  body: string,
  input?: CommandContext["input"]
) {
  game.updatedAt = Date.now();
  const details = buildDetails(game, body);
  const tmpPath = path.join(os.tmpdir(), `ludo_${game.id}_${Date.now()}.png`);

  try {
    const canvas = renderBoard(game, body);
    await fs.writeFile(tmpPath, canvas.toBuffer("image/png"));
  } catch (err) {
    console.error("[Ludo] Canvas error:", err);
    return output.reply(details);
  }

  try {
    const stream = fs.createReadStream(tmpPath);
    const info = await output.reply({ body: details, attachment: stream } as any);

    // Register reply handler so the next message routes back here
    if (input && info?.messageID) {
      const current = game.players[game.turnIndex];
      if (current && !current.bot) {
        input.setReply(info.messageID, {
          key:     "ludo",
          gameKey: game.key,
          gameID:  game.id,
        });
        game.replyMessageID = info.messageID;
      }
    }
  } catch (err) {
    console.error("[Ludo] Reply error:", err);
  } finally {
    fs.remove(tmpPath).catch(() => {});
  }
}

/* ============================================================
   TEXT DETAILS
   ============================================================ */
function buildDetails(game: LudoGame, body: string) {
  const current = game.players[game.turnIndex];
  const mode    = game.teamMode ? "2v2 Combat par équipes" : `Partie ${game.players.length} joueurs`;
  const elapsed = Math.floor((Date.now() - game.startedAt) / 60000);
  const lines: string[] = [];

  lines.push(`🎲 LUDO ROYAL — ${mode}`);
  lines.push(`⏱ Temps : ${elapsed}m  |  Mouvements : ${game.moveCount}  |  Captures : ${game.captures.length}`);
  if (game.bet > 0)
    lines.push(`💰 Mise : $${game.bet.toLocaleString()} chacun  |  Cagnotte : $${game.pot.toLocaleString()}`);
  lines.push("━━━━━━━━━━━━━━━━━━━━━━");

  if (game.lastRoll) {
    const rollLabel = game.lastRoll === 6
      ? `${diceEmoji(game.lastRoll)} 6 — TOUR SUPPLÉMENTAIRE !`
      : `${diceEmoji(game.lastRoll)} (${game.lastRoll})`;
    lines.push(`🎲 Dernier dé : ${rollLabel}`);
  }

  if (current) {
    lines.push(current.bot
      ? `🤖 Tour : ${current.name} [BOT] réfléchit...`
      : `👑 Tour : ${current.name}`);
    lines.push(game.phase === "move"
      ? `⚡ Choisissez le pion : ${game.legalMoves.map(i => i + 1).join(" ou ")}`
      : `⚡ Répondez "roll" pour lancer le dé`);
  }

  lines.push("━━━━━━━━━━━━━━━━━━━━━━");
  lines.push("📊 Tableau des scores :");

  game.players.forEach((p, idx) => {
    const home    = p.tokens.filter(t => t === 57).length;
    const onBoard = p.tokens.filter(t => t >= 0 && t < 57).length;
    const inYard  = p.tokens.filter(t => t === -1).length;
    const caps    = game.captures.filter(c => c.by === p.name).length;
    const bar     = "█".repeat(home) + "░".repeat(4 - home);
    const arrow   = idx === game.turnIndex ? " ◄" : "";
    lines.push(`${p.emoji} ${p.name}${p.bot ? " [BOT]" : ""}${arrow}`);
    lines.push(`   [${bar}] ${home}/4 maison  |  Plateau : ${onBoard}  Départ : ${inYard}${caps > 0 ? `  Captures : ${caps}` : ""}`);
  });

  if (game.captures.length > 0) {
    lines.push("━━━━━━━━━━━━━━━━━━━━━━");
    lines.push(`⚔️ Dernières captures : ${game.captures.slice(-3).map(c => `${c.by}→${c.victim}`).join(", ")}`);
  }

  if (game.log.length > 1) {
    lines.push("━━━━━━━━━━━━━━━━━━━━━━");
    lines.push("📜 Derniers mouvements :");
    game.log.slice(1, 4).forEach(l => { if (l) lines.push(`• ${l.slice(0, 90)}`); });
  }

  lines.push("━━━━━━━━━━━━━━━━━━━━━━");
  lines.push(body);
  return lines.join("\n");
}

/* ============================================================
   HELP TEXT
   ============================================================ */
function buildHelp() {
  return [
    "🎲 LUDO ROYAL 🎲",
    "",
    "Commandes :",
    "• ludo bot       — 1v1 contre un bot",
    "• ludo bot 3     — contre 2 bots",
    "• ludo bot 4     — contre 3 bots",
    "• ludo 1v1 @joueur",
    "• ludo 1v1v1 @p2 @p3",
    "• ludo 1v1v1v1 @p2 @p3 @p4",
    "• ludo 2v2 @p2 @p3 @p4   — Rouge+Vert vs Jaune+Bleu",
    "• ludo stop      — terminer votre partie",
    "• ludo status    — afficher le plateau",
    "",
    "Paris (multijoueur uniquement) :",
    "• ludo 1v1 @joueur 500",
    "• ludo 1v1v1 @p2 @p3 1000",
    "",
    "Comment jouer :",
    "1. Répondez roll pour lancer le dé.",
    "2. Si plusieurs pions bougent, répondez 1, 2, 3 ou 4.",
    "3. Un 6 sort un pion et rejoue.",
    "4. Marchez sur un adversaire pour le capturer.",
    "5. Ramenez vos 4 pions à la maison pour gagner.",
    "★ Les cases étoiles protègent de la capture.",
  ].join("\n");
}

/* ============================================================
   UTILS
   ============================================================ */
async function resolveName(money: any, id: string): Promise<string> {
  if (id.startsWith("bot_")) return id;
  try {
    const ud = await money.getItem(id);
    return ud?.name || "Joueur";
  } catch { return "Joueur"; }
}

/* ============================================================
   CANVAS RENDERING  (identical logic to GoatBot original)
   ============================================================ */
function renderBoard(game: LudoGame, banner: string) {
  const canvas = createCanvas(1200, 1600);
  const ctx    = canvas.getContext("2d");
  const bx = 75, by = 175, cell = 70;

  // Background
  const grad = ctx.createLinearGradient(0, 0, 0, 1600);
  grad.addColorStop(0, "#0f172a"); grad.addColorStop(0.35, "#1e1b4b");
  grad.addColorStop(0.7, "#1a1035"); grad.addColorStop(1, "#0f172a");
  ctx.fillStyle = grad; ctx.fillRect(0, 0, 1200, 1600);
  drawDecorBg(ctx);
  drawTopPanel(ctx, game, banner);
  // shadow
  ctx.save(); ctx.shadowColor = "#000a"; ctx.shadowBlur = 35; ctx.shadowOffsetY = 20;
  rrect(ctx, bx - 10, by - 10, cell * 15 + 20, cell * 15 + 20, 34, "#f8fafc");
  ctx.restore();
  drawGrid(ctx, bx, by, cell);
  drawYards(ctx, bx, by, cell);
  drawHomePaths(ctx, bx, by, cell);
  drawArrows(ctx, bx, by, cell);
  drawTokens(ctx, game, bx, by, cell);
  drawInfoPanel(ctx, game);
  return canvas;
}

function drawDecorBg(ctx: any) {
  ctx.save(); ctx.globalAlpha = 0.04;
  [[100,150,180],[1100,200,220],[600,800,300],[200,1450,160],[950,1500,200],[600,1600,250]]
    .forEach(([cx,cy,r]) => { ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fillStyle="#fff"; ctx.fill(); });
  ctx.restore();
}

function drawTopPanel(ctx: any, game: LudoGame, banner: string) {
  rrect(ctx, 60, 25, 1080, 135, 30, "#ffffff15", "#ffffff40", 2);
  const dS = 110, dX = 1090 - dS, dY = 32;
  drawDiceFace(ctx, dX, dY, dS, game.lastRoll);
  ctx.fillStyle = "#f1f5f9"; ctx.font = "bold 46px LudoFont"; ctx.fillText("LUDO ROYAL", 85, 83);
  const modeLabel = game.teamMode ? "2v2 Team Battle" : `${game.players.length}P`;
  ctx.font = "bold 20px LudoFont"; ctx.fillStyle = "#a5b4fc";
  ctx.fillText(`${modeLabel}  |  ${game.moveCount} moves  |  ${game.captures.length} captures`, 85, 112);
  ctx.font = "bold 22px LudoFont"; ctx.fillStyle = "#fde68a";
  ctx.fillText(banner.length > 70 ? banner.slice(0, 68) + "…" : banner, 85, 144);
}

function drawDiceFace(ctx: any, x: number, y: number, size: number, value: number | null) {
  const r = 18;
  ctx.save(); ctx.shadowColor = "#000000aa"; ctx.shadowBlur = 14; ctx.shadowOffsetY = 6;
  rrect(ctx, x, y, size, size, r, value === 6 ? "#fef9c3" : "#f8fafc"); ctx.restore();
  rrect(ctx, x, y, size, size, r, undefined, value === 6 ? "#b45309" : value ? "#3b82f6" : "#64748b", value === 6 ? 5 : 3);
  if (!value) {
    ctx.fillStyle = "#94a3b8"; ctx.font = `bold ${Math.floor(size * 0.52)}px LudoFont`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("?", x + size / 2, y + size / 2 + 2);
    ctx.textAlign = "left"; ctx.textBaseline = "alphabetic"; return;
  }
  const dotColor = value === 6 ? "#92400e" : "#1e3a8a", dotR = size * 0.085, p = size * 0.26, m = size * 0.5;
  const dotMap: Record<number, [number, number][]> = {
    1: [[m,m]], 2: [[p,p],[size-p,size-p]], 3: [[p,p],[m,m],[size-p,size-p]],
    4: [[p,p],[size-p,p],[p,size-p],[size-p,size-p]],
    5: [[p,p],[size-p,p],[m,m],[p,size-p],[size-p,size-p]],
    6: [[p,p*.85],[size-p,p*.85],[p,m],[size-p,m],[p,size-p*.85],[size-p,size-p*.85]],
  };
  ctx.fillStyle = dotColor;
  for (const [dx, dy] of (dotMap[value] || [])) {
    ctx.beginPath(); ctx.arc(x + dx, y + dy, dotR, 0, Math.PI * 2); ctx.fill();
  }
}

function drawGrid(ctx: any, bx: number, by: number, cell: number) {
  for (let row = 0; row < 15; row++)
    for (let col = 0; col < 15; col++) drawCell(ctx, bx, by, cell, col, row, "#fff7ed");
  for (const [col, row] of TRACK) drawCell(ctx, bx, by, cell, col, row, "#ffffff");
  for (const idx of SAFE_INDEXES) {
    const [col, row] = TRACK[idx];
    drawCell(ctx, bx, by, cell, col, row, "#fef3c7");
    drawStar(ctx, bx + col * cell + cell / 2, by + row * cell + cell / 2, 18, "#b45309");
  }
  ctx.strokeStyle = "#111827"; ctx.lineWidth = 3; ctx.strokeRect(bx, by, cell * 15, cell * 15);
}

function drawYards(ctx: any, bx: number, by: number, cell: number) {
  const offsets: [number, number][] = [[0,0],[9,0],[9,9],[0,9]];
  COLORS.forEach((color, i) => {
    const [col, row] = offsets[i];
    const px = bx + col * cell, py = by + row * cell;
    rrect(ctx, px + 10, py + 10, cell * 6 - 20, cell * 6 - 20, 26, color.hex, color.dark, 5);
    rrect(ctx, px + 62, py + 62, cell * 4 - 54, cell * 4 - 54, 28, "#fffaf0", "#ffffff", 4);
    for (const [tc, tr] of color.yard) {
      const cx = bx + tc * cell + cell / 2, cy = by + tr * cell + cell / 2;
      ctx.save(); ctx.globalAlpha = 0.38;
      ctx.beginPath(); ctx.arc(cx, cy, 24, 0, Math.PI * 2);
      ctx.fillStyle = color.dark; ctx.fill(); ctx.restore();
    }
  });
}

function drawHomePaths(ctx: any, bx: number, by: number, cell: number) {
  for (const color of COLORS)
    for (const [col, row] of color.home) drawCell(ctx, bx, by, cell, col, row, color.hex);
  const paths: [[number,number],[number,number],[number,number], string][] = [
    [[6,6],[9,6],[7.5,7.5], COLORS[1].hex],
    [[9,6],[9,9],[7.5,7.5], COLORS[2].hex],
    [[9,9],[6,9],[7.5,7.5], COLORS[3].hex],
    [[6,9],[6,6],[7.5,7.5], COLORS[0].hex],
  ];
  for (const [[ax,ay],[bx2,by2],[cx2,cy2], fill] of paths) {
    ctx.beginPath();
    ctx.moveTo(bx + ax*cell, by + ay*cell);
    ctx.lineTo(bx + bx2*cell, by + by2*cell);
    ctx.lineTo(bx + cx2*cell, by + cy2*cell);
    ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
  }
  ctx.fillStyle = "#ffffff"; ctx.font = "bold 40px LudoFont";
  ctx.textAlign = "center"; ctx.fillText("HOME", bx + 7.5 * cell, by + 7.65 * cell); ctx.textAlign = "left";
}

function drawArrows(ctx: any, bx: number, by: number, cell: number) {
  for (const color of COLORS) {
    const [col, row] = TRACK[color.start];
    drawCell(ctx, bx, by, cell, col, row, color.hex);
    ctx.fillStyle = "#fff"; ctx.font = "bold 28px LudoFont"; ctx.textAlign = "center";
    ctx.fillText("GO", bx + col * cell + cell / 2, by + row * cell + cell / 2 + 10); ctx.textAlign = "left";
  }
}

function drawTokens(ctx: any, game: LudoGame, bx: number, by: number, cell: number) {
  const positions = new Map<string, { player: LudoPlayer; tokenIdx: number; progress: number }[]>();
  game.players.forEach(player => {
    player.tokens.forEach((progress, tokenIdx) => {
      let col: number, row: number;
      if (progress === -1) { [col, row] = player.colorData.yard[tokenIdx]; }
      else {
        const pos = tokenPos(player, progress)!;
        col = pos.col; row = pos.row;
      }
      const key = `${col},${row}`;
      if (!positions.has(key)) positions.set(key, []);
      positions.get(key)!.push({ player, tokenIdx, progress });
    });
  });
  for (const [key, tokens] of positions.entries()) {
    const [col, row] = key.split(",").map(Number);
    tokens.forEach(({ player, tokenIdx, progress }, idx) => {
      const total = tokens.length;
      const angle = (Math.PI * 2 * idx) / total;
      const radius = total > 2 ? 15 : total > 1 ? 11 : 0;
      const cx = bx + col * cell + cell / 2 + Math.cos(angle) * radius;
      const cy = by + row * cell + cell / 2 + Math.sin(angle) * radius;
      // token base
      ctx.save(); ctx.shadowColor = "#00000088"; ctx.shadowBlur = 8; ctx.shadowOffsetY = 5;
      ctx.beginPath(); ctx.arc(cx, cy, 25, 0, Math.PI * 2);
      ctx.fillStyle = player.colorData.hex; ctx.fill();
      ctx.lineWidth = 5; ctx.strokeStyle = "#fff"; ctx.stroke(); ctx.restore();
      ctx.fillStyle = progress === 57 ? "#fde68a" : "#fff";
      ctx.font = "bold 21px LudoFont"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(progress === 57 ? "★" : String(tokenIdx + 1), cx, cy + 1);
      ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    });
  }
}

function drawInfoPanel(ctx: any, game: LudoGame) {
  const panelY = 1244, panelH = 340;
  rrect(ctx, 60, panelY, 1080, panelH, 30, "#ffffff12", "#ffffff35", 2);
  game.players.forEach((player, index) => {
    const col = index % 2, row = Math.floor(index / 2);
    const cardX = 75 + col * 545, cardY = panelY + 12 + row * 106;
    const cardW = 520, cardH = 92;
    const isCurrent = index === game.turnIndex;
    if (isCurrent) {
      ctx.save(); ctx.shadowColor = player.colorData.hex; ctx.shadowBlur = 20;
      rrect(ctx, cardX-3, cardY-3, cardW+6, cardH+6, 18, undefined, player.colorData.hex, 4);
      ctx.restore();
    }
    rrect(ctx, cardX, cardY, cardW, cardH, 16,
      isCurrent ? player.colorData.hex + "55" : "#ffffff18",
      player.colorData.hex + "88", 2);
    ctx.beginPath(); ctx.arc(cardX+22, cardY+22, 10, 0, Math.PI*2);
    ctx.fillStyle = player.colorData.hex; ctx.fill();
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = "#f8fafc"; ctx.font = "bold 21px LudoFont";
    ctx.fillText(player.name.slice(0, 18) + (player.bot ? " BOT" : ""), cardX+40, cardY+30);
    if (isCurrent) {
      ctx.font = "bold 16px LudoFont"; ctx.fillStyle = "#fde68a";
      ctx.textAlign = "right"; ctx.fillText("YOUR TURN", cardX+cardW-14, cardY+30); ctx.textAlign = "left";
    }
    const home    = player.tokens.filter(t => t === 57).length;
    const onBoard = player.tokens.filter(t => t >= 0 && t < 57).length;
    const inYard  = player.tokens.filter(t => t === -1).length;
    ctx.font = "18px LudoFont"; ctx.fillStyle = "#cbd5e1";
    ctx.fillText(`Home: ${home}/4`, cardX+12, cardY+56);
    ctx.fillText(`Board: ${onBoard}`, cardX+110, cardY+56);
    ctx.fillText(`Yard: ${inYard}`, cardX+196, cardY+56);
    const captures = game.captures.filter(c => c.by === player.name).length;
    if (captures > 0) { ctx.fillStyle = "#fca5a5"; ctx.fillText(`Captures: ${captures}`, cardX+280, cardY+56); }
    player.tokens.forEach((prog, ti) => {
      const dotX = cardX + 12 + ti * 28, dotY = cardY + 75, dotR = 9;
      ctx.beginPath(); ctx.arc(dotX, dotY, dotR, 0, Math.PI*2);
      if (prog === 57) {
        ctx.fillStyle = "#fde68a"; ctx.fill(); ctx.strokeStyle = "#b45309"; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = "#92400e"; ctx.font = "bold 11px LudoFont";
        ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("H", dotX, dotY+1);
        ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
      } else if (prog === -1) {
        ctx.fillStyle = "#334155"; ctx.fill(); ctx.strokeStyle = player.colorData.hex + "88"; ctx.lineWidth = 2; ctx.stroke();
      } else {
        ctx.fillStyle = player.colorData.hex; ctx.fill(); ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = "#fff"; ctx.font = "bold 10px LudoFont";
        ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(String(ti+1), dotX, dotY+1);
        ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
      }
    });
  });
  // log strip
  const logY = panelY + 228;
  rrect(ctx, 75, logY, 1065, 100, 16, "#ffffff0a", "#ffffff25", 1);
  ctx.fillStyle = "#94a3b8"; ctx.font = "bold 16px LudoFont"; ctx.fillText("RECENT MOVES", 100, logY+22);
  ctx.font = "18px LudoFont";
  game.log.slice(0, 3).forEach((line, i) => {
    ctx.fillStyle = i === 0 ? "#e2e8f0" : "#64748b";
    ctx.fillText(line.replace(/[^\x20-\x7E]/g, "").trim().slice(0, 90), 100, logY + 46 + i * 22);
  });
}

/* ── tiny canvas helpers ── */
function drawCell(ctx: any, bx: number, by: number, cell: number, col: number, row: number, fill: string) {
  ctx.fillStyle = fill; ctx.fillRect(bx + col*cell, by + row*cell, cell, cell);
  ctx.strokeStyle = "#1f293733"; ctx.lineWidth = 1; ctx.strokeRect(bx + col*cell, by + row*cell, cell, cell);
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

function rrect(
  ctx: any, x: number, y: number, w: number, h: number, r: number,
  fill?: string, stroke?: string, lw?: number
) {
  ctx.beginPath();
  ctx.moveTo(x+r, y); ctx.lineTo(x+w-r, y); ctx.quadraticCurveTo(x+w, y, x+w, y+r);
  ctx.lineTo(x+w, y+h-r); ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
  ctx.lineTo(x+r, y+h); ctx.quadraticCurveTo(x, y+h, x, y+h-r);
  ctx.lineTo(x, y+r); ctx.quadraticCurveTo(x, y, x+r, y); ctx.closePath();
  if (fill)  { ctx.fillStyle = fill;   ctx.fill(); }
  if (stroke && lw) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
}
