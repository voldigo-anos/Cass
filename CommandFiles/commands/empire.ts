import { UNIRedux, UNISpectra } from "@cassidy/unispectra";
import { defineCommand, defineEntry } from "@cass/define";

// ══════════════════════════════════════════════════════════════════════════════
// ─── CONSTANTS ────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

const COOLDOWNS = {
  COLLECTE:    1  * 60 * 60 * 1000,
  MISSION:     2  * 60 * 60 * 1000,
  BLANCHIMENT: 4  * 60 * 60 * 1000,
  GUERRE:      12 * 60 * 60 * 1000,
  DAILY:       24 * 60 * 60 * 1000,
};

const RANGS = [
  { id: "RAT",        nom: "Rat de Caniveau",   min: 0,           emoji: "🐀", bonus: 0,    color: "⚫" },
  { id: "DEALER",     nom: "Dealer de Rue",      min: 50_000,      emoji: "🧤", bonus: 0.05, color: "🟤" },
  { id: "SOLDAT",     nom: "Soldat",             min: 250_000,     emoji: "🔫", bonus: 0.10, color: "🔴" },
  { id: "CAPORAL",    nom: "Caporal",            min: 1_000_000,   emoji: "⚔️", bonus: 0.15, color: "🟠" },
  { id: "LIEUTENANT", nom: "Lieutenant",         min: 5_000_000,   emoji: "🦅", bonus: 0.20, color: "🟡" },
  { id: "CAPITAINE",  nom: "Capitaine",          min: 20_000_000,  emoji: "🎖️", bonus: 0.25, color: "🟢" },
  { id: "BOSS",       nom: "Boss",               min: 100_000_000, emoji: "💀", bonus: 0.35, color: "🔵" },
  { id: "PARRAIN",    nom: "Le Parrain",         min: 500_000_000, emoji: "👑", bonus: 0.50, color: "🟣" },
];

const TERRITOIRES: Record<string, any> = {
  BANLIEUE: { nom: "Banlieue Sud",     cout: 0,           revenu: 5_000,     risque: 1, protection: 0, emoji: "🏚️" },
  QUARTIER: { nom: "Quartier Nord",    cout: 80_000,      revenu: 18_000,    risque: 2, protection: 0, emoji: "🏘️" },
  PORT:     { nom: "Port Clandestin",  cout: 500_000,     revenu: 65_000,    risque: 3, protection: 1, emoji: "⚓"  },
  CASINO:   { nom: "Casino Caché",     cout: 2_000_000,   revenu: 200_000,   risque: 4, protection: 2, emoji: "🎰" },
  DOUANE:   { nom: "Douane Corrompue", cout: 8_000_000,   revenu: 600_000,   risque: 3, protection: 3, emoji: "🛃" },
  CAPITALE: { nom: "Centre Politique", cout: 30_000_000,  revenu: 2_000_000, risque: 5, protection: 5, emoji: "🏛️" },
};

const PRODUITS: Record<string, any> = {
  CONTREBANDE: { nom: "Contrebande",   prixAchat: 1_000,  prixVente: 2_800,   risque: 1, emoji: "📦" },
  ARMES:       { nom: "Armes légères", prixAchat: 8_000,  prixVente: 22_000,  risque: 3, emoji: "🔫" },
  DOCUMENTS:   { nom: "Faux docs",     prixAchat: 3_000,  prixVente: 9_500,   risque: 2, emoji: "📄" },
  DROGUE:      { nom: "Narcotiques",   prixAchat: 5_000,  prixVente: 16_000,  risque: 4, emoji: "💊" },
  CRYPTO_SALE: { nom: "Crypto volée",  prixAchat: 15_000, prixVente: 45_000,  risque: 3, emoji: "💻" },
  PETROLE:     { nom: "Pétrole noir",  prixAchat: 50_000, prixVente: 140_000, risque: 4, emoji: "🛢️" },
};

const STRUCTURES: Record<string, any> = {
  PLANQUE:    { nom: "Planque",           cout: 10_000,     capacite: 50,  revenuBonus: 0,    emoji: "🏠" },
  LABO:       { nom: "Laboratoire",       cout: 75_000,     capacite: 0,   revenuBonus: 0.15, emoji: "🧪" },
  ENTREPOT:   { nom: "Entrepôt",          cout: 200_000,    capacite: 500, revenuBonus: 0,    emoji: "🏭" },
  RESTAURANT: { nom: "Restaurant Façade", cout: 500_000,    capacite: 0,   revenuBonus: 0.25, emoji: "🍽️" },
  SOCIETE:    { nom: "Société Écran",     cout: 2_000_000,  capacite: 0,   revenuBonus: 0.40, emoji: "🏢" },
  BANQUE_OFF: { nom: "Banque Offshore",   cout: 15_000_000, capacite: 0,   revenuBonus: 0.60, emoji: "🏦" },
};

const ALLIES: Record<string, any> = {
  AVOCAT:     { nom: "Maître Dubois",       cout: 50_000,    effet: "Réduit risque arrestation -30%",  emoji: "⚖️" },
  POLICIER:   { nom: "Inspecteur Corrompu", cout: 150_000,   effet: "Alerte -1 par mission",            emoji: "🚔" },
  POLITICIEN: { nom: "Député Vénard",       cout: 500_000,   effet: "Territoire risque -2",             emoji: "🤝" },
  HACKER:     { nom: "Zero-X",              cout: 250_000,   effet: "+30% revenus marché noir",         emoji: "💻" },
  MERCENAIRE: { nom: "Colonel Krak",        cout: 1_000_000, effet: "+50% succès attaque territoire",   emoji: "🪖" },
  JUGE:       { nom: "Juge Moreau",         cout: 3_000_000, effet: "Immunité totale 48h",              emoji: "🔨" },
};

const MISSIONS = [
  { id: "M01", nom: "Vol à l'arraché",        difficulte: 1, duree: 30,  gain: [2_000,    8_000],     cout: 0,          risque: 10, xp: 5   },
  { id: "M02", nom: "Cambriolage",            difficulte: 2, duree: 60,  gain: [10_000,   40_000],    cout: 2_000,      risque: 20, xp: 15  },
  { id: "M03", nom: "Enlèvement ciblé",       difficulte: 3, duree: 90,  gain: [50_000,   180_000],   cout: 15_000,     risque: 30, xp: 30  },
  { id: "M04", nom: "Hack de banque",         difficulte: 4, duree: 120, gain: [200_000,  700_000],   cout: 50_000,     risque: 45, xp: 60  },
  { id: "M05", nom: "Assassinat de cible",    difficulte: 5, duree: 180, gain: [800_000,  3_000_000], cout: 200_000,    risque: 60, xp: 120 },
  { id: "M06", nom: "Coup d'état économique", difficulte: 6, duree: 240, gain: [3_000_000,12_000_000],cout: 1_000_000,  risque: 75, xp: 300 },
];

const BLANCHIMENT_METHODES: Record<string, any> = {
  IMMOBILIER:   { nom: "Immobilier fictif",     ratio: 0.70, frais: 0.30, emoji: "🏠" },
  CASINO_JETON: { nom: "Jetons de casino",      ratio: 0.80, frais: 0.20, emoji: "🎰" },
  SOCIETE_ECRAN:{ nom: "Société écran offshore",ratio: 0.90, frais: 0.10, emoji: "🏢" },
  CRYPTO_MIX:   { nom: "Mixeur cryptomonnaie",  ratio: 0.85, frais: 0.15, emoji: "🔀" },
  DONATION:     { nom: "Fausse donation ONG",   ratio: 0.60, frais: 0.40, emoji: "🎁" },
};

const ACH_INFO: Record<string, any> = {
  PREMIER_SANG:    { emoji: "🩸", nom: "Premier Sang",        desc: "Compléter sa 1ère mission"         },
  PREMIER_CRIME:   { emoji: "💀", nom: "Premier Crime",       desc: "Gagner 10 000$ au total"            },
  PREMIER_DEPOT:   { emoji: "💰", nom: "Premier Dépôt",       desc: "Faire un premier dépôt"             },
  PETIT_BOSS:      { emoji: "🏙️", nom: "Petit Boss",          desc: "Posséder 3 territoires"             },
  MILLION:         { emoji: "💵", nom: "Premier Million",      desc: "Gagner 1 000 000$ au total"         },
  RICHISSE:        { emoji: "💎", nom: "Richesses",            desc: "Avoir 1M$ d'argent propre"          },
  MILLIARD:        { emoji: "🤑", nom: "Milliardaire",         desc: "Gagner 1 000 000 000$ au total"     },
  CAPO:            { emoji: "🎖️", nom: "Capo",                desc: "Atteindre le rang Capitaine"        },
  PARRAIN_TITLE:   { emoji: "👑", nom: "Le Parrain",           desc: "Atteindre le rang Parrain"          },
  BLANCHISSEUR:    { emoji: "🧼", nom: "Grand Blanchisseur",   desc: "Blanchir 10 000 000$"               },
  CHEF_DE_GUERRE:  { emoji: "⚔️", nom: "Chef de Guerre",      desc: "Gagner 5 guerres"                   },
  SEIGNEUR_GUERRE: { emoji: "🛡️", nom: "Seigneur de Guerre",  desc: "Gagner 10 guerres"                  },
  INVINCIBLE:      { emoji: "🏆", nom: "Invincible",           desc: "Gagner 20 guerres"                  },
  ALLIANCE:        { emoji: "🤝", nom: "Alliance Solide",      desc: "Recruter 4 alliés"                  },
  LEGENDE:         { emoji: "⭐", nom: "Légende Vivante",      desc: "Atteindre 1 milliard de gains"      },
};

