/*
 * @XaviaCMD
 * @rapido
 **/

import axios from "axios";

const config = {
  name: "gemini",
  version: "3.0.0",
  permissions: [0],
  noPrefix: "both",
  credits: "rapido • API migrated by Christus",
  description:
    "Interact with Google Gemini via christus-s-apis with session support.",
  category: "AI",
  usages: "[text]",
  cooldown: 3,
};

const style = {
  titleFont: "bold",
  title: "📷 Google Gemini",
  contentFont: "fancy",
};

const API_BASE = "https://christus-s-apis.vercel.app/api/prexzy/ai/gemini";
const TIMEOUT_MS = 45_000;
const MAX_INPUT = 1_500;

function extractReply(data: any): string {
  if (!data) return "";
  if (typeof data === "string") return data.trim();
  for (const key of ["response", "reply", "message", "answer", "text", "result"]) {
    if (typeof data[key] === "string" && data[key].trim()) {
      return data[key].trim();
    }
  }
  return "";
}

async function onCall({ message, args }) {
  const text = (args.join(" ") || "").trim();

  if (!text) {
    return message.reply(
      "💬 Fournis une question.\nExemple : .gemini Explique la photosynthèse."
    );
  }

  if (text.length > MAX_INPUT) {
    return message.reply(`⚠️ Message trop long (max ${MAX_INPUT} caractères).`);
  }

  const sessionId = message.senderID;
  if (!sessionId) {
    return message.reply("❌ Impossible d'identifier l'utilisateur.");
  }

  try {
    const params = new URLSearchParams({
      prompt: text,
      session_id: String(sessionId),
    });

    const res = await axios.get(`${API_BASE}?${params.toString()}`, {
      timeout: TIMEOUT_MS,
      maxContentLength: 5 * 1024 * 1024,
    });

    const answer = extractReply(res.data);

    if (!answer) {
      console.error("Gemini API - réponse vide :", JSON.stringify(res.data));
      return message.reply("❌ L'IA n'a pas renvoyé de réponse exploitable.");
    }

    return message.reply(answer);
  } catch (e: any) {
    console.error("Gemini error:", e?.response?.data ?? e.message);
    return message.reply("❌ Une erreur est survenue. Réessaie dans un instant.");
  }
}

export default {
  config,
  onCall,
  style,
};
