import {
  SpectralCMDHome,
  Config,
} from "../modules/spectralCMDHome";
import { UNIRedux, UNISpectra } from "@cassidy/unispectra";
import { defineEntry, defineCommand } from "@cass/define";

// ─── Types ────────────────────────────────────────────────────────────────────

interface WhitelistConfig {
  userWhitelist: { enabled: boolean; ids: string[] };
  threadWhitelist: { enabled: boolean; ids: string[] };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getWLConfig(): WhitelistConfig {
  const cfg = global.Cassidy.config as any;
  if (!cfg.whitelistConfig) {
    cfg.whitelistConfig = {
      userWhitelist: { enabled: false, ids: [] },
      threadWhitelist: { enabled: false, ids: [] },
    };
  }
  cfg.whitelistConfig.userWhitelist ??= { enabled: false, ids: [] };
  cfg.whitelistConfig.threadWhitelist ??= { enabled: false, ids: [] };
  return cfg.whitelistConfig as WhitelistConfig;
}

function saveWLConfig(data: WhitelistConfig): void {
  (global.Cassidy.config as any).whitelistConfig = data;
}

// ─── Configs ──────────────────────────────────────────────────────────────────

const configs: Config[] = [

  // ── user ──────────────────────────────────────────────────────────────────
  {
    key: "user",
    description: "Manage the user whitelist (add/remove/list/on/off)",
    args: ["<add|remove|list|on|off>", "[uid | @mention | reply]"],
    aliases: ["u"],
    icon: "👤",
    isAdmin: true,
    async handler({ input, output, money }, { spectralArgs, key }) {
      const action = spectralArgs[0]?.toLowerCase();

      // user add
      if (action === "add" || action === "-a") {
        const wl = getWLConfig();
        let ids: string[] = [];
        if (input.detectID) {
          ids = [input.detectID];
        } else {
          ids = spectralArgs.slice(1).filter((a) => /^\d+$/.test(a.trim()));
        }
        if (ids.length === 0) {
          return output.replyStyled(
            {
              body:
                `${UNIRedux.arrow} **${key} add** ⚠️\n\n` +
                `Please provide a user ID, mention someone, or reply to a message.\n` +
                `Example: \`wl user add 123456789\``,
            },
            style
          );
        }
        const added: string[] = [];
        const alreadyIn: string[] = [];
        for (const id of ids) {
          wl.userWhitelist.ids.includes(id)
            ? alreadyIn.push(id)
            : (wl.userWhitelist.ids.push(id), added.push(id));
        }
        saveWLConfig(wl);
        const getName = async (id: string) => {
          try { return (await money.getItem(id))?.name || "Unknown"; }
          catch { return "Unknown"; }
        };
        let body = `${UNIRedux.charm} **${key} add**\n\n`;
        if (added.length > 0) {
          const lines = await Promise.all(added.map(async (id) => `  • **${await getName(id)}** (${id})`));
          body += `✅ Added ${added.length} user(s):\n${lines.join("\n")}\n`;
        }
        if (alreadyIn.length > 0) {
          const lines = await Promise.all(alreadyIn.map(async (id) => `  • **${await getName(id)}** (${id})`));
          body += `\n⚠️ Already whitelisted (${alreadyIn.length}):\n${lines.join("\n")}`;
        }
        return output.replyStyled({ body }, style);
      }

      // user remove
      if (action === "remove" || action === "-r" || action === "delete" || action === "-d") {
        const wl = getWLConfig();
        let ids: string[] = [];
        if (input.detectID) {
          ids = [input.detectID];
        } else {
          ids = spectralArgs.slice(1).filter((a) => /^\d+$/.test(a.trim()));
        }
        if (ids.length === 0) {
          return output.replyStyled(
            { body: `${UNIRedux.arrow} **${key} remove** ⚠️\n\nPlease provide a user ID, mention someone, or reply to a message.` },
            style
          );
        }
        const removed: string[] = [];
        const notFound: string[] = [];
        for (const id of ids) {
          const idx = wl.userWhitelist.ids.indexOf(id);
          idx !== -1
            ? (wl.userWhitelist.ids.splice(idx, 1), removed.push(id))
            : notFound.push(id);
        }
        saveWLConfig(wl);
        const getName = async (id: string) => {
          try { return (await money.getItem(id))?.name || "Unknown"; }
          catch { return "Unknown"; }
        };
        let body = `${UNIRedux.charm} **${key} remove**\n\n`;
        if (removed.length > 0) {
          const lines = await Promise.all(removed.map(async (id) => `  • **${await getName(id)}** (${id})`));
          body += `✅ Removed ${removed.length} user(s):\n${lines.join("\n")}\n`;
        }
        if (notFound.length > 0) {
          const lines = await Promise.all(notFound.map(async (id) => `  • **${await getName(id)}** (${id})`));
          body += `\n⚠️ Not in whitelist (${notFound.length}):\n${lines.join("\n")}`;
        }
        return output.replyStyled({ body }, style);
      }

      // user list
      if (action === "list" || action === "-l") {
        const wl = getWLConfig();
        const ids = wl.userWhitelist.ids;
        if (ids.length === 0) {
          return output.replyStyled(
            { body: `${UNIRedux.charm} **${key} list** 📋\n\nNo users are currently whitelisted.` },
            style
          );
        }
        const lines = await Promise.all(
          ids.map(async (id, i) => {
            try { return `${i + 1}. **${(await money.getItem(id))?.name || "Unknown"}** (${id})`; }
            catch { return `${i + 1}. Unknown (${id})`; }
          })
        );
        return output.replyStyled(
          {
            body:
              `${UNIRedux.charm} **${key} list** 📋 (${ids.length} total)\n\n` +
              ` ┌─────────────┐\n` +
              lines.map((l) => ` │ ${l}`).join("\n") +
              `\n └─────────────┘`,
          },
          style
        );
      }

      // user on
      if (action === "on" || action === "enable") {
        const wl = getWLConfig();
        wl.userWhitelist.enabled = true;
        saveWLConfig(wl);
        return output.replyStyled(
          {
            body:
              `${UNIRedux.charm} **${key} on** ✅\n\n` +
              `User whitelist mode is now **ENABLED**.\n` +
              `${UNISpectra.arrowFromT} Only whitelisted users can use the bot.`,
          },
          style
        );
      }

      // user off
      if (action === "off" || action === "disable") {
        const wl = getWLConfig();
        wl.userWhitelist.enabled = false;
        saveWLConfig(wl);
        return output.replyStyled(
          {
            body:
              `${UNIRedux.charm} **${key} off** ✅\n\n` +
              `User whitelist mode is now **DISABLED**.\n` +
              `${UNISpectra.arrowFromT} All users can now use the bot.`,
          },
          style
        );
      }

      // fallback
      return output.replyStyled(
        {
          body:
            `${UNIRedux.arrow} **${key}** ⚠️\n\n` +
            `Unknown action: **${action || "(none)"}**\n\n` +
            `Available: \`add\` · \`remove\` · \`list\` · \`on\` · \`off\``,
        },
        style
      );
    },
  },

  // ── thread ────────────────────────────────────────────────────────────────
  {
    key: "thread",
    description: "Manage the thread whitelist (add/remove/list/on/off)",
    args: ["<add|remove|list|on|off>", "[threadID?]"],
    aliases: ["t", "group", "g"],
    icon: "💬",
    isAdmin: true,
    async handler({ input, output, threadsDB }, { spectralArgs, key }) {
      const action = spectralArgs[0]?.toLowerCase();

      // thread add
      if (action === "add" || action === "-a") {
        const wl = getWLConfig();
        const rawID = spectralArgs[1]?.trim() || (input as any).threadID;
        if (!rawID || !/^\d+$/.test(rawID)) {
          return output.replyStyled(
            { body: `${UNIRedux.arrow} **${key} add** ⚠️\n\nPlease provide a valid thread ID, or run in the target thread without arguments.` },
            style
          );
        }
        if (wl.threadWhitelist.ids.includes(rawID)) {
          return output.replyStyled(
            { body: `${UNIRedux.arrow} **${key} add** ⚠️\n\nThread \`${rawID}\` is already in the whitelist.` },
            style
          );
        }
        let threadName = "Unknown Thread";
        try {
          const info = await threadsDB.getItem(rawID);
          threadName = (info as any)?.threadName || threadName;
        } catch {}
        wl.threadWhitelist.ids.push(rawID);
        saveWLConfig(wl);
        return output.replyStyled(
          { body: `${UNIRedux.charm} **${key} add** ✅\n\nAdded thread to whitelist:\n  • **${threadName}** (${rawID})` },
          style
        );
      }

      // thread remove
      if (action === "remove" || action === "-r" || action === "delete" || action === "-d") {
        const wl = getWLConfig();
        const rawID = spectralArgs[1]?.trim() || (input as any).threadID;
        if (!rawID || !/^\d+$/.test(rawID)) {
          return output.replyStyled(
            { body: `${UNIRedux.arrow} **${key} remove** ⚠️\n\nPlease provide a valid thread ID.` },
            style
          );
        }
        const idx = wl.threadWhitelist.ids.indexOf(rawID);
        if (idx === -1) {
          return output.replyStyled(
            { body: `${UNIRedux.arrow} **${key} remove** ⚠️\n\nThread \`${rawID}\` is not in the whitelist.` },
            style
          );
        }
        wl.threadWhitelist.ids.splice(idx, 1);
        saveWLConfig(wl);
        return output.replyStyled(
          { body: `${UNIRedux.charm} **${key} remove** ✅\n\nRemoved thread from whitelist:\n  • \`${rawID}\`` },
          style
        );
      }

      // thread list
      if (action === "list" || action === "-l") {
        const wl = getWLConfig();
        const ids = wl.threadWhitelist.ids;
        if (ids.length === 0) {
          return output.replyStyled(
            { body: `${UNIRedux.charm} **${key} list** 📋\n\nNo threads are currently whitelisted.` },
            style
          );
        }
        const lines = await Promise.all(
          ids.map(async (id, i) => {
            let name = "Unknown Thread";
            try { name = (await threadsDB.getItem(id) as any)?.threadName || name; } catch {}
            return `${i + 1}. **${name}** (${id})`;
          })
        );
        return output.replyStyled(
          {
            body:
              `${UNIRedux.charm} **${key} list** 📋 (${ids.length} total)\n\n` +
              ` ┌─────────────┐\n` +
              lines.map((l) => ` │ ${l}`).join("\n") +
              `\n └─────────────┘`,
          },
          style
        );
      }

      // thread on
      if (action === "on" || action === "enable") {
        const wl = getWLConfig();
        wl.threadWhitelist.enabled = true;
        saveWLConfig(wl);
        return output.replyStyled(
          {
            body:
              `${UNIRedux.charm} **${key} on** ✅\n\n` +
              `Thread whitelist mode is now **ENABLED**.\n` +
              `${UNISpectra.arrowFromT} The bot will only respond in whitelisted threads.`,
          },
          style
        );
      }

      // thread off
      if (action === "off" || action === "disable") {
        const wl = getWLConfig();
        wl.threadWhitelist.enabled = false;
        saveWLConfig(wl);
        return output.replyStyled(
          {
            body:
              `${UNIRedux.charm} **${key} off** ✅\n\n` +
              `Thread whitelist mode is now **DISABLED**.\n` +
              `${UNISpectra.arrowFromT} The bot will respond in all threads.`,
          },
          style
        );
      }

      // fallback
      return output.replyStyled(
        {
          body:
            `${UNIRedux.arrow} **${key}** ⚠️\n\n` +
            `Unknown action: **${action || "(none)"}**\n\n` +
            `Available: \`add\` · \`remove\` · \`list\` · \`on\` · \`off\``,
        },
        style
      );
    },
  },

  // ── status ────────────────────────────────────────────────────────────────
  {
    key: "status",
    description: "View whitelist status for users and threads",
    args: [],
    aliases: ["info", "s"],
    icon: "📊",
    async handler({ output }, { key }) {
      const wl = getWLConfig();
      const userStatus = wl.userWhitelist.enabled ? "🟢 ON" : "🔴 OFF";
      const threadStatus = wl.threadWhitelist.enabled ? "🟢 ON" : "🔴 OFF";
      return output.replyStyled(
        {
          body:
            `${UNIRedux.charm} **${key}** 📊\n\n` +
            `${UNISpectra.arrow} 👤 ***User Whitelist***: ${userStatus}\n` +
            `${UNISpectra.arrowFromT} Total users: **${wl.userWhitelist.ids.length}**\n\n` +
            `${UNISpectra.arrow} 💬 ***Thread Whitelist***: ${threadStatus}\n` +
            `${UNISpectra.arrowFromT} Total threads: **${wl.threadWhitelist.ids.length}**\n\n` +
            `${UNISpectra.arrow} Use \`wl user list\` or \`wl thread list\` to see the full lists.`,
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
    name: "whitelist",
    description:
      "Manage the bot's whitelist — control which users and threads can access the bot",
    otherNames: ["wl"],
    version: "1.2.0",
    usage:
      "{prefix}{name} user <add|remove|list|on|off> [uid]\n" +
      "{prefix}{name} thread <add|remove|list|on|off> [threadID]\n" +
      "{prefix}{name} status",
    category: "Owner",
    author: "Christus",
    role: 2,
    noPrefix: false,
    waitingTime: 3,
    requirement: "3.0.0",
    icon: "📋",
  },
  style: {
    title: "📋 Whitelist",
    titleFont: "bold",
    contentFont: "fancy",
  },
  // ← Pattern correct : defineEntry + runInContext (comme ban.ts)
  entry: defineEntry(async (ctx) => home.runInContext(ctx)),
});

const style = command.style;

export default command;

