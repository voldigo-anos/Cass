import axios from "axios";
import { defineEntry } from "@cass/define";
import { UNISpectra } from "@cassidy/unispectra";

export const meta: CommandMeta = {
  name: "imgx",
  description: "Generate AI images using MagicStudio",
  author: "Christus dev AI",
  version: "1.0.0",
  usage: "{prefix}imgx <prompt>",
  category: "Image Generator",
  role: 0,
  waitingTime: 5,
  icon: "🖼️",
  noLevelUI: true,
};

export const style: CommandStyle = {
  title: "ImgX • MagicStudio 🖼️",
  titleFont: "bold",
  contentFont: "fancy",
};

export const langs = {
  en: {
    noPrompt:
      "⚠️ Please provide a prompt.\nExample: {prefix}imgx anime girl",

    generating:
      "⏳ Generating your image...",

    success:
      "✅ MagicStudio image generated successfully!",

    failed:
      "❌ Failed to generate image.",
  },
};

export const entry = defineEntry(
  async ({
    args,
    output,
    langParser,
  }) => {

    const getLang =
      langParser.createGetLang(
        langs
      );

    const prompt =
      args.join(" ").trim();

    if (!prompt) {

      output.react("⚠️");

      return output.reply(
        getLang("noPrompt")
      );
    }

    try {

      output.react("⏳");

      const apiURL =
        `https://azadx69x.is-a.dev/api/magicstudio?prompt=${encodeURIComponent(prompt)}`;

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

      await output.reply({
        body:
          `${UNISpectra.charm} ${getLang("success")}\n\n` +
          `📝 Prompt: ${prompt}`,

        attachment:
          response.data,
      });

      output.react("✅");

    } catch (err: any) {

      console.error(
        "ImgX Error:",
        err?.message || err
      );

      output.react("❌");

      return output.reply(
        `${getLang("failed")}\n\n📝 ${
          err?.message ||
          "Unknown error"
        }`
      );
    }
  }
);
