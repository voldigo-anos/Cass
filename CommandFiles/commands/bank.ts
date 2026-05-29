import { UNIRedux, UNISpectra } from "@cassidy/unispectra";
import { defineCommand, defineEntry } from "@cass/define";

// ══════════════════════════════════════════════════════════════════════════════
// ─── MARKET DATA ──────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

const STOCKS: Record<string, any> = {
  AAPL:  { price: 150.25, change:  2.1, name: "Apple Inc."         },
  GOOGL: { price: 2800.50,change:  1.8, name: "Alphabet Inc."      },
  TSLA:  { price: 800.75, change: -0.5, name: "Tesla Inc."         },
  MSFT:  { price: 320.40, change:  1.2, name: "Microsoft Corp."    },
  AMZN:  { price: 3200.00,change:  0.8, name: "Amazon.com Inc."    },
  META:  { price: 330.00, change:  2.5, name: "Meta Platforms Inc."},
  NVDA:  { price: 450.00, change:  3.2, name: "NVIDIA Corp."       },
  NFLX:  { price: 380.00, change: -1.1, name: "Netflix Inc."       },
};

const CRYPTO: Record<string, any> = {
  BTC:   { price: 45000,  change: 3.2, name: "Bitcoin"       },
  ETH:   { price: 3200,   change: 2.8, name: "Ethereum"      },
  BNB:   { price: 400,    change: 1.5, name: "Binance Coin"  },
  ADA:   { price: 1.20,   change: 4.1, name: "Cardano"       },
  SOL:   { price: 120.00, change: 3.8, name: "Solana"        },
  MATIC: { price: 0.85,   change: 5.1, name: "Polygon"       },
  LINK:  { price: 28.00,  change: 1.9, name: "Chainlink"     },
  DOT:   { price: 25.50,  change: 2.3, name: "Polkadot"      },
};

const BONDS: Record<string, any> = {
  US_TREASURY: { yield: 2.5, risk: "Low",    term: "10 Year" },
  CORPORATE:   { yield: 3.8, risk: "Medium", term: "5 Year"  },
  MUNICIPAL:   { yield: 2.1, risk: "Low",    term: "7 Year"  },
  HIGH_YIELD:  { yield: 6.2, risk: "High",   term: "3 Year"  },
};

const PROPERTIES: Record<string, any> = {
  APARTMENT: { price: 250_000,    income: 2_500,   name: "City Apartment"        },
  HOUSE:     { price: 500_000,    income: 4_000,   name: "Suburban House"         },
  MANSION:   { price: 2_000_000,  income: 15_000,  name: "Luxury Mansion"         },
  OFFICE:    { price: 1_000_000,  income: 8_000,   name: "Commercial Office"      },
  WAREHOUSE: { price: 750_000,    income: 6_000,   name: "Industrial Warehouse"   },
  MALL:      { price: 5_000_000,  income: 40_000,  name: "Shopping Mall"          },
};

const VEHICLES: Record<string, any> = {
  TOYOTA:      { price: 25_000,    depreciation: 0.85, name: "Toyota Camry"          },
  BMW:         { price: 60_000,    depreciation: 0.70, name: "BMW M3"                },
  FERRARI:     { price: 300_000,   depreciation: 0.90, name: "Ferrari 488"           },
  LAMBORGHINI: { price: 400_000,   depreciation: 0.85, name: "Lamborghini Huracan"   },
  ROLLS_ROYCE: { price: 500_000,   depreciation: 0.80, name: "Rolls-Royce Phantom"   },
  BUGATTI:     { price: 3_000_000, depreciation: 0.75, name: "Bugatti Chiron"        },
};

const BUSINESSES: Record<string, any> = {
  COFFEE_SHOP:  { cost: 50_000,      income: 5_000,     employees: 3,    name: "Coffee Shop"     },
  RESTAURANT:   { cost: 150_000,     income: 12_000,    employees: 8,    name: "Restaurant"       },
  TECH_STARTUP: { cost: 500_000,     income: 50_000,    employees: 20,   name: "Tech Startup"     },
  HOTEL:        { cost: 2_000_000,   income: 150_000,   employees: 50,   name: "Hotel Chain"      },
  BANK:         { cost: 10_000_000,  income: 800_000,   employees: 200,  name: "Regional Bank"    },
  AIRLINE:      { cost: 50_000_000,  income: 3_000_000, employees: 1000, name: "Airline Company"  },
};

const LUXURY_ITEMS: Record<string, any> = {
  ROLEX:       { price: 15_000,       name: "Rolex Submariner"    },
  PAINTING:    { price: 100_000,      name: "Van Gogh Replica"    },
  DIAMOND:     { price: 50_000,       name: "5 Carat Diamond"     },
  YACHT:       { price: 2_000_000,    name: "Luxury Yacht"        },
  PRIVATE_JET: { price: 25_000_000,   name: "Private Jet"         },
  ISLAND:      { price: 100_000_000,  name: "Private Island"      },
};

const SHOP_ITEMS: Record<string, any> = {
  CREDIT_BOOST:    { price: 50_000,    name: "Credit Score Boost (+50)",    desc: "Instantly increase your credit score by 50 points"  },
  MULTIPLIER:      { price: 1_000_000, name: "Earnings Multiplier 1.5x",    desc: "Increase all earnings by 50%"                       },
  INSURANCE_BUNDLE:{ price: 100_000,   name: "Full Insurance Package",       desc: "Get all insurance types at a discount"              },
  LOTTERY_PACK:    { price: 5_000,     name: "Lottery Ticket Pack (100x)",   desc: "Get 100 lottery tickets at once"                    },
  SKILL_BOOST:     { price: 25_000,    name: "Skill Training",               desc: "Increase all skills by 10 levels"                   },
  PREMIUM_TRIAL:   { price: 100_000,   name: "Premium Trial",                desc: "Try premium features"                               },
};

const INSURANCE_TYPES: Record<string, any> = {
  LIFE:     { cost: 10_000,  coverage: 100_000, name: "Life Insurance"      },
  HEALTH:   { cost: 5_000,   coverage: 50_000,  name: "Health Insurance"    },
  PROPERTY: { cost: 15_000,  coverage: 200_000, name: "Property Insurance"  },
  BUSINESS: { cost: 25_000,  coverage: 500_000, name: "Business Insurance"  },
  THEFT:    { cost: 8_000,   coverage: 75_000,  name: "Theft Protection"    },
};

const JOBS = [
  { name: "Delivery Driver", min: 500,   max: 1_500  },
  { name: "Data Entry",      min: 300,   max: 800    },
  { name: "Freelancer",      min: 1_000, max: 3_000  },
  { name: "Consultant",      min: 2_000, max: 5_000  },
  { name: "Manager",         min: 3_000, max: 7_000  },
];

// ══════════════════════════════════════════════════════════════════════════════
// ─── HELPERS ──────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

const FM = (n: number) => `$${Math.floor(n).toLocaleString("en-US")}`;
const LINE = "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━";

function initBank() {
  return {
    balance: 0, savings: 0, vault: 0, loan: 0, loanDate: null,
    creditScore: 750, bankLevel: 1, multiplier: 1.0, premium: false,
    streak: 0, lastDaily: null, lastWork: null, lastRob: null,
    lastInterest: Date.now(), lotteryTickets: 0, achievements: [],
    reputation: 0, frozen: false,
    skills: { gambling: 0, trading: 0, business: 0, investing: 0 },
    stocks: {}, crypto: {}, bonds: {},
    realEstate: [], businesses: [], vehicles: [], luxury: [],
    insurance: {}, transactions: [],
  };
}

function addTx(bank: any, type: string, amount: number, description: string) {
  bank.transactions.push({ type, amount, description, date: Date.now() });
  if (bank.transactions.length > 30) bank.transactions = bank.transactions.slice(-30);
}

function txEmoji(type: string): string {
  const map: Record<string, string> = {
    deposit: "💰", withdrawal: "💸", transfer_in: "📥", transfer_out: "📤",
    loan: "🏦", loan_repayment: "💳", savings_deposit: "🏛️", savings_withdrawal: "🏛️",
    interest_earned: "📈", interest_charged: "📉", stock_purchase: "📊",
    stock_sale: "📊", crypto_purchase: "₿", crypto_sale: "₿",
    bond_purchase: "🏛️", business_purchase: "🏢", business_income: "💼",
    property_purchase: "🏠", rental_income: "🏠", vehicle_purchase: "🚗",
    luxury_purchase: "💎", salary: "💼", daily_reward: "🎁",
    gambling_win: "🎰", gambling_loss: "💸", vault_deposit: "🔐",
    vault_withdrawal: "🔓", robbery_success: "🏴‍☠️", robbed: "😱",
  };
  return map[type] || "💼";
}

