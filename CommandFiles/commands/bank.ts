import { UNIRedux, UNISpectra, abbreviateNumber } from "@cassidy/unispectra";
import { formatCash, getMinimumChange, isNoChange, parseBet } from "@cass-modules/ArielUtils";
import { FontSystem } from "cassidy-styler";
import { UserData } from "@cass-modules/cassidyUser";
import { CassCheckly } from "@cassidy/spectral-home";

const { fonts } = FontSystem;

export const meta: CommandMeta = {
  name: "bank",
  description: "Système bancaire complet avec investissements, business et jeux",
  otherNames: ["bbank", "banque", "b"],
  version: "4.0.0",
  usage: "{prefix}{name} help",
  category: "Finance",
  author: "Christus",
  role: 0,
  noPrefix: false,
  waitingTime: 0,
  requirement: "3.0.0",
  icon: "🏦",
  cmdType: "arl_g",
  isGame: true,
};

export const style: CommandStyle = {
  titleFont: "bold",
  title: "🏦 Bank System",
  contentFont: "fancy",
};

const marketData = {
  stocks: {
    "AAPL": { price: 150.25, change: 2.1, name: "Apple Inc." },
    "GOOGL": { price: 2800.50, change: 1.8, name: "Alphabet Inc." },
    "TSLA": { price: 800.75, change: -0.5, name: "Tesla Inc." },
    "MSFT": { price: 320.40, change: 1.2, name: "Microsoft Corp." },
    "AMZN": { price: 3200.00, change: 0.8, name: "Amazon.com Inc." },
    "META": { price: 330.00, change: 2.5, name: "Meta Platforms Inc." },
    "NVDA": { price: 450.00, change: 3.2, name: "NVIDIA Corp." },
    "NFLX": { price: 380.00, change: -1.1, name: "Netflix Inc." }
  },
  crypto: {
    "BTC": { price: 45000, change: 3.2, name: "Bitcoin" },
    "ETH": { price: 3200, change: 2.8, name: "Ethereum" },
    "BNB": { price: 400, change: 1.5, name: "Binance Coin" },
    "ADA": { price: 1.20, change: 4.1, name: "Cardano" },
    "DOT": { price: 25.50, change: 2.3, name: "Polkadot" },
    "LINK": { price: 28.00, change: 1.9, name: "Chainlink" },
    "MATIC": { price: 0.85, change: 5.1, name: "Polygon" },
    "SOL": { price: 120.00, change: 3.8, name: "Solana" }
  },
  bonds: {
    "US_TREASURY": { yield: 2.5, risk: "Low", term: "10 Year" },
    "CORPORATE": { yield: 3.8, risk: "Medium", term: "5 Year" },
    "MUNICIPAL": { yield: 2.1, risk: "Low", term: "7 Year" },
    "HIGH_YIELD": { yield: 6.2, risk: "High", term: "3 Year" }
  },
  properties: {
    "APARTMENT": { price: 250000, income: 2500, name: "City Apartment" },
    "HOUSE": { price: 500000, income: 4000, name: "Suburban House" },
    "MANSION": { price: 2000000, income: 15000, name: "Luxury Mansion" },
    "OFFICE": { price: 1000000, income: 8000, name: "Commercial Office" },
    "WAREHOUSE": { price: 750000, income: 6000, name: "Industrial Warehouse" },
    "MALL": { price: 5000000, income: 40000, name: "Shopping Mall" }
  },
  vehicles: {
    "TOYOTA": { price: 25000, depreciation: 0.85, name: "Toyota Camry" },
    "BMW": { price: 60000, depreciation: 0.70, name: "BMW M3" },
    "FERRARI": { price: 300000, depreciation: 0.90, name: "Ferrari 488" },
    "LAMBORGHINI": { price: 400000, depreciation: 0.85, name: "Lamborghini Huracan" },
    "ROLLS_ROYCE": { price: 500000, depreciation: 0.80, name: "Rolls-Royce Phantom" },
    "BUGATTI": { price: 3000000, depreciation: 0.75, name: "Bugatti Chiron" }
  },
  businesses: {
    "COFFEE_SHOP": { cost: 50000, income: 5000, employees: 3, name: "Coffee Shop" },
    "RESTAURANT": { cost: 150000, income: 12000, employees: 8, name: "Restaurant" },
    "TECH_STARTUP": { cost: 500000, income: 50000, employees: 20, name: "Tech Startup" },
    "HOTEL": { cost: 2000000, income: 150000, employees: 50, name: "Hotel Chain" },
    "BANK": { cost: 10000000, income: 800000, employees: 200, name: "Regional Bank" },
    "AIRLINE": { cost: 50000000, income: 3000000, employees: 1000, name: "Airline Company" }
  },
  luxury: {
    "ROLEX": { price: 15000, name: "Rolex Submariner" },
    "PAINTING": { price: 100000, name: "Van Gogh Replica" },
    "DIAMOND": { price: 50000, name: "5 Carat Diamond" },
    "YACHT": { price: 2000000, name: "Luxury Yacht" },
    "PRIVATE_JET": { price: 25000000, name: "Private Jet" },
    "ISLAND": { price: 100000000, name: "Private Island" }
  },
  shopItems: {
    "CREDIT_BOOST": { price: 50000, name: "Credit Score Boost (+50)", description: "Instantly increase your credit score by 50 points" },
    "MULTIPLIER": { price: 1000000, name: "Earnings Multiplier 1.5x", description: "Increase all earnings by 50% for 7 days" },
    "INSURANCE_BUNDLE": { price: 100000, name: "Full Insurance Package", description: "Get all 5 insurance types at a discount" },
    "LOTTERY_PACK": { price: 5000, name: "Lottery Ticket Pack (100x)", description: "Get 100 lottery tickets at once" },
    "SKILL_BOOST": { price: 25000, name: "Skill Training", description: "Increase all skills by 10 levels" },
    "PREMIUM_TRIAL": { price: 100000, name: "Premium Trial (30 days)", description: "Try premium features for 30 days" }
  },
  insuranceTypes: {
    "LIFE": { cost: 10000, coverage: 100000, name: "Life Insurance" },
    "HEALTH": { cost: 5000, coverage: 50000, name: "Health Insurance" },
    "PROPERTY": { cost: 15000, coverage: 200000, name: "Property Insurance" },
    "BUSINESS": { cost: 25000, coverage: 500000, name: "Business Insurance" },
    "THEFT": { cost: 8000, coverage: 75000, name: "Theft Protection" }
  }
};

function getDefaultBankData(): any {
  return {
    balance: 0, savings: 0, vault: 0, loan: 0, loanDate: null,
    creditScore: 750, bankLevel: 1, multiplier: 1.0, premium: false,
    streak: 0, lastDaily: null, lastWork: null, lastRob: null,
    lastInterest: Date.now(), lotteryTickets: 0, achievements: [],
    reputation: 0, skills: { gambling: 0, trading: 0, business: 0, investing: 0 },
    stocks: {}, crypto: {}, bonds: {}, realEstate: [], businesses: [],
    vehicles: [], luxury: [], insurance: {}, transactions: []
  };
}

function ensureBankData(userData: UserData): any {
  if (!userData.bankData) {
    userData.bankData = getDefaultBankData();
  }
  return userData.bankData;
}

function getTransactionEmoji(type: string): string {
  const emojis: Record<string, string> = {
    deposit: "💰",
    withdrawal: "💸",
    transfer_in: "📥",
    transfer_out: "📤",
    loan: "🏦",
    loan_repayment: "💳",
    savings_deposit: "🏛️",
    savings_withdrawal: "🏛️⬅️",
    interest_earned: "📈",
    interest_charged: "📉",
    investment: "📊",
    dividend: "💰",
    salary: "💼",
    business_income: "🏢",
    rental_income: "🏠",
    gambling_win: "🎰",
    gambling_loss: "💸"
  };
  return emojis[type] || "💼";
}

function calculatePortfolioValue(bank: any): number {
  let total = 0;
  Object.entries(bank.stocks || {}).forEach(([symbol, shares]: [string, any]) => {
    const price = marketData.stocks[symbol]?.price || 100;
    total += shares * price;
  });
  Object.entries(bank.crypto || {}).forEach(([coin, amount]: [string, any]) => {
    const price = marketData.crypto[coin]?.price || 1;
    total += amount * price;
  });
  Object.entries(bank.bonds || {}).forEach(([, amount]: [string, any]) => {
    total += amount;
  });
  return total;
}

