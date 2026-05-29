// @ts-check

/* ============================================================
   EMPIRE CRIMINEL — Cassidy Port
   Author  : Christus
   Version : 4.0.0
   GoatBot  → Cassidy by Christus
   ============================================================ */

/* ── META ── */
export const meta: CommandMeta = {
  name: "empire",
  otherNames: ["cartel", "mafia", "tycoon"],
  description:
    "💀 Simulation de tycoon criminel ultra-complexe. Construis ton empire depuis la rue jusqu'au trône du Parrain.",
  author: "Christus",
  version: "4.0.0",
  usage: "{prefix}empire <commande>",
  category: "Economy",
  role: 0,
  noPrefix: false,
  waitingTime: 3,
  requirement: "3.0.0",
  icon: "💀",
  cmdType: "cplx_g",
  isGame: true,
};

/* ── STYLE ── */
export const style: CommandStyle = {
  title: "💀 Empire Criminel",
  titleFont: "bold",
  contentFont: "none",
  lineDeco: "altar",
};

/* ============================================================
   CONSTANTES
   ============================================================ */
const COOLDOWNS = {
  COLLECTE:    1  * 60 * 60 * 1000,
  MISSION:     2  * 60 * 60 * 1000,
  BLANCHIMENT: 4  * 60 * 60 * 1000,
  ATTENTAT:    6  * 60 * 60 * 1000,
  GUERRE:      12 * 60 * 60 * 1000,
  DAILY:       24 * 60 * 60 * 1000,
  MARCHE:      30 * 60 * 1000,
};

const RANGS = [
  { id: "RAT",        nom: "Rat de Caniveau",   min: 0,            emoji: "🐀", bonus: 0,    color: "⚫" },
  { id: "DEALER",     nom: "Dealer de Rue",      min: 50_000,       emoji: "🧤", bonus: 0.05, color: "🟤" },
  { id: "SOLDAT",     nom: "Soldat",             min: 250_000,      emoji: "🔫", bonus: 0.10, color: "🔴" },
  { id: "CAPORAL",    nom: "Caporal",            min: 1_000_000,    emoji: "⚔️", bonus: 0.15, color: "🟠" },
  { id: "LIEUTENANT", nom: "Lieutenant",         min: 5_000_000,    emoji: "🦅", bonus: 0.20, color: "🟡" },
  { id: "CAPITAINE",  nom: "Capitaine",          min: 20_000_000,   emoji: "🎖️", bonus: 0.25, color: "🟢" },
  { id: "BOSS",       nom: "Boss",               min: 100_000_000,  emoji: "💀", bonus: 0.35, color: "🔵" },
  { id: "PARRAIN",    nom: "Le Parrain",         min: 500_000_000,  emoji: "👑", bonus: 0.50, color: "🟣" },
] as const;

const TERRITOIRES: Record<string, { id: string; nom: string; cout: number; revenu: number; risque: number; protection: number; emoji: string }> = {
  BANLIEUE: { id: "BANLIEUE", nom: "Banlieue Sud",     cout: 0,           revenu: 5_000,     risque: 1, protection: 0, emoji: "🏚️" },
  QUARTIER: { id: "QUARTIER", nom: "Quartier Nord",    cout: 80_000,      revenu: 18_000,    risque: 2, protection: 0, emoji: "🏘️" },
  PORT:     { id: "PORT",     nom: "Port Clandestin",  cout: 500_000,     revenu: 65_000,    risque: 3, protection: 1, emoji: "⚓"  },
  CASINO:   { id: "CASINO",   nom: "Casino Caché",     cout: 2_000_000,   revenu: 200_000,   risque: 4, protection: 2, emoji: "🎰" },
  DOUANE:   { id: "DOUANE",   nom: "Douane Corrompue", cout: 8_000_000,   revenu: 600_000,   risque: 3, protection: 3, emoji: "🛃" },
  CAPITALE: { id: "CAPITALE", nom: "Centre Politique", cout: 30_000_000,  revenu: 2_000_000, risque: 5, protection: 5, emoji: "🏛️" },
};

const PRODUITS: Record<string, { id: string; nom: string; prixAchat: number; prixVente: number; risque: number; emoji: string }> = {
  CONTREBANDE: { id: "CONTREBANDE", nom: "Contrebande",   prixAchat: 1_000,   prixVente: 2_800,   risque: 1, emoji: "📦" },
  ARMES:       { id: "ARMES",       nom: "Armes légères", prixAchat: 8_000,   prixVente: 22_000,  risque: 3, emoji: "🔫" },
  DOCUMENTS:   { id: "DOCUMENTS",   nom: "Faux docs",     prixAchat: 3_000,   prixVente: 9_500,   risque: 2, emoji: "📄" },
  DROGUE:      { id: "DROGUE",      nom: "Narcotiques",   prixAchat: 5_000,   prixVente: 16_000,  risque: 4, emoji: "💊" },
  CRYPTO_SALE: { id: "CRYPTO_SALE", nom: "Crypto volée",  prixAchat: 15_000,  prixVente: 45_000,  risque: 3, emoji: "💻" },
  PETROLE:     { id: "PETROLE",     nom: "Pétrole noir",  prixAchat: 50_000,  prixVente: 140_000, risque: 4, emoji: "🛢️" },
};

const STRUCTURES: Record<string, { id: string; nom: string; cout: number; capacite: number; revenuBonus: number; emoji: string }> = {
  PLANQUE:    { id: "PLANQUE",    nom: "Planque",           cout: 10_000,     capacite: 50,  revenuBonus: 0,    emoji: "🏠" },
  LABO:       { id: "LABO",       nom: "Laboratoire",       cout: 75_000,     capacite: 0,   revenuBonus: 0.15, emoji: "🧪" },
  ENTREPOT:   { id: "ENTREPOT",   nom: "Entrepôt",          cout: 200_000,    capacite: 500, revenuBonus: 0,    emoji: "🏭" },
  RESTAURANT: { id: "RESTAURANT", nom: "Restaurant Façade", cout: 500_000,    capacite: 0,   revenuBonus: 0.25, emoji: "🍽️" },
  SOCIETE:    { id: "SOCIETE",    nom: "Société Écran",     cout: 2_000_000,  capacite: 0,   revenuBonus: 0.40, emoji: "🏢" },
  BANQUE_OFF: { id: "BANQUE_OFF", nom: "Banque Offshore",   cout: 15_000_000, capacite: 0,   revenuBonus: 0.60, emoji: "🏦" },
};

const ALLIES: Record<string, { id: string; nom: string; cout: number; effet: string; emoji: string }> = {
  AVOCAT:     { id: "AVOCAT",     nom: "Maître Dubois",       cout: 50_000,    effet: "Réduit risque arrestation -30%",  emoji: "⚖️" },
  POLICIER:   { id: "POLICIER",   nom: "Inspecteur Corrompu", cout: 150_000,   effet: "Alerte -1 par mission",           emoji: "🚔" },
  POLITICIEN: { id: "POLITICIEN", nom: "Député Vénard",       cout: 500_000,   effet: "Territoire risque -2",            emoji: "🤝" },
  HACKER:     { id: "HACKER",     nom: "Zero-X",              cout: 250_000,   effet: "+30% revenus marché noir",        emoji: "💻" },
  MERCENAIRE: { id: "MERCENAIRE", nom: "Colonel Krak",        cout: 1_000_000, effet: "+50% succès attaque territoire",  emoji: "🪖" },
  JUGE:       { id: "JUGE",       nom: "Juge Moreau",         cout: 3_000_000, effet: "Immunité totale 48h",             emoji: "🔨" },
};

const MISSIONS = [
  { id: "M01", nom: "Vol à l'arraché",       difficulte: 1, duree: 30,  gain: [2_000,     8_000],    cout: 0,         risque: 10, xp: 5   },
  { id: "M02", nom: "Cambriolage",           difficulte: 2, duree: 60,  gain: [10_000,    40_000],   cout: 2_000,     risque: 20, xp: 15  },
  { id: "M03", nom: "Enlèvement ciblé",      difficulte: 3, duree: 90,  gain: [50_000,    180_000],  cout: 15_000,    risque: 30, xp: 30  },
  { id: "M04", nom: "Hack de banque",        difficulte: 4, duree: 120, gain: [200_000,   700_000],  cout: 50_000,    risque: 45, xp: 60  },
  { id: "M05", nom: "Assassinat de cible",   difficulte: 5, duree: 180, gain: [800_000,   3_000_000],cout: 200_000,   risque: 60, xp: 120 },
  { id: "M06", nom: "Coup d'état économique",difficulte: 6, duree: 240, gain: [3_000_000, 12_000_000],cout:1_000_000, risque: 75, xp: 300 },
];

const BLANCHIMENT_METHODES: Record<string, { id: string; nom: string; ratio: number; frais: number; delai: string; emoji: string }> = {
  IMMOBILIER:   { id: "IMMOBILIER",   nom: "Immobilier fictif",     ratio: 0.70, frais: 0.30, delai: "4h", emoji: "🏠" },
  CASINO_JETON: { id: "CASINO_JETON", nom: "Jetons de casino",      ratio: 0.80, frais: 0.20, delai: "4h", emoji: "🎰" },
  SOCIETE_ECRAN:{ id: "SOCIETE_ECRAN",nom: "Société écran offshore", ratio: 0.90, frais: 0.10, delai: "4h", emoji: "🏢" },
  CRYPTO_MIX:   { id: "CRYPTO_MIX",   nom: "Mixeur cryptomonnaie",  ratio: 0.85, frais: 0.15, delai: "4h", emoji: "🔀" },
  DONATION:     { id: "DONATION",     nom: "Fausse donation ONG",   ratio: 0.60, frais: 0.40, delai: "4h", emoji: "🎁" },
};

