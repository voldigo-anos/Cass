import axios from "axios";
import fs from "fs";
import path from "path";
import { defineEntry } from "@cass/define";
import { UNISpectra } from "@cassidy/unispectra";

export const meta: CommandMeta = {
  name: "gem",
  description: "Generate or edit artistic AI images",
  author: "Christus dev AI",
  version: "3.0.0",
  usage: "{prefix}gem <prompt> [--r X:Y] [--nw]",
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
    noPrompt:
      "⚠️ Please provide a prompt.\nExample: {prefix}gem anime girl --r 9:16",

    generating:
      "🎨 Generating your masterpiece...\nPlease wait...",

    success:
      "✅ Masterpiece created successfully!",

    artistic:
      "🎨 Artistic Mode Enabled",

    failed:
      "❌ Failed to generate image.",
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

    if (!args[0]) {
      output.react("⚠️");

      return output.reply(
        getLang("noPrompt")
      );
    }

    try {

      output.react("🎨");

      const cacheFolder =
        path.join(process.cwd(), "CommandFiles", "cache");

      if (!fs.existsSync(cacheFolder)) {
        fs.mkdirSync(cacheFolder, {
          recursive: true,
        });
      }

      let promptParts: string[] = [];

      let ratio =
        "1:1";

      let artisticMode =
        false;

      for (let i = 0; i < args.length; i++) {

        if (
          args[i] === "--r" &&
          args[i + 1]
        ) {

          ratio =
            args[i + 1];

          i++;

        } else if (
          args[i] === "--nw"
        ) {

          artisticMode =
            true;

        } else {

          promptParts.push(
            args[i]
          );
        }
      }

      const userPrompt =
        promptParts.join(" ").trim();

      if (!userPrompt) {

        output.react("⚠️");

        return output.reply(
          getLang("noPrompt")
        );
      }

      let finalPrompt =
        userPrompt;

      if (artisticMode) {

        finalPrompt =
          `Sophisticated fine art photography, classical figure study, artistic lighting, gallery quality: ${userPrompt}`;
      }

      let endpoint =
        "https://gem-tw6a.onrender.com/generate";

      let payload: any = {
        prompt: finalPrompt,
        ratio,
        format: "jpg",
      };

      const repliedPhoto =
        input.replier?.attachments?.[0];

      if (
        repliedPhoto &&
        repliedPhoto.type === "photo"
      ) {

        const imgURL =
          repliedPhoto.url;

        const imgRes =
          await axios.get(imgURL, {
            responseType: "arraybuffer",
          });

        const imgBase64 =
          Buffer.from(
            imgRes.data,
            "binary"
          ).toString("base64");

        endpoint =
          "https://gem-tw6a.onrender.com/edit";

        payload.image =
          imgBase64;

        delete payload.ratio;
      }

      const response =
        await axios.post(
          endpoint,
          payload,
          {
            responseType: "arraybuffer",
            timeout: 180000,
            headers: {
              Accept: "*/*",
              "User-Agent":
                "Mozilla/5.0",
            },
          }
        );

      const filePath =
        path.join(
          cacheFolder,
          `gem_${Date.now()}.jpg`
        );

      fs.writeFileSync(
        filePath,
        response.data
      );

      await output.reply({
        body:
          `${UNISpectra.charm} ${getLang("success")}\n\n` +
          `📝 Prompt: ${userPrompt}\n` +
          `📐 Ratio: ${ratio}` +
          `${artisticMode ? `\n✨ ${getLang("artistic")}` : ""}`,

        attachment:
          fs.createReadStream(filePath),
      });

      output.react("✅");

      fs.unlink(
        filePath,
        () => {}
      );

    } catch (err: any) {

      console.error(
        "Gem Error:",
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
