import axios from "axios";
import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { defineEntry } from "@cass/define";
import { UNISpectra } from "@cassidy/unispectra";

const API_BASE = "https://image-gen-fix.vercel.app";
const GENERATE_URL = `${API_BASE}/generate`;
const EDIT_URL = `${API_BASE}/edit`;
const TIMEOUT_API = 90_000;
const MAX_PROMPT = 500;
const RATIO_RE = /^\d{1,2}:\d{1,2}$/;
const URL_RE = /^https?:\/\/\S+$/i;
const inFlight = new Set<string>();

export const meta: CommandMeta = {
  name: "gem",
  description: "Generate or edit artistic AI images",
  author: "Christus dev AI",
  version: "3.1.0",
  usage: "{prefix}gem <prompt> [--r X:Y] [--nw] (reply to image to edit)",
  category: "Image Generator",
  role: 2,
  waitingTime: 5,
  icon: "🎨",
  noLevelUI: true,
};

export const style: CommandStyle = {
  title: "Gem • AI Art 🎨",
  titleFont: "bold",
  contentFont: "fancy",
};

export const langs = {
  en: {
    noPrompt: "⚠️ Please provide a prompt.\nExample: {prefix}gem crystal dragon --r 16:9",
    generating: "🎨 Generating your masterpiece...\nPlease wait...",
    success: "✅ Masterpiece created successfully!",
    editSuccess: "✅ Image edited successfully!",
    artistic: "🎨 Artistic Mode Enabled",
    failed: "❌ Failed to generate image.",
    busy: "⏳ You already have a generation in progress.",
    badRatio: "⚠️ Invalid ratio (use e.g. 1:1, 9:16, 16:9).",
    tooLong: "⚠️ Prompt too long (max 500 chars).",
  },
  fr: {
    noPrompt: "⚠️ Veuillez fournir un prompt.\nExemple : {prefix}gem dragon de cristal --r 16:9",
    generating: "🎨 Génération de votre chef-d'œuvre...\nPatientez...",
    success: "✅ Chef-d'œuvre créé avec succès !",
    editSuccess: "✅ Image modifiée avec succès !",
    artistic: "🎨 Mode artistique activé",
    failed: "❌ Échec de la génération.",
    busy: "⏳ Une génération est déjà en cours.",
    badRatio: "⚠️ Ratio invalide (ex : 1:1, 9:16, 16:9).",
    tooLong: "⚠️ Prompt trop long (max 500 caractères).",
  },
};

function extractApiError(err: any): string {
  try {
    const data = err?.response?.data;
    if (data) {
      const text = Buffer.isBuffer(data)
        ? data.toString("utf-8")
        : Buffer.from(data).toString("utf-8");
      try {
        const json = JSON.parse(text);
        return json.error || json.message || text.slice(0, 200);
      } catch {
        return text.slice(0, 200);
      }
    }
  } catch {}
  return err?.message || "Unknown error";
}

export const entry = defineEntry(async ({ args, output, input, langParser, event }) => {
  const getLang = langParser.createGetLang(langs);
  const userId = event?.senderID ?? "anon";

  if (!args[0]) {
    try { await output.react("⚠️"); } catch {}
    return output.reply(getLang("noPrompt"));
  }

  if (inFlight.has(userId)) {
    try { await output.react("⏳"); } catch {}
    return output.reply(getLang("busy"));
  }
  inFlight.add(userId);

  const cacheFolder = path.join(process.cwd(), "CommandFiles", "cache");
  let filePath: string | null = null;

  try {
    await output.react("🎨");
    await fs.mkdir(cacheFolder, { recursive: true });

    const promptParts: string[] = [];
    let ratio = "1:1";
    let artisticMode = false;
    let imageUrl: string | null = null;

    const repliedPhoto = input.replier?.attachments?.find(
      (a: any) => a?.type === "photo" && a?.url
    );
    if (repliedPhoto) imageUrl = repliedPhoto.url;

    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if (a === "--r" && args[i + 1]) {
        ratio = args[i + 1];
        i++;
      } else if (a === "--nw") {
        artisticMode = true;
      } else if (RATIO_RE.test(a)) {
        ratio = a;
      } else if (URL_RE.test(a) && !imageUrl) {
        imageUrl = a;
      } else {
        promptParts.push(a);
      }
    }

    const userPrompt = promptParts.join(" ").trim();

    if (!userPrompt) {
      try { await output.react("⚠️"); } catch {}
      return output.reply(getLang("noPrompt"));
    }
    if (userPrompt.length > MAX_PROMPT) {
      try { await output.react("⚠️"); } catch {}
      return output.reply(getLang("tooLong"));
    }
    if (!RATIO_RE.test(ratio)) {
      try { await output.react("⚠️"); } catch {}
      return output.reply(getLang("badRatio"));
    }

    let finalPrompt = userPrompt;
    if (artisticMode) {
      finalPrompt = `Sophisticated fine art photography, classical figure study, artistic lighting, gallery quality: ${userPrompt}`;
    }

    const isEdit = !!imageUrl;

    const requestConfig = {
      responseType: "arraybuffer" as const,
      timeout: TIMEOUT_API,
      maxContentLength: 25 * 1024 * 1024,
      headers: { Accept: "*/*", "User-Agent": "Mozilla/5.0" },
    };

    const response = isEdit
      ? await axios.post(
          EDIT_URL,
          { prompt: finalPrompt, image: imageUrl, ratio },
          requestConfig
        )
      : await axios.post(
          GENERATE_URL,
          { prompt: finalPrompt, ratio, format: "jpg", nw: true },
          requestConfig
        );

    const contentType = String(response.headers?.["content-type"] ?? "");
    if (!contentType.startsWith("image/")) {
      console.error("Gem API non-image response:", contentType);
      try { await output.react("❌"); } catch {}
      return output.reply(getLang("failed"));
    }

    filePath = path.join(cacheFolder, `gem_${Date.now()}_${randomUUID()}.jpg`);
    await fs.writeFile(filePath, Buffer.from(response.data));

    await output.reply({
      body:
        `${UNISpectra.charm} ${isEdit ? getLang("editSuccess") : getLang("success")}\n\n` +
        `📝 Prompt: ${userPrompt}\n` +
        `📐 Ratio: ${ratio}` +
        (artisticMode ? `\n✨ ${getLang("artistic")}` : ""),
      attachment: filePath,
    });

    try { await output.react("✅"); } catch {}
  } catch (err: any) {
    console.error("Gem Error:", err?.response?.data ?? err?.message ?? err);
    try { await output.react("❌"); } catch {}
    return output.reply(`${getLang("failed")}\n\n📝 ${extractApiError(err)}`);
  } finally {
    inFlight.delete(userId);
    if (filePath) {
      try { await fs.unlink(filePath); } catch {}
    }
  }
});
