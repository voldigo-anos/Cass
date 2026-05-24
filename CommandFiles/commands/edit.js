import axios from "axios";
import { defineEntry } from "@cass/define";
import { UNISpectra } from "@cassidy/unispectra";

export const meta: CommandMeta = {
  name: "edit",
  aliases: [],
  author: "Christus",
  version: "2.0.0",
  description: "Generate or edit images using AI",
  category: "AI",
  usage: "{prefix}{name} <prompt> (reply to an image)",
  role: 0,
  waitingTime: 5,
  icon: "🖼️",
  noLevelUI: true,
};

export const style: CommandStyle = {
  title: "🖌️ Christus • Image Editor",
  titleFont: "bold",
  contentFont: "fancy",
};

export const langs = {
  fr: {
    noPrompt:
      "❌ Veuillez fournir un prompt.\nExemple: !edit cyberpunk style",
    noImage:
      "🖼️ Veuillez répondre à une image.",
    processing:
      "⏳ Traitement de votre image...",
    success:
      "🖌️ Image modifiée avec succès.",
    fail:
      "❌ Impossible de traiter l'image.",
  },

  en: {
    noPrompt:
      "❌ Please provide a prompt.\nExample: !edit cyberpunk style",
    noImage:
      "🖼️ Please reply to an image.",
    processing:
      "⏳ Processing your image...",
    success:
      "🖌️ Image edited successfully.",
    fail:
      "❌ Failed to process image.",
  }
};

export const entry = defineEntry(
  async ({ output, args, langParser, event }) => {

    const t = langParser.createGetLang(langs);

    const prompt = args.join(" ").trim();

    if (!prompt) {
      return output.reply(t("noPrompt"));
    }

    const replied =
      event.messageReply?.attachments?.[0];

    if (!replied || replied.type !== "photo") {
      return output.reply(t("noImage"));
    }

    const imageUrl = replied.url;

    const loadingMsg =
      await output.reply(t("processing"));

    try {

      const apiUrl =
        `https://azadx69x.is-a.dev/api/editor?url=${encodeURIComponent(imageUrl)}&prompt=${encodeURIComponent(prompt)}`;

      const response = await axios.get(apiUrl, {
        responseType: "stream",
        timeout: 120000,
        headers: {
          Accept: "*/*",
          Connection: "keep-alive",
          "User-Agent":
            "Mozilla/5.0"
        }
      });

      await output.reply({
        body:
          `${UNISpectra.charm} ${t("success")}\n` +
          `📝 Prompt: ${prompt}`,
        attachment: response.data
      });

      if (loadingMsg?.messageID) {
        output.unsend(loadingMsg.messageID);
      }

    } catch (err) {

      console.error("EDIT ERROR:", err);

      if (loadingMsg?.messageID) {
        output.unsend(loadingMsg.messageID);
      }

      output.reply(t("fail"));
    }
  }
);