function calcPortfolio(bank: any): number {
  let total = 0;
  for (const [s, n] of Object.entries<number>(bank.stocks)) total += n * (STOCKS[s]?.price || 100);
  for (const [c, n] of Object.entries<number>(bank.crypto)) total += n * (CRYPTO[c]?.price || 1);
  for (const [, n] of Object.entries<number>(bank.bonds)) total += n;
  return total;
}
function calcRealEstate(bank: any): number { return (bank.realEstate || []).reduce((t: number, p: any) => t + p.value, 0); }
function calcBusiness(bank: any): number   { return (bank.businesses || []).reduce((t: number, b: any) => t + (BUSINESSES[b.type]?.cost || 0) * b.level, 0); }
function calcVehicles(bank: any): number   { return (bank.vehicles || []).reduce((t: number, v: any) => t + v.currentValue, 0); }
function calcLuxury(bank: any): number     { return (bank.luxury || []).reduce((t: number, i: any) => t + i.value, 0); }

function wealthTier(total: number): { label: string; emoji: string } {
  if (total >= 1_000_000_000) return { label: "💎 Billionaire",  emoji: "👑" };
  if (total >= 1_000_000)     return { label: "🏆 Millionaire",  emoji: "⭐" };
  if (total >= 100_000)       return { label: "💰 Wealthy",      emoji: "✨" };
  if (total >= 10_000)        return { label: "📈 Rising",       emoji: "🚀" };
  return                             { label: "👤 Beginner",     emoji: "🔰" };
}

function creditRating(score: number): { label: string; color: string } {
  if (score >= 800) return { label: "Excellent", color: "🟢" };
  if (score >= 740) return { label: "Very Good", color: "🟢" };
  if (score >= 670) return { label: "Good",      color: "🟡" };
  if (score >= 580) return { label: "Fair",      color: "🟠" };
  return                   { label: "Poor",      color: "🔴" };
}

// ══════════════════════════════════════════════════════════════════════════════
// ─── COMMAND ──────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

