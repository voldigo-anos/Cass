import axios from "axios";
import { defineEntry } from "@cass/define";
import { UNISpectra } from "@cassidy/unispectra";

export const meta: CommandMeta = {
  name: "edit",
  description: "Edit images using AI prompts",
  author: "Christus dev AI",
  version: "1.0.0",
  usage: "{prefix}edit <prompt>",
  category: "Image Generator",
  role: 0,
  waitingTime: 5,
  icon: "🖼️",
  noLevelUI: true,
};

export const style: CommandStyle = {
  title: "Edit • AI Image Editor 🖼️",
  titleFont: "bold",
  contentFont: "fancy",
};

export const langs = {
  en: {
    noPrompt:
      "⚠️ Please provide a prompt.\nExample: {prefix}edit make it cyberpunk",

    noImage:
      "🖼️ Please reply to an image.",

    processing:
      "⏳ Editing image...\nPlease wait...",

    success:
      "✅ Image edited successfully!",

    failed:
      "❌ Failed to process image.",
  },
};

export const entry = defineEntry(
  async ({
    args,
    output,
    input,
    langParser,
  }) => {

    const getLang =
      langParser.createGetLang(langs);

    try {

      const prompt =
        args.join(" ").trim();

      if (!prompt) {

        output.react("⚠️");

        return output.reply(
          getLang("noPrompt")
        );
      }

      const repliedImage =
        input.replier?.attachments?.[0];

      const imageURL =
        repliedImage?.url;

      if (!imageURL) {

        output.react("🖼️");

        return output.reply(
          getLang("noImage")
        );
      }

      output.react("⏳");

      const apiURL =
        `https://azadx69x.is-a.dev/api/editor?url=${encodeURIComponent(imageURL)}&prompt=${encodeURIComponent(prompt)}`;

      const response =
        await axios.get(apiURL, {
          responseType: "stream",
          timeout: 180000,
          headers: {
            Accept: "*/*",
            "User-Agent":
              "Mozilla/5.0",
          },
        });

      await output.replyStyled(
        {
          body:
            `${UNISpectra.charm} ${getLang("success")}\n\n` +
            `📝 Prompt: ${prompt}`,

          attachment:
            response.data,
        },

        style
      );

      output.react("✅");

    } catch (err: any) {

      console.error(
        "Edit Error:",
        err?.message || err
      );

      output.react("❌");

      return output.reply(
        `${getLang("failed")}\n\n📝 ${
          err?.message || "Unknown error"
        }`
      );
    }
  }
);
