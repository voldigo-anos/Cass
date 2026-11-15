import axios from "axios";
import fs from "fs-extra";
import path from "path";
import moment from "moment-timezone";
import { v4 as uuidv4 } from "uuid";
import { defineEntry } from "@cass/define";
import { UNISpectra } from "@cassidy/unispectra";

const API_BASE = "https://christus-api-chat.vercel.app";
const API_ENDPOINT = `${API_BASE}/chat`;
const CLEAR_ENDPOINT = `${API_BASE}/chat/clear`;
const TMP_DIR = path.join(__dirname, "cache");

const HTTP_TIMEOUT_POST = 60_000;
const HTTP_TIMEOUT_DELETE = 20_000;
const HTTP_TIMEOUT_DL = 60_000;
const RETRY_MAX = 3;
const RETRY_DELAY_MS = (attempt: number) => 4_000 * attempt;

export const meta: CommandMeta = {
  name: "ai",
  description: "Assistant IA avancé (texte, image, musique, vidéo, lyrics)",
  author: "Christus",
  version: "3.1.0",
  usage: "ai <message | image>",
  category: "AI",
  role: 0,
  waitingTime: 3,
  icon: "🤖",
  noLevelUI: true,
  noPrefix: true,
};

export const style: CommandStyle = {
  title: "Shizu • Advanced AI 🤖",
  titleFont: "bold",
  contentFont: "fancy",
};

export const langs = {
  fr: {
    noInput: "💬 Veuillez fournir un message ou une image.",
    processing: "🤖 Analyse IA en cours...\nVeuillez patienter...",
    resetSuccess: "♻️ Conversation réinitialisée avec succès.",
    resetFail: "❌ Échec de la réinitialisation.",
    error: "❌ Une erreur IA est survenue.",
  },
  en: {
    noInput: "💬 Please provide a message or image.",
    processing: "🤖 AI is thinking...\nPlease wait...",
    resetSuccess: "♻️ Conversation successfully reset.",
    resetFail: "❌ Reset failed.",
    error: "❌ An AI error occurred.",
  },
};

async function download(url: string, ext: string): Promise<string> {
  await fs.ensureDir(TMP_DIR);
  const filePath = path.join(TMP_DIR, `${uuidv4()}.${ext}`);
  const res = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: HTTP_TIMEOUT_DL,
    maxContentLength: 50 * 1024 * 1024,
  });
  await fs.writeFile(filePath, res.data);
  return filePath;
}

async function postWithRetry<T = any>(payload: Record<string, any>): Promise<T> {
  let lastErr: any;
  for (let attempt = 1; attempt <= RETRY_MAX; attempt++) {
    try {
      const res = await axios.post(API_ENDPOINT, payload, {
        timeout: HTTP_TIMEOUT_POST,
      });
      if (typeof res.data?.reply === "string" && res.data.reply.trim()) {
        return res.data as T;
      }
      lastErr = new Error("Réponse API au format inattendu.");
      console.error(`❌ IA - réponse invalide (tentative ${attempt}/${RETRY_MAX})`);
    } catch (err: any) {
      lastErr = err;
      const detail = err.response?.data ?? err.message;
      console.error(`❌ IA - tentative ${attempt}/${RETRY_MAX} :`, detail);
    }
    if (attempt < RETRY_MAX) {
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS(attempt)));
    }
  }
  throw lastErr;
}

function normalizeText(text: string): string {
  if (!text) return text;
  return text
    .replace(/Aryan\s*Chauchan/gi, "Christus")
    .replace(/Aryan\s*Chauhan/gi, "Christus")
    .replace(/A\.?\s*Chauchan/gi, "Christus");
}

export const entry = defineEntry(async ({ args, event, output, langParser }) => {
  const getLang = langParser.createGetLang(langs);
  const userId = event.senderID;
  const input = args.join(" ").trim();

  if (!input && !event.attachments?.length) {
    return output.reply(getLang("noInput"));
  }

  if (["clear", "reset"].includes(input.toLowerCase())) {
    try {
      await axios.delete(
        `${CLEAR_ENDPOINT}/${encodeURIComponent(userId)}`,
        { timeout: HTTP_TIMEOUT_DELETE }
      );
      return output.reply(getLang("resetSuccess"));
    } catch (err: any) {
      console.error("IA - reset :", err.response?.data ?? err.message);
      return output.reply(getLang("resetFail"));
    }
  }

  const timestamp = moment()
    .tz("Asia/Manila")
    .format("MMMM D, YYYY h:mm A");

  const loading = await output.reply(
    `${UNISpectra.charm} ${getLang("processing")}\n• 📅 ${timestamp}`
  );

  let imageUrl: string | null = null;
  const PHOTO_TYPES = new Set(["photo", "animated_image"]);

  const directImage = event.attachments?.find(
    (a) => PHOTO_TYPES.has(a.type) || a.type === "photo"
  );
  if (directImage?.url) imageUrl = directImage.url;

  const replyImage = event.messageReply?.attachments?.find(
    (a) => PHOTO_TYPES.has(a.type) || a.type === "photo"
  );
  if (replyImage?.url) imageUrl = replyImage.url;

  const createdFiles: string[] = [];
  let loadingConsumed = false;

  try {
    const data = await postWithRetry({
      uid: userId,
      message: input,
      image_url: imageUrl,
    });

    const {
      reply,
      image_url,
      music_data,
      video_data,
      shoti_data,
      lyrics_data,
    } = data;

    let body = normalizeText(reply || "✅ AI Response");
    const attachments: any[] = [];

    if (image_url) {
      const file = await download(image_url, "jpg");
      attachments.push(fs.createReadStream(file));
      createdFiles.push(file);
    }

    if (music_data?.downloadUrl) {
      const file = await download(music_data.downloadUrl, "mp3");
      attachments.push(fs.createReadStream(file));
      createdFiles.push(file);
    }

    if (video_data?.downloadUrl) {
      const file = await download(video_data.downloadUrl, "mp4");
      attachments.push(fs.createReadStream(file));
      createdFiles.push(file);
    }

    if (shoti_data?.downloadUrl) {
      const file = await download(shoti_data.downloadUrl, "mp4");
      attachments.push(fs.createReadStream(file));
      createdFiles.push(file);
    }

    if (lyrics_data?.lyrics) {
      body += `\n\n🎵 ${lyrics_data.track_name}\n${normalizeText(
        lyrics_data.lyrics.slice(0, 1500)
      )}`;
    }

    if (loading?.messageID) {
      try {
        await output.unsend(loading.messageID);
        loadingConsumed = true;
      } catch {}
    }

    await output.reply({
      body,
      attachment: attachments.length ? attachments : undefined,
    });
  } catch (err: any) {
    console.error("IA Error:", err.response?.data ?? err.message);
    if (!loadingConsumed && loading?.messageID) {
      try { await output.unsend(loading.messageID); } catch {}
    }
    await output.reply(getLang("error"));
  } finally {
    for (const file of createdFiles) {
      try {
        if (await fs.pathExists(file)) await fs.remove(file);
      } catch {}
    }
  }
});