const command = defineCommand({
  meta: {
    name: "bank",
    otherNames: ["bbank", "banque"],
    description: "🏦 Comprehensive banking system — invest, trade, build, gamble",
    version: "1.0.0",
    author: "Christus",
    category: "Economy",
    usage: "{prefix}{name} help",
    role: 0,
    noPrefix: false,
    waitingTime: 0,
    requirement: "3.0.0",
    icon: "🏦",
  },
  style: {
    title: "🏦 Banking System",
    titleFont: "bold",
    contentFont: "fancy",
  },

  entry: defineEntry(async (ctx) => {
    const { input, output, money } = ctx;
    const args = input.arguments ?? [];
    const sub  = (args[0] || "balance").toLowerCase();

    // ── Load data ──────────────────────────────────────────────────────────
    let userData: any = await money.getItem(input.senderID);
    if (!userData) userData = { money: 0, name: "Unknown" };
    if (!userData.bank) userData.bank = initBank();
    const bank    = userData.bank;
    const wallet  = userData.money ?? 0;

    const save = async () => {
      userData.bank = bank;
      await money.setItem(input.senderID, { bank });
    };

    if (bank.frozen && !["freeze", "balance", "bal", "help"].includes(sub)) {
      return output.replyStyled({ body: `🔒 **Account Frozen**\n\nAll transactions are blocked.\nUse \`bank freeze\` to unfreeze.` }, style);
    }

    const reply = (body: string) => output.replyStyled({ body }, style);

    // ══════════════════════════════════════════════════════════════════════
    switch (sub) {

      // ── HELP ─────────────────────────────────────────────────────────
      case "help":
        return reply(
          `🏦 **BANKING SYSTEM**\n${LINE}\n\n` +
          `**💰 BASIC BANKING**\n` +
          `• \`bank balance\` — Financial dashboard\n` +
          `• \`bank deposit <amount>\` — Deposit to bank\n` +
          `• \`bank withdraw <amount>\` — Withdraw from bank\n` +
          `• \`bank transfer @user <amount>\` — Send money\n` +
          `• \`bank loan <amount>\` — Get a loan\n` +
          `• \`bank repay <amount>\` — Repay loan\n` +
          `• \`bank savings [withdraw] <amount>\` — Savings account\n` +
          `• \`bank interest\` — Calculate & collect interest\n` +
          `• \`bank history\` — Transaction history\n` +
          `• \`bank daily\` — Daily reward (24h)\n` +
          `• \`bank work\` — Work for money (4h)\n` +
          `• \`bank freeze\` — Toggle account lock\n\n` +
          `**📈 INVESTMENTS**\n` +
          `• \`bank stocks [list|buy|sell]\` — Stock market\n` +
          `• \`bank crypto [list|buy|sell]\` — Cryptocurrency\n` +
          `• \`bank bonds [list|buy]\` — Government bonds\n` +
          `• \`bank portfolio\` — Your investment portfolio\n` +
          `• \`bank market\` — Market overview\n` +
          `• \`bank dividend\` — Collect dividends\n\n` +
          `**🏢 BUSINESS & REAL ESTATE**\n` +
          `• \`bank business [list|buy|collect]\` — Build empire\n` +
          `• \`bank property [list|buy]\` — Real estate\n` +
          `• \`bank rent\` — Collect rental income\n` +
          `• \`bank luxury [list|buy]\` — Luxury items\n` +
          `• \`bank car [list|buy]\` — Luxury vehicles\n\n` +
          `**🎰 GAMES**\n` +
          `• \`bank gamble <amount>\` — Risk/reward\n` +
          `• \`bank slots <amount>\` — Slot machine\n` +
          `• \`bank blackjack <amount>\` — Card game\n` +
          `• \`bank roulette <amount> <bet>\` — Roulette\n` +
          `• \`bank lottery [buy|check] [n]\` — Lottery\n\n` +
          `**⭐ PREMIUM & SOCIAL**\n` +
          `• \`bank premium [buy]\` — 2x earnings\n` +
          `• \`bank vault [deposit|withdraw] <amount>\` — Secure vault\n` +
          `• \`bank insurance [list|buy] <type>\` — Asset protection\n` +
          `• \`bank shop [list|buy] <item>\` — Upgrades\n` +
          `• \`bank credit\` — Credit score report\n` +
          `• \`bank achievements\` — Unlock rewards\n` +
          `• \`bank leaderboard\` — Top players\n` +
          `• \`bank rob @user\` — Steal money (risky!)`
        );

      // ── BALANCE ──────────────────────────────────────────────────────
      case "balance": case "bal": {
        const portfolio  = calcPortfolio(bank);
        const realEstate = calcRealEstate(bank);
        const biz        = calcBusiness(bank);
        const veh        = calcVehicles(bank);
        const lux        = calcLuxury(bank);
        const liquid     = wallet + bank.balance + bank.savings + bank.vault;
        const assets     = portfolio + realEstate + biz + veh + lux;
        const net        = liquid + assets;
        const tier       = wealthTier(net);
        const cr         = creditRating(bank.creditScore);
        return reply(
          `💳 **FINANCIAL DASHBOARD** ${tier.emoji}\n${LINE}\n` +
          `**${tier.label}** · Level **${bank.bankLevel}**${bank.premium ? " · 💎 Premium" : ""}\n\n` +
          `**💰 LIQUID ASSETS**\n` +
          `💵 Wallet: **${FM(wallet)}**\n` +
          `🏦 Bank: **${FM(bank.balance)}**\n` +
          `🏛️ Savings: **${FM(bank.savings)}**${bank.savings > 0 ? " (+3%/mo)" : ""}\n` +
          `🔐 Vault: **${FM(bank.vault)}**${bank.vault > 0 ? " (+1%/mo)" : ""}\n` +
          `└ Total Liquid: **${FM(liquid)}**\n\n` +
          `**📊 ASSET PORTFOLIO**\n` +
          `📈 Investments: **${FM(portfolio)}**\n` +
          `🏠 Real Estate: **${FM(realEstate)}**\n` +
          `🏢 Businesses: **${FM(biz)}**\n` +
          `🚗 Vehicles: **${FM(veh)}**\n` +
          `💎 Luxury: **${FM(lux)}**\n` +
          `└ Total Assets: **${FM(assets)}**\n\n` +
          `**🏆 WEALTH SUMMARY**\n` +
          `💎 Net Worth: **${FM(net)}**\n` +
          `${cr.color} Credit: **${bank.creditScore}/850** (${cr.label})\n` +
          `🎯 Max Loan: **${FM(bank.creditScore * 1000)}**\n` +
          `⚡ Multiplier: **${bank.multiplier}x**\n\n` +
          `**📈 STATS**\n` +
          `🔥 Streak: **${bank.streak} days** · 🏆 Achievements: **${bank.achievements.length}**\n` +
          `💸 Active Loan: **${bank.loan > 0 ? FM(bank.loan) : "None ✅"}**\n` +
          `🎰 Gambling: **${bank.skills.gambling}** · 📊 Trading: **${bank.skills.trading}**\n` +
          `🏢 Business: **${bank.skills.business}** · 📈 Investing: **${bank.skills.investing}**`
        );
      }

      // ── DEPOSIT ──────────────────────────────────────────────────────
      case "deposit": case "dep": {
        const amt = parseInt(args[1]);
        if (!amt || amt <= 0) return reply(`💰 **Deposit Help**\n\nUsage: \`bank deposit <amount>\`\nWallet: **${FM(wallet)}**`);
        if (wallet < amt) return reply(`❌ Insufficient wallet funds.\nWallet: **${FM(wallet)}** · Need: **${FM(amt)}**`);
        await money.setItem(input.senderID, { money: wallet - amt });
        bank.balance += amt;
        if (!bank.achievements.includes("First Deposit")) bank.achievements.push("First Deposit");
        if (amt >= 1_000_000 && !bank.achievements.includes("Million Dollar Deposit")) bank.achievements.push("Million Dollar Deposit");
        addTx(bank, "deposit", amt, "Cash deposit");
        await save();
        return reply(`✅ **Deposit Successful!**\n\n💵 Deposited: **${FM(amt)}**\n🏦 Bank Balance: **${FM(bank.balance)}**\n💳 Wallet Remaining: **${FM(wallet - amt)}**`);
      }

      // ── WITHDRAW ─────────────────────────────────────────────────────
      case "withdraw": case "wd": {
        const amt = parseInt(args[1]);
        if (!amt || amt <= 0) return reply(`💸 **Withdrawal Help**\n\nUsage: \`bank withdraw <amount>\`\nBank: **${FM(bank.balance)}**`);
        if (bank.balance < amt) return reply(`❌ Insufficient bank funds.\nBank: **${FM(bank.balance)}** · Need: **${FM(amt)}**`);
        bank.balance -= amt;
        await money.setItem(input.senderID, { money: wallet + amt });
        addTx(bank, "withdrawal", amt, "Cash withdrawal");
        await save();
        return reply(`✅ **Withdrawal Successful!**\n\n💵 Withdrawn: **${FM(amt)}**\n💳 New Wallet: **${FM(wallet + amt)}**\n🏦 Remaining Bank: **${FM(bank.balance)}**`);
      }

      // ── TRANSFER ─────────────────────────────────────────────────────
      case "transfer": case "send": {
        const targetID = Object.keys((input as any).mentions ?? {})[0] || input.detectID;
        const amt = parseInt(args[2] || args[1]);
        if (!targetID) return reply("❌ Please mention a user.\nUsage: `bank transfer @user <amount>`");
        if (targetID === input.senderID) return reply("❌ You cannot transfer to yourself.");
        if (!amt || amt <= 0) return reply("❌ Please enter a valid amount.");
        if (bank.balance < amt) return reply(`❌ Insufficient bank funds: **${FM(bank.balance)}**`);
        let targetData: any = await money.getItem(targetID);
        if (!targetData) return reply("❌ Target user not found in the database.");
        if (!targetData.bank) targetData.bank = initBank();
        bank.balance -= amt;
        targetData.bank.balance += amt;
        addTx(bank, "transfer_out", amt, `Transfer to ${targetID}`);
        addTx(targetData.bank, "transfer_in", amt, `Transfer from ${input.senderID}`);
        await money.setItem(targetID, { bank: targetData.bank });
        await save();
        return reply(`✅ **Transfer Successful!**\n\n📤 Sent: **${FM(amt)}**\n🏦 Your Bank Remaining: **${FM(bank.balance)}**`);
      }

      // ── LOAN ─────────────────────────────────────────────────────────
      case "loan": {
        const amt = parseInt(args[1]);
        const maxLoan = bank.creditScore * 1000;
        if (!amt || amt <= 0) return reply(
          `💳 **Loan Information**\n\nCredit Score: **${bank.creditScore}** · Max: **${FM(maxLoan)}**\n` +
          `Rate: **5%/week** · Current Loan: **${bank.loan > 0 ? FM(bank.loan) : "None"}**\n\nUsage: \`bank loan <amount>\``
        );
        if (bank.loan > 0) return reply(`❌ Active loan of **${FM(bank.loan)}**. Repay first with \`bank repay\`.`);
        if (amt < 1_000) return reply("❌ Minimum loan: **$1,000**.");
        if (amt > maxLoan) return reply(`❌ Max loan based on your credit: **${FM(maxLoan)}**`);
        bank.balance += amt;
        bank.loan = amt;
        bank.loanDate = Date.now();
        addTx(bank, "loan", amt, "Bank loan approved");
        await save();
        return reply(`✅ **Loan Approved!**\n\n💵 **${FM(amt)}** added to your bank\nRate: **5%/week** · Balance: **${FM(bank.balance)}**`);
      }

      // ── REPAY ────────────────────────────────────────────────────────
      case "repay": {
        if (bank.loan <= 0) return reply("❌ No active loans.");
        const amt = parseInt(args[1]);
        if (!amt || amt <= 0) return reply(`💳 **Loan Repayment**\n\nLoan: **${FM(bank.loan)}** · Bank: **${FM(bank.balance)}**\n\nUsage: \`bank repay <amount>\``);
        if (bank.balance < amt) return reply(`❌ Insufficient bank funds: **${FM(bank.balance)}**`);
        const repay = Math.min(amt, bank.loan);
        bank.balance -= repay;
        bank.loan -= repay;
        if (bank.loan <= 0) { bank.loanDate = null; bank.creditScore = Math.min(850, bank.creditScore + 10); }
        addTx(bank, "loan_repayment", repay, "Loan repayment");
        await save();
        return reply(bank.loan <= 0
          ? `✅ **Loan Fully Repaid!**\n\nCredit score +10 → **${bank.creditScore}**`
          : `✅ Repaid **${FM(repay)}**. Remaining: **${FM(bank.loan)}**`
        );
      }

      // ── SAVINGS ──────────────────────────────────────────────────────
      case "savings": case "save": {
        const isWithdraw = args[1] === "withdraw" || args[1] === "out";
        const amt = parseInt(isWithdraw ? args[2] : args[1]);
        if (isWithdraw) {
          if (!amt || amt <= 0) return reply("❌ Usage: `bank savings withdraw <amount>`");
          if (bank.savings < amt) return reply(`❌ Insufficient savings: **${FM(bank.savings)}**`);
          bank.savings -= amt;
          bank.balance += amt;
          addTx(bank, "savings_withdrawal", amt, "Savings withdrawal");
          await save();
          return reply(`✅ Withdrew **${FM(amt)}** from savings.\nBank: **${FM(bank.balance)}** · Savings: **${FM(bank.savings)}**`);
        }
        if (!amt || amt <= 0) return reply(
          `🏛️ **Savings Account**\n\nSavings: **${FM(bank.savings)}** (+3%/month)\nBank: **${FM(bank.balance)}**\n\n` +
          `• \`bank savings <amount>\` — Deposit\n• \`bank savings withdraw <amount>\` — Withdraw`
        );
        if (bank.balance < amt) return reply(`❌ Insufficient bank funds: **${FM(bank.balance)}**`);
        bank.balance -= amt;
        bank.savings += amt;
        addTx(bank, "savings_deposit", amt, "Savings deposit");
        await save();
        return reply(`✅ Saved **${FM(amt)}**. Earning **3%/month**.\nNew Savings: **${FM(bank.savings)}**`);
      }

      // ── INTEREST ─────────────────────────────────────────────────────
      case "interest": {
        const now  = Date.now();
        const hrs  = (now - (bank.lastInterest || now)) / 3_600_000;
        if (hrs < 1) return reply(`⏰ Wait **${Math.round(60 - hrs * 60)} more minutes** to collect interest.`);
        const savInt  = Math.floor(bank.savings * (0.03 / (30 * 24)) * hrs);
        const vltInt  = Math.floor(bank.vault   * (0.01 / (30 * 24)) * hrs);
        const loanInt = Math.floor(bank.loan    * (0.05 / ( 7 * 24)) * hrs);
        bank.savings += savInt;
        bank.vault   += vltInt;
        bank.loan    += loanInt;
        bank.lastInterest = now;
        if (savInt  > 0) addTx(bank, "interest_earned",  savInt,  `Savings interest (${Math.floor(hrs)}h)`);
        if (vltInt  > 0) addTx(bank, "interest_earned",  vltInt,  `Vault interest (${Math.floor(hrs)}h)`);
        if (loanInt > 0) addTx(bank, "interest_charged", loanInt, `Loan interest (${Math.floor(hrs)}h)`);
        await save();
        const net = savInt + vltInt - loanInt;
        return reply(
          `📊 **Interest Collected** (${Math.floor(hrs)}h)\n\n` +
          `💰 Savings: **+${FM(savInt)}**\n🔐 Vault: **+${FM(vltInt)}**\n💸 Loan: **-${FM(loanInt)}**\n` +
          `└ Net: **${net >= 0 ? "+" : ""}${FM(net)}**`
        );
      }

      // ── HISTORY ──────────────────────────────────────────────────────
      case "history": {
        const txs = bank.transactions.slice(-15).reverse();
        if (txs.length === 0) return reply("📋 No transaction history yet.");
        const lines = txs.map((tx: any) => {
          const d    = new Date(tx.date).toLocaleDateString("en-US");
          const sign = tx.amount >= 0 ? "+" : "";
          return `${txEmoji(tx.type)} **${tx.description}**: ${sign}${FM(tx.amount)} _(${d})_`;
        }).join("\n");
        return reply(`📋 **Transaction History (Last 15)**\n\n${lines}`);
      }

      // ── FREEZE ───────────────────────────────────────────────────────
      case "freeze": {
        bank.frozen = !bank.frozen;
        await save();
        return reply(bank.frozen
          ? `🔒 **Account Frozen.** All transactions blocked.`
          : `🔓 **Account Unfrozen.** Transactions re-enabled.`
        );
      }

      // ── DAILY ────────────────────────────────────────────────────────
      case "daily": {
        const now   = Date.now();
        const last  = bank.lastDaily ? new Date(bank.lastDaily).getTime() : 0;
        const cd    = 24 * 60 * 60 * 1000;
        if (now - last < cd) {
          const tl  = cd - (now - last);
          return reply(`⏰ Daily already claimed!\nNext in: **${Math.floor(tl / 3_600_000)}h ${Math.floor((tl % 3_600_000) / 60_000)}m**`);
        }
        bank.streak = (now - last < cd * 2) ? bank.streak + 1 : 1;
        const reward = Math.floor(
          (1_000 + Math.min(bank.streak * 100, 2_000) + bank.bankLevel * 500) * (bank.premium ? 2 : 1)
        );
        bank.balance += reward;
        bank.lastDaily = new Date();
        addTx(bank, "daily_reward", reward, `Daily reward (streak ${bank.streak})`);
        await save();
        return reply(`🎁 **Daily Reward Claimed!**\n\n💰 **${FM(reward)}** added to bank\n🔥 Streak: **${bank.streak} days**${bank.premium ? "\n⭐ 2x Premium Bonus!" : ""}`);
      }

      // ── WORK ─────────────────────────────────────────────────────────
      case "work": {
        const now   = Date.now();
        const last  = bank.lastWork ? new Date(bank.lastWork).getTime() : 0;
        const cd    = 4 * 60 * 60 * 1000;
        if (now - last < cd) {
          const tl = cd - (now - last);
          return reply(`⏰ Too tired to work!\nRest for: **${Math.floor(tl / 3_600_000)}h ${Math.floor((tl % 3_600_000) / 60_000)}m**`);
        }
        const job    = JOBS[Math.floor(Math.random() * JOBS.length)];
        const base   = Math.floor(Math.random() * (job.max - job.min + 1)) + job.min;
        const earned = Math.floor((base + bank.skills.business * 100) * bank.multiplier);
        bank.balance     += earned;
        bank.lastWork     = new Date();
        bank.skills.business++;
        addTx(bank, "salary", earned, `Work: ${job.name}`);
        await save();
        return reply(`💼 **Work Completed!**\n\nJob: **${job.name}**\nEarned: **${FM(earned)}**\n📈 Business Skill: **${bank.skills.business}**`);
      }

      // ── STOCKS ───────────────────────────────────────────────────────
      case "stocks": {
        const action = (args[1] || "list").toLowerCase();
        if (action === "list") {
          const owned = Object.entries(bank.stocks)
            .map(([s, n]: [string, any]) => `  • ${s}: **${n}** shares (${FM(n * (STOCKS[s]?.price || 0))})`)
            .join("\n") || "  None";
          const lines = Object.entries(STOCKS)
            .map(([s, d]: [string, any]) => `${d.change >= 0 ? "📈" : "📉"} **${s}** — ${FM(d.price)} (${d.change >= 0 ? "+" : ""}${d.change}%)\n  ${d.name}`)
            .join("\n\n");
          return reply(`📈 **Stock Market**\n\n${lines}\n\n**Your Holdings:**\n${owned}\n\n\`bank stocks buy <SYM> <shares>\` · \`bank stocks sell <SYM> <shares>\``);
        }
        const sym    = args[2]?.toUpperCase();
        const shares = parseInt(args[3]);
        if (!sym || !STOCKS[sym]) return reply("❌ Invalid symbol. Use `bank stocks list`.");
        if (!shares || shares <= 0) return reply("❌ Specify number of shares.");
        if (action === "buy") {
          const cost = STOCKS[sym].price * shares;
          if (bank.balance < cost) return reply(`❌ Insufficient funds. Need **${FM(cost)}**`);
          bank.balance -= cost;
          bank.stocks[sym] = (bank.stocks[sym] || 0) + shares;
          addTx(bank, "stock_purchase", cost, `Bought ${shares}x ${sym}`);
          bank.skills.trading++;
          await save();
          return reply(`✅ Bought **${shares}x ${sym}** for **${FM(cost)}**`);
        }
        if (action === "sell") {
          if ((bank.stocks[sym] || 0) < shares) return reply(`❌ Not enough shares. You own **${bank.stocks[sym] || 0}**.`);
          const val = STOCKS[sym].price * shares;
          bank.balance += val;
          bank.stocks[sym] -= shares;
          if (bank.stocks[sym] === 0) delete bank.stocks[sym];
          addTx(bank, "stock_sale", val, `Sold ${shares}x ${sym}`);
          await save();
          return reply(`✅ Sold **${shares}x ${sym}** for **${FM(val)}**`);
        }
        return reply("❓ Usage: `bank stocks [list|buy|sell] <SYM> <shares>`");
      }

      // ── CRYPTO ───────────────────────────────────────────────────────
      case "crypto": {
        const action = (args[1] || "list").toLowerCase();
        if (action === "list") {
          const owned = Object.entries(bank.crypto)
            .map(([c, n]: [string, any]) => `  • ${c}: **${n}** coins (${FM(n * (CRYPTO[c]?.price || 0))})`)
            .join("\n") || "  None";
          const lines = Object.entries(CRYPTO)
            .map(([c, d]: [string, any]) => `${d.change >= 0 ? "📈" : "📉"} **${c}** — ${FM(d.price)} (${d.change >= 0 ? "+" : ""}${d.change}%)\n  ${d.name}`)
            .join("\n\n");
          return reply(`₿ **Crypto Market**\n\n${lines}\n\n**Your Holdings:**\n${owned}\n\n\`bank crypto buy <SYM> <amount>\` · \`bank crypto sell <SYM> <amount>\``);
        }
        const sym  = args[2]?.toUpperCase();
        const amt  = parseFloat(args[3]);
        if (!sym || !CRYPTO[sym]) return reply("❌ Invalid symbol. Use `bank crypto list`.");
        if (!amt || amt <= 0) return reply("❌ Specify amount.");
        if (action === "buy") {
          const cost = CRYPTO[sym].price * amt;
          if (bank.balance < cost) return reply(`❌ Insufficient funds. Need **${FM(cost)}**`);
          bank.balance -= cost;
          bank.crypto[sym] = (bank.crypto[sym] || 0) + amt;
          addTx(bank, "crypto_purchase", cost, `Bought ${amt} ${sym}`);
          bank.skills.investing++;
          await save();
          return reply(`✅ Bought **${amt} ${sym}** for **${FM(cost)}**`);
        }
        if (action === "sell") {
          if ((bank.crypto[sym] || 0) < amt) return reply(`❌ Not enough. You own **${bank.crypto[sym] || 0}**.`);
          const val = CRYPTO[sym].price * amt;
          bank.balance += val;
          bank.crypto[sym] -= amt;
          if (bank.crypto[sym] <= 0) delete bank.crypto[sym];
          addTx(bank, "crypto_sale", val, `Sold ${amt} ${sym}`);
          await save();
          return reply(`✅ Sold **${amt} ${sym}** for **${FM(val)}**`);
        }
        return reply("❓ Usage: `bank crypto [list|buy|sell] <SYM> <amount>`");
      }

      // ── BONDS ────────────────────────────────────────────────────────
      case "bonds": {
        const action = (args[1] || "list").toLowerCase();
        if (action === "list") {
          const owned = Object.entries(bank.bonds)
            .map(([t, n]: [string, any]) => `  • ${t.replace(/_/g, " ")}: **${FM(n)}**`)
            .join("\n") || "  None";
          const lines = Object.entries(BONDS)
            .map(([t, d]: [string, any]) => `📊 **${t.replace(/_/g, " ")}** — Yield: **${d.yield}%** · Risk: **${d.risk}** · Term: **${d.term}**`)
            .join("\n");
          return reply(`🏛️ **Bond Market**\n\n${lines}\n\n**Your Holdings:**\n${owned}\n\n\`bank bonds buy <TYPE> <amount>\``);
        }
        if (action === "buy") {
          const type = args[2]?.toUpperCase();
          const amt  = parseInt(args[3]);
          if (!type || !BONDS[type]) return reply("❌ Invalid bond type. Use `bank bonds list`.");
          if (!amt || amt <= 0) return reply("❌ Specify amount.");
          if (bank.balance < amt) return reply(`❌ Insufficient funds: **${FM(bank.balance)}**`);
          bank.balance -= amt;
          bank.bonds[type] = (bank.bonds[type] || 0) + amt;
          addTx(bank, "bond_purchase", amt, `Bought ${type} bonds`);
          bank.skills.investing++;
          await save();
          return reply(`✅ Invested **${FM(amt)}** in **${type.replace(/_/g, " ")}** bonds`);
        }
        return reply("❓ Usage: `bank bonds [list|buy] <TYPE> <amount>`");
      }

      // ── PORTFOLIO ────────────────────────────────────────────────────
      case "portfolio": {
        let body = `📊 **Investment Portfolio**\n\n`;
        let total = 0;
        if (Object.keys(bank.stocks).length > 0) {
          body += `**📈 Stocks:**\n`;
          for (const [s, n] of Object.entries<number>(bank.stocks)) {
            const val = n * (STOCKS[s]?.price || 100);
            total += val;
            body += `• ${s}: ${n} shares — **${FM(val)}**\n`;
          }
          body += "\n";
        }
        if (Object.keys(bank.crypto).length > 0) {
          body += `**₿ Crypto:**\n`;
          for (const [c, n] of Object.entries<number>(bank.crypto)) {
            const val = n * (CRYPTO[c]?.price || 1);
            total += val;
            body += `• ${c}: ${n} coins — **${FM(val)}**\n`;
          }
          body += "\n";
        }
        if (Object.keys(bank.bonds).length > 0) {
          body += `**🏛️ Bonds:**\n`;
          for (const [t, n] of Object.entries<number>(bank.bonds)) {
            total += n;
            body += `• ${t.replace(/_/g, " ")}: **${FM(n)}**\n`;
          }
          body += "\n";
        }
        if (total === 0) return reply("📊 Your portfolio is empty.\nStart with `bank stocks list` or `bank crypto list`!");
        body += `**Total Portfolio Value: ${FM(total)}**`;
        return reply(body);
      }

      // ── MARKET ───────────────────────────────────────────────────────
      case "market": {
        const topStocks = Object.entries(STOCKS).slice(0, 4).map(([s, d]: [string, any]) =>
          `${d.change >= 0 ? "📈" : "📉"} ${s}: ${FM(d.price)} (${d.change >= 0 ? "+" : ""}${d.change}%)`
        ).join("\n");
        const topCrypto = Object.entries(CRYPTO).slice(0, 4).map(([c, d]: [string, any]) =>
          `${d.change >= 0 ? "📈" : "📉"} ${c}: ${FM(d.price)} (${d.change >= 0 ? "+" : ""}${d.change}%)`
        ).join("\n");
        const topBonds = Object.entries(BONDS).map(([t, d]: [string, any]) =>
          `📊 ${t.replace(/_/g, " ")}: **${d.yield}%** (${d.term})`
        ).join("\n");
        return reply(`📊 **Global Market Overview**\n\n**📈 TOP STOCKS:**\n${topStocks}\n\n**₿ TOP CRYPTO:**\n${topCrypto}\n\n**🏛️ BOND YIELDS:**\n${topBonds}\n\n📊 Sentiment: **Bullish** · 🔥 Trending: **Tech, DeFi**`);
      }

      // ── DIVIDEND ─────────────────────────────────────────────────────
      case "dividend": {
        let total = 0;
        for (const [s, n] of Object.entries<number>(bank.stocks)) total += n * 5;
        for (const [t, n] of Object.entries<number>(bank.bonds)) total += n * ((BONDS[t]?.yield || 2.5) / 100) / 12;
        if (total === 0) return reply("💰 No dividends to collect.\nInvest in stocks or bonds to earn dividends!");
        bank.balance += Math.floor(total);
        addTx(bank, "dividend", Math.floor(total), "Investment dividends");
        await save();
        return reply(`💰 **Dividends Collected!**\n\n**+${FM(total)}** added to your bank.`);
      }

      // ── BUSINESS ─────────────────────────────────────────────────────
      case "business": {
        const action = (args[1] || "list").toLowerCase();
        if (action === "list") {
          const lines = Object.entries(BUSINESSES).map(([t, d]: [string, any]) =>
            `🏢 **${d.name}** [${t}]\n  💵 Cost: ${FM(d.cost)} · Income: ${FM(d.income)}/mo · ROI: ${Math.round(d.income * 12 / d.cost * 100)}%/yr`
          ).join("\n\n");
          const owned = bank.businesses.length > 0
            ? bank.businesses.map((b: any, i: number) => `${i + 1}. **${b.name}** (Lv${b.level})`).join("\n")
            : "None";
          return reply(`🏢 **Business Opportunities**\n\n${lines}\n\n**Your Businesses:**\n${owned}\n\n\`bank business buy <TYPE>\` · \`bank business collect\``);
        }
        if (action === "buy") {
          const type = args[2]?.toUpperCase();
          const d    = BUSINESSES[type];
          if (!d) return reply("❌ Invalid business type. Use `bank business list`.");
          if (bank.balance < d.cost) return reply(`❌ Insufficient funds. Need **${FM(d.cost)}**`);
          bank.balance -= d.cost;
          bank.businesses.push({ type, name: d.name, level: 1, revenue: d.income, employees: d.employees, established: Date.now(), lastCollected: Date.now() });
          addTx(bank, "business_purchase", d.cost, `Bought ${d.name}`);
          bank.skills.business++;
          await save();
          return reply(`✅ **Purchased ${d.name}!**\n\n💵 Cost: **${FM(d.cost)}** · Monthly Income: **${FM(d.income)}**`);
        }
        if (action === "collect") {
          const now = Date.now();
          let total = 0;
          bank.businesses.forEach((b: any) => {
            const hrs  = (now - (b.lastCollected || b.established)) / 3_600_000;
            const inc  = Math.floor((b.revenue / 30 / 24) * hrs * b.level);
            if (inc > 0) { total += inc; b.lastCollected = now; }
          });
          if (total === 0) return reply("💼 No business income to collect yet.");
          bank.balance += total;
          addTx(bank, "business_income", total, "Business income");
          await save();
          return reply(`💼 **Business Income Collected!**\n\n**+${FM(total)}** from your businesses.`);
        }
        return reply("❓ Usage: `bank business [list|buy|collect]`");
      }

      // ── PROPERTY ─────────────────────────────────────────────────────
      case "property": case "realestate": case "house": {
        const action = (args[1] || "list").toLowerCase();
        if (action === "list") {
          const lines = Object.entries(PROPERTIES).map(([t, d]: [string, any]) =>
            `🏠 **${d.name}** [${t}]\n  💵 ${FM(d.price)} · Rent: ${FM(d.income)}/mo · ROI: ${Math.round(d.income * 12 / d.price * 100)}%`
          ).join("\n\n");
          const owned = bank.realEstate.length > 0
            ? bank.realEstate.map((p: any, i: number) => `${i + 1}. **${p.name}** — ${FM(p.value)}`).join("\n")
            : "None";
          return reply(`🏠 **Real Estate Market**\n\n${lines}\n\n**Your Properties:**\n${owned}\n\n\`bank property buy <TYPE>\` · \`bank rent\``);
        }
        if (action === "buy") {
          const type = args[2]?.toUpperCase();
          const d    = PROPERTIES[type];
          if (!d) return reply("❌ Invalid property type. Use `bank property list`.");
          if (bank.balance < d.price) return reply(`❌ Need **${FM(d.price)}**`);
          bank.balance -= d.price;
          bank.realEstate.push({ type, name: d.name, value: d.price, income: d.income, purchased: Date.now(), lastRentCollected: Date.now() });
          addTx(bank, "property_purchase", d.price, `Bought ${d.name}`);
          await save();
          return reply(`🏠 **Purchased ${d.name}!**\n\n💵 Cost: **${FM(d.price)}** · Monthly Rent: **${FM(d.income)}**`);
        }
        return reply("❓ Usage: `bank property [list|buy] <TYPE>`");
      }

      // ── RENT ─────────────────────────────────────────────────────────
      case "rent": {
        if (bank.realEstate.length === 0) return reply("🏠 No properties owned. Buy with `bank property buy <TYPE>`.");
        const now = Date.now();
        let total = 0;
        bank.realEstate.forEach((p: any) => {
          const hrs = (now - (p.lastRentCollected || p.purchased)) / 3_600_000;
          const inc = Math.floor((p.income / 30 / 24) * hrs);
          if (inc > 0) { total += inc; p.lastRentCollected = now; }
        });
        if (total === 0) return reply("🏠 No rent to collect yet.");
        bank.balance += total;
        addTx(bank, "rental_income", total, "Rental income");
        await save();
        return reply(`🏠 **Rental Income Collected!**\n\n**+${FM(total)}**`);
      }

      // ── LUXURY ───────────────────────────────────────────────────────
      case "luxury": {
        const action = (args[1] || "list").toLowerCase();
        if (action === "list") {
          const lines = Object.entries(LUXURY_ITEMS).map(([t, d]: [string, any]) =>
            `💎 **${d.name}** [${t}] — ${FM(d.price)}`
          ).join("\n");
          const owned = bank.luxury.length > 0
            ? bank.luxury.map((i: any, idx: number) => `${idx + 1}. **${i.name}** — ${FM(i.value)}`).join("\n")
            : "None";
          return reply(`💎 **Luxury Collection**\n\n${lines}\n\n**Your Collection:**\n${owned}\n\n\`bank luxury buy <TYPE>\``);
        }
        if (action === "buy") {
          const type = args[2]?.toUpperCase();
          const d    = LUXURY_ITEMS[type];
          if (!d) return reply("❌ Invalid item. Use `bank luxury list`.");
          if (bank.balance < d.price) return reply(`❌ Need **${FM(d.price)}**`);
          bank.balance -= d.price;
          bank.luxury.push({ type, name: d.name, value: d.price, purchased: Date.now() });
          addTx(bank, "luxury_purchase", d.price, `Bought ${d.name}`);
          await save();
          return reply(`💎 **Purchased ${d.name}!** — **${FM(d.price)}**`);
        }
        return reply("❓ Usage: `bank luxury [list|buy] <TYPE>`");
      }

      // ── CAR ──────────────────────────────────────────────────────────
      case "car": {
        const action = (args[1] || "list").toLowerCase();
        if (action === "list") {
          const lines = Object.entries(VEHICLES).map(([t, d]: [string, any]) =>
            `🚗 **${d.name}** [${t}] — ${FM(d.price)} · Dep: ${Math.round((1 - d.depreciation) * 100)}%/yr`
          ).join("\n");
          const owned = bank.vehicles.length > 0
            ? bank.vehicles.map((v: any, i: number) => `${i + 1}. **${v.name}** — ${FM(v.currentValue)}`).join("\n")
            : "None";
          return reply(`🚗 **Luxury Vehicles**\n\n${lines}\n\n**Your Vehicles:**\n${owned}\n\n\`bank car buy <TYPE>\``);
        }
        if (action === "buy") {
          const type = args[2]?.toUpperCase();
          const d    = VEHICLES[type];
          if (!d) return reply("❌ Invalid vehicle. Use `bank car list`.");
          if (bank.balance < d.price) return reply(`❌ Need **${FM(d.price)}**`);
          bank.balance -= d.price;
          bank.vehicles.push({ type, name: d.name, purchasePrice: d.price, currentValue: d.price, depreciation: d.depreciation, purchased: Date.now() });
          addTx(bank, "vehicle_purchase", d.price, `Bought ${d.name}`);
          await save();
          return reply(`🚗 **Purchased ${d.name}!** — **${FM(d.price)}**`);
        }
        return reply("❓ Usage: `bank car [list|buy] <TYPE>`");
      }

      // ── GAMBLE ───────────────────────────────────────────────────────
      case "gamble": {
        const amt = parseInt(args[1]);
        if (!amt || amt <= 0) return reply(`🎲 **Gambling Games**\n\nBalance: **${FM(bank.balance)}** · Skill: **${bank.skills.gambling}**\n\nGames: \`gamble\` · \`slots\` · \`blackjack\` · \`roulette\``);
        if (bank.balance < amt) return reply(`❌ Insufficient funds: **${FM(bank.balance)}**`);
        const win    = Math.random() < (0.45 + bank.skills.gambling * 0.01);
        const multi  = win && Math.random() < 0.1 ? 3 : 2;
        if (win) {
          bank.balance += amt * (multi - 1);
          bank.skills.gambling++;
          addTx(bank, "gambling_win", amt * (multi - 1), `Gamble win (${multi}x)`);
        } else {
          bank.balance -= amt;
          addTx(bank, "gambling_loss", amt, "Gamble loss");
        }
        await save();
        return reply(win
          ? `🎉 **WIN!** You won **${FM(amt * (multi - 1))}**! (${multi}x)\nBalance: **${FM(bank.balance)}** · Skill: **${bank.skills.gambling}**`
          : `💸 **LOSE!** You lost **${FM(amt)}**\nBalance: **${FM(bank.balance)}**`
        );
      }

      // ── SLOTS ────────────────────────────────────────────────────────
      case "slots": {
        const amt  = parseInt(args[1]);
        if (!amt || amt <= 0) return reply("❌ Usage: `bank slots <amount>`");
        if (bank.balance < amt) return reply(`❌ Insufficient funds: **${FM(bank.balance)}**`);
        const S    = ["🍒","🍋","🍊","🍇","🔔","💎","7️⃣","⭐"];
        const r    = Array.from({ length: 3 }, () => S[Math.floor(Math.random() * S.length)]);
        const cnt  = r.reduce<Record<string, number>>((a, c) => { a[c] = (a[c] || 0) + 1; return a; }, {});
        const max  = Math.max(...Object.values(cnt));
        let multi  = 0;
        if (max === 3) {
          if (r[0] === "7️⃣") multi = 50; else if (r[0] === "💎") multi = 25; else if (r[0] === "⭐") multi = 15; else multi = 10;
        } else if (max === 2) multi = 2;
        if (multi > 0) { bank.balance += amt * (multi - 1); addTx(bank, "gambling_win", amt * (multi - 1), `Slots (${multi}x)`); }
        else { bank.balance -= amt; addTx(bank, "gambling_loss", amt, "Slots loss"); }
        await save();
        return reply(
          `🎰 **SLOT MACHINE**\n\n┌──────────────┐\n│ ${r[0]} │ ${r[1]} │ ${r[2]} │\n└──────────────┘\n\n` +
          (multi > 0 ? `🎉 **${multi === 50 ? "MEGA JACKPOT" : multi === 25 ? "JACKPOT" : "WIN"}!** **+${FM(amt * (multi - 1))}** (${multi}x)` : `💸 No match! **-${FM(amt)}**`) +
          `\nBalance: **${FM(bank.balance)}**`
        );
      }

      // ── BLACKJACK ────────────────────────────────────────────────────
      case "blackjack": {
        const amt    = parseInt(args[1]);
        if (!amt || amt <= 0) return reply("❌ Usage: `bank blackjack <amount>`");
        if (bank.balance < amt) return reply(`❌ Insufficient funds: **${FM(bank.balance)}**`);
        const card   = () => Math.min(Math.floor(Math.random() * 13) + 1, 10);
        const p1 = card(), p2 = card(), d1 = card(), d2 = card();
        const pt = p1 + p2, dt = d1 + d2;
        let result: string, net: number;
        if (pt === 21) { result = "🎉 BLACKJACK! (2.5x)"; net = Math.floor(amt * 1.5); }
        else if (pt > 21) { result = "💸 BUST!"; net = -amt; }
        else if (dt > 21) { result = "🎉 DEALER BUST!"; net = amt; }
        else if (pt > dt) { result = "🎉 WIN!"; net = amt; }
        else if (pt === dt) { result = "🤝 PUSH!"; net = 0; }
        else { result = "💸 LOSE!"; net = -amt; }
        bank.balance += net;
        addTx(bank, net > 0 ? "gambling_win" : net < 0 ? "gambling_loss" : "gambling_push", Math.abs(net), `Blackjack: ${result}`);
        await save();
        return reply(
          `🃏 **BLACKJACK**\n\nYour: **${p1} + ${p2} = ${pt}**\nDealer: **${d1} + ${d2} = ${dt}**\n\n**${result}**\n` +
          (net > 0 ? `Won: **+${FM(net)}**` : net < 0 ? `Lost: **-${FM(Math.abs(net))}**` : `Tie — no change`) +
          `\nBalance: **${FM(bank.balance)}**`
        );
      }

      // ── ROULETTE ─────────────────────────────────────────────────────
      case "roulette": {
        const amt  = parseInt(args[1]);
        const bet  = args[2]?.toLowerCase();
        if (!amt || amt <= 0) return reply(
          `🎯 **Roulette Wheel**\n\nBets: \`red\`/\`black\` · \`odd\`/\`even\` · \`high\`/\`low\` · \`0-36\` (36x)\n\nUsage: \`bank roulette <amount> <bet>\``
        );
        if (!bet) return reply("❌ Specify your bet. Example: `bank roulette 1000 red`");
        if (bank.balance < amt) return reply(`❌ Insufficient funds: **${FM(bank.balance)}**`);
        const num  = Math.floor(Math.random() * 37);
        const reds = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
        const isRed   = reds.has(num);
        const isBlack = num !== 0 && !isRed;
        const isOdd   = num > 0 && num % 2 === 1;
        const isEven  = num > 0 && num % 2 === 0;
        let won  = false, multi = 2;
        if (bet === "red"   && isRed)  won = true;
        else if (bet === "black" && isBlack) won = true;
        else if (bet === "odd"   && isOdd)   won = true;
        else if (bet === "even"  && isEven)  won = true;
        else if (bet === "high"  && num >= 19 && num <= 36) won = true;
        else if (bet === "low"   && num >= 1  && num <= 18) won = true;
        else if (bet === num.toString()) { won = true; multi = 36; }
        const net = won ? amt * (multi - 1) : -amt;
        bank.balance += net;
        addTx(bank, won ? "gambling_win" : "gambling_loss", Math.abs(net), `Roulette: ${num} (${bet})`);
        await save();
        const color = num === 0 ? "🟢" : isRed ? "🔴" : "⚫";
        return reply(
          `🎯 **ROULETTE RESULT**\n\nResult: ${color} **${num}** · Bet: **${bet}**\n\n` +
          (won ? `🎉 **WIN!** **+${FM(net)}** (${multi}x)` : `💸 **LOSE!** **-${FM(Math.abs(net))}**`) +
          `\nBalance: **${FM(bank.balance)}**`
        );
      }

      // ── LOTTERY ──────────────────────────────────────────────────────
      case "lottery": {
        const action = (args[1] || "buy").toLowerCase();
        if (action === "buy") {
          const tickets = parseInt(args[2]) || 1;
          const cost    = tickets * 100;
          if (bank.balance < cost) return reply(`❌ Need **${FM(cost)}** for ${tickets} ticket(s).`);
          bank.balance -= cost;
          bank.lotteryTickets += tickets;
          await save();
          return reply(`🎫 Bought **${tickets} ticket(s)** for **${FM(cost)}**!\nTotal: **${bank.lotteryTickets} tickets** · Use \`bank lottery check\``);
        }
        if (action === "check") {
          if (!bank.lotteryTickets) return reply("🎫 No lottery tickets. Buy with `bank lottery buy <n>`");
          const won = Math.random() < Math.min(bank.lotteryTickets * 0.01, 0.5);
          if (won) {
            const prize = Math.floor(Math.random() * 1_000_000) + 50_000;
            bank.balance += prize;
            bank.lotteryTickets = 0;
            addTx(bank, "gambling_win", prize, "Lottery jackpot!");
            await save();
            return reply(`🎊 **LOTTERY WINNER!**\n\n**+${FM(prize)}** added to your bank!`);
          }
          return reply(`🎫 No win this time. **${bank.lotteryTickets} tickets** remaining. Keep trying!`);
        }
        return reply("❓ Usage: `bank lottery [buy|check] [amount]`");
      }

      // ── SHOP ─────────────────────────────────────────────────────────
      case "shop": {
        const action = (args[1] || "list").toLowerCase();
        if (action === "list") {
          const lines = Object.entries(SHOP_ITEMS).map(([t, d]: [string, any]) =>
            `🛍️ **${d.name}** [${t}]\n  💵 ${FM(d.price)} · ${d.desc}`
          ).join("\n\n");
          return reply(`🛒 **Bank Shop**\n\n${lines}\n\n\`bank shop buy <TYPE>\``);
        }
        if (action === "buy") {
          const type = args[2]?.toUpperCase();
          const d    = SHOP_ITEMS[type];
          if (!d) return reply("❌ Invalid item. Use `bank shop list`.");
          if (bank.balance < d.price) return reply(`❌ Need **${FM(d.price)}**`);
          bank.balance -= d.price;
          if (type === "CREDIT_BOOST")    bank.creditScore = Math.min(850, bank.creditScore + 50);
          if (type === "MULTIPLIER")      bank.multiplier  = 1.5;
          if (type === "LOTTERY_PACK")    bank.lotteryTickets += 100;
          if (type === "SKILL_BOOST")     { bank.skills.trading += 10; bank.skills.business += 10; bank.skills.investing += 10; bank.skills.gambling += 10; }
          if (type === "PREMIUM_TRIAL")   { bank.premium = true; bank.multiplier = 2.0; }
          if (type === "INSURANCE_BUNDLE") {
            for (const t of Object.keys(INSURANCE_TYPES)) {
              bank.insurance[t] = { active: true, coverage: INSURANCE_TYPES[t].coverage, purchased: Date.now() };
            }
          }
          addTx(bank, "shop_purchase", d.price, `Bought ${d.name}`);
          await save();
          return reply(`✅ **Purchased ${d.name}!**`);
        }
        return reply("❓ Usage: `bank shop [list|buy] <TYPE>`");
      }

      // ── VAULT ────────────────────────────────────────────────────────
      case "vault": {
        const action = (args[1] || "").toLowerCase();
        const amt    = parseInt(args[2]);
        if (!action) return reply(`🔐 **Secure Vault**\n\nVault: **${FM(bank.vault)}** · Bank: **${FM(bank.balance)}**\n💡 +1%/month interest · Theft-proof\n\n\`bank vault deposit <amount>\` · \`bank vault withdraw <amount>\``);
        if (!amt || amt <= 0) return reply("❌ Specify a valid amount.");
        if (action === "deposit") {
          if (bank.balance < amt) return reply(`❌ Insufficient bank funds: **${FM(bank.balance)}**`);
          bank.balance -= amt; bank.vault += amt;
          addTx(bank, "vault_deposit", amt, "Vault deposit");
          await save();
          return reply(`🔐 Deposited **${FM(amt)}** to vault.\nVault: **${FM(bank.vault)}**`);
        }
        if (action === "withdraw") {
          if (bank.vault < amt) return reply(`❌ Insufficient vault funds: **${FM(bank.vault)}**`);
          bank.vault -= amt; bank.balance += amt;
          addTx(bank, "vault_withdrawal", amt, "Vault withdrawal");
          await save();
          return reply(`🔓 Withdrew **${FM(amt)}** from vault.\nBank: **${FM(bank.balance)}**`);
        }
        return reply("❓ Usage: `bank vault [deposit|withdraw] <amount>`");
      }

      // ── INSURANCE ────────────────────────────────────────────────────
      case "insurance": {
        const action = (args[1] || "list").toLowerCase();
        if (action === "list") {
          const lines = Object.entries(INSURANCE_TYPES).map(([t, d]: [string, any]) =>
            `🛡️ **${d.name}** [${t}]\n  💵 ${FM(d.cost)} · Coverage: ${FM(d.coverage)} · ${bank.insurance[t] ? "✅ Owned" : "❌ Not owned"}`
          ).join("\n\n");
          return reply(`🛡️ **Insurance Policies**\n\n${lines}\n\n\`bank insurance buy <TYPE>\``);
        }
        if (action === "buy") {
          const type = args[2]?.toUpperCase();
          const d    = INSURANCE_TYPES[type];
          if (!d) return reply("❌ Invalid type. Use `bank insurance list`.");
          if (bank.insurance[type]) return reply("❌ Already owned this policy.");
          if (bank.balance < d.cost) return reply(`❌ Need **${FM(d.cost)}**`);
          bank.balance -= d.cost;
          bank.insurance[type] = { active: true, coverage: d.coverage, purchased: Date.now() };
          addTx(bank, "insurance_purchase", d.cost, `Bought ${d.name}`);
          await save();
          return reply(`✅ **Purchased ${d.name}!**\nCoverage: **${FM(d.coverage)}**`);
        }
        return reply("❓ Usage: `bank insurance [list|buy] <TYPE>`");
      }

      // ── CREDIT ───────────────────────────────────────────────────────
      case "credit": {
        const cr = creditRating(bank.creditScore);
        return reply(
          `📊 **Credit Score Report**\n\n${cr.color} Score: **${bank.creditScore}/850** (${cr.label})\n` +
          `💳 Max Loan: **${FM(bank.creditScore * 1000)}**\n` +
          `🏦 Interest Rate: **${bank.creditScore >= 750 ? "5%" : bank.creditScore >= 650 ? "7%" : "10%"}**\n\n` +
          `**💡 Improve your score:**\n• Repay loans on time (+10 pts)\n• Maintain low debt\n• Keep accounts active`
        );
      }

      // ── ACHIEVEMENTS ─────────────────────────────────────────────────
      case "achievements": {
        const possible = [
          "First Deposit","First Loan","First Investment","First Business",
          "Millionaire","Multi-Millionaire","Billionaire","Property Owner",
          "Stock Trader","Crypto Investor","Business Tycoon","Gambling King",
          "Insurance Buyer","Premium Member","Daily Streaker","Work Horse",
          "Loan Repayer","Savings Master","Portfolio Builder","Risk Taker",
        ];
        const ach     = bank.achievements || [];
        const unlocked = ach.slice(0, 10).map((a: string, i: number) => `${i + 1}. 🏆 **${a}**`).join("\n");
        const next    = possible.filter((a: string) => !ach.includes(a)).slice(0, 5).map((a: string) => `• ${a}`).join("\n");
        return reply(
          `🏆 **Achievements** — ${ach.length}/${possible.length}\n\n` +
          (unlocked ? `**Unlocked:**\n${unlocked}${ach.length > 10 ? `\n... and ${ach.length - 10} more!` : ""}\n\n` : "No achievements yet.\n\n") +
          (next ? `**Next Goals:**\n${next}` : "🎉 All achievements unlocked!")
        );
      }

      // ── PREMIUM ──────────────────────────────────────────────────────
      case "premium": {
        if ((args[1] || "").toLowerCase() === "buy") {
          if (bank.premium) return reply("💎 Already a Premium member!");
          if (bank.balance < 1_000_000) return reply(`❌ Premium costs **$1,000,000**. You have **${FM(bank.balance)}**`);
          bank.balance -= 1_000_000;
          bank.premium   = true;
          bank.multiplier = 2.0;
          await save();
          return reply("💎 **Welcome to Premium!**\n\n✅ 2x earnings on all activities\n✅ Higher daily rewards\n✅ Multiplier: **2x**");
        }
        return reply(
          `💎 **Premium Membership**\n\nStatus: **${bank.premium ? "✅ Active" : "❌ Inactive"}** · Multiplier: **${bank.multiplier}x**\nCost: **$1,000,000**\n\n` +
          `Benefits: 2x earnings · Higher daily · Exclusive content\n\n${!bank.premium ? "`bank premium buy` to upgrade!" : ""}`
        );
      }

      // ── LEADERBOARD ──────────────────────────────────────────────────
      case "leaderboard": {
        const allCache = await money.getAllCache();
        const players: any[] = [];
        for (const [, u] of Object.entries<any>(allCache)) {
          const b = u.bank;
          if (b && (b.balance > 0 || b.savings > 0 || b.vault > 0)) {
            players.push({
              name:    u.name || "Unknown",
              wealth:  (b.balance || 0) + (b.savings || 0) + (b.vault || 0),
              level:   b.bankLevel || 1,
              premium: b.premium || false,
              ach:     b.achievements?.length || 0,
            });
          }
        }
        players.sort((a, b) => b.wealth - a.wealth);
        if (players.length === 0) return reply("📊 No players on the leaderboard yet.");
        const medals = ["🥇", "🥈", "🥉"];
        const lines  = players.slice(0, 10).map((p, i) =>
          `${medals[i] || `**#${i + 1}**`} **${p.name}**${p.premium ? " 💎" : ""}\n  💰 **${FM(p.wealth)}** · Lv${p.level}${p.ach > 0 ? ` · 🏆 ${p.ach}` : ""}`
        ).join("\n\n");
        return reply(`🏆 **Leaderboard**\n\n${lines}`);
      }

      // ── ROB ──────────────────────────────────────────────────────────
      case "rob": {
        const targetID = Object.keys((input as any).mentions ?? {})[0] || input.detectID;
        if (!targetID) return reply("❌ Mention a user to rob. Usage: `bank rob @user`");
        if (targetID === input.senderID) return reply("❌ Can't rob yourself!");
        const now  = Date.now();
        const last = bank.lastRob ? new Date(bank.lastRob).getTime() : 0;
        const cd   = 6 * 60 * 60 * 1000;
        if (now - last < cd) {
          const tl = cd - (now - last);
          return reply(`⏰ Too tired! Wait **${Math.floor(tl / 3_600_000)}h** more.`);
        }
        const targetData: any = await money.getItem(targetID);
        if (!targetData?.bank) return reply("❌ Target has no bank account.");
        const tBank = targetData.bank;
        if ((tBank.balance || 0) <= 100) return reply("❌ Target doesn't have enough to steal.");
        if (tBank.insurance?.THEFT) return reply("🛡️ Target has **Theft Protection**! Rob failed.");
        const success  = Math.random() < Math.max(0.30, 0.60 - ((tBank.bankLevel || 1) - (bank.bankLevel || 1)) * 0.1);
        bank.lastRob   = new Date();
        if (success) {
          const stolen = Math.floor(tBank.balance * (Math.random() * 0.3 + 0.1));
          bank.balance += stolen;
          tBank.balance -= stolen;
          addTx(bank,  "robbery_success", stolen, `Robbed ${targetID}`);
          addTx(tBank, "robbed",          stolen, `Robbed by ${input.senderID}`);
          await money.setItem(targetID, { bank: tBank });
          await save();
          return reply(`🏴‍☠️ **Robbery Successful!**\n\nStole **${FM(stolen)}**!\nYour Bank: **${FM(bank.balance)}**`);
        }
        const fine = Math.min(bank.balance * 0.1, 10_000);
        bank.balance -= fine;
        addTx(bank, "robbery_failed", fine, "Failed robbery fine");
        await save();
        return reply(`🚔 **Caught!** Fined **${FM(fine)}**.\nBank: **${FM(bank.balance)}**`);
      }

      default:
        return reply(`❓ Unknown command: **${sub}**\n\nType \`bank help\` for all commands.`);
    }
  }),
});

const style = command.style;
export default command;
