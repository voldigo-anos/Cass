// @ts-check
import axios from "axios";
import fs from "fs-extra";
import path from "path";
import os from "os";

export const meta: CommandMeta = {
  name: "gem",
  otherNames: ["art", "generate"],
  description: "🎨 Génère ou édite des images artistiques avec l'IA",
  author: "Christus",
  version: "2.0",
  usage: "{prefix}gem <prompt> [--r X:Y] [--nw]",
  category: "AI",
  role: 3,
  noPrefix: false,
  waitingTime: 5,
  requirement: "3.0.0",
  icon: "🎨",
};

export const style: CommandStyle = {
  title: "🎨 GEM Art Generator",
  titleFont: "bold",
  contentFont: "fancy",
};

export const langs = {
  en: {
    noPrompt: "🎨 | Please provide a prompt.",
    processing: "🎨 | Creating your masterpiece...",
    success: "🎨✨ | Masterpiece created!{mode}",
    artisticMode: " [Artistic Mode]",
    editMode: " (edited from image)",
    error: "❌ | Failed: {err}",
  },
  fr: {
    noPrompt: "🎨 | Veuillez fournir une description.",
    processing: "🎨 | Création de votre chef-d'œuvre...",
    success: "🎨✨ | Chef-d'œuvre créé !{mode}",
    artisticMode: " [Mode Artistique]",
    editMode: " (édité depuis une image)",
    error: "❌ | Échec : {err}",
  },
};

const ENDPOINTS = {
  generate: "https://gem-tw6a.onrender.com/generate",
  edit: "https://gem-tw6a.onrender.com/edit",
};

const DEFAULT_RATIO = "1:1";

export async function entry(ctx: CommandContext) {
  const { input, output, args, api, langParser } = ctx;
  const getLang = langParser.createGetLang(langs);

  if (!args[0]) {
    return output.reply(getLang("noPrompt"));
  }

  await api.setMessageReaction("🎨", input.messageID, () => {}, true);

  const loading = await output.reply(getLang("processing"));

  try {
    const { prompt, ratio, unfilteredMode, isEditMode, imageBase64 } = parseArgs(args, input);

    if (!prompt) {
      await output.unsend(loading.messageID);
      await api.setMessageReaction("❌", input.messageID, () => {}, true);
      return output.reply(getLang("noPrompt"));
    }

    let endpoint: string;
    let payload: any;

    if (isEditMode && imageBase64) {
      endpoint = ENDPOINTS.edit;
      payload = {
        image: imageBase64,
        prompt: buildPrompt(prompt, unfilteredMode),
        format: "jpg",
      };
    } else {
      endpoint = ENDPOINTS.generate;
      payload = {
        prompt: buildPrompt(prompt, unfilteredMode),
        ratio: ratio || DEFAULT_RATIO,
        format: "jpg",
      };
    }

    const response = await axios.post(endpoint, payload, {
      responseType: "arraybuffer",
      timeout: 180000,
    });

    const tmpDir = os.tmpdir();
    const imgPath = path.join(tmpDir, `gem_${Date.now()}.jpg`);
    await fs.writeFile(imgPath, Buffer.from(response.data));

    await api.setMessageReaction("✅", input.messageID, () => {}, true);
    await output.unsend(loading.messageID);

    let modeText = "";
    if (unfilteredMode) modeText += getLang("artisticMode");
    if (isEditMode) modeText += getLang("editMode");

    const successBody = getLang("success").replace("{mode}", modeText);

    await output.reply({
      body: successBody,
      attachment: fs.createReadStream(imgPath),
    } as any);

    await fs.remove(imgPath).catch(() => {});

  } catch (error: any) {
    await api.setMessageReaction("❌", input.messageID, () => {}, true);
    await output.unsend(loading.messageID).catch(() => {});
    console.error("[Gem] Error:", error);
    output.reply(getLang("error").replace("{err}", error.message || String(error)));
  }
}

function parseArgs(args: string[], input: CommandContext["input"]): {
  prompt: string;
  ratio: string | null;
  unfilteredMode: boolean;
  isEditMode: boolean;
  imageBase64: string | null;
} {
  let promptParts: string[] = [];
  let ratio: string | null = null;
  let unfilteredMode = false;
  let isEditMode = false;
  let imageBase64: string | null = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--r" && i + 1 < args.length) {
      ratio = args[i + 1];
      i++;
    } else if (args[i] === "--nw") {
      unfilteredMode = true;
    } else {
      promptParts.push(args[i]);
    }
  }

  const prompt = promptParts.join(" ");

  if (input.messageReply?.attachments?.[0]?.type === "photo") {
    isEditMode = true;
    const imgUrl = input.messageReply.attachments[0].url;
    try {
      const imgRes = await axios.get(imgUrl, { responseType: "arraybuffer" });
      imageBase64 = Buffer.from(imgRes.data, "binary").toString("base64");
    } catch (err) {
      console.error("[Gem] Failed to fetch image:", err);
    }
  }

  return { prompt, ratio, unfilteredMode, isEditMode, imageBase64 };
}

function buildPrompt(prompt: string, unfilteredMode: boolean): string {
  if (unfilteredMode) {
    return `Sophisticated fine art photography, classical figure study, artistic lighting, gallery quality: ${prompt}`;
  }
  return prompt;
                                  }
