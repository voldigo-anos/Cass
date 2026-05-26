// @ts-check

export const meta = {
  name: "whitelist",
  author: "Converted from Azack (NeoKEX) by Christus",
  description:
    "Blocks messages from users/threads not in the whitelist when whitelist mode is enabled",
  version: "1.0.0",
  supported: "^1.0.0",
  after: ["input"],
  type: "plugin",
  order: 2,
};

/**
 * @param {CommandContext} obj
 */
export async function use(obj) {
  try {
    const { input, event } = obj;

    // Only intercept actual messages
    if (!["message", "message_reply"].includes(event.type)) {
      return obj.next();
    }

    const cfg = global.Cassidy.config;
    const wl = cfg.whitelistConfig;

    // whitelistConfig not initialized yet → pass through
    if (!wl) {
      return obj.next();
    }

    const senderID = String(event.senderID ?? "");
    const threadID = String(event.threadID ?? "");
    const isAdmin = input?.isAdmin ?? false;

    // Admins are always allowed through
    if (isAdmin) {
      return obj.next();
    }

    // ── Thread whitelist check ──────────────────────────────────────────────
    if (wl.threadWhitelist?.enabled) {
      const allowedThreads = (wl.threadWhitelist.ids ?? []).map(String);
      if (!allowedThreads.includes(threadID)) {
        // Silent block — don't reply, just stop processing
        return;
      }
    }

    // ── User whitelist check ────────────────────────────────────────────────
    if (wl.userWhitelist?.enabled) {
      const allowedUsers = (wl.userWhitelist.ids ?? []).map(String);
      if (!allowedUsers.includes(senderID)) {
        // Silent block — don't reply, just stop processing
        return;
      }
    }
  } catch (error) {
    console.error("[whitelist plugin]", error);
  }

  obj.next();
                                                            }
          
