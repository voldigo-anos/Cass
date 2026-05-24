import axios from "axios";
import { defineEntry } from "@cass/define";
import { UNISpectra } from "@cassidy/unispectra";

export const meta: CommandMeta = {
  name: "flux",
  description: "Generate AI images using Flux",
  author: "Christus dev AI",
  version: "2.0.0",
  usage: "{prefix}flux <prompt> | <ratio>",
  category: "Image Generator",
  role: 0,
  waitingTime: 5,
  icon: "⚡",
  noLevelUI: true,
};

export const style: CommandStyle = {
  title: "Flux • AI Generator ⚡",
  titleFont: "bold",
  contentFont: "fancy",
};

export const langs = {
  en: {
    noPrompt:
      "⚠️ Please provide a prompt.\nExample: {prefix}flux anime girl | 9:16",

    processing:
      "⚡ Generating your Flux AI image...\nPlease wait...",

    success:
      "✅ Flux image generated successfully!",

    fail:
      "❌ Failed to generate image.",
  },
};

export const entry = defineEntry(
  async ({ args, output, langParser }) => {

    const getLang =
      langParser.createGetLang(langs);

    const input =
      args.join(" ").trim();

    if (!input) {
      output.react("⚠️");

      return output.reply(
        getLang("noPrompt")
      );
    }

    const split =
      input.split("|");

    const prompt =
      split[0]?.trim();

    const ratio =
      split[1]?.trim();

    if (!prompt) {
      output.react("⚠️");

      return output.reply(
        getLang("noPrompt")
      );
    }

    try {

      output.react("⏳");

      let apiURL =
        `https://azadx69x.is-a.dev/api/flux?prompt=${encodeURIComponent(prompt)}`;

      if (ratio) {
        apiURL +=
          `&ratio=${encodeURIComponent(ratio)}`;
      }

      const response =
        await axios.get(apiURL, {
          responseType: "stream",
          timeout: 180000,
          headers: {
            Accept: "*/*",
            "User-Agent": "Mozilla/5.0"
          }
        });

      await output.reply({
        body:
          `${UNISpectra.charm} ${getLang("success")}\n\n` +
          `📝 Prompt: ${prompt}` +
          `${ratio ? `\n📐 Ratio: ${ratio}` : ""}`,

        attachment: response.data,
      });

      output.react("✅");

    } catch (err: any) {

      console.error(
        "Flux Error:",
        err?.message || err
      );

      output.react("❌");

      return output.reply(
        `${getLang("fail")}\n\n📝 ${
          err?.message || "Unknown error"
        }`
      );
    }
  }
);