/* ============================================================
   TYPES
   ============================================================ */
interface EmpireData {
  argentSale: number;
  argentPropre: number;
  totalGagne: number;
  totalBlanchit: number;
  rang: string;
  xp: number;
  niveau: number;
  reputation: number;
  territoires: string[];
  structuresActives: { type: string; territoire: string; id: string }[];
  inventaire: Record<string, number>;
  capaciteMax: number;
  allies: string[];
  missionEnCours: { missionId: string; finAt: number; cout: number } | null;
  lastMission: number | null;
  missionsCompletes: number;
  lastGuerre: number | null;
  guerresGagnees: number;
  guerresPerdues: number;
  lastBlanchiment: number | null;
  blanchimentEnCours: { methode: string; montant: number; finAt: number } | null;
  lastCollecte: number | null;
  lastAttentat: number | null;
  lastDaily: number | null;
  lastMarche: number | null;
  transactions: { type: string; montant: number; description: string; date: number }[];
  achievements: string[];
  evenementActif: string | null;
  evenementExpire: number | null;
  tauxCorruption: number;
  prisEnChasse: boolean;
  nbArrestes: number;
  vault: number;
  loan: number;
  loanDate: number | null;
  creditScore: number;
  bankLevel: number;
  multiplier: number;
  premium: boolean;
  streak: number;
  lastVault: number | null;
  lastInterest: number;
}

/* ============================================================
   INIT
   ============================================================ */
function initEmpire(): EmpireData {
  return {
    argentSale: 0, argentPropre: 0, totalGagne: 0, totalBlanchit: 0,
    rang: "RAT", xp: 0, niveau: 1, reputation: 0,
    territoires: ["BANLIEUE"], structuresActives: [],
    inventaire: {}, capaciteMax: 50, allies: [],
    missionEnCours: null, lastMission: null, missionsCompletes: 0,
    lastGuerre: null, guerresGagnees: 0, guerresPerdues: 0,
    lastBlanchiment: null, blanchimentEnCours: null,
    lastCollecte: null, lastAttentat: null, lastDaily: null, lastMarche: null,
    transactions: [], achievements: [],
    evenementActif: null, evenementExpire: null,
    tauxCorruption: 0, prisEnChasse: false, nbArrestes: 0,
    vault: 0, loan: 0, loanDate: null, creditScore: 500,
    bankLevel: 1, multiplier: 1.0, premium: false, streak: 0,
    lastVault: null, lastInterest: Date.now(),
  };
}

/* ============================================================
   UTILITAIRES
   ============================================================ */
