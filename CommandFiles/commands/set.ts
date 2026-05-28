import {
  SpectralCMDHome,
  Config,
} from "../modules/spectralCMDHome";
import { UNIRedux, UNISpectra } from "@cassidy/unispectra";
import { defineEntry, defineCommand } from "@cass/define";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMoney(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return "0$";
  if (amount === Infinity) return "∞$";
  if (amount === -Infinity) return "-∞$";
  if (!isFinite(amount)) return "NaN$";

  const scales = [
    { value: 1e18, suffix: "Qi" },
    { value: 1e15, suffix: "Qa" },
    { value: 1e12, suffix: "T" },
    { value: 1e9,  suffix: "B" },
    { value: 1e6,  suffix: "M" },
    { value: 1e3,  suffix: "K" },
  ];
  const scale = scales.find((s) => Math.abs(amount) >= s.value);
  if (scale) {
    const scaled = (amount / scale.value).toFixed(2);
    const clean = scaled.endsWith(".00") ? scaled.slice(0, -3) : scaled;
    return `${amount < 0 ? "-" : ""}${clean}${scale.suffix}$`;
  }
  return `${amount.toLocaleString("en-US")}$`;
}

// ─── Configs ──────────────────────────────────────────────────────────────────

const configs: Config[] = [

  // ── money ─────────────────────────────────────────────────────────────────
  {
    key: "money",
    description: "Set the money of a user",
    args: ["<amount>", "[@mention | reply | uid]"],
    aliases: ["m", "cash"],
    icon: "💰",
    isAdmin: true,
    async handler({ input, output, money }, { spectralArgs, key }) {
      // Resolve target
      const targetID = input.detectID || input.senderID;
      const rawAmount = spectralArgs.find((a) => /^-?\d+(\.\d+)?$/.test(a));

      if (!rawAmount) {
        return output.replyStyled(
          {
            body:
              `${UNIRedux.arrow} **${key}** ⚠️\n\n` +
              `Please provide a valid amount.\n` +
              `${UNISpectra.arrowFromT} Example: \`set money 1000000 @user\``,
          },
          style
        );
      }

      const amount = parseFloat(rawAmount);

      let userData: any;
      try {
        userData = await money.getItem(targetID);
        if (!userData) throw new Error("User not found");
      } catch {
        return output.replyStyled(
          {
            body:
              `${UNIRedux.arrow} **${key}** ❌\n\n` +
              `User not found in the database.\n` +
              `${UNISpectra.arrowFromT} ID: \`${targetID}\``,
          },
          style
        );
      }

      try {
        await money.setItem(targetID, { money: amount });
        return output.replyStyled(
          {
            body:
              `${UNIRedux.charm} **${key}** ✅\n\n` +
              `💰 Money set to **${formatMoney(amount)}**\n` +
              `${UNISpectra.arrowFromT} User: **${userData.name}** (\`${targetID}\`)`,
          },
          style
        );
      } catch (err: any) {
        return output.replyStyled(
          {
            body:
              `${UNIRedux.arrow} **${key}** ❌\n\n` +
              `Failed to update money.\n` +
              `${UNISpectra.arrowFromT} ${err?.message ?? "Unknown error"}`,
          },
          style
        );
      }
    },
  },

  // ── exp ───────────────────────────────────────────────────────────────────
  {
    key: "exp",
    description: "Set the XP of a user",
    args: ["<amount>", "[@mention | reply | uid]"],
    aliases: ["xp", "e"],
    icon: "🌟",
    isAdmin: true,
    async handler({ input, output, money }, { spectralArgs, key }) {
      const targetID = input.detectID || input.senderID;
      const rawAmount = spectralArgs.find((a) => /^-?\d+(\.\d+)?$/.test(a));

      if (!rawAmount) {
        return output.replyStyled(
          {
            body:
              `${UNIRedux.arrow} **${key}** ⚠️\n\n` +
              `Please provide a valid XP value.\n` +
              `${UNISpectra.arrowFromT} Example: \`set exp 5000 @user\``,
          },
          style
        );
      }

      const amount = parseFloat(rawAmount);

      let userData: any;
      try {
        userData = await money.getItem(targetID);
        if (!userData) throw new Error("User not found");
      } catch {
        return output.replyStyled(
          {
            body:
              `${UNIRedux.arrow} **${key}** ❌\n\n` +
              `User not found in the database.\n` +
              `${UNISpectra.arrowFromT} ID: \`${targetID}\``,
          },
          style
        );
      }

      try {
        await money.setItem(targetID, { exp: amount });
        return output.replyStyled(
          {
            body:
              `${UNIRedux.charm} **${key}** ✅\n\n` +
              `🌟 XP set to **${amount.toLocaleString()}**\n` +
              `${UNISpectra.arrowFromT} User: **${userData.name}** (\`${targetID}\`)`,
          },
          style
        );
      } catch (err: any) {
        return output.replyStyled(
          {
            body:
              `${UNIRedux.arrow} **${key}** ❌\n\n` +
              `Failed to update XP.\n` +
              `${UNISpectra.arrowFromT} ${err?.message ?? "Unknown error"}`,
          },
          style
        );
      }
    },
  },

  // ── custom ────────────────────────────────────────────────────────────────
  {
    key: "custom",
    description: "Set a custom variable on a user's data",
    args: ["<variable>", "<value>", "[@mention | reply | uid]"],
    aliases: ["var", "c"],
    icon: "🔧",
    isAdmin: true,
    async handler({ input, output, money }, { spectralArgs, key }) {
      const targetID = input.detectID || input.senderID;

      // spectralArgs: ["variable", "value", ...]
      const variable = spectralArgs[0];
      const value = spectralArgs[1];

      if (!variable || value === undefined) {
        return output.replyStyled(
          {
            body:
              `${UNIRedux.arrow} **${key}** ⚠️\n\n` +
              `Usage: \`set custom <variable> <value> [@user]\`\n` +
              `${UNISpectra.arrowFromT} Example: \`set custom tmwin1 10 @user\``,
          },
          style
        );
      }

      // Protected fields that shouldn't be overwritten via custom
      const protectedFields = ["name", "id", "userID", "senderID", "fbid"];
      if (protectedFields.includes(variable.toLowerCase())) {
        return output.replyStyled(
          {
            body:
              `${UNIRedux.arrow} **${key}** ❌\n\n` +
              `**${variable}** is a protected field and cannot be modified.`,
          },
          style
        );
      }

      let userData: any;
      try {
        userData = await money.getItem(targetID);
        if (!userData) throw new Error("User not found");
      } catch {
        return output.replyStyled(
          {
            body:
              `${UNIRedux.arrow} **${key}** ❌\n\n` +
              `User not found in the database.\n` +
              `${UNISpectra.arrowFromT} ID: \`${targetID}\``,
          },
          style
        );
      }

      // Auto-cast: try number, then boolean, then keep string
      let parsedValue: any = value;
      if (!isNaN(Number(value)) && value.trim() !== "") {
        parsedValue = Number(value);
      } else if (value === "true") {
        parsedValue = true;
      } else if (value === "false") {
        parsedValue = false;
      }

      try {
        await money.setItem(targetID, { [variable]: parsedValue });
        return output.replyStyled(
          {
            body:
              `${UNIRedux.charm} **${key}** ✅\n\n` +
              `🔧 Variable **${variable}** set to **${String(parsedValue)}**\n` +
              `${UNISpectra.arrowFromT} User: **${userData.name}** (\`${targetID}\`)`,
          },
          style
        );
      } catch (err: any) {
        return output.replyStyled(
          {
            body:
              `${UNIRedux.arrow} **${key}** ❌\n\n` +
              `Failed to set custom variable.\n` +
              `${UNISpectra.arrowFromT} ${err?.message ?? "Unknown error"}`,
          },
          style
        );
      }
    },
  },

  // ── info ──────────────────────────────────────────────────────────────────
  {
    key: "info",
    description: "View the full data of a user",
    args: ["[@mention | reply | uid]"],
    aliases: ["view", "check", "i"],
    icon: "🔍",
    isAdmin: true,
    async handler({ input, output, money }, { key }) {
      const targetID = input.detectID || input.senderID;

      let userData: any;
      try {
        userData = await money.getItem(targetID);
        if (!userData) throw new Error("User not found");
      } catch {
        return output.replyStyled(
          {
            body:
              `${UNIRedux.arrow} **${key}** ❌\n\n` +
              `User not found in the database.\n` +
              `${UNISpectra.arrowFromT} ID: \`${targetID}\``,
          },
          style
        );
      }

      // Pick the most relevant fields to display
      const display: string[] = [];
      const priority = ["name", "money", "exp", "battlePoints", "level"];
      const skip = ["inventory", "collectibles", "analytics"];

      for (const k of priority) {
        if (userData[k] !== undefined) {
          const val =
            k === "money"
              ? formatMoney(Number(userData[k]))
              : String(userData[k]);
          display.push(`  ┣ **${k}**: ${val}`);
        }
      }

      for (const [k, v] of Object.entries(userData)) {
        if (priority.includes(k) || skip.includes(k)) continue;
        if (typeof v === "object") continue;
        display.push(`  ┣ **${k}**: ${v}`);
      }

      return output.replyStyled(
        {
          body:
            `${UNIRedux.charm} **${key}** 🔍\n\n` +
            `👤 **${userData.name}** (\`${targetID}\`)\n\n` +
            ` ┌─────────────┐\n` +
            display.join("\n") +
            `\n └─────────────┘`,
        },
        style
      );
    },
  },
];

// ─── Home ──────────────────────────────────────────────────────────────────────

const home = new SpectralCMDHome(
  {
    argIndex: 0,
    isHypen: false,
    globalCooldown: 3,
    errorHandler: (error, ctx) => ctx.output.error(error),
    defaultCategory: "Owner",
  },
  configs
);

// ─── Command ───────────────────────────────────────────────────────────────────

const command = defineCommand({
  meta: {
    name: "set",
    otherNames: ["setadmin", "admincmd"],
    description:
      "Modify user data (money, XP, custom variables) — admin only",
    version: "2.0.0",
    author: "Christus",
    category: "Owner",
    usage:
      "{prefix}{name} money <amount> [@user]\n" +
      "{prefix}{name} exp <amount> [@user]\n" +
      "{prefix}{name} custom <variable> <value> [@user]\n" +
      "{prefix}{name} info [@user]",
    role: 2,
    noPrefix: false,
    waitingTime: 3,
    requirement: "3.0.0",
    icon: "🔧",
  },
  style: {
    title: "🔧 Set Admin",
    titleFont: "bold",
    contentFont: "fancy",
  },
  entry: defineEntry(async (ctx) => home.runInContext(ctx)),
});

const style = command.style;

export default command;
    