// ══════════════════════════════════════════════════════════════════════════════
// ─── HELPERS ──────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

const FM = (n: number) => `$${Math.floor(n).toLocaleString("fr-FR")}`;
const pct = (n: number) => `${Math.round(n * 100)}%`;
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const LINE = "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━";

function timeLeft(ts: number | null, cd: number): string | null {
  const diff = cd - (Date.now() - (ts || 0));
  if (diff <= 0) return null;
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function getRang(empire: any) {
  let rang = RANGS[0];
  for (const r of RANGS) {
    if (empire.totalGagne >= r.min) rang = r;
    else break;
  }
  return rang;
}

function getRevenuTotal(empire: any): number {
  let total = 0;
  for (const tId of empire.territoires) {
    const t = TERRITOIRES[tId];
    if (t) total += t.revenu;
  }
  for (const s of empire.structuresActives) {
    const st = STRUCTURES[s.type];
    if (st?.revenuBonus > 0) total += total * st.revenuBonus;
  }
  const rang = getRang(empire);
  total += total * rang.bonus;
  if (empire.allies.includes("HACKER")) total += total * 0.30;
  return Math.floor(total);
}

function getCapaciteMax(empire: any): number {
  let cap = 50;
  for (const s of empire.structuresActives) {
    const st = STRUCTURES[s.type];
    if (st?.capacite > 0) cap += st.capacite;
  }
  return cap;
}

function getQuantiteInventaire(empire: any): number {
  return Object.values(empire.inventaire as Record<string, number>).reduce((a, b) => a + b, 0);
}

function calculatePortfolioValue(empire: any): number {
  let total = 0;
  for (const tId of empire.territoires) {
    const t = TERRITOIRES[tId];
    if (t) total += t.cout;
  }
  for (const s of empire.structuresActives) {
    const st = STRUCTURES[s.type];
    if (st) total += st.cout;
  }
  for (const [pId, qte] of Object.entries(empire.inventaire as Record<string, number>)) {
    const p = PRODUITS[pId];
    if (p) total += p.prixAchat * qte;
  }
  return total;
}

function checkAchievements(empire: any): string[] {
  const checks: [string, () => boolean][] = [
    ["PREMIER_SANG",    () => empire.missionsCompletes >= 1],
    ["PREMIER_CRIME",   () => empire.totalGagne >= 10_000],
    ["PREMIER_DEPOT",   () => empire.achievements.includes("PREMIER_DEPOT")],
    ["PETIT_BOSS",      () => empire.territoires.length >= 3],
    ["MILLION",         () => empire.totalGagne >= 1_000_000],
    ["RICHISSE",        () => empire.argentPropre >= 1_000_000],
    ["MILLIARD",        () => empire.totalGagne >= 1_000_000_000],
    ["CAPO",            () => empire.rang === "CAPITAINE"],
    ["PARRAIN_TITLE",   () => empire.rang === "PARRAIN"],
    ["BLANCHISSEUR",    () => empire.totalBlanchit >= 10_000_000],
    ["CHEF_DE_GUERRE",  () => empire.guerresGagnees >= 5],
    ["SEIGNEUR_GUERRE", () => empire.guerresGagnees >= 10],
    ["INVINCIBLE",      () => empire.guerresGagnees >= 20],
    ["ALLIANCE",        () => empire.allies.length >= 4],
    ["LEGENDE",         () => empire.totalGagne >= 1_000_000_000],
  ];
  const unlocked: string[] = [];
  for (const [id, fn] of checks) {
    if (!empire.achievements.includes(id) && fn()) {
      empire.achievements.push(id);
      unlocked.push(id);
    }
  }
  return unlocked;
}

function addTx(empire: any, type: string, montant: number, description: string) {
  empire.transactions.push({ type, montant, description, date: Date.now() });
  if (empire.transactions.length > 30) empire.transactions = empire.transactions.slice(-30);
}

function getTxEmoji(type: string): string {
  const map: Record<string, string> = {
    deposit: "💰", withdrawal: "💸", vault_deposit: "🔐", vault_withdrawal: "🔓",
    loan: "🏦", loan_repayment: "💳", interest_earned: "📈", interest_charged: "📉",
    daily: "🎁", collecte: "💵", achat_territoire: "🗺️", construction: "🏗️",
    achat_marche: "🛒", vente_marche: "💸", recrutement: "🤝", blanchiment: "🧼",
    mission_succes: "✅", mission_echec: "❌", guerre_victoire: "⚔️", guerre_defaite: "💀",
    raid: "🚔",
  };
  return map[type] || "💼";
}

function initEmpire() {
  return {
    argentSale: 0, argentPropre: 0, totalGagne: 0, totalBlanchit: 0,
    rang: "RAT", xp: 0, niveau: 1, reputation: 0,
    territoires: ["BANLIEUE"], structuresActives: [], inventaire: {},
    capaciteMax: 50, allies: [],
    missionEnCours: null, lastMission: null, missionsCompletes: 0,
    lastGuerre: null, guerresGagnees: 0, guerresPerdues: 0,
    lastBlanchiment: null, blanchimentEnCours: null,
    lastCollecte: null, lastDaily: null,
    transactions: [], achievements: [],
    tauxCorruption: 0, prisEnChasse: false, nbArrestes: 0,
    vault: 0, loan: 0, loanDate: null, creditScore: 500,
    bankLevel: 1, multiplier: 1.0, premium: false, streak: 0,
    lastInterest: Date.now(),
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// ─── DASHBOARD ────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

function renderDashboard(empire: any, wallet: number): string {
  const rang = getRang(empire);
  const revenu = getRevenuTotal(empire);
  const totalLiquid = wallet + empire.argentPropre;
  const totalNet = totalLiquid + empire.argentSale + empire.vault;
  const portfolio = calculatePortfolioValue(empire);
  const totalWealth = totalNet + portfolio;
  const invQte = getQuantiteInventaire(empire);
  const capMax = getCapaciteMax(empire);

  let wealthTier = "🔰 Débutant";
  if (totalWealth >= 1_000_000_000) wealthTier = "👑 Parrain Suprême";
  else if (totalWealth >= 100_000_000) wealthTier = "💀 Boss Redouté";
  else if (totalWealth >= 10_000_000) wealthTier = "🎖️ Capitaine";
  else if (totalWealth >= 1_000_000) wealthTier = "⚔️ Soldat Confirmé";
  else if (totalWealth >= 100_000) wealthTier = "🧤 Dealer Ambitieux";

  let creditRating = "Mauvais 🔴";
  if (empire.creditScore >= 800) creditRating = "Excellent 🟢";
  else if (empire.creditScore >= 700) creditRating = "Bon 🟢";
  else if (empire.creditScore >= 600) creditRating = "Moyen 🟡";
  else if (empire.creditScore >= 500) creditRating = "Faible 🟠";

  return (
    `💀 **EMPIRE CRIMINEL**\n${LINE}\n` +
    `**${wealthTier}** · Niveau **${empire.bankLevel}**${empire.premium ? " · 💎 Premium" : ""}\n\n` +
    `**💰 FINANCES**\n` +
    `💵 Portefeuille: **${FM(wallet)}**\n` +
    `🧼 Argent propre: **${FM(empire.argentPropre)}**\n` +
    `💀 Argent sale: **${FM(empire.argentSale)}** ⚠️\n` +
    `🔐 Coffre: **${FM(empire.vault)}**\n` +
    `└ Liquidités: **${FM(totalLiquid)}**\n\n` +
    `**📈 EMPIRE**\n` +
    `🗺️ Territoires: **${empire.territoires.length}** · Revenu/h: **${FM(revenu)}**\n` +
    `🏗️ Structures: **${empire.structuresActives.length}** · 🤝 Alliés: **${empire.allies.length}**\n` +
    `📦 Inventaire: **${invQte}/${capMax}**\n` +
    `└ Portfolio: **${FM(portfolio)}**\n\n` +
    `**🏆 PATRIMOINE TOTAL**\n` +
    `💎 **${FM(totalWealth)}**\n` +
    `💳 Crédit: **${empire.creditScore}/850** (${creditRating})\n` +
    `🎯 Prêt max: **${FM(empire.creditScore * 2000)}**\n` +
    `⚡ Multiplicateur: **${empire.multiplier}x**\n\n` +
    `**👤 PROGRESSION**\n` +
    `${rang.emoji} Rang: **${rang.nom}**\n` +
    `⭐ XP: **${empire.xp.toLocaleString("fr-FR")}** · 🎯 Rép: **${empire.reputation}/1000**\n` +
    `🏆 Succès: **${empire.achievements.length}** · 🔥 Série: **${empire.streak}j**\n` +
    `💸 Prêt actif: **${empire.loan > 0 ? FM(empire.loan) : "Aucun ✅"}**\n\n` +
    `**⏳ COOLDOWNS**\n` +
    `💰 Collecte: ${timeLeft(empire.lastCollecte, COOLDOWNS.COLLECTE) || "✅ Prêt"}\n` +
    `🎯 Mission: ${empire.missionEnCours ? "⏳ En cours" : timeLeft(empire.lastMission, COOLDOWNS.MISSION) || "✅ Prêt"}\n` +
    `🧼 Blanchiment: ${empire.blanchimentEnCours ? "⏳ En cours" : timeLeft(empire.lastBlanchiment, COOLDOWNS.BLANCHIMENT) || "✅ Prêt"}\n` +
    `⚔️ Guerre: ${timeLeft(empire.lastGuerre, COOLDOWNS.GUERRE) || "✅ Prêt"}\n` +
    `🎁 Daily: ${timeLeft(empire.lastDaily, COOLDOWNS.DAILY) || "✅ Prêt"}\n` +
    `${empire.prisEnChasse ? "🚨 **LA POLICE EST SUR VOTRE PISTE !**" : "✅ Aucune surveillance"}`
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ─── COMMAND ──────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

const command = defineCommand({
  meta: {
    name: "empire",
    otherNames: ["cartel", "mafia", "tycoon"],
    description: "💀 Simulation de tycoon criminel ultra-complexe. Construis ton empire depuis la rue jusqu'au trône du Parrain.",
    version: "4.0.0",
    author: "Christus",
    category: "Economy",
    usage: "{prefix}{name} help",
    role: 0,
    noPrefix: false,
    waitingTime: 3,
    requirement: "3.0.0",
    icon: "💀",
  },
  style: {
    title: "💀 Empire Criminel",
    titleFont: "bold",
    contentFont: "fancy",
  },

  entry: defineEntry(async (ctx) => {
    const { input, output, money } = ctx;
    const args = input.arguments ?? [];
    const sub = (args[0] || "help").toLowerCase();

    // ── Load data ──────────────────────────────────────────────────────────
    let userData: any = await money.getItem(input.senderID);
    if (!userData) userData = { money: 0, exp: 0, name: "Unknown" };
    if (!userData.empire) userData.empire = initEmpire();
    const empire = userData.empire;
    const wallet: number = userData.money ?? 0;

    const rang = getRang(empire);
    empire.rang = rang.id;

    const save = async () => {
      userData.empire = empire;
      await money.setItem(input.senderID, { empire });
    };

    const reply = (body: string) => output.replyStyled({ body }, style);

    // ══════════════════════════════════════════════════════════════════════
    switch (sub) {

      // ── HELP ─────────────────────────────────────────────────────────
      case "help": case "aide":
        return reply(
          `💀 **EMPIRE CRIMINEL — GUIDE COMPLET**\n${LINE}\n\n` +
          `**💰 BANQUE & FINANCES**\n` +
          `• \`empire stat\` — Tableau de bord\n` +
          `• \`empire deposit <montant>\` — Déposer argent propre\n` +
          `• \`empire withdraw <montant>\` — Retirer argent propre\n` +
          `• \`empire vault [deposit|withdraw] <montant>\` — Coffre\n` +
          `• \`empire loan <montant>\` — Emprunter\n` +
          `• \`empire repay <montant>\` — Rembourser\n` +
          `• \`empire interest\` — Intérêts coffre/prêt\n` +
          `• \`empire history\` — Historique transactions\n` +
          `• \`empire daily\` — Récompense quotidienne\n` +
          `• \`empire collecte\` — Percevoir revenus territoires\n\n` +
          `**🗺️ TERRITOIRES & STRUCTURES**\n` +
          `• \`empire territoire list\` — Voir disponibles\n` +
          `• \`empire territoire buy <ID>\` — Conquérir\n` +
          `• \`empire territoire info <ID>\` — Détails\n` +
          `• \`empire structure list\` — Voir structures\n` +
          `• \`empire structure build <TYPE> <TERR>\` — Construire\n\n` +
          `**🛒 MARCHÉ NOIR**\n` +
          `• \`empire market\` — Prix du marché\n` +
          `• \`empire buy <ID> <qte>\` — Acheter\n` +
          `• \`empire sell <ID> <qte>\` — Vendre\n` +
          `• \`empire inventory\` — Inventaire\n\n` +
          `**🎯 MISSIONS**\n` +
          `• \`empire mission list\` — Missions disponibles\n` +
          `• \`empire mission start <N°>\` — Lancer\n` +
          `• \`empire mission check\` — Vérifier\n` +
          `• \`empire mission cancel\` — Annuler (50% remboursé)\n\n` +
          `**🤝 ALLIÉS**\n` +
          `• \`empire ally list\` — Alliés disponibles\n` +
          `• \`empire ally buy <ID>\` — Recruter\n\n` +
          `**⚔️ GUERRE**\n` +
          `• \`empire war stats\` — Bilan guerres\n` +
          `• \`empire war attack <ID>\` — Attaquer territoire\n\n` +
          `**🧼 BLANCHIMENT**\n` +
          `• \`empire launder list\` — Méthodes disponibles\n` +
          `• \`empire launder <METHODE> <montant>\` — Blanchir\n` +
          `• \`empire launder check\` — Récupérer\n\n` +
          `**🏆 PROGRESSION**\n` +
          `• \`empire rank\` — Rang & progression\n` +
          `• \`empire achievements\` — Succès\n` +
          `• \`empire leaderboard\` — Classement\n` +
          `• \`empire credit\` — Score de crédit\n` +
          `• \`empire premium [buy]\` — Abonnement premium\n\n` +
          `⚠️ L'argent sale peut être SAISI lors de raids\n` +
          `⚠️ Sans blanchiment, vous ne pouvez pas dépenser l'argent criminel`
        );

      // ── STAT ──────────────────────────────────────────────────────────
      case "stat": case "status": case "dashboard": case "bal": case "balance":
        return reply(renderDashboard(empire, wallet));

      // ── DEPOSIT ───────────────────────────────────────────────────────
      case "deposit": case "dep": {
        const amt = parseInt(args[1]);
        if (!amt || amt <= 0) return reply(
          `💰 **DÉPÔT D'ARGENT PROPRE**\n\nUsage: \`empire deposit <montant>\`\n` +
          `Portefeuille: **${FM(wallet)}** · Argent propre: **${FM(empire.argentPropre)}**`
        );
        if (wallet < amt) return reply(
          `❌ **Fonds insuffisants**\n\nPortefeuille: **${FM(wallet)}** · Manque: **${FM(amt - wallet)}**`
        );
        await money.setItem(input.senderID, { money: wallet - amt });
        empire.argentPropre += amt;
        if (!empire.achievements.includes("PREMIER_DEPOT")) empire.achievements.push("PREMIER_DEPOT");
        addTx(empire, "deposit", amt, "Dépôt argent propre");
        await save();
        return reply(
          `✅ **DÉPÔT RÉUSSI!**\n\n💵 Déposé: **${FM(amt)}**\n🧼 Argent propre: **${FM(empire.argentPropre)}**\n` +
          `💳 Portefeuille restant: **${FM(wallet - amt)}**`
        );
      }

      // ── WITHDRAW ──────────────────────────────────────────────────────
      case "withdraw": case "wd": {
        const amt = parseInt(args[1]);
        if (!amt || amt <= 0) return reply(
          `💸 **RETRAIT D'ARGENT PROPRE**\n\nUsage: \`empire withdraw <montant>\`\nArgent propre: **${FM(empire.argentPropre)}**`
        );
        if (empire.argentPropre < amt) return reply(
          `❌ **Fonds insuffisants**\n\nArgent propre: **${FM(empire.argentPropre)}** · Manque: **${FM(amt - empire.argentPropre)}**`
        );
        empire.argentPropre -= amt;
        await money.setItem(input.senderID, { money: wallet + amt });
        addTx(empire, "withdrawal", amt, "Retrait argent propre");
        await save();
        return reply(
          `💸 **RETRAIT RÉUSSI!**\n\n💵 Retiré: **${FM(amt)}**\n🧼 Argent propre: **${FM(empire.argentPropre)}**\n` +
          `💳 Nouveau portefeuille: **${FM(wallet + amt)}**`
        );
      }

      // ── VAULT ─────────────────────────────────────────────────────────
      case "vault": {
        const action = (args[1] || "").toLowerCase();
        const amt = parseInt(args[2]);
        if (!action) return reply(
          `🔐 **COFFRE FORT CRIMINEL**\n\nSolde: **${FM(empire.vault)}** · Argent propre: **${FM(empire.argentPropre)}**\n\n` +
          `Le coffre offre:\n• Sécurité maximale contre les raids\n• Intérêts de 2% par mois\n\n` +
          `• \`empire vault deposit <montant>\`\n• \`empire vault withdraw <montant>\``
        );
        if (!amt || amt <= 0) return reply("❌ Montant invalide.");
        if (action === "deposit") {
          if (empire.argentPropre < amt) return reply(`❌ Fonds insuffisants. Vous avez **${FM(empire.argentPropre)}**.`);
          empire.argentPropre -= amt;
          empire.vault += amt;
          addTx(empire, "vault_deposit", amt, "Dépôt coffre");
          await save();
          return reply(`🔐 **DÉPÔT COFFRE RÉUSSI!**\n\nDéposé: **${FM(amt)}**\nSolde coffre: **${FM(empire.vault)}**\n💡 Gain 2% d'intérêts mensuels!`);
        }
        if (action === "withdraw") {
          if (empire.vault < amt) return reply(`❌ Fonds insuffisants dans le coffre. Solde: **${FM(empire.vault)}**`);
          empire.vault -= amt;
          empire.argentPropre += amt;
          addTx(empire, "vault_withdrawal", amt, "Retrait coffre");
          await save();
          return reply(`🔓 **RETRAIT COFFRE RÉUSSI!**\n\nRetiré: **${FM(amt)}**\nSolde coffre: **${FM(empire.vault)}**\nArgent propre: **${FM(empire.argentPropre)}**`);
        }
        return reply("❓ Usage: `empire vault [deposit|withdraw] <montant>`");
      }

      // ── LOAN ──────────────────────────────────────────────────────────
      case "loan": {
        const maxLoan = empire.creditScore * 2000;
        const amt = parseInt(args[1]);
        if (!amt || amt <= 0) return reply(
          `🏦 **PRÊT CRIMINEL**\n\nScore crédit: **${empire.creditScore}** · Max: **${FM(maxLoan)}**\n` +
          `Taux: **8%/semaine** · Prêt actuel: **${empire.loan > 0 ? FM(empire.loan) : "Aucun"}**\n\nUsage: \`empire loan <montant>\``
        );
        if (empire.loan > 0) return reply(`❌ Prêt actif de **${FM(empire.loan)}**. Remboursez d'abord avec \`empire repay\`.`);
        if (amt < 10_000) return reply("❌ Montant minimum: **$10 000**.");
        if (amt > maxLoan) return reply(`❌ Maximum basé sur votre crédit: **${FM(maxLoan)}**`);
        empire.argentPropre += amt;
        empire.loan = amt;
        empire.loanDate = Date.now();
        addTx(empire, "loan", amt, "Prêt approuvé");
        await save();
        return reply(`✅ **PRÊT APPROUVÉ!**\n\n**${FM(amt)}** ajouté à votre argent propre\nTaux: **8%/semaine**\nArgent propre: **${FM(empire.argentPropre)}**`);
      }

      // ── REPAY ─────────────────────────────────────────────────────────
      case "repay": {
        if (empire.loan <= 0) return reply("❌ Aucun prêt actif.");
        const amt = parseInt(args[1]);
        if (!amt || amt <= 0) return reply(
          `💳 **REMBOURSEMENT**\n\nPrêt restant: **${FM(empire.loan)}**\nArgent propre: **${FM(empire.argentPropre)}**\n\nUsage: \`empire repay <montant>\``
        );
        if (empire.argentPropre < amt) return reply(`❌ Fonds insuffisants. Vous avez **${FM(empire.argentPropre)}**.`);
        const repay = Math.min(amt, empire.loan);
        empire.argentPropre -= repay;
        empire.loan -= repay;
        if (empire.loan <= 0) { empire.loanDate = null; empire.creditScore = Math.min(850, empire.creditScore + 15); }
        addTx(empire, "loan_repayment", repay, "Remboursement prêt");
        await save();
        return reply(empire.loan <= 0
          ? `✅ **Prêt entièrement remboursé!** Score crédit +15 → **${empire.creditScore}**`
          : `✅ Remboursé **${FM(repay)}**. Restant: **${FM(empire.loan)}**`
        );
      }

      // ── INTEREST ──────────────────────────────────────────────────────
      case "interest": {
        const now = Date.now();
        const hrs = (now - (empire.lastInterest || now)) / 3_600_000;
        if (hrs < 1) return reply(`⏰ Attendez encore **${Math.round(60 - hrs * 60)} minutes** pour collecter les intérêts.`);
        const vInt  = Math.floor(empire.vault * (0.02 / (30 * 24)) * hrs);
        const lInt  = Math.floor(empire.loan  * (0.08 / ( 7 * 24)) * hrs);
        empire.vault += vInt;
        empire.loan  += lInt;
        empire.lastInterest = now;
        if (vInt > 0) addTx(empire, "interest_earned",  vInt, `Intérêts coffre (${Math.floor(hrs)}h)`);
        if (lInt > 0) addTx(empire, "interest_charged", lInt, `Intérêts prêt (${Math.floor(hrs)}h)`);
        await save();
        return reply(
          `📊 **CALCUL DES INTÉRÊTS** (${Math.floor(hrs)}h)\n\n` +
          `💰 Coffre: **+${FM(vInt)}**\n💸 Prêt: **+${FM(lInt)}**\n` +
          `└ Net: **${vInt - lInt >= 0 ? "+" : ""}${FM(vInt - lInt)}**\n\n` +
          `Coffre: **${FM(empire.vault)}** · Prêt: **${FM(empire.loan)}**`
        );
      }

      // ── HISTORY ───────────────────────────────────────────────────────
      case "history": case "historique": {
        const txs = empire.transactions.slice(-15).reverse();
        if (txs.length === 0) return reply("📋 Aucune transaction enregistrée.");
        const lines = txs.map((tx: any) => {
          const d = new Date(tx.date).toLocaleDateString("fr-FR");
          const sign = tx.montant >= 0 ? "+" : "";
          return `${getTxEmoji(tx.type)} **${tx.description}**: ${sign}${FM(tx.montant)} _(${d})_`;
        }).join("\n");
        return reply(`📋 **HISTORIQUE (15 dernières)**\n\n${lines}`);
      }

      // ── DAILY ─────────────────────────────────────────────────────────
      case "daily": {
        const cd = timeLeft(empire.lastDaily, COOLDOWNS.DAILY);
        if (cd) return reply(`⏰ Récompense quotidienne déjà réclamée!\nProchaine dans: **${cd}**`);
        empire.streak = (Date.now() - (empire.lastDaily || 0)) < COOLDOWNS.DAILY * 2 ? empire.streak + 1 : 1;
        const reward = Math.floor(
          (10_000 + Math.min(empire.streak * 500, 5_000) + empire.bankLevel * 1_000 + Math.floor(empire.reputation * 20))
          * (empire.premium ? 2 : 1)
        );
        empire.argentSale += reward;
        empire.totalGagne += reward;
        empire.lastDaily = Date.now();
        empire.reputation = Math.min(1000, empire.reputation + 3);
        addTx(empire, "daily", reward, `Récompense quotidienne (série ${empire.streak}j)`);
        const ach = checkAchievements(empire);
        await save();
        return reply(
          `🎁 **RÉCOMPENSE QUOTIDIENNE!**\n\n💰 **${FM(reward)}** ajouté à votre argent sale\n` +
          `🔥 Série: **${empire.streak} jours** · 🎯 Rép: +3\n` +
          `📈 Niveau: **${empire.bankLevel}** · ⭐ Premium: **${empire.premium ? "2x Bonus!" : "Non"}**` +
          (ach.length ? `\n🏆 Succès: **${ach.join(", ")}**` : "")
        );
      }

      // ── COLLECTE ──────────────────────────────────────────────────────
      case "collecte": {
        const cd = timeLeft(empire.lastCollecte, COOLDOWNS.COLLECTE);
        if (cd) return reply(`⏰ Collecte disponible dans **${cd}**.`);
        if (empire.territoires.length === 0) return reply("❌ Vous n'avez aucun territoire.");
        const revenu = getRevenuTotal(empire);
        if (revenu <= 0) return reply("❌ Vos territoires ne génèrent aucun revenu.");
        const risqueTotal = empire.territoires.reduce((s: number, tId: string) => s + (TERRITOIRES[tId]?.risque || 0), 0);
        const raid = Math.random() * 100 < Math.max(0, risqueTotal * 3 - empire.tauxCorruption) && !empire.allies.includes("POLICIER");
        if (raid) {
          const saisie = Math.floor(empire.argentSale * 0.15);
          empire.argentSale = Math.max(0, empire.argentSale - saisie);
          empire.prisEnChasse = true;
          empire.nbArrestes++;
          addTx(empire, "raid", -saisie, "Saisie lors d'un raid");
          await save();
          return reply(`🚔 **RAID DE POLICE!**\n\nSaisie: **${FM(saisie)}** d'argent sale.\n⚠️ Vous êtes maintenant en fuite!\n💡 Recrutez un Inspecteur Corrompu pour éviter cela.`);
        }
        empire.argentSale += revenu;
        empire.totalGagne += revenu;
        empire.xp += Math.floor(revenu / 10_000);
        empire.lastCollecte = Date.now();
        empire.prisEnChasse = false;
        const oldRang = empire.rang;
        empire.rang = getRang(empire).id;
        addTx(empire, "collecte", revenu, `Collecte ${empire.territoires.length} territoire(s)`);
        const ach = checkAchievements(empire);
        await save();
        const lines = empire.territoires.map((tId: string) => {
          const t = TERRITOIRES[tId];
          return t ? `${t.emoji} ${t.nom}: **+${FM(t.revenu)}**` : "";
        }).join("\n");
        let msg = `💰 **COLLECTE EFFECTUÉE!**\n\n${lines}\n\n${LINE}\n` +
          `💰 Total: **+${FM(revenu)}** · ⭐ XP: **+${Math.floor(revenu / 10_000)}**\n` +
          `💀 Argent sale total: **${FM(empire.argentSale)}**`;
        if (oldRang !== empire.rang) msg += `\n\n🎉 NOUVEAU RANG: **${getRang(empire).emoji} ${getRang(empire).nom}!**`;
        if (ach.length) msg += `\n🏆 Succès: **${ach.join(", ")}**`;
        return reply(msg);
      }

      // ── TERRITOIRE ────────────────────────────────────────────────────
      case "territoire": case "zone": {
        const s = (args[1] || "list").toLowerCase();
        if (s === "list") {
          const lines = Object.entries(TERRITOIRES).map(([id, t]: [string, any]) =>
            `${t.emoji} **${t.nom}** [${id}]\n` +
            `  💰 ${FM(t.revenu)}/h · ⚠️ ${"🔴".repeat(t.risque)} · 💵 ${t.cout === 0 ? "Gratuit" : FM(t.cout)}\n` +
            `  ${empire.territoires.includes(id) ? "✅ POSSÉDÉ" : "🔒 Non acquis"}`
          ).join("\n\n");
          return reply(`🗺️ **TERRITOIRES DISPONIBLES**\n\n${lines}\n\nAcquérir: \`empire territoire buy <ID>\``);
        }
        if (s === "buy" || s === "acheter") {
          const tId = (args[2] || "").toUpperCase();
          const t = TERRITOIRES[tId];
          if (!t) return reply("❌ Territoire inconnu. Voir `empire territoire list`.");
          if (empire.territoires.includes(tId)) return reply("❌ Vous possédez déjà ce territoire.");
          const total = wallet + empire.argentPropre;
          if (total < t.cout) return reply(`❌ Fonds insuffisants.\nCoût: **${FM(t.cout)}** · Disponible: **${FM(total)}** · Manque: **${FM(t.cout - total)}**`);
          let reste = t.cout;
          if (empire.argentPropre >= reste) { empire.argentPropre -= reste; }
          else { reste -= empire.argentPropre; empire.argentPropre = 0; await money.setItem(input.senderID, { money: wallet - reste }); }
          empire.territoires.push(tId);
          empire.reputation = Math.min(1000, empire.reputation + t.risque * 20);
          addTx(empire, "achat_territoire", -t.cout, `Acquisition: ${t.nom}`);
          const ach = checkAchievements(empire);
          await save();
          return reply(
            `${t.emoji} **TERRITOIRE ACQUIS: ${t.nom}**\n\n💵 Coût: **${FM(t.cout)}** · Revenu: **+${FM(t.revenu)}/h**\n🎯 Réputation: **+${t.risque * 20}**` +
            (ach.length ? `\n🏆 **${ach.join(", ")}**` : "")
          );
        }
        if (s === "info") {
          const tId = (args[2] || "").toUpperCase();
          const t = TERRITOIRES[tId];
          if (!t) return reply("❌ Territoire inconnu.");
          const structs = empire.structuresActives.filter((x: any) => x.territoire === tId);
          return reply(
            `${t.emoji} **${t.nom}**\n\n💰 Revenu: **${FM(t.revenu)}/h** · ⚠️ Risque: ${"🔴".repeat(t.risque)}\n` +
            `🛡️ Protection: **${t.protection}/5**\n📊 Statut: **${empire.territoires.includes(tId) ? "✅ Possédé" : "🔒 Non acquis"}**\n` +
            `🏗️ Structures: **${structs.length > 0 ? structs.map((x: any) => STRUCTURES[x.type]?.nom).join(", ") : "Aucune"}**`
          );
        }
        return reply("❓ Usage: `empire territoire [list|buy|info] <ID>`");
      }

      // ── STRUCTURE ─────────────────────────────────────────────────────
      case "structure": case "build": {
        const s = (args[1] || "list").toLowerCase();
        if (s === "list") {
          const lines = Object.entries(STRUCTURES).map(([id, st]: [string, any]) =>
            `${st.emoji} **${st.nom}** [${id}] · **${FM(st.cout)}**` +
            (st.capacite > 0 ? ` · +${st.capacite} capacité` : "") +
            (st.revenuBonus > 0 ? ` · +${pct(st.revenuBonus)} revenus` : "")
          ).join("\n");
          return reply(`🏗️ **STRUCTURES DISPONIBLES**\n\n${lines}\n\nConstruire: \`empire structure build <TYPE> <TERR_ID>\``);
        }
        if (s === "build") {
          const type = (args[2] || "").toUpperCase();
          const tId  = (args[3] || "").toUpperCase();
          const st = STRUCTURES[type];
          if (!st) return reply("❌ Structure inconnue. Voir `empire structure list`.");
          if (!empire.territoires.includes(tId)) return reply(`❌ Vous ne possédez pas ce territoire (**${tId}**).`);
          const total = wallet + empire.argentPropre;
          if (total < st.cout) return reply(`❌ Fonds insuffisants. Coût: **${FM(st.cout)}** · Disponible: **${FM(total)}**`);
          let reste = st.cout;
          if (empire.argentPropre >= reste) { empire.argentPropre -= reste; }
          else { reste -= empire.argentPropre; empire.argentPropre = 0; await money.setItem(input.senderID, { money: wallet - reste }); }
          empire.structuresActives.push({ type, territoire: tId, id: `${type}_${tId}_${Date.now()}` });
          addTx(empire, "construction", -st.cout, `Construction: ${st.nom} sur ${tId}`);
          await save();
          return reply(
            `${st.emoji} **STRUCTURE CONSTRUITE: ${st.nom}**\n\n` +
            `Territoire: **${TERRITOIRES[tId]?.nom || tId}** · Coût: **${FM(st.cout)}**\n` +
            (st.capacite > 0 ? `📦 Capacité: **+${st.capacite}**\n` : "") +
            (st.revenuBonus > 0 ? `📈 Bonus revenus: **+${pct(st.revenuBonus)}**` : "")
          );
        }
        return reply("❓ Usage: `empire structure [list|build] <TYPE> <TERR_ID>`");
      }

      // ── MARKET ────────────────────────────────────────────────────────
      case "market": case "marche": {
        const fluctu = () => 0.85 + Math.random() * 0.30;
        const lines = Object.entries(PRODUITS).map(([id, p]: [string, any]) => {
          const f = fluctu();
          const stock = empire.inventaire[id] || 0;
          return `${p.emoji} **${p.nom}** [${id}]\n` +
            `  🛒 ${FM(Math.floor(p.prixAchat * f))} · 💸 ${FM(Math.floor(p.prixVente * f))} · ⚠️ ${"🔴".repeat(p.risque)} · 📦 **${stock}**`;
        }).join("\n\n");
        return reply(
          `🕶️ **MARCHÉ NOIR**\n\n${lines}\n\n` +
          `📦 Inventaire: **${getQuantiteInventaire(empire)}/${getCapaciteMax(empire)}**\n\n` +
          `• \`empire buy <ID> <qte>\`\n• \`empire sell <ID> <qte>\``
        );
      }

      // ── BUY ───────────────────────────────────────────────────────────
      case "buy": case "acheter": {
        const pId  = (args[1] || "").toUpperCase();
        const qte  = parseInt(args[2]) || 1;
        const p    = PRODUITS[pId];
        if (!p) return reply("❌ Produit inconnu. Voir `empire market`.");
        const pUnit = Math.floor(p.prixAchat * (0.85 + Math.random() * 0.30));
        const total = pUnit * qte;
        const capMax = getCapaciteMax(empire);
        if (getQuantiteInventaire(empire) + qte > capMax)
          return reply(`❌ Capacité insuffisante. Place restante: **${capMax - getQuantiteInventaire(empire)}**`);
        const avail = wallet + empire.argentPropre;
        if (avail < total) return reply(`❌ Fonds insuffisants. Coût: **${FM(total)}** · Disponible: **${FM(avail)}**`);
        let reste = total;
        if (empire.argentPropre >= reste) { empire.argentPropre -= reste; }
        else { reste -= empire.argentPropre; empire.argentPropre = 0; await money.setItem(input.senderID, { money: wallet - reste }); }
        empire.inventaire[pId] = (empire.inventaire[pId] || 0) + qte;
        addTx(empire, "achat_marche", -total, `Achat ${qte}x ${p.nom}`);
        await save();
        return reply(
          `${p.emoji} **ACHAT EFFECTUÉ!**\n\n${qte}x **${p.nom}** · ${FM(pUnit)}/u · Total: **${FM(total)}**\n📦 Stock: **${empire.inventaire[pId]}**`
        );
      }

      // ── SELL ──────────────────────────────────────────────────────────
      case "sell": case "vendre": {
        const pId  = (args[1] || "").toUpperCase();
        const qte  = parseInt(args[2]) || 1;
        const p    = PRODUITS[pId];
        if (!p) return reply("❌ Produit inconnu. Voir `empire market`.");
        if ((empire.inventaire[pId] || 0) < qte)
          return reply(`❌ Stock insuffisant. Vous avez **${empire.inventaire[pId] || 0}** unité(s).`);
        const hacker = empire.allies.includes("HACKER");
        const pUnit  = Math.floor(p.prixVente * (0.85 + Math.random() * 0.30) * (hacker ? 1.30 : 1));
        const gain   = pUnit * qte;
        if (Math.random() * 100 < p.risque * 5 - empire.tauxCorruption / 2) {
          empire.inventaire[pId] -= qte;
          if (empire.inventaire[pId] <= 0) delete empire.inventaire[pId];
          empire.prisEnChasse = true;
          await save();
          return reply(`🚔 **INTERCEPTION!**\n\n**${qte}x ${p.nom}** saisi(e)s. Aucun revenu.\n⚠️ Vous êtes en fuite!`);
        }
        empire.inventaire[pId] -= qte;
        if (empire.inventaire[pId] <= 0) delete empire.inventaire[pId];
        empire.argentSale += gain;
        empire.totalGagne += gain;
        empire.xp += Math.floor(gain / 5_000);
        addTx(empire, "vente_marche", gain, `Vente ${qte}x ${p.nom}`);
        const ach = checkAchievements(empire);
        await save();
        return reply(
          `${p.emoji} **VENTE EFFECTUÉE!**\n\n${qte}x **${p.nom}** · ${FM(pUnit)}/u${hacker ? " (+30% Zero-X)" : ""}\n` +
          `💰 **+${FM(gain)}** · Argent sale: **${FM(empire.argentSale)}**` +
          (ach.length ? `\n🏆 **${ach.join(", ")}**` : "")
        );
      }

      // ── INVENTORY ─────────────────────────────────────────────────────
      case "inventory": case "inventaire": case "inv": {
        const capMax = getCapaciteMax(empire);
        const invQte = getQuantiteInventaire(empire);
        if (invQte === 0)
          return reply(`📦 **INVENTAIRE** (0/${capMax})\n\nInventaire vide.\nAchetez sur: \`empire market\``);
        const lines = Object.entries(empire.inventaire as Record<string, number>)
          .filter(([, q]) => q > 0)
          .map(([id, q]) => { const p = PRODUITS[id]; return p ? `${p.emoji} **${p.nom}**: ${q} unités` : null; })
          .filter(Boolean).join("\n");
        return reply(`📦 **INVENTAIRE** (${invQte}/${capMax})\n\n${lines}\n\nVendre: \`empire sell <ID> <qte>\``);
      }

      // ── MISSION ───────────────────────────────────────────────────────
      case "mission": {
        const s = (args[1] || "list").toLowerCase();
        const curRang = getRang(empire);

        if (s === "list") {
          const lines = MISSIONS.map((m, i) => {
            const ok = m.difficulte <= Math.ceil(curRang.bonus * 20 + 1) || empire.reputation >= m.difficulte * 150;
            return `**[${i + 1}] ${m.nom}**\n` +
              `  🎖️ ${"⭐".repeat(m.difficulte)} · ⏱️ ${m.duree}min · 💰 ${FM(m.gain[0])}–${FM(m.gain[1])}\n` +
              `  💵 ${FM(m.cout)} · ⚠️ ${m.risque}% · ${ok ? "✅ Accessible" : `🔒 Rép requise: **${m.difficulte * 150}**`}`;
          }).join("\n\n");
          return reply(`🎯 **MISSIONS DISPONIBLES**\n\n${lines}\n\nLancer: \`empire mission start <N°>\``);
        }

        if (s === "check") {
          if (!empire.missionEnCours) return reply("❌ Aucune mission en cours.");
          const m = MISSIONS.find(x => x.id === empire.missionEnCours.missionId);
          const restant = empire.missionEnCours.finAt - Date.now();
          if (restant > 0)
            return reply(`⏳ **Mission en cours: "${m?.nom}"**\nTemps restant: **${Math.ceil(restant / 60_000)} minutes**`);
          const success = Math.random() * 100 > (m?.risque || 50);
          let msg = "";
          if (success && m) {
            let gain = rand(m.gain[0], m.gain[1]);
            if (empire.allies.includes("MERCENAIRE")) gain = Math.floor(gain * 1.20);
            empire.argentSale += gain;
            empire.totalGagne += gain;
            empire.xp += m.xp;
            empire.reputation = Math.min(1000, empire.reputation + m.difficulte * 5);
            empire.missionsCompletes++;
            addTx(empire, "mission_succes", gain, `Mission réussie: ${m.nom}`);
            msg = `✅ **MISSION RÉUSSIE: ${m.nom}**\n\n💰 **+${FM(gain)}** · XP: **+${m.xp}** · Rép: **+${m.difficulte * 5}**`;
          } else if (m) {
            const amende = Math.floor(empire.argentSale * 0.10);
            empire.argentSale = Math.max(0, empire.argentSale - amende);
            empire.prisEnChasse = true;
            empire.nbArrestes++;
            addTx(empire, "mission_echec", -amende, `Mission échouée: ${m.nom}`);
            msg = `❌ **MISSION ÉCHOUÉE: ${m.nom}**\n\n🚔 Arrestation. Amende: **${FM(amende)}**\n⚠️ Vous êtes en fuite.`;
          }
          empire.missionEnCours = null;
          empire.lastMission = Date.now();
          const ach = checkAchievements(empire);
          await save();
          if (ach.length) msg += `\n🏆 **${ach.join(", ")}**`;
          return reply(msg);
        }

        if (s === "cancel" || s === "annuler") {
          if (!empire.missionEnCours) return reply("❌ Aucune mission en cours.");
          const m = MISSIONS.find(x => x.id === empire.missionEnCours.missionId);
          const remb = Math.floor(empire.missionEnCours.cout * 0.50);
          empire.argentPropre += remb;
          empire.missionEnCours = null;
          empire.lastMission = Date.now();
          await save();
          return reply(`🔄 **"${m?.nom}"** annulée.\nRemboursement (50%): **${FM(remb)}**`);
        }

        if (s === "start") {
          if (empire.missionEnCours) {
            const rest = Math.ceil((empire.missionEnCours.finAt - Date.now()) / 60_000);
            return reply(`⚠️ Mission déjà en cours. Fin dans **${rest} min**.\nTapez \`empire mission check\`.`);
          }
          const cd = timeLeft(empire.lastMission, COOLDOWNS.MISSION);
          if (cd) return reply(`⏰ Cooldown mission: **${cd}**.`);
          const num = parseInt(args[2]) - 1;
          if (isNaN(num) || num < 0 || num >= MISSIONS.length)
            return reply(`❌ Numéro invalide (1–${MISSIONS.length}).`);
          const m = MISSIONS[num];
          const ok = m.difficulte <= Math.ceil(curRang.bonus * 20 + 1) || empire.reputation >= m.difficulte * 150;
          if (!ok) return reply(`🔒 Inaccessible. Réputation requise: **${m.difficulte * 150}** (votre rép: **${empire.reputation}**)`);
          if (m.cout > 0 && empire.argentPropre < m.cout)
            return reply(`❌ Coût: **${FM(m.cout)}**. Argent propre insuffisant.`);
          if (m.cout > 0) empire.argentPropre -= m.cout;
          empire.missionEnCours = { missionId: m.id, finAt: Date.now() + m.duree * 60_000, cout: m.cout };
          await save();
          return reply(
            `🎯 **MISSION LANCÉE: ${m.nom}**\n\n⏱️ Durée: **${m.duree} min** · Coût: **${FM(m.cout)}** · Risque: **${m.risque}%**\n\n` +
            `Tapez \`empire mission check\` dans **${m.duree} min**.`
          );
        }
        return reply("❓ Usage: `empire mission [list|start|check|cancel]`");
      }

      // ── ALLY ──────────────────────────────────────────────────────────
      case "ally": case "allie": {
        const s = (args[1] || "list").toLowerCase();
        if (s === "list") {
          const lines = Object.entries(ALLIES).map(([id, a]: [string, any]) =>
            `${a.emoji} **${a.nom}** [${id}]\n  💵 ${FM(a.cout)} · ✨ ${a.effet}\n  ${empire.allies.includes(id) ? "✅ RECRUTÉ" : "🔒 Non recruté"}`
          ).join("\n\n");
          return reply(`🤝 **ALLIÉS DISPONIBLES**\n\n${lines}\n\nRecruter: \`empire ally buy <ID>\``);
        }
        if (s === "buy" || s === "acheter") {
          const aId = (args[2] || "").toUpperCase();
          const a = ALLIES[aId];
          if (!a) return reply("❌ Allié inconnu. Voir `empire ally list`.");
          if (empire.allies.includes(aId)) return reply("❌ Vous avez déjà recruté cet allié.");
          const avail = wallet + empire.argentPropre;
          if (avail < a.cout) return reply(`❌ Fonds insuffisants. Coût: **${FM(a.cout)}** · Disponible: **${FM(avail)}**`);
          let reste = a.cout;
          if (empire.argentPropre >= reste) { empire.argentPropre -= reste; }
          else { reste -= empire.argentPropre; empire.argentPropre = 0; await money.setItem(input.senderID, { money: wallet - reste }); }
          empire.allies.push(aId);
          if (["POLICIER","POLITICIEN","JUGE"].includes(aId)) empire.tauxCorruption = Math.min(100, empire.tauxCorruption + (aId === "POLICIER" ? 30 : aId === "POLITICIEN" ? 20 : 15));
          empire.reputation = Math.min(1000, empire.reputation + 30);
          addTx(empire, "recrutement", -a.cout, `Recrutement: ${a.nom}`);
          const ach = checkAchievements(empire);
          await save();
          return reply(
            `${a.emoji} **ALLIÉ RECRUTÉ: ${a.nom}**\n\n💵 Coût: **${FM(a.cout)}** · ✨ ${a.effet}\n🎯 Réputation: **+30**` +
            (ach.length ? `\n🏆 **${ach.join(", ")}**` : "")
          );
        }
        return reply("❓ Usage: `empire ally [list|buy] <ID>`");
      }

      // ── LAUNDER ───────────────────────────────────────────────────────
      case "launder": case "blanchir": {
        const s = (args[1] || "list").toLowerCase();
        if (s === "list") {
          const lines = Object.entries(BLANCHIMENT_METHODES).map(([id, m]: [string, any]) =>
            `${m.emoji} **${m.nom}** [${id}]\n  💵 Ratio: **${pct(m.ratio)}** · Frais: **${pct(m.frais)}** · ⏱️ 4h`
          ).join("\n\n");
          return reply(
            `🧼 **BLANCHIMENT D'ARGENT**\n\n💀 Argent sale: **${FM(empire.argentSale)}**\n\n${lines}\n\n` +
            `\`empire launder <METHODE> <montant>\`\n⚠️ L'argent sale ne peut PAS être dépensé directement.`
          );
        }
        if (s === "check" || s === "collect") {
          if (!empire.blanchimentEnCours) return reply("❌ Aucun blanchiment en cours.");
          const restant = empire.blanchimentEnCours.finAt - Date.now();
          if (restant > 0) {
            const h = Math.floor(restant / 3_600_000);
            const m = Math.floor((restant % 3_600_000) / 60_000);
            return reply(`⏳ Blanchiment en cours. Fin dans **${h}h ${m}m**.\nTapez \`empire launder check\` pour récupérer.`);
          }
          const meth = BLANCHIMENT_METHODES[empire.blanchimentEnCours.methode];
          const obtenu = Math.floor(empire.blanchimentEnCours.montant * meth.ratio);
          empire.argentPropre += obtenu;
          empire.totalBlanchit += obtenu;
          empire.blanchimentEnCours = null;
          empire.lastBlanchiment = Date.now();
          addTx(empire, "blanchiment", obtenu, `Blanchiment: ${meth.nom}`);
          const ach = checkAchievements(empire);
          await save();
          return reply(
            `${meth.emoji} **BLANCHIMENT TERMINÉ!**\n\n💰 **+${FM(obtenu)}** argent propre récupéré\n` +
            `📊 Total blanchi: **${FM(empire.totalBlanchit)}**` +
            (ach.length ? `\n🏆 **${ach.join(", ")}**` : "")
          );
        }
        if (empire.blanchimentEnCours && empire.blanchimentEnCours.finAt > Date.now()) {
          const restant = empire.blanchimentEnCours.finAt - Date.now();
          const h = Math.floor(restant / 3_600_000);
          const m = Math.floor((restant % 3_600_000) / 60_000);
          return reply(`⏳ Blanchiment déjà en cours. Fin dans **${h}h ${m}m**.\nTapez \`empire launder check\`.`);
        }
        const cd = timeLeft(empire.lastBlanchiment, COOLDOWNS.BLANCHIMENT);
        if (cd) return reply(`⏰ Blanchiment disponible dans **${cd}**.`);
        const methId = s.toUpperCase();
        const meth = BLANCHIMENT_METHODES[methId];
        if (!meth) return reply("❌ Méthode inconnue. Voir `empire launder list`.");
        const montant = parseInt(args[2]);
        if (!montant || montant < 10_000) return reply("❌ Montant minimum: **$10 000**.");
        if (montant > empire.argentSale) return reply(`❌ Vous avez seulement **${FM(empire.argentSale)}** d'argent sale.`);
        empire.argentSale -= montant;
        empire.blanchimentEnCours = { methode: methId, montant, finAt: Date.now() + COOLDOWNS.BLANCHIMENT };
        await save();
        return reply(
          `${meth.emoji} **BLANCHIMENT LANCÉ!**\n\nMéthode: **${meth.nom}**\nMontant: **${FM(montant)}** · Frais: **${FM(Math.floor(montant * meth.frais))}**\n` +
          `Récupération dans **4h**: **${FM(Math.floor(montant * meth.ratio))}**\n\nTapez \`empire launder check\` dans 4h.`
        );
      }

      // ── WAR ───────────────────────────────────────────────────────────
      case "war": case "guerre": {
        const s = (args[1] || "stats").toLowerCase();
        if (s === "stats" || s === "stat") {
          const total = empire.guerresGagnees + empire.guerresPerdues;
          return reply(
            `⚔️ **BILAN DE GUERRE**\n\n🏆 Gagnées: **${empire.guerresGagnees}** · 💀 Perdues: **${empire.guerresPerdues}**\n` +
            `📊 Ratio: **${total > 0 ? pct(empire.guerresGagnees / total) : "N/A"}**\n\nAttaquer: \`empire war attack <ID_TERRITOIRE>\``
          );
        }
        if (s === "attack" || s === "attaquer") {
          const cd = timeLeft(empire.lastGuerre, COOLDOWNS.GUERRE);
          if (cd) return reply(`⏰ Guerre disponible dans **${cd}**.`);
          const tId = (args[2] || "").toUpperCase();
          const t = TERRITOIRES[tId];
          if (!t) return reply("❌ Territoire inconnu.");
          if (empire.territoires.includes(tId)) return reply("❌ Vous possédez déjà ce territoire.");
          const coutGuerre = Math.floor(t.cout * 0.20);
          if (empire.argentPropre < coutGuerre)
            return reply(`❌ Fonds insuffisants. Besoin: **${FM(coutGuerre)}** argent propre.`);
          empire.argentPropre -= coutGuerre;
          let chance = Math.min(0.85, 0.45 + (empire.allies.includes("MERCENAIRE") ? 0.25 : 0) + empire.guerresGagnees * 0.02);
          const victoire = Math.random() < chance;
          if (victoire) {
            empire.territoires.push(tId);
            empire.guerresGagnees++;
            empire.reputation = Math.min(1000, empire.reputation + t.risque * 30);
            empire.xp += 500;
            addTx(empire, "guerre_victoire", t.revenu, `Territoire capturé: ${t.nom}`);
            empire.lastGuerre = Date.now();
            const ach = checkAchievements(empire);
            await save();
            return reply(
              `⚔️ **VICTOIRE MILITAIRE!**\n\n🗺️ ${t.emoji} **${t.nom}** conquis!\n` +
              `📈 Revenu: **+${FM(t.revenu)}/h** · Rép: **+${t.risque * 30}** · XP: **+500**` +
              (ach.length ? `\n🏆 **${ach.join(", ")}**` : "")
            );
          }
          const perte = Math.floor(empire.argentSale * 0.10);
          empire.argentSale = Math.max(0, empire.argentSale - perte);
          empire.guerresPerdues++;
          empire.lastGuerre = Date.now();
          addTx(empire, "guerre_defaite", -perte - coutGuerre, `Défaite sur: ${t.nom}`);
          await save();
          return reply(
            `💀 **DÉFAITE!**\n\nL'attaque de ${t.emoji} **${t.nom}** a échoué.\n` +
            `💰 Perte argent sale: **${FM(perte)}** · Coût guerre: **${FM(coutGuerre)}**\n💡 Recrutez un Mercenaire pour augmenter vos chances.`
          );
        }
        return reply("❓ Usage: `empire war [stats|attack] <TERRITOIRE_ID>`");
      }

      // ── RANK ──────────────────────────────────────────────────────────
      case "rank": case "rang": {
        const r = getRang(empire);
        const nextIdx = RANGS.findIndex(x => x.id === r.id) + 1;
        const next = RANGS[nextIdx] || null;
        let txt =
          `${r.emoji} **RANG: ${r.nom}**\n${LINE}\n\n` +
          `📊 Gains totaux: **${FM(empire.totalGagne)}** · XP: **${empire.xp.toLocaleString("fr-FR")}**\n` +
          `🎯 Réputation: **${empire.reputation}/1000** · Bonus: **+${pct(r.bonus)}**`;
        if (next) txt += `\n\n⬆️ Prochain: **${next.emoji} ${next.nom}**\n   Requis: **${FM(next.min)}** · Manque: **${FM(Math.max(0, next.min - empire.totalGagne))}**`;
        else txt += "\n\n👑 **Rang MAXIMUM atteint!**";
        txt += `\n\n${LINE}\n`;
        txt += RANGS.map(rx => `${rx.id === r.id ? "▶️" : "  "} ${rx.emoji} ${rx.nom} — dès ${FM(rx.min)}`).join("\n");
        return reply(txt);
      }

      // ── ACHIEVEMENTS ──────────────────────────────────────────────────
      case "achievements": case "succes": {
        const total = Object.keys(ACH_INFO).length;
        const unlocked = empire.achievements.slice(0, 10).map((id: string, i: number) => {
          const info = ACH_INFO[id] || { emoji: "🏆", nom: id };
          return `${i + 1}. ${info.emoji} **${info.nom}**`;
        }).join("\n");
        const remaining = Object.entries(ACH_INFO)
          .filter(([id]) => !empire.achievements.includes(id))
          .slice(0, 5)
          .map(([, info]: [string, any]) => `• ${info.emoji} **${info.nom}**: ${info.desc}`)
          .join("\n");
        return reply(
          `🏆 **SUCCÈS** — ${empire.achievements.length}/${total}\n\n` +
          (unlocked
            ? `**Débloqués:**\n${unlocked}${empire.achievements.length > 10 ? `\n... et ${empire.achievements.length - 10} de plus!` : ""}\n\n`
            : "🎯 Aucun succès débloqué. Commencez à construire votre empire!\n\n") +
          (remaining ? `**Prochains objectifs:**\n${remaining}` : "🎉 Tous les succès débloqués!")
        );
      }

      // ── LEADERBOARD ───────────────────────────────────────────────────
      case "leaderboard": case "classement": {
        const allCache = await money.getAllCache();
        const joueurs: any[] = [];
        for (const [, u] of Object.entries<any>(allCache)) {
          const e = u.empire;
          if (e && e.totalGagne > 0) {
            joueurs.push({
              nom: u.name || "Unknown",
              wealth: (e.argentPropre || 0) + (e.argentSale || 0) + (e.vault || 0),
              totalGagne: e.totalGagne,
              rang: getRang(e),
              premium: e.premium || false,
              ach: e.achievements?.length || 0,
            });
          }
        }
        joueurs.sort((a, b) => b.wealth - a.wealth);
        if (joueurs.length === 0) return reply("📊 Aucun joueur classé pour le moment.");
        const medals = ["🥇", "🥈", "🥉"];
        const lines = joueurs.slice(0, 10).map((j, i) =>
          `${medals[i] || `**#${i + 1}**`} **${j.nom}**${j.premium ? " 💎" : ""}\n` +
          `  ${j.rang.emoji} ${j.rang.nom} · 💰 **${FM(j.wealth)}** · 📈 ${FM(j.totalGagne)}${j.ach > 0 ? ` · 🏆 ${j.ach}` : ""}`
        ).join("\n\n");
        return reply(
          `👑 **CLASSEMENT EMPIRE**\n${LINE}\n**TOP 10 DES PARRAINS**\n\n${lines}\n\n` +
          `👑 Légende: $1Mrd+ · 💀 Boss: $100M+ · 🎖️ Capo: $10M+`
        );
      }

      // ── CREDIT ────────────────────────────────────────────────────────
      case "credit": case "creditscore": {
        const sc = empire.creditScore;
        const rating = sc >= 800 ? "Excellent 🟢" : sc >= 700 ? "Bon 🟢" : sc >= 600 ? "Moyen 🟡" : sc >= 500 ? "Faible 🟠" : "Mauvais 🔴";
        return reply(
          `📊 **RAPPORT DE CRÉDIT CRIMINEL**\n\nScore: **${sc}/850** (${rating})\n💳 Prêt max: **${FM(sc * 2000)}**\n` +
          `🏦 Taux: **${sc >= 750 ? "6%" : sc >= 650 ? "8%" : "10%"}**\n\n` +
          `**💡 Améliorer votre score:**\n• Remboursez vos prêts à temps (+15 pts)\n• Évitez les raids de police\n• Augmentez votre réputation`
        );
      }

      // ── PREMIUM ───────────────────────────────────────────────────────
      case "premium": {
        if ((args[1] || "").toLowerCase() === "buy") {
          if (empire.premium) return reply("💎 Vous êtes déjà Premium!");
          if (empire.argentPropre < 1_000_000)
            return reply(`❌ L'abonnement coûte **$1 000 000**. Vous avez **${FM(empire.argentPropre)}**.`);
          empire.argentPropre -= 1_000_000;
          empire.premium = true;
          empire.multiplier = 2.0;
          addTx(empire, "premium_purchase", -1_000_000, "Achat premium");
          await save();
          return reply("💎 **BIENVENUE AU CLUB PREMIUM!**\n\n✅ 2x les gains\n✅ Daily doublé\n✅ Multiplicateur: **2x**");
        }
        return reply(
          `💎 **ABONNEMENT PREMIUM**\n\nStatut: **${empire.premium ? "✅ Actif" : "❌ Inactif"}** · Multiplicateur: **${empire.multiplier}x**\nCoût: **$1 000 000**\n\n` +
          `Avantages: 2x gains · Daily doublé\n\n${!empire.premium ? "`empire premium buy` pour devenir premium!" : ""}`
        );
      }

      default:
        return reply(`❓ Commande inconnue: **${sub}**\n\nTapez \`empire help\` pour voir la liste.`);
    }
  }),
});

const style = command.style;
export default command;