function FM(n: number): string { return `$${Math.floor(n).toLocaleString("fr-FR")}`; }
function pct(n: number): string { return `${Math.round(n * 100)}%`; }
function rand(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min; }
function timeLeft(ts: number | null, cd: number): string | null {
  const diff = cd - (Date.now() - (ts || 0));
  if (diff <= 0) return null;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function getRang(empire: EmpireData) {
  let rang = RANGS[0];
  for (const r of RANGS) {
    if (empire.totalGagne >= r.min) rang = r;
    else break;
  }
  return rang;
}

function getRevenuTotal(empire: EmpireData): number {
  let total = 0;
  for (const tId of empire.territoires) {
    const t = TERRITOIRES[tId];
    if (t) total += t.revenu;
  }
  for (const s of empire.structuresActives) {
    const struct = STRUCTURES[s.type];
    if (struct && struct.revenuBonus > 0) total += total * struct.revenuBonus;
  }
  const rang = getRang(empire);
  total += total * rang.bonus;
  if (empire.allies.includes("HACKER")) total += total * 0.30;
  if (empire.evenementActif === "EVT_POLICE" && Date.now() < (empire.evenementExpire || 0))
    total -= total * 0.20;
  return Math.floor(total);
}

function getCapaciteMax(empire: EmpireData): number {
  let cap = 50;
  for (const s of empire.structuresActives) {
    const struct = STRUCTURES[s.type];
    if (struct && struct.capacite > 0) cap += struct.capacite;
  }
  return cap;
}

function getQuantiteInventaire(empire: EmpireData): number {
  return Object.values(empire.inventaire).reduce((a, b) => a + b, 0);
}

function checkAchievements(empire: EmpireData): string[] {
  const liste: string[] = [];
  const add = (id: string, cond: boolean) => {
    if (!empire.achievements.includes(id) && cond) liste.push(id);
  };
  add("PREMIER_SANG",   empire.missionsCompletes >= 1);
  add("PETIT_BOSS",     empire.territoires.length >= 3);
  add("MILLION",        empire.totalGagne >= 1_000_000);
  add("MILLIARD",       empire.totalGagne >= 1_000_000_000);
  add("CAPO",           empire.rang === "CAPITAINE");
  add("PARRAIN_TITLE",  empire.rang === "PARRAIN");
  add("BLANCHISSEUR",   empire.totalBlanchit >= 10_000_000);
  add("CHEF_DE_GUERRE", empire.guerresGagnees >= 5);
  add("ALLIANCE",       empire.allies.length >= 4);
  add("PREMIER_CRIME",  empire.totalGagne >= 10_000);
  add("RICHISSE",       empire.argentPropre >= 1_000_000);
  add("SEIGNEUR_GUERRE",empire.guerresGagnees >= 10);
  add("INVINCIBLE",     empire.guerresGagnees >= 20);
  add("LEGENDE",        empire.totalGagne >= 1_000_000_000);
  for (const a of liste) empire.achievements.push(a);
  return liste;
}

function getTransactionEmoji(type: string): string {
  const map: Record<string, string> = {
    deposit: "💰", withdrawal: "💸", vault_deposit: "🔐", vault_withdrawal: "🔓",
    loan: "🏦", loan_repayment: "💳", interest_earned: "📈", interest_charged: "📉",
    daily: "🎁", collecte: "💵", achat_territoire: "🗺️", construction: "🏗️",
    achat_marche: "🛒", vente_marche: "💸", recrutement: "🤝", blanchiment: "🧼",
    mission_succes: "✅", mission_echec: "❌", guerre_victoire: "⚔️", guerre_defaite: "💀",
    raid: "🚔", salary: "💼",
  };
  return map[type] || "💼";
}

function pushTx(empire: EmpireData, type: string, montant: number, description: string) {
  empire.transactions.push({ type, montant, description, date: Date.now() });
  if (empire.transactions.length > 30) empire.transactions = empire.transactions.slice(-30);
}

function calculatePortfolioValue(empire: EmpireData): number {
  let total = 0;
  for (const tId of empire.territoires) { const t = TERRITOIRES[tId]; if (t) total += t.cout; }
  for (const s of empire.structuresActives) { const st = STRUCTURES[s.type]; if (st) total += st.cout; }
  for (const [pId, qte] of Object.entries(empire.inventaire)) { const p = PRODUITS[pId]; if (p) total += p.prixAchat * qte; }
  return total;
}

/* ============================================================
   RENDERS
   ============================================================ */
function renderDashboard(empire: EmpireData, walletBalance: number): string {
  const rang         = getRang(empire);
  const revenu       = getRevenuTotal(empire);
  const totalLiquid  = walletBalance + empire.argentPropre;
  const totalNet     = totalLiquid + empire.argentSale + empire.vault;
  const portfolio    = calculatePortfolioValue(empire);
  const totalWealth  = totalNet + portfolio;
  const invQte       = getQuantiteInventaire(empire);
  const capMax       = getCapaciteMax(empire);

  let wealthTier = "🔰 Débutant";
  if      (totalWealth >= 1_000_000_000) wealthTier = "👑 Parrain Suprême";
  else if (totalWealth >= 100_000_000)   wealthTier = "💀 Boss Redouté";
  else if (totalWealth >= 10_000_000)    wealthTier = "🎖️ Capitaine";
  else if (totalWealth >= 1_000_000)     wealthTier = "⚔️ Soldat Confirmé";
  else if (totalWealth >= 100_000)       wealthTier = "🧤 Dealer Ambitieux";

  let creditRating = "Mauvais"; let creditEmoji = "🔴";
  if      (empire.creditScore >= 800) { creditRating = "Excellent"; creditEmoji = "🟢"; }
  else if (empire.creditScore >= 700) { creditRating = "Bon";       creditEmoji = "🟢"; }
  else if (empire.creditScore >= 600) { creditRating = "Moyen";     creditEmoji = "🟡"; }
  else if (empire.creditScore >= 500) { creditRating = "Faible";    creditEmoji = "🟠"; }

  return [
    `💀 EMPIRE CRIMINEL — ${wealthTier}${empire.premium ? " • 💎 Premium" : ""}`,
    ``,
    `💰 FINANCES`,
    `💵 Portefeuille   : ${FM(walletBalance)}`,
    `🧼 Argent propre  : ${FM(empire.argentPropre)}`,
    `💀 Argent sale    : ${FM(empire.argentSale)} ⚠️`,
    `🔐 Coffre sécurisé: ${FM(empire.vault)}`,
    `├─ Liquidités     : ${FM(totalLiquid)}`,
    ``,
    `📈 INVESTISSEMENTS`,
    `🗺️ Territoires : ${empire.territoires.length} zones`,
    `🏗️ Structures  : ${empire.structuresActives.length}`,
    `🤝 Alliés      : ${empire.allies.length}`,
    `📦 Inventaire  : ${invQte}/${capMax} unités`,
    `├─ Portfolio   : ${FM(portfolio)}`,
    ``,
    `🏆 RICHESSE TOTALE`,
    `💎 Patrimoine  : ${FM(totalWealth)}`,
    `${creditEmoji} Score crédit  : ${empire.creditScore}/850 (${creditRating})`,
    `🎯 Prêt max    : ${FM(empire.creditScore * 2000)}`,
    `⚡ Multiplicateur: ${empire.multiplier}x`,
    ``,
    `👤 PROGRESSION`,
    `${rang.emoji} Rang          : ${rang.nom}`,
    `⭐ XP           : ${empire.xp.toLocaleString("fr-FR")}`,
    `🎯 Réputation   : ${empire.reputation}/1000`,
    `🏆 Succès       : ${empire.achievements.length}/14`,
    `🔥 Série daily  : ${empire.streak} jours`,
    `💸 Prêt actif   : ${empire.loan > 0 ? FM(empire.loan) : "Aucun ✅"}`,
    ``,
    `⏳ COOLDOWNS`,
    `💰 Collecte    : ${timeLeft(empire.lastCollecte, COOLDOWNS.COLLECTE) || "✅ Prêt"}`,
    `🎯 Mission     : ${empire.missionEnCours ? "⏳ En cours" : timeLeft(empire.lastMission, COOLDOWNS.MISSION) || "✅ Prêt"}`,
    `🧼 Blanchiment : ${empire.blanchimentEnCours ? "⏳ En cours" : timeLeft(empire.lastBlanchiment, COOLDOWNS.BLANCHIMENT) || "✅ Prêt"}`,
    `⚔️ Guerre      : ${timeLeft(empire.lastGuerre, COOLDOWNS.GUERRE) || "✅ Prêt"}`,
    `🎁 Daily       : ${timeLeft(empire.lastDaily, COOLDOWNS.DAILY) || "✅ Prêt"}`,
    ``,
    empire.prisEnChasse ? "🚨 LA POLICE EST SUR VOTRE PISTE !" : "✅ Aucune surveillance",
  ].join("\n");
}

function renderHelp(): string {
  return [
    `💀 EMPIRE CRIMINEL — GUIDE COMPLET`,
    ``,
    `💰 BANQUE & FINANCES`,
    `• empire stat          — Tableau de bord`,
    `• empire deposit <$>   — Déposer argent propre`,
    `• empire withdraw <$>  — Retirer argent propre`,
    `• empire vault [deposit/withdraw] <$> — Coffre`,
    `• empire loan <$>      — Emprunter`,
    `• empire repay <$>     — Rembourser`,
    `• empire interest      — Calculer intérêts`,
    `• empire collect       — Percevoir revenus`,
    `• empire history       — Historique transactions`,
    `• empire daily         — Récompense quotidienne`,
    ``,
    `🗺️ TERRITOIRES & STRUCTURES`,
    `• empire territoire list         — Voir territoires`,
    `• empire territoire buy <ID>     — Conquérir`,
    `• empire territoire info <ID>    — Détails`,
    `• empire structure list          — Voir structures`,
    `• empire structure build <T> <Z> — Construire`,
    ``,
    `🛒 MARCHÉ NOIR`,
    `• empire market        — Prix du marché`,
    `• empire buy <ID> <n>  — Acheter`,
    `• empire sell <ID> <n> — Vendre`,
    `• empire inventory     — Inventaire`,
    ``,
    `🎯 MISSIONS`,
    `• empire mission list        — Voir missions`,
    `• empire mission start <N>   — Lancer`,
    `• empire mission check       — Vérifier avancement`,
    `• empire mission cancel      — Annuler (remb. 50%)`,
    ``,
    `🤝 ALLIÉS`,
    `• empire ally list     — Alliés disponibles`,
    `• empire ally buy <ID> — Recruter`,
    ``,
    `⚔️ GUERRE`,
    `• empire war stats          — Bilan`,
    `• empire war attack <ID>    — Attaquer territoire`,
    ``,
    `🧼 BLANCHIMENT`,
    `• empire launder list              — Méthodes`,
    `• empire launder <METHODE> <$>     — Blanchir`,
    `• empire launder check             — Récupérer`,
    ``,
    `🏆 PROGRESSION`,
    `• empire rank          — Rang et progression`,
    `• empire achievements  — Succès débloqués`,
    `• empire leaderboard   — Classement`,
    ``,
    `💎 PREMIUM`,
    `• empire premium       — Voir avantages`,
    `• empire premium buy   — Devenir premium`,
    ``,
    `⚠️ RÈGLES`,
    `• L'argent sale peut être SAISI lors de raids`,
    `• Sans blanchiment, impossible de dépenser l'argent criminel`,
    `• Le coffre protège du vol et génère 2%/mois d'intérêts`,
  ].join("\n");
}

/* ============================================================
   SOUS-COMMANDES
   ============================================================ */
async function cmdDeposit(output: CommandContext["output"], args: string[], empire: EmpireData, walletBalance: number, save: () => Promise<void>) {
  const amount = parseInt(args[1]);
  if (!amount || amount <= 0) {
    return output.reply(
      `💰 DÉPÔT D'ARGENT PROPRE\n\nUsage: empire deposit <montant>\n\nPortefeuille : ${FM(walletBalance)}\nArgent propre : ${FM(empire.argentPropre)}`
    );
  }
  if (walletBalance < amount)
    return output.reply(`❌ FONDS INSUFFISANTS\n\nPortefeuille : ${FM(walletBalance)}\nRequis : ${FM(amount)}\nManque : ${FM(amount - walletBalance)}`);

  // débit portefeuille → argent propre empire
  empire.argentPropre += amount;
  if (!empire.achievements.includes("PREMIER_DEPOT")) empire.achievements.push("PREMIER_DEPOT");
  pushTx(empire, "deposit", amount, "Dépôt argent propre");
  await save();
  return output.reply(`💰 DÉPÔT RÉUSSI !\n\nMontant déposé : ${FM(amount)}\nArgent propre : ${FM(empire.argentPropre)}\nPortefeuille restant : ${FM(walletBalance - amount)}`);
}

async function cmdWithdraw(output: CommandContext["output"], args: string[], empire: EmpireData, save: () => Promise<void>) {
  const amount = parseInt(args[1]);
  if (!amount || amount <= 0)
    return output.reply(`💸 RETRAIT D'ARGENT PROPRE\n\nUsage: empire withdraw <montant>\n\nArgent propre : ${FM(empire.argentPropre)}`);
  if (empire.argentPropre < amount)
    return output.reply(`❌ Fonds insuffisants.\nArgent propre : ${FM(empire.argentPropre)}\nRequis : ${FM(amount)}`);
  empire.argentPropre -= amount;
  pushTx(empire, "withdrawal", amount, "Retrait argent propre");
  await save();
  return output.reply(`💸 RETRAIT RÉUSSI !\n\nMontant retiré : ${FM(amount)}\nArgent propre restant : ${FM(empire.argentPropre)}\n\n💡 Utilisez 'empire vault' pour une sécurité maximale.`);
}

async function cmdVault(output: CommandContext["output"], args: string[], empire: EmpireData, save: () => Promise<void>) {
  const action = (args[1] || "").toLowerCase();
  const amount = parseInt(args[2]);
  if (!action || !["deposit", "withdraw"].includes(action)) {
    return output.reply(
      `🔐 COFFRE FORT\n\nSolde coffre : ${FM(empire.vault)}\nArgent propre : ${FM(empire.argentPropre)}\n\n• empire vault deposit <montant>\n• empire vault withdraw <montant>\n\n💡 2% d'intérêts mensuels, protection totale contre les raids.`
    );
  }
  if (!amount || amount <= 0) return output.reply("❌ Montant invalide.");
  if (action === "deposit") {
    if (empire.argentPropre < amount)
      return output.reply(`❌ Fonds insuffisants. Argent propre : ${FM(empire.argentPropre)}`);
    empire.argentPropre -= amount;
    empire.vault += amount;
    pushTx(empire, "vault_deposit", amount, "Dépôt coffre");
    await save();
    return output.reply(`🔐 DÉPÔT COFFRE RÉUSSI !\n\nMontant : ${FM(amount)}\nCoffre : ${FM(empire.vault)}\nArgent propre : ${FM(empire.argentPropre)}`);
  }
  if (empire.vault < amount)
    return output.reply(`❌ Fonds insuffisants dans le coffre. Solde : ${FM(empire.vault)}`);
  empire.vault -= amount;
  empire.argentPropre += amount;
  pushTx(empire, "vault_withdrawal", amount, "Retrait coffre");
  await save();
  return output.reply(`🔓 RETRAIT COFFRE RÉUSSI !\n\nMontant : ${FM(amount)}\nCoffre : ${FM(empire.vault)}\nArgent propre : ${FM(empire.argentPropre)}`);
}

async function cmdLoan(output: CommandContext["output"], args: string[], empire: EmpireData, save: () => Promise<void>) {
  const amount = parseInt(args[1]);
  const maxLoan = Math.floor(empire.creditScore * 2000);
  if (!amount || amount <= 0)
    return output.reply(`🏦 PRÊT CRIMINEL\n\nScore crédit : ${empire.creditScore}\nMax : ${FM(maxLoan)}\nTaux : 8%/semaine\nPrêt actuel : ${empire.loan > 0 ? FM(empire.loan) : "Aucun"}\n\nUsage: empire loan <montant>`);
  if (empire.loan > 0) return output.reply(`❌ Prêt actif de ${FM(empire.loan)}. Remboursez d'abord avec 'empire repay'.`);
  if (amount > maxLoan) return output.reply(`❌ Max basé sur votre crédit : ${FM(maxLoan)}`);
  if (amount < 10_000)  return output.reply("❌ Minimum du prêt : $10 000.");
  empire.argentPropre += amount;
  empire.loan = amount;
  empire.loanDate = Date.now();
  pushTx(empire, "loan", amount, "Prêt approuvé");
  await save();
  return output.reply(`✅ PRÊT APPROUVÉ !\n\nMontant : ${FM(amount)}\nTaux : 8%/semaine\nArgent propre : ${FM(empire.argentPropre)}\n\n💡 Remboursez vite pour améliorer votre crédit !`);
}

async function cmdRepay(output: CommandContext["output"], args: string[], empire: EmpireData, save: () => Promise<void>) {
  if (empire.loan <= 0) return output.reply("❌ Aucun prêt actif.");
  const amount = parseInt(args[1]);
  if (!amount || amount <= 0)
    return output.reply(`💳 REMBOURSEMENT\n\nPrêt restant : ${FM(empire.loan)}\nArgent propre : ${FM(empire.argentPropre)}\n\nUsage: empire repay <montant>`);
  if (empire.argentPropre < amount) return output.reply(`❌ Fonds insuffisants. Disponible : ${FM(empire.argentPropre)}`);
  const repay = Math.min(amount, empire.loan);
  empire.argentPropre -= repay;
  empire.loan -= repay;
  if (empire.loan <= 0) { empire.loanDate = null; empire.creditScore = Math.min(850, empire.creditScore + 15); }
  pushTx(empire, "loan_repayment", repay, "Remboursement prêt");
  await save();
  return empire.loan <= 0
    ? output.reply(`✅ Prêt entièrement remboursé ! Crédit +15 points.`)
    : output.reply(`✅ Remboursement de ${FM(repay)}. Prêt restant : ${FM(empire.loan)}`);
}

async function cmdInterest(output: CommandContext["output"], empire: EmpireData, save: () => Promise<void>) {
  const now = Date.now();
  const hoursPassed = (now - (empire.lastInterest || now)) / 3_600_000;
  const vaultInterest = Math.floor(empire.vault * (0.02 / (30 * 24)) * hoursPassed);
  const loanInterest  = Math.floor(empire.loan  * (0.08 / ( 7 * 24)) * hoursPassed);
  if (hoursPassed < 1)
    return output.reply(`📊 APERÇU INTÉRÊTS\n\nTemps écoulé : ${Math.floor(hoursPassed * 60)} min\n\n💰 Intérêts coffre potentiels : +${FM(vaultInterest)}\n💸 Intérêts prêt potentiels : +${FM(loanInterest)}\n\nAttendez ${60 - Math.floor(hoursPassed * 60)} minutes.`);
  empire.vault += vaultInterest;
  empire.loan  += loanInterest;
  empire.lastInterest = now;
  if (vaultInterest > 0) pushTx(empire, "interest_earned",  vaultInterest, `Intérêts coffre (${Math.floor(hoursPassed)}h)`);
  if (loanInterest  > 0) pushTx(empire, "interest_charged", loanInterest,  `Intérêts prêt (${Math.floor(hoursPassed)}h)`);
  await save();
  return output.reply(`📊 INTÉRÊTS CALCULÉS\n\nPériode : ${Math.floor(hoursPassed)}h\n💰 Coffre : +${FM(vaultInterest)}\n💸 Prêt : +${FM(loanInterest)}\n\nSolde coffre : ${FM(empire.vault)}\nPrêt : ${FM(empire.loan)}`);
}

async function cmdCollect(output: CommandContext["output"], empire: EmpireData, save: () => Promise<void>) {
  const now = Date.now();
  const hoursPassed = (now - (empire.lastInterest || now)) / 3_600_000;
  if (empire.lastInterest && hoursPassed < 1)
    return output.reply(`⏰ Intérêts collectables 1x/heure. Attendez ${60 - Math.floor(hoursPassed * 60)} min.`);
  const vaultInterest = Math.floor(empire.vault * (0.02 / (30 * 24)) * hoursPassed);
  const loanInterest  = Math.floor(empire.loan  * (0.08 / ( 7 * 24)) * hoursPassed);
  const net = vaultInterest - loanInterest;
  empire.vault += vaultInterest;
  empire.loan  += loanInterest;
  empire.lastInterest = now;
  if (vaultInterest > 0) pushTx(empire, "interest_earned",  vaultInterest, `Intérêts coffre`);
  if (loanInterest  > 0) pushTx(empire, "interest_charged", loanInterest,  `Intérêts prêt`);
  await save();
  return output.reply(`💰 INTÉRÊTS COLLECTÉS !\n\nPériode : ${Math.floor(hoursPassed)}h\n💰 Coffre : +${FM(vaultInterest)}\n💸 Prêt : -${FM(loanInterest)}\n\nRésultat net : ${net >= 0 ? "+" : ""}${FM(net)}\nCoffre : ${FM(empire.vault)}`);
}

async function cmdHistory(output: CommandContext["output"], empire: EmpireData) {
  const txs = empire.transactions.slice(-15).reverse();
  if (!txs.length) return output.reply("📋 Aucune transaction enregistrée.");
  let txt = `📋 HISTORIQUE (15 dernières)\n\n`;
  for (const tx of txs) {
    const emoji = getTransactionEmoji(tx.type);
    const sign  = tx.montant >= 0 ? "+" : "";
    const date  = new Date(tx.date).toLocaleDateString("fr-FR");
    txt += `${emoji} ${tx.description}\n   ${sign}${FM(tx.montant)} (${date})\n\n`;
  }
  return output.reply(txt.trim());
}

async function cmdDaily(output: CommandContext["output"], empire: EmpireData, save: () => Promise<void>) {
  const cd = timeLeft(empire.lastDaily, COOLDOWNS.DAILY);
  if (cd) return output.reply(`⏰ Récompense quotidienne déjà réclamée ! Prochaine dans : ${cd}.`);
  if (Date.now() - (empire.lastDaily || 0) < COOLDOWNS.DAILY * 2) empire.streak++;
  else empire.streak = 1;
  const totalReward = Math.floor(
    (10_000 + Math.min(empire.streak * 500, 5_000) + empire.bankLevel * 1_000 + empire.reputation * 20)
    * (empire.premium ? 2 : 1)
  );
  empire.argentSale += totalReward;
  empire.totalGagne += totalReward;
  empire.lastDaily   = Date.now();
  empire.reputation  = Math.min(1000, empire.reputation + 3);
  pushTx(empire, "daily", totalReward, `Daily (série ${empire.streak} j)`);
  const newAch = checkAchievements(empire);
  await save();
  let msg = `🎁 RÉCOMPENSE QUOTIDIENNE !\n\n💰 Récompense : ${FM(totalReward)}\n🔥 Série : ${empire.streak} jours\n⭐ Premium : ${empire.premium ? "2x Bonus !" : "Non"}\n🎯 Réputation : +3`;
  if (newAch.length) msg += `\n🏆 Succès : ${newAch.join(", ")}`;
  return output.reply(msg);
}

async function cmdCollecte(output: CommandContext["output"], empire: EmpireData, save: () => Promise<void>) {
  const cd = timeLeft(empire.lastCollecte, COOLDOWNS.COLLECTE);
  if (cd) return output.reply(`⏰ Collecte disponible dans ${cd}.`);
  if (!empire.territoires.length) return output.reply("❌ Vous n'avez aucun territoire.");
  const revenu = getRevenuTotal(empire);
  if (revenu <= 0) return output.reply("❌ Vos territoires ne génèrent aucun revenu.");
  const risqueTotal = empire.territoires.reduce((s, tId) => s + (TERRITOIRES[tId]?.risque || 0), 0);
  const raid = Math.random() * 100 < Math.max(0, risqueTotal * 3 - empire.tauxCorruption);
  if (raid && !empire.allies.includes("POLICIER")) {
    const saisie = Math.floor(empire.argentSale * 0.15);
    empire.argentSale = Math.max(0, empire.argentSale - saisie);
    empire.prisEnChasse = true;
    empire.nbArrestes++;
    pushTx(empire, "raid", -saisie, "Saisie lors d'un raid");
    await save();
    return output.reply(`🚔 RAID DE POLICE !\n\nSaisie : ${FM(saisie)} d'argent sale.\n⚠️ Vous êtes en fuite !\n\n💡 Recrutez un Inspecteur Corrompu.`);
  }
  empire.argentSale += revenu;
  empire.totalGagne += revenu;
  empire.xp         += Math.floor(revenu / 10_000);
  empire.lastCollecte = Date.now();
  empire.prisEnChasse = false;
  const oldRang = empire.rang;
  empire.rang = getRang(empire).id;
  pushTx(empire, "collecte", revenu, `Collecte ${empire.territoires.length} territoire(s)`);
  const newAch = checkAchievements(empire);
  await save();
  let txt = `💰 COLLECTE EFFECTUÉE !\n\n`;
  for (const tId of empire.territoires) { const t = TERRITOIRES[tId]; if (t) txt += `${t.emoji} ${t.nom} : +${FM(t.revenu)}\n`; }
  txt += `\nTotal perçu : ${FM(revenu)}\n💀 Argent sale : ${FM(empire.argentSale)}\n⭐ XP : +${Math.floor(revenu / 10_000)}`;
  if (oldRang !== empire.rang) txt += `\n\n🎉 NOUVEAU RANG : ${getRang(empire).emoji} ${getRang(empire).nom} !`;
  if (newAch.length) txt += `\n🏆 Succès : ${newAch.join(", ")}`;
  return output.reply(txt);
}

async function cmdPremium(output: CommandContext["output"], args: string[], empire: EmpireData, save: () => Promise<void>) {
  if ((args[1] || "").toLowerCase() === "buy") {
    const cost = 1_000_000;
    if (empire.argentPropre < cost)
      return output.reply(`❌ Premium coûte ${FM(cost)}. Vous avez ${FM(empire.argentPropre)}.`);
    empire.argentPropre -= cost;
    empire.premium = true;
    empire.multiplier = 2.0;
    pushTx(empire, "premium_purchase", -cost, "Achat premium");
    await save();
    return output.reply(`💎 BIENVENUE AU CLUB PREMIUM !\n\n✅ 2x les gains\n✅ Daily doublé\n✅ Missions exclusives\n✅ Statistiques avancées`);
  }
  return output.reply(`💎 ABONNEMENT PREMIUM\n\nStatut : ${empire.premium ? "✅ Actif" : "❌ Inactif"}\nMultiplicateur : ${empire.multiplier}x\nCoût : ${FM(1_000_000)}\n\n${!empire.premium ? "Utilisez 'empire premium buy' pour devenir premium !" : ""}`);
}

async function cmdAchievements(output: CommandContext["output"], empire: EmpireData) {
  const def: Record<string, { emoji: string; nom: string; desc: string }> = {
    PREMIER_SANG:   { emoji: "🩸", nom: "Premier Sang",    desc: "1ère mission complétée" },
    PREMIER_CRIME:  { emoji: "💀", nom: "Premier Crime",   desc: "Gagner 10 000$" },
    PREMIER_DEPOT:  { emoji: "💰", nom: "Premier Dépôt",   desc: "Premier dépôt" },
    PETIT_BOSS:     { emoji: "🏙️", nom: "Petit Boss",      desc: "3 territoires" },
    MILLION:        { emoji: "💵", nom: "Premier Million",  desc: "1 000 000$ total" },
    RICHISSE:       { emoji: "💎", nom: "Richesses",        desc: "1M$ d'argent propre" },
    MILLIARD:       { emoji: "🤑", nom: "Milliardaire",    desc: "1 000 000 000$ total" },
    CAPO:           { emoji: "🎖️", nom: "Capo",            desc: "Rang Capitaine" },
    PARRAIN_TITLE:  { emoji: "👑", nom: "Le Parrain",      desc: "Rang Parrain" },
    BLANCHISSEUR:   { emoji: "🧼", nom: "Grand Blanchisseur", desc: "Blanchir 10M$" },
    CHEF_DE_GUERRE: { emoji: "⚔️", nom: "Chef de Guerre",  desc: "5 guerres gagnées" },
    SEIGNEUR_GUERRE:{ emoji: "🛡️", nom: "Seigneur de Guerre", desc: "10 guerres gagnées" },
    INVINCIBLE:     { emoji: "🏆", nom: "Invincible",      desc: "20 guerres gagnées" },
    ALLIANCE:       { emoji: "🤝", nom: "Alliance Solide", desc: "4 alliés recrutés" },
    LEGENDE:        { emoji: "⭐", nom: "Légende Vivante", desc: "1 milliard de gains" },
  };
  let txt = `🏆 SUCCÈS\n\nProgression : ${empire.achievements.length}/${Object.keys(def).length}\n\n`;
  if (!empire.achievements.length) {
    txt += "Aucun succès pour l'instant. Commencez à construire votre empire !\n\n";
  } else {
    txt += "🎖️ DÉBLOQUÉS :\n";
    empire.achievements.slice(0, 10).forEach((a, i) => {
      const info = def[a] || { emoji: "🏆", nom: a };
      txt += `${i + 1}. ${info.emoji} ${info.nom}\n`;
    });
    if (empire.achievements.length > 10) txt += `... et ${empire.achievements.length - 10} de plus !\n`;
    txt += "\n";
  }
  txt += "🎯 PROCHAINS OBJECTIFS :\n";
  Object.keys(def).filter(a => !empire.achievements.includes(a)).slice(0, 5).forEach(a => {
    txt += `• ${def[a].emoji} ${def[a].nom} : ${def[a].desc}\n`;
  });
  return output.reply(txt.trim());
}

async function cmdLeaderboard(output: CommandContext["output"], money: CommandContext["money"]) {
  try {
    const allUsers = await money.queryItemAll({}, "empire", "name", "userID");
    const joueurs: { nom: string; totalGagne: number; totalWealth: number; rang: string; rangEmoji: string; premium: boolean; achievements: number }[] = [];
    for (const u of Object.values(allUsers) as any[]) {
      const e: EmpireData = u.empire;
      if (!e || !e.totalGagne) continue;
      const totalWealth = (e.argentPropre || 0) + (e.argentSale || 0) + (e.vault || 0);
      joueurs.push({ nom: u.name || "Inconnu", totalGagne: e.totalGagne, totalWealth, rang: getRang(e).nom, rangEmoji: getRang(e).emoji, premium: e.premium || false, achievements: e.achievements?.length || 0 });
    }
    joueurs.sort((a, b) => b.totalWealth - a.totalWealth);
    const top10 = joueurs.slice(0, 10);
    let txt = `👑 CLASSEMENT EMPIRE\nTOP 10 DES PARRAINS\n\n`;
    if (!top10.length) {
      txt += "Aucun joueur classé. Commencez à construire votre empire !";
    } else {
      top10.forEach((j, i) => {
        const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`;
        txt += `${medal} ${j.nom}${j.premium ? " 💎" : ""}\n   ${j.rangEmoji} ${j.rang}\n   💰 ${FM(j.totalWealth)}\n   📈 ${FM(j.totalGagne)} | 🏆 ${j.achievements} succès\n\n`;
      });
    }
    return output.reply(txt.trim());
  } catch (e) {
    return output.reply("❌ Erreur lors du chargement du classement.");
  }
}

async function cmdRank(output: CommandContext["output"], empire: EmpireData) {
  const rang = getRang(empire);
  const nextIndex = RANGS.findIndex(r => r.id === rang.id) + 1;
  const next = nextIndex < RANGS.length ? RANGS[nextIndex] : null;
  let txt = `${rang.emoji} RANG : ${rang.nom}\n\nGains totaux : ${FM(empire.totalGagne)}\n⭐ XP : ${empire.xp.toLocaleString("fr-FR")}\n🎯 Réputation : ${empire.reputation}/1000\n💰 Bonus revenus : +${pct(rang.bonus)}\n\n`;
  if (next) {
    txt += `⬆️ Prochain rang : ${next.emoji} ${next.nom}\n   Requis : ${FM(next.min)}\n   Manque : ${FM(Math.max(0, next.min - empire.totalGagne))}\n\n`;
  } else {
    txt += "👑 Rang MAXIMUM atteint !\n\n";
  }
  txt += "📜 TOUS LES RANGS :\n";
  RANGS.forEach(r => { txt += `${r.id === rang.id ? "▶️ " : "   "}${r.emoji} ${r.nom} — dès ${FM(r.min)}\n`; });
  return output.reply(txt.trim());
}

async function cmdTerritoire(output: CommandContext["output"], args: string[], empire: EmpireData, walletBalance: number, save: () => Promise<void>) {
  const sub = (args[1] || "list").toLowerCase();

  if (sub === "list") {
    let txt = `🗺️ TERRITOIRES DISPONIBLES\n\n`;
    for (const [id, t] of Object.entries(TERRITOIRES)) {
      const owned = empire.territoires.includes(id);
      txt += `${t.emoji} ${t.nom} [${id}]\n   💰 Revenu : ${FM(t.revenu)}/h\n   ⚠️ Risque : ${"🔴".repeat(t.risque)}\n   💵 Coût : ${t.cout === 0 ? "Gratuit" : FM(t.cout)}\n   ${owned ? "✅ POSSÉDÉ" : "🔒 Non acquis"}\n\n`;
    }
    txt += "Commande : empire territoire buy <ID>";
    return output.reply(txt.trim());
  }

  if (sub === "buy" || sub === "acheter") {
    const tId = (args[2] || "").toUpperCase();
    const t = TERRITOIRES[tId];
    if (!t) return output.reply("❌ Territoire inconnu. Voir 'empire territoire list'.");
    if (empire.territoires.includes(tId)) return output.reply("❌ Vous possédez déjà ce territoire.");
    const available = walletBalance + empire.argentPropre;
    if (available < t.cout) return output.reply(`❌ Fonds insuffisants.\nCoût : ${FM(t.cout)}\nDisponible : ${FM(available)}`);
    let reste = t.cout;
    if (empire.argentPropre >= reste) { empire.argentPropre -= reste; }
    else { reste -= empire.argentPropre; empire.argentPropre = 0; /* wallet déduit via save */ }
    empire.territoires.push(tId);
    empire.reputation = Math.min(1000, empire.reputation + t.risque * 20);
    pushTx(empire, "achat_territoire", -t.cout, `Acquisition : ${t.nom}`);
    const newAch = checkAchievements(empire);
    await save();
    let msg = `${t.emoji} TERRITOIRE ACQUIS : ${t.nom}\n\nCoût payé : ${FM(t.cout)}\nRevenu : +${FM(t.revenu)}/h\nRéputation : +${t.risque * 20}\nTerritoires total : ${empire.territoires.length}`;
    if (newAch.length) msg += `\n🏆 Succès : ${newAch.join(", ")}`;
    return output.reply(msg);
  }

  if (sub === "info") {
    const tId = (args[2] || "").toUpperCase();
    const t = TERRITOIRES[tId];
    if (!t) return output.reply("❌ Territoire inconnu.");
    const owned = empire.territoires.includes(tId);
    const structs = empire.structuresActives.filter(s => s.territoire === tId);
    return output.reply(`${t.emoji} TERRITOIRE : ${t.nom}\n\nRevenu : ${FM(t.revenu)}/h\nRisque : ${"🔴".repeat(t.risque)} (${t.risque}/5)\nProtection : ${t.protection}/5\nStatut : ${owned ? "✅ Possédé" : "🔒 Non acquis"}\nStructures : ${structs.length > 0 ? structs.map(s => STRUCTURES[s.type]?.nom).join(", ") : "Aucune"}`);
  }

  return output.reply("❓ Usage : empire territoire [list|buy|info] <ID>");
}

async function cmdStructure(output: CommandContext["output"], args: string[], empire: EmpireData, walletBalance: number, save: () => Promise<void>) {
  const sub = (args[1] || "list").toLowerCase();

  if (sub === "list") {
    let txt = `🏗️ STRUCTURES DISPONIBLES\n\n`;
    for (const [id, s] of Object.entries(STRUCTURES)) {
      txt += `${s.emoji} ${s.nom} [${id}]\n   💵 Coût : ${FM(s.cout)}\n`;
      if (s.capacite > 0)    txt += `   📦 Capacité : +${s.capacite}\n`;
      if (s.revenuBonus > 0) txt += `   📈 Bonus revenu : +${pct(s.revenuBonus)}\n`;
      txt += "\n";
    }
    txt += "Commande : empire structure build <TYPE> <TERRITOIRE_ID>";
    return output.reply(txt.trim());
  }

  if (sub === "build") {
    const type = (args[2] || "").toUpperCase();
    const tId  = (args[3] || "").toUpperCase();
    const struct = STRUCTURES[type];
    if (!struct) return output.reply("❌ Structure inconnue.");
    if (!empire.territoires.includes(tId)) return output.reply(`❌ Vous ne possédez pas ce territoire (${tId}).`);
    const available = walletBalance + empire.argentPropre;
    if (available < struct.cout) return output.reply(`❌ Fonds insuffisants. Coût : ${FM(struct.cout)}`);
    let reste = struct.cout;
    if (empire.argentPropre >= reste) { empire.argentPropre -= reste; }
    else { reste -= empire.argentPropre; empire.argentPropre = 0; }
    empire.structuresActives.push({ type, territoire: tId, id: `${type}_${tId}_${Date.now()}` });
    pushTx(empire, "construction", -struct.cout, `Construction : ${struct.nom}`);
    await save();
    return output.reply(`${struct.emoji} STRUCTURE CONSTRUITE !\n\nNom : ${struct.nom}\nTerritoire : ${TERRITOIRES[tId]?.nom || tId}\nCoût payé : ${FM(struct.cout)}${struct.capacite > 0 ? `\n📦 Capacité : +${struct.capacite}` : ""}${struct.revenuBonus > 0 ? `\n📈 Bonus : +${pct(struct.revenuBonus)}` : ""}`);
  }

  return output.reply("❓ Usage : empire structure [list|build] <TYPE> <TERRITOIRE_ID>");
}

async function cmdMarket(output: CommandContext["output"], empire: EmpireData) {
  const capMax = getCapaciteMax(empire);
  const invQte = getQuantiteInventaire(empire);
  let txt = `🕶️ MARCHÉ NOIR\n\n`;
  for (const [id, p] of Object.entries(PRODUITS)) {
    const fluctu = 0.85 + Math.random() * 0.30;
    const achat  = Math.floor(p.prixAchat * fluctu);
    const vente  = Math.floor(p.prixVente * fluctu);
    txt += `${p.emoji} ${p.nom} [${id}]\n   🛒 Achat : ${FM(achat)}/u\n   💸 Vente : ${FM(vente)}/u\n   ⚠️ Risque : ${"🔴".repeat(p.risque)}\n   📦 Stock : ${empire.inventaire[id] || 0} u\n\n`;
  }
  txt += `📦 Inventaire : ${invQte}/${capMax}\n\n• empire buy <ID> <n>\n• empire sell <ID> <n>`;
  return output.reply(txt.trim());
}

async function cmdBuy(output: CommandContext["output"], args: string[], empire: EmpireData, walletBalance: number, save: () => Promise<void>) {
  const pId  = (args[1] || "").toUpperCase();
  const qte  = parseInt(args[2]) || 1;
  const p    = PRODUITS[pId];
  if (!p) return output.reply("❌ Produit inconnu. Voir 'empire market'.");
  const fluctu    = 0.85 + Math.random() * 0.30;
  const prixUnit  = Math.floor(p.prixAchat * fluctu);
  const totalCout = prixUnit * qte;
  const capMax    = getCapaciteMax(empire);
  const invActuel = getQuantiteInventaire(empire);
  if (invActuel + qte > capMax)
    return output.reply(`❌ Capacité insuffisante. Place restante : ${capMax - invActuel} u.`);
  const available = walletBalance + empire.argentPropre;
  if (available < totalCout)
    return output.reply(`❌ Fonds insuffisants. Coût : ${FM(totalCout)}`);
  let reste = totalCout;
  if (empire.argentPropre >= reste) { empire.argentPropre -= reste; }
  else { reste -= empire.argentPropre; empire.argentPropre = 0; }
  empire.inventaire[pId] = (empire.inventaire[pId] || 0) + qte;
  empire.lastMarche = Date.now();
  pushTx(empire, "achat_marche", -totalCout, `Achat ${qte}x ${p.nom}`);
  await save();
  return output.reply(`${p.emoji} ACHAT EFFECTUÉ !\n\nProduit : ${p.nom}\nQuantité : ${qte} u\nPrix/u : ${FM(prixUnit)}\nTotal : ${FM(totalCout)}\nStock : ${empire.inventaire[pId]} u`);
}

async function cmdSell(output: CommandContext["output"], args: string[], empire: EmpireData, save: () => Promise<void>) {
  const pId = (args[1] || "").toUpperCase();
  const qte = parseInt(args[2]) || 1;
  const p   = PRODUITS[pId];
  if (!p) return output.reply("❌ Produit inconnu. Voir 'empire market'.");
  if (!empire.inventaire[pId] || empire.inventaire[pId] < qte)
    return output.reply(`❌ Stock insuffisant. Vous avez ${empire.inventaire[pId] || 0} u de ${p.nom}.`);
  const fluctu     = 0.85 + Math.random() * 0.30;
  const hackerBonus = empire.allies.includes("HACKER") ? 1.30 : 1;
  const prixUnit   = Math.floor(p.prixVente * fluctu * hackerBonus);
  const totalGain  = prixUnit * qte;
  const chanceRaid = p.risque * 5 - empire.tauxCorruption / 2;
  if (Math.random() * 100 < chanceRaid) {
    empire.inventaire[pId] -= qte;
    if (empire.inventaire[pId] <= 0) delete empire.inventaire[pId];
    empire.prisEnChasse = true;
    await save();
    return output.reply(`🚔 INTERCEPTION !\n\nLa police a saisi votre livraison de ${p.nom}.\n📦 ${qte} u saisies. Aucun revenu.\n⚠️ Vous êtes en fuite !`);
  }
  empire.inventaire[pId] -= qte;
  if (empire.inventaire[pId] <= 0) delete empire.inventaire[pId];
  empire.argentSale += totalGain;
  empire.totalGagne += totalGain;
  empire.xp += Math.floor(totalGain / 5_000);
  pushTx(empire, "vente_marche", totalGain, `Vente ${qte}x ${p.nom}`);
  const newAch = checkAchievements(empire);
  await save();
  let msg = `${p.emoji} VENTE EFFECTUÉE !\n\nProduit : ${p.nom}\nQuantité : ${qte} u\nPrix/u : ${FM(prixUnit)}${empire.allies.includes("HACKER") ? " (+30% Zero-X)" : ""}\nTotal : ${FM(totalGain)}\n💀 Argent sale : ${FM(empire.argentSale)}`;
  if (newAch.length) msg += `\n🏆 Succès : ${newAch.join(", ")}`;
  return output.reply(msg);
}

async function cmdInventory(output: CommandContext["output"], empire: EmpireData) {
  const capMax = getCapaciteMax(empire);
  const invQte = getQuantiteInventaire(empire);
  let txt = `📦 INVENTAIRE\n\n`;
  if (!invQte) {
    txt += "Inventaire vide.\n";
  } else {
    for (const [pId, qte] of Object.entries(empire.inventaire)) {
      if (qte <= 0) continue;
      const p = PRODUITS[pId];
      if (p) txt += `${p.emoji} ${p.nom} : ${qte} u\n`;
    }
  }
  txt += `\nCapacité : ${invQte}/${capMax}\nVendre : empire sell <ID> <n>`;
  return output.reply(txt.trim());
}

async function cmdMission(output: CommandContext["output"], args: string[], empire: EmpireData, save: () => Promise<void>) {
  const sub = (args[1] || "list").toLowerCase();
  const rang = getRang(empire);

  if (sub === "list") {
    let txt = `🎯 MISSIONS DISPONIBLES\n\n`;
    MISSIONS.forEach((m, i) => {
      const accessible = m.difficulte <= rang.bonus * 20 + 1 || empire.reputation >= m.difficulte * 150;
      txt += `[${i + 1}] ${m.nom}\n   🎖️ Difficulté : ${"⭐".repeat(m.difficulte)}\n   💵 Gain : ${FM(m.gain[0])} — ${FM(m.gain[1])}\n   💰 Coût : ${FM(m.cout)}\n   ⏱️ Durée : ${m.duree} min\n   ⚠️ Risque : ${m.risque}%\n   ${accessible ? "✅ Accessible" : `🔒 Réputation requise : ${m.difficulte * 150}`}\n\n`;
    });
    txt += "Lancer : empire mission start <N°>";
    return output.reply(txt.trim());
  }

  if (sub === "check") {
    if (!empire.missionEnCours) return output.reply("❌ Aucune mission en cours.");
    const m = MISSIONS.find(x => x.id === empire.missionEnCours!.missionId);
    const restant = empire.missionEnCours.finAt - Date.now();
    if (restant > 0) return output.reply(`⏳ Mission : "${m?.nom}"\nTemps restant : ${Math.ceil(restant / 60000)} min.`);
    const success = Math.random() * 100 > (m?.risque || 50);
    let msg = "";
    if (success) {
      const gain = rand(m!.gain[0], m!.gain[1]) * (empire.allies.includes("MERCENAIRE") ? 1.2 : 1);
      empire.argentSale      += gain;
      empire.totalGagne      += gain;
      empire.xp              += m!.xp;
      empire.reputation       = Math.min(1000, empire.reputation + m!.difficulte * 5);
      empire.missionsCompletes++;
      pushTx(empire, "mission_succes", gain, `Mission réussie : ${m!.nom}`);
      msg = `✅ MISSION RÉUSSIE : ${m!.nom}\n\nGain : ${FM(gain)}\nXP : +${m!.xp}\nRéputation : +${m!.difficulte * 5}`;
    } else {
      const amende = Math.floor(empire.argentSale * 0.10);
      empire.argentSale = Math.max(0, empire.argentSale - amende);
      empire.prisEnChasse = true;
      empire.nbArrestes++;
      pushTx(empire, "mission_echec", -amende, `Mission échouée : ${m!.nom}`);
      msg = `❌ MISSION ÉCHOUÉE : ${m!.nom}\n\nAmende : ${FM(amende)}\n⚠️ Vous êtes en fuite.`;
    }
    empire.missionEnCours = null;
    empire.lastMission    = Date.now();
    const newAch = checkAchievements(empire);
    await save();
    if (newAch.length) msg += `\n🏆 Succès : ${newAch.join(", ")}`;
    return output.reply(msg);
  }

  if (sub === "cancel" || sub === "annuler") {
    if (!empire.missionEnCours) return output.reply("❌ Aucune mission en cours.");
    const m = MISSIONS.find(x => x.id === empire.missionEnCours!.missionId);
    const remb = Math.floor(empire.missionEnCours.cout * 0.5);
    empire.argentPropre    += remb;
    empire.missionEnCours   = null;
    empire.lastMission      = Date.now();
    await save();
    return output.reply(`🔄 Mission "${m?.nom}" annulée.\nRemboursement (50%) : ${FM(remb)}`);
  }

  if (sub === "start") {
    if (empire.missionEnCours) {
      const restant = Math.ceil((empire.missionEnCours.finAt - Date.now()) / 60000);
      return output.reply(`⚠️ Mission déjà en cours. Fin dans ${restant} min.\nTapez 'empire mission check'.`);
    }
    const cd = timeLeft(empire.lastMission, COOLDOWNS.MISSION);
    if (cd) return output.reply(`⏰ Cooldown mission : ${cd}.`);
    const num = parseInt(args[2]) - 1;
    if (isNaN(num) || num < 0 || num >= MISSIONS.length)
      return output.reply(`❌ Numéro invalide (1-${MISSIONS.length}).`);
    const m = MISSIONS[num];
    const accessible = m.difficulte <= Math.ceil(rang.bonus * 20 + 1) || empire.reputation >= m.difficulte * 150;
    if (!accessible) return output.reply(`🔒 Mission inaccessible. Réputation requise : ${m.difficulte * 150}`);
    if (m.cout > 0 && empire.argentPropre < m.cout)
      return output.reply(`❌ Fonds insuffisants pour financer la mission. Coût : ${FM(m.cout)}.`);
    if (m.cout > 0) empire.argentPropre -= m.cout;
    empire.missionEnCours = { missionId: m.id, finAt: Date.now() + m.duree * 60_000, cout: m.cout };
    await save();
    return output.reply(`🎯 MISSION LANCÉE : ${m.nom}\n\nDurée : ${m.duree} min\nCoût : ${FM(m.cout)}\nRisque : ${m.risque}%\n\nTapez 'empire mission check' dans ${m.duree} min.`);
  }

  return output.reply("❓ Usage : empire mission [list|start|check|cancel]");
}

async function cmdAlly(output: CommandContext["output"], args: string[], empire: EmpireData, walletBalance: number, save: () => Promise<void>) {
  const sub = (args[1] || "list").toLowerCase();

  if (sub === "list") {
    let txt = `🤝 ALLIÉS DISPONIBLES\n\n`;
    for (const [id, a] of Object.entries(ALLIES)) {
      txt += `${a.emoji} ${a.nom} [${id}]\n   💵 Coût : ${FM(a.cout)}\n   ✨ Effet : ${a.effet}\n   ${empire.allies.includes(id) ? "✅ RECRUTÉ" : "🔒 Non recruté"}\n\n`;
    }
    txt += "Recruter : empire ally buy <ID>";
    return output.reply(txt.trim());
  }

  if (sub === "buy" || sub === "acheter") {
    const aId = (args[2] || "").toUpperCase();
    const a   = ALLIES[aId];
    if (!a) return output.reply("❌ Allié inconnu. Voir 'empire ally list'.");
    if (empire.allies.includes(aId)) return output.reply("❌ Allié déjà recruté.");
    const available = walletBalance + empire.argentPropre;
    if (available < a.cout) return output.reply(`❌ Fonds insuffisants. Coût : ${FM(a.cout)}`);
    let reste = a.cout;
    if (empire.argentPropre >= reste) { empire.argentPropre -= reste; }
    else { reste -= empire.argentPropre; empire.argentPropre = 0; }
    empire.allies.push(aId);
    if (aId === "POLICIER")   empire.tauxCorruption = Math.min(100, empire.tauxCorruption + 30);
    if (aId === "POLITICIEN") empire.tauxCorruption = Math.min(100, empire.tauxCorruption + 20);
    if (aId === "JUGE")       empire.tauxCorruption = Math.min(100, empire.tauxCorruption + 15);
    empire.reputation = Math.min(1000, empire.reputation + 30);
    pushTx(empire, "recrutement", -a.cout, `Recrutement : ${a.nom}`);
    const newAch = checkAchievements(empire);
    await save();
    let msg = `${a.emoji} ALLIÉ RECRUTÉ : ${a.nom}\n\nCoût : ${FM(a.cout)}\nEffet actif : ${a.effet}\nRéputation : +30`;
    if (newAch.length) msg += `\n🏆 Succès : ${newAch.join(", ")}`;
    return output.reply(msg);
  }

  return output.reply("❓ Usage : empire ally [list|buy] <ID>");
}

async function cmdLaunder(output: CommandContext["output"], args: string[], empire: EmpireData, save: () => Promise<void>) {
  const sub = (args[1] || "list").toLowerCase();

  if (sub === "list") {
    let txt = `🧼 BLANCHIMENT D'ARGENT\n\nArgent sale disponible : ${FM(empire.argentSale)}\n\n`;
    for (const [id, m] of Object.entries(BLANCHIMENT_METHODES)) {
      txt += `${m.emoji} ${m.nom} [${id}]\n   💵 Ratio : ${pct(m.ratio)} (frais : ${pct(m.frais)})\n   ⏱️ Durée : ${m.delai}\n\n`;
    }
    txt += "Commande : empire launder <METHODE> <montant>";
    return output.reply(txt.trim());
  }

  // blanchiment en cours ?
  if (empire.blanchimentEnCours) {
    const restant = empire.blanchimentEnCours.finAt - Date.now();
    if (restant > 0 && sub !== "check") {
      const h = Math.floor(restant / 3_600_000);
      const min = Math.floor((restant % 3_600_000) / 60_000);
      return output.reply(`⏳ Blanchiment en cours. Fin dans ${h}h ${min}m.\nTapez 'empire launder check'.`);
    }
    if (sub === "check" || sub === "collect") {
      if (restant > 0) return output.reply(`⏳ Pas encore terminé. Fin dans ${Math.ceil(restant / 60_000)} min.`);
      const { methode, montant } = empire.blanchimentEnCours;
      const m = BLANCHIMENT_METHODES[methode];
      const obtenu = Math.floor(montant * m.ratio);
      empire.argentPropre += obtenu;
      empire.totalBlanchit += obtenu;
      empire.blanchimentEnCours = null;
      empire.lastBlanchiment = Date.now();
      pushTx(empire, "blanchiment", obtenu, `Blanchiment : ${m.nom}`);
      const newAch = checkAchievements(empire);
      await save();
      let msg = `${m.emoji} BLANCHIMENT TERMINÉ\n\nMéthode : ${m.nom}\nMontant : ${FM(montant)}\nFrais : ${FM(montant - obtenu)}\n💰 Argent propre récupéré : ${FM(obtenu)}\nTotal blanchi : ${FM(empire.totalBlanchit)}`;
      if (newAch.length) msg += `\n🏆 Succès : ${newAch.join(", ")}`;
      return output.reply(msg);
    }
  }

  if (sub === "check") return output.reply("❌ Aucun blanchiment en cours.");

  const cd = timeLeft(empire.lastBlanchiment, COOLDOWNS.BLANCHIMENT);
  if (cd) return output.reply(`⏰ Blanchiment disponible dans ${cd}.`);

  const methodeId = sub.toUpperCase();
  const m = BLANCHIMENT_METHODES[methodeId];
  if (!m) return output.reply("❌ Méthode inconnue. Voir 'empire launder list'.");
  const montant = parseInt(args[2]);
  if (!montant || montant <= 0) return output.reply("❌ Montant invalide. Ex: empire launder CASINO_JETON 500000");
  if (montant > empire.argentSale) return output.reply(`❌ Argent sale disponible : ${FM(empire.argentSale)}`);
  if (montant < 10_000) return output.reply("❌ Minimum : $10 000.");
  empire.argentSale -= montant;
  empire.blanchimentEnCours = { methode: methodeId, montant, finAt: Date.now() + COOLDOWNS.BLANCHIMENT };
  await save();
  return output.reply(`${m.emoji} BLANCHIMENT LANCÉ\n\nMéthode : ${m.nom}\nMontant : ${FM(montant)}\nRécupération : ${FM(Math.floor(montant * m.ratio))} dans 4h\nFrais : ${FM(Math.floor(montant * m.frais))}\n\nTapez 'empire launder check' dans 4h.`);
}

async function cmdWar(output: CommandContext["output"], args: string[], empire: EmpireData, save: () => Promise<void>) {
  const sub = (args[1] || "stats").toLowerCase();

  if (sub === "stat" || sub === "stats") {
    const total = empire.guerresGagnees + empire.guerresPerdues;
    return output.reply(`⚔️ BILAN DE GUERRE\n\n🏆 Victoires : ${empire.guerresGagnees}\n💀 Défaites : ${empire.guerresPerdues}\n📊 Ratio : ${total > 0 ? pct(empire.guerresGagnees / total) : "N/A"}\n\nAttaquer : empire war attack <ID_TERRITOIRE>`);
  }

  if (sub === "attack" || sub === "attaquer") {
    const cd = timeLeft(empire.lastGuerre, COOLDOWNS.GUERRE);
    if (cd) return output.reply(`⏰ Guerre disponible dans ${cd}.`);
    const tId = (args[2] || "").toUpperCase();
    const t   = TERRITOIRES[tId];
    if (!t) return output.reply("❌ Territoire inconnu.");
    if (empire.territoires.includes(tId)) return output.reply("❌ Vous possédez déjà ce territoire.");
    const coutGuerre = Math.floor(t.cout * 0.20);
    if (empire.argentPropre < coutGuerre)
      return output.reply(`❌ Fonds insuffisants pour l'attaque. Besoin : ${FM(coutGuerre)}`);
    empire.argentPropre -= coutGuerre;
    let chance = Math.min(0.85, 0.45 + (empire.allies.includes("MERCENAIRE") ? 0.25 : 0) + empire.guerresGagnees * 0.02);
    const victoire = Math.random() < chance;
    empire.lastGuerre = Date.now();
    if (victoire) {
      empire.territoires.push(tId);
      empire.guerresGagnees++;
      empire.reputation = Math.min(1000, empire.reputation + t.risque * 30);
      empire.xp += 500;
      pushTx(empire, "guerre_victoire", t.revenu, `Territoire capturé : ${t.nom}`);
      const newAch = checkAchievements(empire);
      await save();
      let msg = `⚔️ VICTOIRE MILITAIRE !\n\nTerritoire conquis : ${t.emoji} ${t.nom}\nRevenu : +${FM(t.revenu)}/h\nCoût guerre : ${FM(coutGuerre)}\nRéputation : +${t.risque * 30}\nXP : +500`;
      if (newAch.length) msg += `\n🏆 Succès : ${newAch.join(", ")}`;
      return output.reply(msg);
    } else {
      const perteSale = Math.floor(empire.argentSale * 0.10);
      empire.argentSale = Math.max(0, empire.argentSale - perteSale);
      empire.guerresPerdues++;
      pushTx(empire, "guerre_defaite", -(perteSale + coutGuerre), `Défaite : ${t.nom}`);
      await save();
      return output.reply(`💀 DÉFAITE !\n\nAttaque de ${t.emoji} ${t.nom} échouée.\nPerte argent sale : ${FM(perteSale)}\nCoût guerre perdu : ${FM(coutGuerre)}\n\n💡 Recrutez un Mercenaire pour augmenter vos chances.`);
    }
  }

  return output.reply("❓ Usage : empire war [stats|attack] <TERRITOIRE_ID>");
}

/* ============================================================
   ENTRY POINT
   ============================================================ */
export async function entry(ctx: CommandContext) {
  const { input, output, args, money } = ctx;
  const sid = input.senderID;
  const sub = (args[0] || "stat").toLowerCase();

  /* ── Charger ou initialiser les données empire ── */
  const userData = await money.getItem(sid);
  if (!userData.empire) userData.empire = initEmpire();
  const empire: EmpireData = userData.empire;
  const walletBalance: number = userData.money || 0;

  /* Rang auto-sync */
  empire.rang = getRang(empire).id;

  /* Fonction de sauvegarde */
  const save = async () => {
    userData.empire = empire;
    // La déduction du portefeuille pour deposit/buy est gérée via money.setItem
    await money.setItem(sid, userData);
  };

  /* ── Dispatcher ── */
  switch (sub) {
    case "help":
    case "aide":
      return output.reply(renderHelp());

    case "stat":
    case "status":
    case "dashboard":
    case "bal":
    case "balance":
      return output.reply(renderDashboard(empire, walletBalance));

    case "deposit":
    case "dep":
      return cmdDeposit(output, args, empire, walletBalance, save);

    case "withdraw":
    case "wd":
      return cmdWithdraw(output, args, empire, save);

    case "vault":
      return cmdVault(output, args, empire, save);

    case "loan":
      return cmdLoan(output, args, empire, save);

    case "repay":
      return cmdRepay(output, args, empire, save);

    case "interest":
      return cmdInterest(output, empire, save);

    case "collect":
      return cmdCollect(output, empire, save);

    case "collecte":
      return cmdCollecte(output, empire, save);

    case "history":
    case "historique":
      return cmdHistory(output, empire);

    case "daily":
      return cmdDaily(output, empire, save);

    case "premium":
      return cmdPremium(output, args, empire, save);

    case "achievements":
    case "succes":
      return cmdAchievements(output, empire);

    case "leaderboard":
    case "classement":
      return cmdLeaderboard(output, money);

    case "rank":
    case "rang":
      return cmdRank(output, empire);

    case "territoire":
    case "zone":
      return cmdTerritoire(output, args, empire, walletBalance, save);

    case "structure":
    case "build":
      return cmdStructure(output, args, empire, walletBalance, save);

    case "market":
    case "marche":
      return cmdMarket(output, empire);

    case "buy":
    case "acheter":
      return cmdBuy(output, args, empire, walletBalance, save);

    case "sell":
    case "vendre":
      return cmdSell(output, args, empire, save);

    case "inventory":
    case "inventaire":
    case "inv":
      return cmdInventory(output, empire);

    case "mission":
      return cmdMission(output, args, empire, save);

    case "ally":
    case "allie":
      return cmdAlly(output, args, empire, walletBalance, save);

    case "launder":
    case "blanchir":
      return cmdLaunder(output, args, empire, save);

    case "war":
    case "guerre":
      return cmdWar(output, args, empire, save);

    default:
      return output.reply("❓ Commande inconnue. Tapez 'empire help' pour voir la liste.");
  }
}
