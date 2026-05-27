import { UNIRedux, UNISpectra } from "@cassidy/unispectra";
import { defineEntry, defineCommand } from "@cass/define";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function truncateName(name: string, maxLength = 30): string {
  if (!name || name.trim() === "") return "Unnamed Group";
  if (name.length <= maxLength) return name;
  return name.substring(0, maxLength) + "...";
}

// ─── Command ──────────────────────────────────────────────────────────────────

const command = defineCommand({
  meta: {
    name: "join",
    otherNames: ["joingroup", "jg"],
    description: "List the groups the bot is in and let a user request to join one",
    version: "1.0.0",
    author: "Christus",
    category: "Utility",
    usage: "{prefix}{name}",
    role: 0,
    noPrefix: false,
    waitingTime: 5,
    requirement: "3.0.0",
    icon: "📂",
  },
  style: {
    title: "📂 Group List",
    titleFont: "bold",
    contentFont: "fancy",
  },
  entry: defineEntry(async (ctx) => {
    const { output, api, input } = ctx;

    // ── Fetch group list ───────────────────────────────────────────────────
    let rawGroups: any[];
    try {
      const threadList = await api.getThreadList(50, null, ["INBOX"]);
      rawGroups = (threadList as any[]).filter(
        (t) => t.threadID && String(t.threadID).length >= 15
      );
    } catch (err) {
      return output.replyStyled(
        {
          body:
            `${UNIRedux.arrow} **Error** ❌\n\n` +
            `Could not retrieve the group list.`,
        },
        style
      );
    }

    if (rawGroups.length === 0) {
      return output.replyStyled(
        {
          body:
            `${UNIRedux.charm} **Group List** 📭\n\n` +
            `The bot is not in any group yet.`,
        },
        style
      );
    }

    // ── Enrich with names & member counts ──────────────────────────────────
    const groups = await Promise.all(
      rawGroups.map(async (g) => {
        let fullName = g.threadName?.trim() || "";
        if (!fullName) {
          try {
            const info = await api.getThreadInfo(g.threadID);
            fullName = info.threadName || info.name || "";
          } catch {}
        }
        if (!fullName) fullName = "Unnamed Group";

        return {
          threadID: g.threadID as string,
          fullName,
          displayName: truncateName(fullName, 30),
          memberCount: (g.participantIDs?.length as number) || 0,
        };
      })
    );

    // ── Build list message ─────────────────────────────────────────────────
    const lines = groups.map(
      (g, i) =>
        ` │ ${i + 1}. **${g.displayName}**\n` +
        ` │   🆔 \`${g.threadID}\`\n` +
        ` │   👥 ${g.memberCount} member(s)`
    );

    const body =
      `${UNIRedux.charm} **Groups** (${groups.length})\n\n` +
      ` ┌─────────────┐\n` +
      lines.join("\n │\n") +
      `\n └─────────────┘\n\n` +
      `${UNISpectra.arrow} Reply with the **group number** to join.`;

    const info = await output.replyStyled({ body }, style);

    // Auto-unsend after 60s
    const unsendTimer = setTimeout(() => {
      output.unsend(info.messageID);
    }, 60_000);

    // ── Handle reply ───────────────────────────────────────────────────────
    info.atReply(async (replyCtx) => {
      // Only the original sender can reply
      if (replyCtx.input.senderID !== input.senderID) return;

      clearTimeout(unsendTimer);
      output.unsend(info.messageID);

      const raw = (replyCtx.input.body ?? "").trim();
      const index = parseInt(raw) - 1;

      if (isNaN(index) || index < 0 || index >= groups.length) {
        return replyCtx.output.replyStyled(
          {
            body:
              `${UNIRedux.arrow} **Invalid Number** ⚠️\n\n` +
              `Please reply with a number between **1** and **${groups.length}**.`,
          },
          style
        );
      }

      const group = groups[index];

      // ── Get fresh thread info ────────────────────────────────────────────
      let threadInfo: any;
      try {
        threadInfo = await api.getThreadInfo(group.threadID);
      } catch (err) {
        return replyCtx.output.replyStyled(
          {
            body:
              `${UNIRedux.arrow} **Error** ❌\n\n` +
              `Could not retrieve info for **${group.displayName}**.`,
          },
          style
        );
      }

      const currentName =
        threadInfo.threadName || threadInfo.name || group.fullName;
      const participants: string[] = threadInfo.participantIDs ?? [];

      // Already in the group
      if (participants.includes(replyCtx.input.senderID)) {
        return replyCtx.output.replyStyled(
          {
            body:
              `${UNIRedux.arrow} **Already In Group** ⚠️\n\n` +
              `You are already a member of:\n` +
              `${UNISpectra.arrowFromT} **${currentName}**`,
          },
          style
        );
      }

      // Group is full
      if (participants.length >= 250) {
        return replyCtx.output.replyStyled(
          {
            body:
              `${UNIRedux.arrow} **Group Full** ❌\n\n` +
              `**${currentName}** has reached the 250-member limit.`,
          },
          style
        );
      }

      // ── Add the user ─────────────────────────────────────────────────────
      try {
        await api.addUserToGroup(replyCtx.input.senderID, group.threadID);

        return replyCtx.output.replyStyled(
          {
            body:
              `${UNIRedux.charm} **Joined Successfully** ✅\n\n` +
              `You have been added to:\n` +
              `${UNISpectra.arrowFromT} **${currentName}**`,
          },
          style
        );
      } catch (err) {
        return replyCtx.output.replyStyled(
          {
            body:
              `${UNIRedux.arrow} **Failed to Add** ❌\n\n` +
              `Could not add you to **${currentName}**.\n` +
              `${UNISpectra.arrowFromT} The bot may not have admin rights in that group.`,
          },
          style
        );
      }
    });
  }),
});

const style = command.style;

export default command;
                    