function calculateRealEstateValue(bank: any): number {
  return (bank.realEstate || []).reduce((total: number, property: any) => total + property.value, 0);
}

function calculateBusinessValue(bank: any): number {
  return (bank.businesses || []).reduce((total: number, business: any) => {
    const marketValue = marketData.businesses[business.type]?.cost || 100000;
    return total + (marketValue * business.level);
  }, 0);
}

function calculateVehicleValue(bank: any): number {
  return (bank.vehicles || []).reduce((total: number, vehicle: any) => total + vehicle.currentValue, 0);
}

function calculateLuxuryValue(bank: any): number {
  return (bank.luxury || []).reduce((total: number, item: any) => total + item.value, 0);
}

const configs: Config[] = [
  {
    key: "help",
    description: "Affiche l'aide du système bancaire",
    aliases: ["h"],
    icon: "📖",
    validator: new CassCheckly([]),
    async handler({ output }) {
      const helpText = `
${fonts.bold("🏦 BANKING SYSTEM")}
━━━━━━━━━━━━━━━━
${fonts.bold("💎 The Ultimate Financial Experience 💎")}

${fonts.bold("💰 BASIC BANKING")} ${fonts.bold("━━━━━━━━━━━━━")}
🏦 bank balance - Check your complete financial overview
💵 bank deposit <amount> - Secure your money in the bank
💸 bank withdraw <amount> - Access your funds instantly
📤 bank transfer <@user> <amount> - Send money to friends
💳 bank loan <amount> - Get financing for your dreams
🔄 bank repay <amount> - Build your credit score
🏛️ bank savings <amount> - Grow your wealth safely
🏛️ bank savings withdraw <amount> - Withdraw from savings
📊 bank interest - Calculate your earnings
💰 bank collect - Claim your interest rewards
📋 bank history - View your transaction timeline
🎁 bank daily - Claim daily bonuses (24h cooldown)
💼 bank work - Earn money through various jobs

${fonts.bold("📈 INVESTMENTS")} ${fonts.bold("━━━━━━━━━━━━━")}
🚀 bank invest - Explore investment opportunities
📊 bank stocks [list/buy/sell] - Trade blue-chip stocks
₿ bank crypto [list/buy/sell] - Cryptocurrency trading
🏛️ bank bonds [list/buy/sell] - Stable government bonds
📊 bank portfolio - View your investment portfolio
📈 bank market - Live market prices & trends
💰 bank dividend - Collect investment dividends

${fonts.bold("🏢 BUSINESS EMPIRE")} ${fonts.bold("━━━━━━━━━━━━━")}
🏢 bank business [list/buy/upgrade] - Build your empire
🛒 bank shop [list/buy] - Exclusive items & upgrades

${fonts.bold("🏠 REAL ESTATE")} ${fonts.bold("━━━━━━━━━━━━━")}
🏠 bank property [list/buy/sell] - Premium properties
🏘️ bank house [list/buy/sell] - Luxury homes
💰 bank rent - Collect passive rental income

${fonts.bold("💎 LUXURY LIFESTYLE")} ${fonts.bold("━━━━━━━━━━━━━")}
💎 bank luxury [list/buy] - Exclusive collectibles
🚗 bank car [list/buy/sell] - Luxury vehicle collection

${fonts.bold("🎰 GAMING & ENTERTAINMENT")} ${fonts.bold("━━━━━━━━━━━━━")}
🎲 bank gamble <amount> - High-risk, high-reward games
🎫 bank lottery [buy/check] - Weekly lottery draws
🎰 bank slots <amount> - Vegas-style slot machines
🃏 bank blackjack <amount> - Classic card game
🎯 bank roulette <amount> <bet> - European roulette

${fonts.bold("⭐ PREMIUM & SOCIAL")} ${fonts.bold("━━━━━━━━━━━━━")}
💎 bank premium [buy] - 2x earnings & exclusive perks
🔐 bank vault [deposit/withdraw] - Ultra-secure storage
🛡️ bank insurance [list/buy/claim] - Protect your assets
📊 bank credit - Monitor your credit score
🏆 bank achievements - Unlock rewards & titles
🏆 bank leaderboard - Compete with top users
🏴‍☠️ bank rob <@user> - Risky robbery attempts
`;
      return output.reply(helpText);
    }
  },
  {
    key: "balance",
    description: "Check your financial dashboard",
    aliases: ["bal"],
    icon: "💰",
    validator: new CassCheckly([]),
    async handler({ money, input, output }) {
      await money.ensureUserInfo(input.senderID);
      const userData = await money.getItem(input.senderID);
      const bank = ensureBankData(userData);
      const walletBalance = userData.money || 0;
      
      const portfolioValue = calculatePortfolioValue(bank);
      const realEstateValue = calculateRealEstateValue(bank);
      const businessValue = calculateBusinessValue(bank);
      const vehicleValue = calculateVehicleValue(bank);
      const luxuryValue = calculateLuxuryValue(bank);

      const totalLiquid = bank.balance + bank.savings + bank.vault + walletBalance;
      const totalAssets = portfolioValue + realEstateValue + businessValue + vehicleValue + luxuryValue;
      const totalWealth = totalLiquid + totalAssets;

      let wealthTier = "👤 Beginner";
      let tierEmoji = "🔰";
      if (totalWealth >= 1000000000) {
        wealthTier = "💎 Billionaire";
        tierEmoji = "👑";
      } else if (totalWealth >= 1000000) {
        wealthTier = "🏆 Millionaire";
        tierEmoji = "⭐";
      } else if (totalWealth >= 100000) {
        wealthTier = "💰 Wealthy";
        tierEmoji = "✨";
      } else if (totalWealth >= 10000) {
        wealthTier = "📈 Rising";
        tierEmoji = "🚀";
      }

      let creditRating = "Poor";
      let creditEmoji = "🔴";
      if (bank.creditScore >= 800) {
        creditRating = "Excellent";
        creditEmoji = "🟢";
      } else if (bank.creditScore >= 740) {
        creditRating = "Very Good";
        creditEmoji = "🟢";
      } else if (bank.creditScore >= 670) {
        creditRating = "Good";
        creditEmoji = "🟡";
      } else if (bank.creditScore >= 580) {
        creditRating = "Fair";
        creditEmoji = "🟠";
      }

      const balanceText = `
${fonts.bold("💳 FINANCIAL DASHBOARD")} ${tierEmoji}
━━━━━━━━━━━━━
${fonts.bold(wealthTier)} • ${fonts.bold("Level " + bank.bankLevel)}${bank.premium ? " • 💎 Premium" : ""}

${fonts.bold("💰 LIQUID ASSETS")} ${fonts.bold("━━━━━━━━━━━━━")}
💵 Wallet: ${fonts.bold("$" + walletBalance.toLocaleString())}
🏦 Bank: ${fonts.bold("$" + bank.balance.toLocaleString())}
🏛️ Savings: ${fonts.bold("$" + bank.savings.toLocaleString())} ${bank.savings > 0 ? "(+3% monthly)" : ""}
🔐 Vault: ${fonts.bold("$" + bank.vault.toLocaleString())} ${bank.vault > 0 ? "(+1% monthly)" : ""}
├─ ${fonts.bold("Total Liquid: $" + totalLiquid.toLocaleString())}

${fonts.bold("📊 ASSET PORTFOLIO")} ${fonts.bold("━━━━━━━━━━━━━")}
📈 Investments: ${fonts.bold("$" + portfolioValue.toLocaleString())}
🏠 Real Estate: ${fonts.bold("$" + realEstateValue.toLocaleString())}
🏢 Businesses: ${fonts.bold("$" + businessValue.toLocaleString())}
🚗 Vehicles: ${fonts.bold("$" + vehicleValue.toLocaleString())}
💎 Luxury: ${fonts.bold("$" + luxuryValue.toLocaleString())}
├─ ${fonts.bold("Total Assets: $" + totalAssets.toLocaleString())}

${fonts.bold("🏆 WEALTH SUMMARY")} ${fonts.bold("━━━━━━━━━━━━━")}
💎 ${fonts.bold("Net Worth: $" + totalWealth.toLocaleString())}
${creditEmoji} Credit Score: ${fonts.bold(bank.creditScore + "/850")} (${creditRating})
🎯 Max Loan: ${fonts.bold("$" + (bank.creditScore * 1000).toLocaleString())}
⚡ Earnings Multiplier: ${fonts.bold(bank.multiplier + "x")}${bank.premium ? " (Premium Boost!)" : ""}

${fonts.bold("📈 PERFORMANCE METRICS")} ${fonts.bold("━━━━━━━━━━━━━")}
🔥 Daily Streak: ${fonts.bold(bank.streak + " days")} ${bank.streak >= 7 ? "🎉" : ""}
🏆 Achievements: ${fonts.bold((bank.achievements?.length || 0) + "/100")} ${bank.achievements?.length >= 10 ? "⭐" : ""}
⭐ Reputation: ${fonts.bold(bank.reputation)} ${bank.reputation >= 100 ? "👑" : ""}
💸 Active Loan: ${fonts.bold(bank.loan > 0 ? "$" + bank.loan.toLocaleString() : "None ✅")}

${fonts.bold("🎲 GAMING STATS")} ${fonts.bold("━━━━━━━━━━━━━")}
🎰 Gambling Skill: ${fonts.bold(bank.skills?.gambling || 0)}
📊 Trading Skill: ${fonts.bold(bank.skills?.trading || 0)}
🏢 Business Skill: ${fonts.bold(bank.skills?.business || 0)}
📈 Investing Skill: ${fonts.bold(bank.skills?.investing || 0)}`;
      return output.reply(balanceText);
    }
  },
  {
    key: "deposit",
    description: "Deposit money to your bank account",
    aliases: ["dep"],
    icon: "💰",
    validator: new CassCheckly([
      { index: 0, type: "number", required: true, name: "amount" }
    ]),
    async handler({ money, input, output, args }) {
      const amount = parseInt(args[0]);
      if (!amount || amount <= 0) {
        return output.reply(fonts.bold(`
💰 DEPOSIT HELP
━━━━━━━━━━━━━

Usage: bank deposit <amount>
Example: bank deposit 5000
`));
      }

      await money.ensureUserInfo(input.senderID);
      const userData = await money.getItem(input.senderID);
      const bank = ensureBankData(userData);
      const userMoney = userData.money || 0;
      
      if (userMoney < amount) {
        return output.reply(fonts.bold(`
❌ INSUFFICIENT FUNDS
━━━━━━━━━━━

Wallet Balance: $${userMoney.toLocaleString()}
Required Amount: $${amount.toLocaleString()}
Shortfall: $${(amount - userMoney).toLocaleString()}

💡 Tip: Use 'bank work' to earn more money!
`));
      }

      userData.money = userMoney - amount;
      bank.balance += amount;
      bank.transactions.push({
        type: "deposit",
        amount: amount,
        date: Date.now(),
        description: "Cash deposit"
      });

      if (!bank.achievements.includes("First Deposit")) {
        bank.achievements.push("First Deposit");
      }
      if (amount >= 1000000 && !bank.achievements.includes("Million Dollar Deposit")) {
        bank.achievements.push("Million Dollar Deposit");
      }

      await money.setItem(input.senderID, userData);

      const newAchievements = bank.achievements.includes("First Deposit") ? "\n🏆 Achievement unlocked: First Deposit!" : "";
      const millionAchievement = bank.achievements.includes("Million Dollar Deposit") ? "\n🏆 Achievement unlocked: Million Dollar Deposit!" : "";

      return output.reply(fonts.bold(`
💰 DEPOSIT SUCCESSFUL! 
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💵 Amount Deposited: $${amount.toLocaleString()}
🏦 New Bank Balance: $${bank.balance.toLocaleString()}
💳 Remaining Wallet: $${userData.money.toLocaleString()}

📊 Transaction recorded successfully!
${newAchievements}${millionAchievement}

💡 Your money is now earning interest in the bank!
`));
    }
  },
  {
    key: "withdraw",
    description: "Withdraw money from your bank account",
    aliases: ["wd"],
    icon: "💸",
    validator: new CassCheckly([
      { index: 0, type: "number", required: true, name: "amount" }
    ]),
    async handler({ money, input, output, args }) {
      const amount = parseInt(args[0]);
      if (!amount || amount <= 0) {
        return output.reply(fonts.bold(`
💸 WITHDRAWAL HELP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Usage: bank withdraw <amount>
Example: bank withdraw 5000
`));
      }

      await money.ensureUserInfo(input.senderID);
      const userData = await money.getItem(input.senderID);
      const bank = ensureBankData(userData);
      
      if (bank.balance < amount) {
        return output.reply(fonts.bold(`
❌ INSUFFICIENT BANK FUNDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Bank Balance: $${bank.balance.toLocaleString()}
Required Amount: $${amount.toLocaleString()}
Shortfall: $${(amount - bank.balance).toLocaleString()}

💡 Tips:
• Use 'bank collect' to claim interest
• Transfer from savings if available
• Work or invest to earn more money
`));
      }

      userData.money = (userData.money || 0) + amount;
      bank.balance -= amount;
      bank.transactions.push({
        type: "withdrawal",
        amount: amount,
        date: Date.now(),
        description: "Cash withdrawal"
      });

      await money.setItem(input.senderID, userData);

      return output.reply(fonts.bold(`
💸 WITHDRAWAL SUCCESSFUL!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💵 Amount Withdrawn: $${amount.toLocaleString()}
💳 New Wallet Balance: $${userData.money.toLocaleString()}
🏦 Remaining Bank Balance: $${bank.balance.toLocaleString()}

📊 Transaction recorded successfully!

💡 Remember: Money in your wallet can be stolen!
Consider keeping funds in your vault for security.
`));
    }
  },
  {
    key: "transfer",
    description: "Transfer money to another user",
    aliases: ["send"],
    icon: "📤",
    validator: new CassCheckly([
      { index: 0, type: "string", required: true, name: "userID" },
      { index: 1, type: "number", required: true, name: "amount" }
    ]),
    async handler({ money, input, output, args }) {
      const targetUID = input.firstMention?.senderID || args[0];
      const amount = parseInt(args[1]);

      if (!targetUID) {
        return output.reply(fonts.bold("❌ Please mention a user to transfer money to.\nUsage: bank transfer @user <amount>"));
      }
      if (targetUID === input.senderID) {
        return output.reply(fonts.bold("❌ You cannot transfer money to yourself."));
      }
      if (!amount || amount <= 0) {
        return output.reply(fonts.bold("❌ Please enter a valid amount to transfer."));
      }

      await money.ensureUserInfo(input.senderID);
      const userData = await money.getItem(input.senderID);
      const bank = ensureBankData(userData);
      
      if (bank.balance < amount) {
        return output.reply(fonts.bold(`❌ Insufficient funds in your bank account. You have $${bank.balance.toLocaleString()}, but need $${amount.toLocaleString()}.`));
      }

      try {
        let targetUser = await money.getItem(targetUID);
        if (!targetUser) {
          targetUser = { money: 0, exp: 0 };
        }
        const targetBank = ensureBankData(targetUser);

        bank.balance -= amount;
        targetBank.balance += amount;
        bank.transactions.push({
          type: "transfer_out",
          amount: amount,
          date: Date.now(),
          description: `Transfer to user ${targetUID}`
        });
        targetBank.transactions.push({
          type: "transfer_in",
          amount: amount,
          date: Date.now(),
          description: `Transfer from user ${input.senderID}`
        });

        await money.setItem(targetUID, targetUser);
        await money.setItem(input.senderID, userData);

        return output.reply(fonts.bold(`✅ Successfully transferred $${amount.toLocaleString()} to the user.\nYour new balance: $${bank.balance.toLocaleString()}`));
      } catch (error) {
        console.error('Transfer error:', error);
        return output.reply(fonts.bold("❌ An error occurred during the transfer. Please try again."));
      }
    }
  },
  {
    key: "loan",
    description: "Take a loan from the bank",
    aliases: ["l"],
    icon: "💳",
    validator: new CassCheckly([
      { index: 0, type: "number", required: false, name: "amount" }
    ]),
    async handler({ money, input, output, args }) {
      const amount = parseInt(args[0]);

      await money.ensureUserInfo(input.senderID);
      const userData = await money.getItem(input.senderID);
      const bank = ensureBankData(userData);

      if (!amount || amount <= 0) {
        const maxLoan = Math.floor(bank.creditScore * 1000);
        return output.reply(fonts.bold(`
💳 LOAN INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your Credit Score: ${bank.creditScore}
Maximum Loan Amount: $${maxLoan.toLocaleString()}
Interest Rate: 5% per week
Current Loan: ${bank.loan > 0 ? "$" + bank.loan.toLocaleString() : "None"}
${bank.loanDate ? `Loan Date: ${new Date(bank.loanDate).toLocaleDateString()}` : ""}

Usage: bank loan <amount>
Example: bank loan 50000
`));
      }

      if (bank.loan > 0) {
        return output.reply(fonts.bold(`❌ You already have an active loan of $${bank.loan.toLocaleString()}. Please repay it first using 'bank repay <amount>'.`));
      }

      const maxLoan = Math.floor(bank.creditScore * 1000);
      if (amount > maxLoan) {
        return output.reply(fonts.bold(`❌ Maximum loan amount based on your credit score (${bank.creditScore}): $${maxLoan.toLocaleString()}\nRequested: $${amount.toLocaleString()}`));
      }
      if (amount < 1000) {
        return output.reply(fonts.bold("❌ Minimum loan amount is $1,000."));
      }

      bank.balance += amount;
      bank.loan = amount;
      bank.loanDate = new Date();
      bank.transactions.push({
        type: "loan",
        amount: amount,
        date: Date.now(),
        description: "Bank loan approved"
      });

      await money.setItem(input.senderID, userData);
      return output.reply(fonts.bold(`✅ Loan approved! $${amount.toLocaleString()} has been added to your bank account.\nInterest rate: 5% per week\nCurrent balance: $${bank.balance.toLocaleString()}\nPlease repay responsibly to maintain your credit score.`));
    }
  },
  {
    key: "repay",
    description: "Repay your loan",
    aliases: ["rep"],
    icon: "🔄",
    validator: new CassCheckly([
      { index: 0, type: "number", required: false, name: "amount" }
    ]),
    async handler({ money, input, output, args }) {
      const amount = parseInt(args[0]);

      await money.ensureUserInfo(input.senderID);
      const userData = await money.getItem(input.senderID);
      const bank = ensureBankData(userData);

      if (bank.loan <= 0) {
        return output.reply(fonts.bold("❌ You don't have any active loans."));
      }
      if (!amount || amount <= 0) {
        return output.reply(fonts.bold(`
💳 LOAN REPAYMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Outstanding Loan: $${bank.loan.toLocaleString()}
Your Balance: $${bank.balance.toLocaleString()}

Usage: bank repay <amount>
Example: bank repay ${Math.min(bank.loan, bank.balance)}
`));
      }
      if (bank.balance < amount) {
        return output.reply(fonts.bold("❌ Insufficient funds in your bank account."));
      }

      const repayAmount = Math.min(amount, bank.loan);
      bank.balance -= repayAmount;
      bank.loan -= repayAmount;
      if (bank.loan <= 0) {
        bank.loanDate = null;
        bank.creditScore += 10;
      }
      bank.transactions.push({
        type: "loan_repayment",
        amount: repayAmount,
        date: Date.now(),
        description: "Loan repayment"
      });

      await money.setItem(input.senderID, userData);

      const message_text = bank.loan <= 0 
        ? `✅ Loan fully repaid! Your credit score increased by 10 points.` 
        : `✅ Successfully repaid $${repayAmount.toLocaleString()}.\nRemaining loan: $${bank.loan.toLocaleString()}`;
      return output.reply(fonts.bold(message_text));
    }
  },
  {
    key: "savings",
    description: "Manage your savings account",
    aliases: ["save"],
    icon: "🏛️",
    validator: new CassCheckly([
      { index: 0, type: "string", required: false, name: "action" },
      { index: 1, type: "number", required: false, name: "amount" }
    ]),
    async handler({ money, input, output, args }) {
      const action = args[0]?.toLowerCase();
      const amount = parseInt(args[1]);

      await money.ensureUserInfo(input.senderID);
      const userData = await money.getItem(input.senderID);
      const bank = ensureBankData(userData);

      if (action === "withdraw" || action === "out") {
        if (!amount || amount <= 0) {
          return output.reply(fonts.bold("❌ Invalid amount. Use: bank savings withdraw <amount>"));
        }
        if (bank.savings < amount) {
          return output.reply(fonts.bold(`❌ Insufficient savings. You have $${bank.savings.toLocaleString()}.`));
        }
        bank.savings -= amount;
        bank.balance += amount;
        bank.transactions.push({
          type: "savings_withdrawal",
          amount: amount,
          date: Date.now(),
          description: "Savings withdrawal"
        });
        await money.setItem(input.senderID, userData);
        return output.reply(fonts.bold(`✅ Withdrew $${amount.toLocaleString()} from savings.\n💰 New bank balance: $${bank.balance.toLocaleString()}\n🏛️ New savings: $${bank.savings.toLocaleString()}`));
      }

      if (!amount || amount <= 0) {
        return output.reply(fonts.bold(`
💰 SAVINGS ACCOUNT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Current Savings: $${bank.savings.toLocaleString()}
Bank Balance: $${bank.balance.toLocaleString()}
Interest Rate: 3% monthly

Savings earn interest every month automatically!

Usage: bank savings <amount>  (deposit)
       bank savings withdraw <amount>  (withdraw)
Example: bank savings 10000
`));
      }
      if (bank.balance < amount) {
        return output.reply(fonts.bold("❌ Insufficient funds in your bank account."));
      }
      bank.balance -= amount;
      bank.savings += amount;
      bank.transactions.push({
        type: "savings_deposit",
        amount: amount,
        date: Date.now(),
        description: "Savings deposit"
      });
      await money.setItem(input.senderID, userData);
      return output.reply(fonts.bold(`✅ Successfully saved $${amount.toLocaleString()}.\nSavings earn 3% interest monthly.\nNew savings balance: $${bank.savings.toLocaleString()}`));
    }
  },
  {
    key: "interest",
    description: "Calculate your interest earnings",
    aliases: ["int"],
    icon: "📊",
    validator: new CassCheckly([]),
    async handler({ money, input, output }) {
      await money.ensureUserInfo(input.senderID);
      const userData = await money.getItem(input.senderID);
      const bank = ensureBankData(userData);

      const now = Date.now();
      const lastInterest = bank.lastInterest ? new Date(bank.lastInterest).getTime() : now;
      const timeDiff = now - lastInterest;
      const hoursPassed = timeDiff / (1000 * 60 * 60);

      const savingsRate = 0.03 / (30 * 24);
      const loanRate = 0.05 / (7 * 24);
      const savingsInterest = Math.floor(bank.savings * savingsRate * hoursPassed);
      const loanInterest = Math.floor(bank.loan * loanRate * hoursPassed);

      if (hoursPassed < 1) {
        return output.reply(fonts.bold(`
📊 INTEREST PREVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Time since last calculation: ${Math.floor(hoursPassed * 60)} minutes
Minimum time required: 1 hour

${fonts.bold("💰 Potential Savings Interest:")} +$${savingsInterest.toLocaleString()}
${fonts.bold("💸 Potential Loan Interest:")} +$${loanInterest.toLocaleString()}

Wait ${60 - Math.floor(hoursPassed * 60)} more minutes to collect interest.
`));
      }

      bank.savings += savingsInterest;
      bank.loan += loanInterest;
      bank.lastInterest = new Date();

      if (savingsInterest > 0) {
        bank.transactions.push({
          type: "interest_earned",
          amount: savingsInterest,
          date: Date.now(),
          description: `Savings interest (${Math.floor(hoursPassed)}h)`
        });
      }
      if (loanInterest > 0) {
        bank.transactions.push({
          type: "interest_charged",
          amount: loanInterest,
          date: Date.now(),
          description: `Loan interest (${Math.floor(hoursPassed)}h)`
        });
      }

      await money.setItem(input.senderID, userData);

      const interestText = `
${fonts.bold("📊 INTEREST CALCULATION")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${fonts.bold("⏰ Time Period:")} ${Math.floor(hoursPassed)} hours
${fonts.bold("💰 Savings Interest Earned:")} +$${savingsInterest.toLocaleString()}
${fonts.bold("💸 Loan Interest Accrued:")} +$${loanInterest.toLocaleString()}

${fonts.bold("📈 Updated Balances:")}
• Savings: $${bank.savings.toLocaleString()}
• Loan: $${bank.loan.toLocaleString()}
• Net Change: ${savingsInterest - loanInterest >= 0 ? '+' : ''}$${(savingsInterest - loanInterest).toLocaleString()}
`;
      return output.reply(interestText);
    }
  },
  {
    key: "collect",
    description: "Collect your interest earnings",
    aliases: ["col"],
    icon: "💰",
    validator: new CassCheckly([]),
    async handler({ money, input, output }) {
      await money.ensureUserInfo(input.senderID);
      const userData = await money.getItem(input.senderID);
      const bank = ensureBankData(userData);

      const now = Date.now();
      const lastInterest = bank.lastInterest ? new Date(bank.lastInterest).getTime() : 0;
      const timeDiff = now - lastInterest;
      const hoursPassed = timeDiff / (1000 * 60 * 60);

      if (bank.lastInterest && hoursPassed < 1) {
        const minutesLeft = 60 - Math.floor(hoursPassed * 60);
        return output.reply(fonts.bold(`⏰ Interest can only be collected once per hour.\nWait ${minutesLeft} more minutes.`));
      }

      const savingsRate = 0.03 / (30 * 24);
      const vaultRate = 0.01 / (30 * 24);
      const loanRate = 0.05 / (7 * 24);

      const savingsInterest = Math.floor(bank.savings * savingsRate * hoursPassed);
      const vaultInterest = Math.floor(bank.vault * vaultRate * hoursPassed);
      const loanInterest = Math.floor(bank.loan * loanRate * hoursPassed);
      const netInterest = savingsInterest + vaultInterest - loanInterest;

      bank.savings += savingsInterest;
      bank.vault += vaultInterest;
      bank.loan += loanInterest;
      bank.lastInterest = new Date();

      if (savingsInterest > 0) {
        bank.transactions.push({
          type: "interest_earned",
          amount: savingsInterest,
          date: Date.now(),
          description: `Savings interest (${Math.floor(hoursPassed)}h)`
        });
      }
      if (vaultInterest > 0) {
        bank.transactions.push({
          type: "interest_earned",
          amount: vaultInterest,
          date: Date.now(),
          description: `Vault interest (${Math.floor(hoursPassed)}h)`
        });
      }
      if (loanInterest > 0) {
        bank.transactions.push({
          type: "interest_charged",
          amount: loanInterest,
          date: Date.now(),
          description: `Loan interest (${Math.floor(hoursPassed)}h)`
        });
      }

      await money.setItem(input.senderID, userData);

      const interestText = `
${fonts.bold("💰 INTEREST COLLECTED")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${fonts.bold("⏰ Time Period:")} ${Math.floor(hoursPassed)} hours

${fonts.bold("💰 EARNINGS:")}
• Savings Interest: +$${savingsInterest.toLocaleString()}
• Vault Interest: +$${vaultInterest.toLocaleString()}

${fonts.bold("💸 CHARGES:")}
• Loan Interest: -$${loanInterest.toLocaleString()}

${fonts.bold("📊 NET RESULT:")} ${netInterest >= 0 ? '+' : ''}$${netInterest.toLocaleString()}

${fonts.bold("📈 Current Balances:")}
• Savings: $${bank.savings.toLocaleString()}
• Vault: $${bank.vault.toLocaleString()}
• Outstanding Loan: $${bank.loan.toLocaleString()}
`;
      return output.reply(interestText);
    }
  },
  {
    key: "history",
    description: "View your transaction history",
    aliases: ["hist"],
    icon: "📋",
    validator: new CassCheckly([]),
    async handler({ money, input, output }) {
      await money.ensureUserInfo(input.senderID);
      const userData = await money.getItem(input.senderID);
      const bank = ensureBankData(userData);
      
      const transactions = bank.transactions.slice(-15);
      if (transactions.length === 0) {
        return output.reply(fonts.bold("📋 No transaction history available."));
      }

      let historyText = `${fonts.bold("📋 TRANSACTION HISTORY (Last 15)")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      transactions.reverse().forEach((tx: any, index: number) => {
        const date = new Date(tx.date).toLocaleDateString();
        const type = tx.type.replace(/_/g, ' ').toUpperCase();
        const amount = tx.amount.toLocaleString();
        const emoji = getTransactionEmoji(tx.type);
        historyText += `${emoji} ${type}: $${amount} (${date})\n`;
      });
      return output.reply(historyText);
    }
  },
  {
    key: "daily",
    description: "Claim your daily reward",
    aliases: ["d"],
    icon: "🎁",
    validator: new CassCheckly([]),
    async handler({ money, input, output }) {
      await money.ensureUserInfo(input.senderID);
      const userData = await money.getItem(input.senderID);
      const bank = ensureBankData(userData);

      const now = Date.now();
      const lastDaily = bank.lastDaily ? new Date(bank.lastDaily).getTime() : 0;
      const oneDayMs = 24 * 60 * 60 * 1000;

      if (now - lastDaily < oneDayMs) {
        const timeLeft = oneDayMs - (now - lastDaily);
        const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000));
        const minutesLeft = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
        return output.reply(fonts.bold(`⏰ Daily reward already claimed!\nNext reward in: ${hoursLeft}h ${minutesLeft}m`));
      }

      if (now - lastDaily < oneDayMs * 2) {
        bank.streak++;
      } else {
        bank.streak = 1;
      }

      const baseReward = 1000;
      const streakBonus = Math.min(bank.streak * 100, 2000);
      const levelBonus = bank.bankLevel * 500;
      const premiumMultiplier = bank.premium ? 2 : 1;
      const totalReward = Math.floor((baseReward + streakBonus + levelBonus) * premiumMultiplier);

      bank.balance += totalReward;
      bank.lastDaily = new Date();
      bank.transactions.push({
        type: "daily_reward",
        amount: totalReward,
        date: Date.now(),
        description: `Daily reward (${bank.streak} day streak)`
      });

      await money.setItem(input.senderID, userData);

      return output.reply(fonts.bold(`
🎁 DAILY REWARD CLAIMED!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 Reward: $${totalReward.toLocaleString()}
🔥 Streak: ${bank.streak} days
📈 Level: ${bank.bankLevel}
⭐ Premium: ${bank.premium ? "2x Bonus!" : "None"}

Keep your streak alive for bigger rewards!
`));
    }
  },
  {
    key: "work",
    description: "Work to earn money",
    aliases: ["w"],
    icon: "💼",
    validator: new CassCheckly([]),
    async handler({ money, input, output }) {
      await money.ensureUserInfo(input.senderID);
      const userData = await money.getItem(input.senderID);
      const bank = ensureBankData(userData);

      const now = Date.now();
      const lastWork = bank.lastWork ? new Date(bank.lastWork).getTime() : 0;
      const workCooldown = 4 * 60 * 60 * 1000;

      if (now - lastWork < workCooldown) {
        const timeLeft = workCooldown - (now - lastWork);
        const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000));
        const minutesLeft = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
        return output.reply(fonts.bold(`⏰ You're too tired to work!\nRest for: ${hoursLeft}h ${minutesLeft}m`));
      }

      const jobs = [
        { name: "Delivery Driver", min: 500, max: 1500 },
        { name: "Data Entry", min: 300, max: 800 },
        { name: "Freelancer", min: 1000, max: 3000 },
        { name: "Consultant", min: 2000, max: 5000 },
        { name: "Manager", min: 3000, max: 7000 }
      ];
      const job = jobs[Math.floor(Math.random() * jobs.length)];
      const salary = Math.floor(Math.random() * (job.max - job.min + 1)) + job.min;
      const skillBonus = bank.skills.business * 100;
      const totalEarnings = Math.floor((salary + skillBonus) * bank.multiplier);

      bank.balance += totalEarnings;
      bank.lastWork = new Date();
      bank.skills.business += 1;
      bank.transactions.push({
        type: "salary",
        amount: totalEarnings,
        date: Date.now(),
        description: `Work: ${job.name}`
      });

      await money.setItem(input.senderID, userData);

      return output.reply(fonts.bold(`
💼 WORK COMPLETED!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Job: ${job.name}
Base Salary: $${salary.toLocaleString()}
Skill Bonus: $${skillBonus.toLocaleString()}
Total Earned: $${totalEarnings.toLocaleString()}

Business Skill increased! (${bank.skills.business})
`));
    }
  },
  {
    key: "stocks",
    description: "Trade stocks on the market",
    aliases: ["stock"],
    icon: "📈",
    validator: new CassCheckly([
      { index: 0, type: "string", required: false, name: "action" },
      { index: 1, type: "string", required: false, name: "symbol" },
      { index: 2, type: "number", required: false, name: "shares" }
    ]),
    async handler({ money, input, output, args }) {
      const action = args[0]?.toLowerCase();
      const symbol = args[1]?.toUpperCase();
      const shares = parseInt(args[2]);

      await money.ensureUserInfo(input.senderID);
      const userData = await money.getItem(input.senderID);
      const bank = ensureBankData(userData);

      if (!action || action === "list") {
        let stockList = `${fonts.bold("📈 STOCK MARKET")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        Object.entries(marketData.stocks).forEach(([sym, data]: [string, any]) => {
          const changeEmoji = data.change >= 0 ? "📈" : "📉";
          const changeColor = data.change >= 0 ? "+" : "";
          stockList += `${changeEmoji} ${sym} - $${data.price.toLocaleString()} (${changeColor}${data.change}%)\n`;
          stockList += `   ${data.name}\n\n`;
        });
        stockList += `${fonts.bold("Your Holdings:")}\n`;
        if (Object.keys(bank.stocks).length === 0) {
          stockList += "None owned\n\n";
        } else {
          Object.entries(bank.stocks).forEach(([sym, shareCount]: [string, any]) => {
            const currentPrice = marketData.stocks[sym]?.price || 0;
            const value = shareCount * currentPrice;
            stockList += `• ${sym}: ${shareCount} shares ($${value.toLocaleString()})\n`;
          });
          stockList += "\n";
        }
        stockList += `${fonts.bold("Usage:")}\n`;
        stockList += `• bank stocks buy <symbol> <shares>\n`;
        stockList += `• bank stocks sell <symbol> <shares>`;
        return output.reply(stockList);
      }

      if (!symbol || !marketData.stocks[symbol]) {
        return output.reply(fonts.bold("❌ Invalid stock symbol. Use 'bank stocks list' to see available stocks."));
      }
      
      if (action === "buy") {
        if (!shares || shares <= 0) {
          return output.reply(fonts.bold("❌ Please specify the number of shares to buy."));
        }
        const stockPrice = marketData.stocks[symbol].price;
        const totalCost = stockPrice * shares;
        if (bank.balance < totalCost) {
          return output.reply(fonts.bold("❌ Insufficient funds. You need $" + totalCost.toLocaleString()));
        }
        bank.balance -= totalCost;
        if (!bank.stocks[symbol]) bank.stocks[symbol] = 0;
        bank.stocks[symbol] += shares;
        bank.transactions.push({
          type: "stock_purchase",
          amount: totalCost,
          date: Date.now(),
          description: `Bought ${shares} shares of ${symbol}`
        });
        await money.setItem(input.senderID, userData);
        return output.reply(fonts.bold(`✅ Bought ${shares} shares of ${symbol} for $${totalCost.toLocaleString()}.`));
      }
      
      if (action === "sell") {
        if (!shares || shares <= 0) {
          return output.reply(fonts.bold("❌ Please specify the number of shares to sell."));
        }
        if (!bank.stocks[symbol] || bank.stocks[symbol] < shares) {
          return output.reply(fonts.bold("❌ You don't own enough shares."));
        }
        const stockPrice = marketData.stocks[symbol].price;
        const totalValue = stockPrice * shares;
        bank.balance += totalValue;
        bank.stocks[symbol] -= shares;
        if (bank.stocks[symbol] === 0) delete bank.stocks[symbol];
        bank.transactions.push({
          type: "stock_sale",
          amount: totalValue,
          date: Date.now(),
          description: `Sold ${shares} shares of ${symbol}`
        });
        await money.setItem(input.senderID, userData);
        return output.reply(fonts.bold(`✅ Sold ${shares} shares of ${symbol} for $${totalValue.toLocaleString()}.`));
      }
    }
  },
  {
    key: "crypto",
    description: "Trade cryptocurrencies",
    aliases: ["crypt"],
    icon: "₿",
    validator: new CassCheckly([
      { index: 0, type: "string", required: false, name: "action" },
      { index: 1, type: "string", required: false, name: "symbol" },
      { index: 2, type: "number", required: false, name: "amount" }
    ]),
    async handler({ money, input, output, args }) {
      const action = args[0]?.toLowerCase();
      const symbol = args[1]?.toUpperCase();
      const amount = parseFloat(args[2]);

      await money.ensureUserInfo(input.senderID);
      const userData = await money.getItem(input.senderID);
      const bank = ensureBankData(userData);

      if (!action || action === "list") {
        let cryptoList = `${fonts.bold("₿ CRYPTOCURRENCY MARKET")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        Object.entries(marketData.crypto).forEach(([sym, data]: [string, any]) => {
          const changeEmoji = data.change >= 0 ? "📈" : "📉";
          const changeColor = data.change >= 0 ? "+" : "";
          cryptoList += `${changeEmoji} ${sym} - $${data.price.toLocaleString()} (${changeColor}${data.change}%)\n`;
          cryptoList += `   ${data.name}\n\n`;
        });
        cryptoList += `${fonts.bold("Your Holdings:")}\n`;
        if (Object.keys(bank.crypto).length === 0) {
          cryptoList += "None owned\n\n";
        } else {
          Object.entries(bank.crypto).forEach(([sym, coinAmount]: [string, any]) => {
            const currentPrice = marketData.crypto[sym]?.price || 0;
            const value = coinAmount * currentPrice;
            cryptoList += `• ${sym}: ${coinAmount} coins ($${value.toLocaleString()})\n`;
          });
          cryptoList += "\n";
        }
        cryptoList += `${fonts.bold("Usage:")}\n`;
        cryptoList += `• bank crypto buy <symbol> <amount>\n`;
        cryptoList += `• bank crypto sell <symbol> <amount>`;
        return output.reply(cryptoList);
      }

      if (!symbol || !marketData.crypto[symbol]) {
        return output.reply(fonts.bold("❌ Invalid crypto symbol. Use 'bank crypto list' to see available cryptos."));
      }
      
      if (action === "buy") {
        if (!amount || amount <= 0) {
          return output.reply(fonts.bold("❌ Please specify the amount to buy."));
        }
        const cryptoPrice = marketData.crypto[symbol].price;
        const totalCost = cryptoPrice * amount;
        if (bank.balance < totalCost) {
          return output.reply(fonts.bold("❌ Insufficient funds. You need $" + totalCost.toLocaleString()));
        }
        bank.balance -= totalCost;
        if (!bank.crypto[symbol]) bank.crypto[symbol] = 0;
        bank.crypto[symbol] += amount;
        bank.transactions.push({
          type: "crypto_purchase",
          amount: totalCost,
          date: Date.now(),
          description: `Bought ${amount} ${symbol}`
        });
        await money.setItem(input.senderID, userData);
        return output.reply(fonts.bold(`✅ Bought ${amount} ${symbol} for $${totalCost.toLocaleString()}.`));
      }
      
      if (action === "sell") {
        if (!amount || amount <= 0) {
          return output.reply(fonts.bold("❌ Please specify the amount to sell."));
        }
        if (!bank.crypto[symbol] || bank.crypto[symbol] < amount) {
          return output.reply(fonts.bold("❌ You don't own enough cryptocurrency."));
        }
        const cryptoPrice = marketData.crypto[symbol].price;
        const totalValue = cryptoPrice * amount;
        bank.balance += totalValue;
        bank.crypto[symbol] -= amount;
        if (bank.crypto[symbol] === 0) delete bank.crypto[symbol];
        bank.transactions.push({
          type: "crypto_sale",
          amount: totalValue,
          date: Date.now(),
          description: `Sold ${amount} ${symbol}`
        });
        await money.setItem(input.senderID, userData);
        return output.reply(fonts.bold(`✅ Sold ${amount} ${symbol} for $${totalValue.toLocaleString()}.`));
      }
    }
  },
  {
    key: "portfolio",
    description: "View your investment portfolio",
    aliases: ["port"],
    icon: "📊",
    validator: new CassCheckly([]),
    async handler({ money, input, output }) {
      await money.ensureUserInfo(input.senderID);
      const userData = await money.getItem(input.senderID);
      const bank = ensureBankData(userData);
      
      let portfolioText = `${fonts.bold("📊 INVESTMENT PORTFOLIO")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      let totalValue = 0;

      if (Object.keys(bank.stocks).length > 0) {
        portfolioText += `${fonts.bold("📈 STOCKS:")}\n`;
        Object.entries(bank.stocks).forEach(([symbol, shares]: [string, any]) => {
          const currentPrice = marketData.stocks[symbol]?.price || 100;
          const value = shares * currentPrice;
          totalValue += value;
          portfolioText += `• ${symbol}: ${shares} shares ($${value.toLocaleString()})\n`;
        });
        portfolioText += "\n";
      }
      if (Object.keys(bank.crypto).length > 0) {
        portfolioText += `${fonts.bold("₿ CRYPTOCURRENCY:")}\n`;
        Object.entries(bank.crypto).forEach(([coin, coinAmount]: [string, any]) => {
          const currentPrice = marketData.crypto[coin]?.price || 1;
          const value = coinAmount * currentPrice;
          totalValue += value;
          portfolioText += `• ${coin}: ${coinAmount} coins ($${value.toLocaleString()})\n`;
        });
        portfolioText += "\n";
      }
      if (Object.keys(bank.bonds).length > 0) {
        portfolioText += `${fonts.bold("🏛️ BONDS:")}\n`;
        Object.entries(bank.bonds).forEach(([type, bondAmount]: [string, any]) => {
          totalValue += bondAmount;
          portfolioText += `• ${type.replace(/_/g, ' ')}: $${bondAmount.toLocaleString()}\n`;
        });
        portfolioText += "\n";
      }
      portfolioText += `${fonts.bold("Total Portfolio Value: $" + totalValue.toLocaleString())}`;
      if (totalValue === 0) {
        portfolioText = fonts.bold("📊 Your investment portfolio is empty.\nStart investing with 'bank stocks list' or 'bank crypto list'!");
      }
      return output.reply(portfolioText);
    }
  },
  {
    key: "gamble",
    description: "Gamble your money",
    aliases: ["gamb"],
    icon: "🎲",
    validator: new CassCheckly([
      { index: 0, type: "number", required: true, name: "amount" }
    ]),
    async handler({ money, input, output, args }) {
      const amount = parseInt(args[0]);
      
      await money.ensureUserInfo(input.senderID);
      const userData = await money.getItem(input.senderID);
      const bank = ensureBankData(userData);
      
      if (!amount || amount <= 0) {
        return output.reply(fonts.bold(`
🎰 GAMBLING GAMES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Available Games:
• bank gamble <amount> - Classic risk/reward
• bank slots <amount> - Slot machine
• bank blackjack <amount> - Card game
• bank roulette <amount> <bet> - Roulette wheel

Your Balance: $${bank.balance.toLocaleString()}
Gambling Skill: ${bank.skills.gambling}
`));
      }
      if (bank.balance < amount) {
        return output.reply(fonts.bold("❌ Insufficient funds."));
      }
      
      const random = Math.random();
      const skillBonus = bank.skills.gambling * 0.01;
      const winChance = 0.45 + skillBonus;
      let result, winnings = 0;
      if (random < winChance) {
        const multiplier = Math.random() < 0.1 ? 3 : 2;
        result = "🎉 WIN!";
        winnings = amount * multiplier;
        bank.balance += winnings - amount;
        bank.skills.gambling += 1;
      } else {
        result = "💸 LOSE!";
        bank.balance -= amount;
      }
      bank.transactions.push({
        type: winnings > 0 ? "gambling_win" : "gambling_loss",
        amount: winnings > 0 ? winnings - amount : amount,
        date: Date.now(),
        description: `Gambling: ${result}`
      });
      await money.setItem(input.senderID, userData);
      
      const resultText = winnings > 0 
        ? `${result} You won $${(winnings - amount).toLocaleString()}! (${winnings/amount}x multiplier)` 
        : `${result} You lost $${amount.toLocaleString()}!`;
      return output.reply(fonts.bold(`🎰 ${resultText}\nGambling skill increased! (${bank.skills.gambling})`));
    }
  },
  {
    key: "slots",
    description: "Play the slot machine",
    aliases: ["slot"],
    icon: "🎰",
    validator: new CassCheckly([
      { index: 0, type: "number", required: true, name: "amount" }
    ]),
    async handler({ money, input, output, args }) {
      const amount = parseInt(args[0]);
      
      await money.ensureUserInfo(input.senderID);
      const userData = await money.getItem(input.senderID);
      const bank = ensureBankData(userData);
      
      if (!amount || amount <= 0) {
        return output.reply(fonts.bold("❌ Please enter a valid amount to play slots."));
      }
      if (bank.balance < amount) {
        return output.reply(fonts.bold("❌ Insufficient funds."));
      }
      
      const symbols = ["🍒", "🍋", "🍊", "🍇", "🔔", "💎", "7️⃣", "⭐"];
      const slot1 = symbols[Math.floor(Math.random() * symbols.length)];
      const slot2 = symbols[Math.floor(Math.random() * symbols.length)];
      const slot3 = symbols[Math.floor(Math.random() * symbols.length)];
      let winnings = 0;
      let multiplier = 0;
      if (slot1 === slot2 && slot2 === slot3) {
        if (slot1 === "7️⃣") multiplier = 50;
        else if (slot1 === "💎") multiplier = 25;
        else if (slot1 === "⭐") multiplier = 15;
        else multiplier = 10;
      } else if (slot1 === slot2 || slot2 === slot3 || slot1 === slot3) {
        multiplier = 2;
      }
      if (multiplier > 0) {
        winnings = amount * multiplier;
        bank.balance += winnings - amount;
      } else {
        bank.balance -= amount;
      }
      bank.transactions.push({
        type: winnings > 0 ? "gambling_win" : "gambling_loss",
        amount: winnings > 0 ? winnings - amount : amount,
        date: Date.now(),
        description: `Slots: ${slot1}${slot2}${slot3}`
      });
      await money.setItem(input.senderID, userData);
      
      const slotText = `
🎰 SLOT MACHINE 🎰
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─────────────┐
│ ${slot1} │ ${slot2} │ ${slot3} │
└─────────────┘

${winnings > 0 ? `🎉 JACKPOT! You won $${(winnings - amount).toLocaleString()}! (${multiplier}x)` : `💸 No match! You lost $${amount.toLocaleString()}!`}

Balance: $${bank.balance.toLocaleString()}
`;
      return output.reply(slotText);
    }
  },
  {
    key: "blackjack",
    description: "Play blackjack",
    aliases: ["bj"],
    icon: "🃏",
    validator: new CassCheckly([
      { index: 0, type: "number", required: true, name: "amount" }
    ]),
    async handler({ money, input, output, args }) {
      const amount = parseInt(args[0]);
      
      await money.ensureUserInfo(input.senderID);
      const userData = await money.getItem(input.senderID);
      const bank = ensureBankData(userData);
      
      if (!amount || amount <= 0) {
        return output.reply(fonts.bold("❌ Please enter a valid amount to play blackjack."));
      }
      if (bank.balance < amount) {
        return output.reply(fonts.bold("❌ Insufficient funds."));
      }
      
      const getCard = () => Math.min(Math.floor(Math.random() * 13) + 1, 10);
      const playerCard1 = getCard();
      const playerCard2 = getCard();
      const dealerCard1 = getCard();
      const dealerCard2 = getCard();
      const playerTotal = playerCard1 + playerCard2;
      const dealerTotal = dealerCard1 + dealerCard2;
      let result, winnings = 0;
      if (playerTotal === 21) {
        result = "🎉 BLACKJACK!";
        winnings = amount * 2.5;
      } else if (playerTotal > 21) {
        result = "💸 BUST!";
      } else if (dealerTotal > 21) {
        result = "🎉 DEALER BUST!";
        winnings = amount * 2;
      } else if (playerTotal > dealerTotal) {
        result = "🎉 WIN!";
        winnings = amount * 2;
      } else if (playerTotal === dealerTotal) {
        result = "🤝 PUSH!";
        winnings = amount;
      } else {
        result = "💸 LOSE!";
      }
      if (winnings > 0) {
        bank.balance += winnings - amount;
      } else {
        bank.balance -= amount;
      }
      bank.transactions.push({
        type: winnings > amount ? "gambling_win" : winnings === amount ? "gambling_push" : "gambling_loss",
        amount: Math.abs(winnings - amount),
        date: Date.now(),
        description: `Blackjack: ${result}`
      });
      await money.setItem(input.senderID, userData);
      
      const blackjackText = `
🃏 BLACKJACK 🃏
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your Cards: ${playerCard1} + ${playerCard2} = ${playerTotal}
Dealer Cards: ${dealerCard1} + ${dealerCard2} = ${dealerTotal}

${result}
${winnings > amount ? `You won $${(winnings - amount).toLocaleString()}!` : 
  winnings === amount ? `It's a tie!` : 
  `You lost $${amount.toLocaleString()}!`}

Balance: $${bank.balance.toLocaleString()}
`;
      return output.reply(blackjackText);
    }
  },
  {
    key: "roulette",
    description: "Play roulette",
    aliases: ["roul"],
    icon: "🎯",
    validator: new CassCheckly([
      { index: 0, type: "number", required: true, name: "amount" },
      { index: 1, type: "string", required: true, name: "bet" }
    ]),
    async handler({ money, input, output, args }) {
      const amount = parseInt(args[0]);
      const bet = args[1]?.toLowerCase();
      
      await money.ensureUserInfo(input.senderID);
      const userData = await money.getItem(input.senderID);
      const bank = ensureBankData(userData);
      
      if (!amount || amount <= 0) {
        return output.reply(fonts.bold(`
🎯 ROULETTE WHEEL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Betting Options:
• red/black - 2x payout
• odd/even - 2x payout
• high (19-36)/low (1-18) - 2x payout
• number (0-36) - 36x payout

Usage: bank roulette <amount> <bet>
Example: bank roulette 1000 red
`));
      }
      if (!bet) {
        return output.reply(fonts.bold("❌ Please specify your bet (red/black/odd/even/high/low/number)."));
      }
      if (bank.balance < amount) {
        return output.reply(fonts.bold("❌ Insufficient funds."));
      }
      
      const winningNumber = Math.floor(Math.random() * 37);
      const isRed = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(winningNumber);
      const isBlack = winningNumber !== 0 && !isRed;
      const isOdd = winningNumber > 0 && winningNumber % 2 === 1;
      const isEven = winningNumber > 0 && winningNumber % 2 === 0;
      const isHigh = winningNumber >= 19 && winningNumber <= 36;
      const isLow = winningNumber >= 1 && winningNumber <= 18;
      let won = false, multiplier = 0;
      if (bet === "red" && isRed) { won = true; multiplier = 2; }
      else if (bet === "black" && isBlack) { won = true; multiplier = 2; }
      else if (bet === "odd" && isOdd) { won = true; multiplier = 2; }
      else if (bet === "even" && isEven) { won = true; multiplier = 2; }
      else if (bet === "high" && isHigh) { won = true; multiplier = 2; }
      else if (bet === "low" && isLow) { won = true; multiplier = 2; }
      else if (bet === winningNumber.toString()) { won = true; multiplier = 36; }
      let winnings = 0;
      if (won) {
        winnings = amount * multiplier;
        bank.balance += winnings - amount;
      } else {
        bank.balance -= amount;
      }
      bank.transactions.push({
        type: won ? "gambling_win" : "gambling_loss",
        amount: won ? winnings - amount : amount,
        date: Date.now(),
        description: `Roulette: ${winningNumber} (${bet})`
      });
      await money.setItem(input.senderID, userData);
      
      const color = winningNumber === 0 ? "🟢" : isRed ? "🔴" : "⚫";
      const result = won ? `🎉 WIN! You won $${(winnings - amount).toLocaleString()}! (${multiplier}x)` : `💸 You lost $${amount.toLocaleString()}!`;
      const rouletteText = `
🎯 ROULETTE RESULT 🎯
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Winning Number: ${color} ${winningNumber}
Your Bet: ${bet}

${result}

Balance: $${bank.balance.toLocaleString()}
`;
      return output.reply(rouletteText);
    }
  },
  {
    key: "leaderboard",
    description: "View the richest users",
    aliases: ["lb", "top"],
    icon: "🏆",
    validator: new CassCheckly([]),
    async handler({ money, output }) {
      const allUsers = await money.getAll();
      const richestUsers: any[] = [];
      
      for (const [uid, user] of Object.entries(allUsers)) {
        const bank = (user as any).bankData;
        if (bank && (bank.balance > 0 || bank.savings > 0 || bank.vault > 0)) {
          const wealth = (bank.balance || 0) + (bank.savings || 0) + (bank.vault || 0);
          richestUsers.push({
            uid,
            wealth,
            level: bank.bankLevel || 1,
            premium: bank.premium || false,
            achievements: bank.achievements?.length || 0,
            name: (user as any).name || `User ${uid}`
          });
        }
      }
      
      richestUsers.sort((a, b) => b.wealth - a.wealth);
      const top10 = richestUsers.slice(0, 10);
      let leaderboardText = `${fonts.bold("🏆 LEADERBOARD")}\n`;
      leaderboardText += `━━━━━━━━━━━\n`;
      leaderboardText += `💎 ${fonts.bold("TOP USERS")} 💎\n\n`;
      
      if (top10.length === 0) {
        leaderboardText += `${fonts.bold("📊 No wealthy users found yet!")}\n`;
        leaderboardText += `${fonts.bold("💡 Start banking to appear on the leaderboard!")}`;
      } else {
        top10.forEach((user, index) => {
          const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${fonts.bold(`#${index + 1}`)}`;
          const crown = index === 0 ? " 👑" : index === 1 ? " ⭐" : index === 2 ? " ✨" : "";
          const premiumIcon = user.premium ? " 💎" : "";
          const levelIcon = user.level >= 10 ? " 🔥" : user.level >= 5 ? " ⚡" : "";
          leaderboardText += `${medal} ${fonts.bold(user.name)}${crown}${premiumIcon}${levelIcon}\n`;
          leaderboardText += `   💰 Wealth: $${user.wealth.toLocaleString()}\n`;
          leaderboardText += `   📈 Level: ${user.level}`;
          if (user.achievements > 0) {
            leaderboardText += ` | 🏆 ${user.achievements} achievements`;
          }
          if (user.wealth >= 1000000000) {
            leaderboardText += ` | 💎 Billionaire`;
          } else if (user.wealth >= 1000000) {
            leaderboardText += ` | 🏆 Millionaire`;
          } else if (user.wealth >= 100000) {
            leaderboardText += ` | ⭐ Wealthy`;
          }
          leaderboardText += `\n\n`;
        });
        leaderboardText += `${fonts.bold("🔥 LEADERBOARD TIERS")}\n`;
        leaderboardText += `💎 Billionaire: $1B+\n`;
        leaderboardText += `🏆 Millionaire: $1M+\n`;
        leaderboardText += `⭐ Wealthy: $100K+\n`;
        leaderboardText += `📈 Rising: $10K+\n\n`;
      }
      return output.reply(leaderboardText);
    }
  }
];

const home = new SpectralCMDHome(
  {
    argIndex: 0,
    isHypen: false,
    globalCooldown: 5,
    defaultKey: "help",
    errorHandler: (error, ctx) => {
      ctx.output.error(error);
    },
    defaultCategory: "Finance",
  },
  configs
);

import { defineEntry } from "@cass/define";

export const entry = defineEntry(async (ctx) => {
  return home.runInContext(ctx);
});