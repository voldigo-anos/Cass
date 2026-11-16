import axios from "axios";
import { defineEntry } from "@cass/define";

const BASE = "https://darkgpt-api.vercel.app";
const CHAT_URL = `${BASE}/api/chat`;
const clearUrl = (uid: string) =>
  `${BASE}/api/chat/clear/${encodeURIComponent(uid)}`;

const TIMEOUT_POST = 50_000;
const TIMEOUT_DELETE = 20_000;
const RETRY_MAX = 3;
const RETRY_DELAY_MS = (attempt: number) => 3_000 * attempt;

/* ================= META ================= */

export const meta: CommandMeta = {
  name: "darkgpt",
  otherNames: ["dgpt"],
  description: "Chat with DarkGPT (per-user conversation memory)",
  author: "Christus",
  version: "2.1.0",
  usage: "{prefix}darkgpt <message>\n{prefix}darkgpt reset",
  category: "AI",
  role: 0,
  waitingTime: 5,
  icon: "🌑",
  noLevelUI: true,
};

export const style: CommandStyle = {
  title: "🌑 DarkGPT",
  titleFont: "bold",
  contentFont: "fancy",
};

/* ================= LANG ================= */

export const langs = {
  en: {
    noInput:
      "❓ Please provide a message.\n\n💡 Example: darkgpt hello, how are you?",
    resetSuccess: "✅ Conversation reset successfully.",
    resetFail: "❌ Could not reset conversation (endpoint unavailable).",
    error: "❌ Unable to get a response. Please try again later.",
  },
  fr: {
    noInput:
      "❓ Écris un message.\n\n💡 Exemple : darkgpt salut, comment tu vas ?",
    resetSuccess: "✅ Conversation réinitialisée.",
    resetFail:
      "❌ Impossible de réinitialiser la conversation (endpoint indisponible).",
    error: "❌ Impossible d'obtenir une réponse. Réessaie dans un instant.",
  },
};

/* ================= UTILS ================= */

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function askDarkGPT(uid: string, message: string): Promise<string> {
  let lastErr: any;
  for (let attempt = 1; attempt <= RETRY_MAX; attempt++) {
    try {
      const res = await axios.post(
        CHAT_URL,
        { uid: String(uid), message },
        {
          headers: { "Content-Type": "application/json" },
          timeout: TIMEOUT_POST,
        }
      );

      const data = res.data;
      const reply = data?.reply || data?.response;

      if (typeof reply === "string" && reply.trim()) return reply.trim();

      lastErr = new Error("Unexpected API response format.");
      console.error(
        `❌ DarkGPT - unexpected response (${attempt}/${RETRY_MAX}):`,
        JSON.stringify(data)
      );
    } catch (err: any) {
      lastErr = err;
      console.error(
        `❌ DarkGPT - attempt ${attempt}/${RETRY_MAX}:`,
        err?.response?.data ?? err?.message
      );
    }

    if (attempt < RETRY_MAX) await sleep(RETRY_DELAY_MS(attempt));
  }
  throw lastErr;
}

async function resetMemory(uid: string): Promise<void> {
  await axios.delete(clearUrl(uid), { timeout: TIMEOUT_DELETE });
}

/* ================= CORE ================= */

async function main(ctx: any): Promise<any> {
  const { args, event, output, input, langParser, cancelCooldown } = ctx;
  const getLang = langParser.createGetLang(langs);
  const userId = event?.senderID ?? input?.senderID ?? "anon";

  const userInput =
    (Array.isArray(args) ? args.join(" ").trim() : "") ||
    (typeof input?.body === "string" ? input.body.trim() : "");

  if (!userInput) {
    try { cancelCooldown?.(); } catch {}
    try { await output.react("❓"); } catch {}
    return output.reply(getLang("noInput"));
  }

  if (["reset", "clear"].includes(userInput.toLowerCase())) {
    try {
      await resetMemory(userId);
      try { await output.react("✅"); } catch {}
      return output.reply(getLang("resetSuccess"));
    } catch (err: any) {
      console.error(
        "DarkGPT reset error:",
        err?.response?.data ?? err?.message
      );
      try { await output.react("❌"); } catch {}
      return output.reply(getLang("resetFail"));
    }
  }

  try {
    try { await output.react("⏳"); } catch {}
    const answer = await askDarkGPT(userId, userInput);
    try { await output.react("✅"); } catch {}

    const sent = await output.reply(answer);

    if (sent?.messageID && typeof sent.atReply === "function") {
      sent.atReply(async (rep: any) => {
        if (rep?.input?.senderID && rep.input.senderID !== userId) return;
        try {
          const words = Array.isArray(rep.input?.words)
            ? rep.input.words
            : String(rep.input?.body ?? "")
                .trim()
                .split(/\s+/)
                .filter(Boolean);
          await main({ ...rep, args: words });
        } catch (e) {
          console.error("DarkGPT reply error:", e);
        }
      });
    }

    return sent;
  } catch (err: any) {
    console.error("DarkGPT error:", err?.response?.data ?? err?.message);
    try { await output.react("❌"); } catch {}
    return output.reply(getLang("error"));
  }
}

export const entry = defineEntry(async (ctx) => main(ctx));
