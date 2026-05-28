import { UNIRedux, UNISpectra } from "@cassidy/unispectra";
import { defineCommand, defineEntry } from "@cass/define";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MemberCount {
  userID: string;
  name: string;
  count: number;
}

interface SplitPage<T> {
  allPage: T[][];
  totalPage: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BANNED_CHAR = "️️️️️️️️️️️️️️️️️"; // Facebook banned invisible char (from Azack)

function splitPage<T>(array: T[], itemsPerPage: number): SplitPage<T> {
  const allPage: T[][] = [];
  for (let i = 0; i < array.length; i += itemsPerPage) {
    allPage.push(array.slice(i, i + itemsPerPage));
  }
  return { allPage, totalPage: allPage.length };
}

function buildPageBody(
  pageItems: (MemberCount & { stt: number })[],
  page: number,
  totalPage: number
): string {
  const lines = pageItems
    .filter((u) => u.count > 0)
    .map((u) => `  ${u.stt}. **${u.name}**: ${u.count.toLocaleString()} msg`);

  return (
    `${UNIRedux.charm} **Message Count** 📊\n` +
    `${UNISpectra.arrowFromT} Page **[${page}/${totalPage}]**\n\n` +
    ` ┌─────────────┐\n` +
    lines.map((l) => ` │ ${l}`).join("\n") +
    `\n └─────────────┘\n\n` +
    `${UNISpectra.arrow} Members not listed have 0 messages.\n` +
    `${UNISpectra.arrowFromT} Reply with a page number to navigate.`
  );
}

// ─── Command ──────────────────────────────────────────────────────────────────

const command = defineCommand({
  meta: {
    name: "count",
    otherNames: ["msgcount", "mc"],
    description:
      "View the message count of members in the group (tracked since the bot joined)",
    version: "1.0.0",
    author: "Christus",
    category: "Group",
    usage:
      "{prefix}{name} — your own count\n" +
      "{prefix}{name} all [page] — full leaderboard\n" +
      "{prefix}{name} @mention — specific user(s)",
    role: 0,
    noPrefix: false,
    waitingTime: 5,
    requirement: "3.0.0",
    icon: "📊",
    // Only trigger event on regular messages
    eventType: ["message", "message_reply"],
  },
  style: {
    title: "📊 Message Count",
    titleFont: "bold",
    contentFont: "fancy",
  },

  // ── entry: command handler ─────────────────────────────────────────────────
  entry: defineEntry(async (ctx) => {
    const { input, output, threadsDB, money, api } = ctx;
    const { threadID, senderID } = input as any;

    // Get stored counts for this thread
    const threadData = await threadsDB.getItem(threadID);
    const members: MemberCount[] = (threadData as any)?.msgCounts ?? [];

    // Get current participants from Facebook
    let participants: string[] = [];
    try {
      const info = await api.getThreadInfo(threadID);
      participants = info.participantIDs ?? [];
    } catch {}

    // Filter to only current members, sort by count desc, assign rank
    const sorted = members
      .filter((m) => participants.includes(m.userID))
      .sort((a, b) => b.count - a.count)
      .map((m, i) => ({
        ...m,
        name: m.name.includes(BANNED_CHAR) ? `UID: ${m.userID}` : m.name,
        stt: i + 1,
      }));

    const args = input.arguments ?? [];
    const firstArg = args[0]?.toLowerCase();

    // ── wl all [page] ─────────────────────────────────────────────────────
    if (firstArg === "all") {
      if (sorted.length === 0) {
        return output.replyStyled(
          {
            body:
              `${UNIRedux.charm} **Message Count** 📊\n\n` +
              `No messages have been recorded yet in this group.`,
          },
          style
        );
      }

      // If short enough, send in one message
      const singleBody =
        `${UNIRedux.charm} **Message Count** 📊 (${sorted.length} members)\n\n` +
        ` ┌─────────────┐\n` +
        sorted
          .filter((u) => u.count > 0)
          .map((u) => ` │ ${u.stt}. **${u.name}**: ${u.count.toLocaleString()} msg`)
          .join("\n") +
        `\n └─────────────┘\n\n` +
        `${UNISpectra.arrow} Members not listed have 0 messages.`;

      if (singleBody.length <= 19000) {
        return output.replyStyled({ body: singleBody }, style);
      }

      // Paginate (50 per page)
      const pages = splitPage(sorted, 50);
      const page = Math.max(1, Math.min(parseInt(args[1] ?? "1") || 1, pages.totalPage));
      const body = buildPageBody(pages.allPage[page - 1], page, pages.totalPage);

      const info = await output.replyStyled({ body }, style);

      // Register reply handler for page navigation
      info.atReply(async (replyCtx) => {
        if (replyCtx.input.senderID !== senderID) return;

        const newPage = parseInt((replyCtx.input.body ?? "").trim());
        if (isNaN(newPage) || newPage < 1 || newPage > pages.totalPage) {
          return replyCtx.output.replyStyled(
            {
              body:
                `${UNIRedux.arrow} **Invalid Page** ⚠️\n\n` +
                `Please enter a number between **1** and **${pages.totalPage}**.`,
            },
            style
          );
        }

        output.unsend(info.messageID);
        const newBody = buildPageBody(pages.allPage[newPage - 1], newPage, pages.totalPage);
        const newInfo = await replyCtx.output.replyStyled({ body: newBody }, style);

        // Re-register for further navigation
        newInfo.atReply(async (nextCtx) => {
          if (nextCtx.input.senderID !== senderID) return;
          const nextPage = parseInt((nextCtx.input.body ?? "").trim());
          if (isNaN(nextPage) || nextPage < 1 || nextPage > pages.totalPage) return;
          output.unsend(newInfo.messageID);
          const nextBody = buildPageBody(pages.allPage[nextPage - 1], nextPage, pages.totalPage);
          nextCtx.output.replyStyled({ body: nextBody }, style);
        });
      });

      return;
    }

    // ── @mention: show specific users ────────────────────────────────────
    const mentions = input.mentions ?? {};
    if (Object.keys(mentions).length > 0) {
      const lines: string[] = [];
      for (const id of Object.keys(mentions)) {
        const found = sorted.find((m) => m.userID === id);
        if (found) {
          lines.push(
            `${UNISpectra.arrow} **${found.name}** — rank **#${found.stt}** · **${found.count.toLocaleString()}** messages`
          );
        } else {
          const name = mentions[id] ?? "Unknown";
          lines.push(`${UNISpectra.arrow} **${name}** — no messages recorded yet.`);
        }
      }
      return output.replyStyled(
        {
          body:
            `${UNIRedux.charm} **Message Count** 📊\n\n` +
            lines.join("\n"),
        },
        style
      );
    }

    // ── default: sender's own count ───────────────────────────────────────
    const found = sorted.find((m) => m.userID === senderID);
    if (!found || found.count === 0) {
      return output.replyStyled(
        {
          body:
            `${UNIRedux.charm} **Message Count** 📊\n\n` +
            `You haven't sent any messages since the bot joined this group.`,
        },
        style
      );
    }

    return output.replyStyled(
      {
        body:
          `${UNIRedux.charm} **Message Count** 📊\n\n` +
          `${UNISpectra.arrow} You are ranked **#${found.stt}**\n` +
          `${UNISpectra.arrowFromT} **${found.count.toLocaleString()}** messages sent in this group.`,
      },
      style
    );
  }),

  // ── event: track every message ────────────────────────────────────────────
  event: async (ctx) => {
    const { input, threadsDB, money } = ctx;
    const { threadID, senderID } = input as any;

    // Only track group messages (threadID !== senderID)
    if (!threadID || threadID === senderID) return;

    try {
      const threadData = await threadsDB.getItem(threadID);
      const members: MemberCount[] = (threadData as any)?.msgCounts ?? [];

      const existing = members.find((m) => m.userID === senderID);
      if (existing) {
        existing.count += 1;
      } else {
        // Fetch user name for first-time tracking
        let name = "Unknown";
        try {
          const userData = await money.getItem(senderID);
          name = userData?.name || "Unknown";
        } catch {}
        members.push({ userID: senderID, name, count: 1 });
      }

      await threadsDB.setItem(threadID, { msgCounts: members });
    } catch (err) {
      console.error("[count] event tracking error:", err);
    }
  },
});

const style = command.style;

export default command;


