import axios from "axios";
import fs from "fs-extra";
import path from "path";
import { defineEntry } from "@cass/define";
import { UNISpectra } from "@cassidy/unispectra";

const baseApi =
  "https://azadx69x-all-apis-top.vercel.app/api/mj";

const cacheDir =
  path.join(
    process.cwd(),
    "CommandFiles",
    "cache",
    "midjourney"
  );

export const meta: CommandMeta = {
  name: "midjourney",
  otherNames: ["mj"],
  description:
    "Generate MidJourney AI images",
  author: "Azadx69x x Christus",
  version: "1.0.0",
  usage:
    "{prefix}midjourney <prompt>",
  category: "AI",
  role: 0,
  waitingTime: 5,
  icon: "🎨",
  noLevelUI: true,
};

export const style: CommandStyle = {
  title: "MidJourney • AI Generator 🎨",
  titleFont: "bold",
  contentFont: "fancy",
};

export const langs = {
  en: {
    missingPrompt:
      "⚠️ Please provide a prompt.",

    generating:
      "🎨 Generating MidJourney images...",

    failed:
      "❌ Failed to generate image.",

    noImages:
      "❌ API did not return any images.",
  },
};

export const entry = defineEntry(
  async ({
    args,
    output,
    langParser,
  }) => {

    const getLang =
      langParser.createGetLang(langs);

    const prompt =
      args.join(" ").trim();

    if (!prompt) {

      output.react("⚠️");

      return output.reply(
        getLang("missingPrompt")
      );
    }

    try {

      output.react("🎨");

      fs.ensureDirSync(cacheDir);

      const apiUrl =
        `${baseApi}?prompt=${encodeURIComponent(prompt)}`;

      const response =
        await axios.get(apiUrl, {
          timeout: 180000,
        });

      const result =
        response.data;

      if (
        !result?.success ||
        !result?.data?.images?.length
      ) {
        throw new Error(
          getLang("noImages")
        );
      }

      const attachments: any[] = [];

      for (
        let i = 0;
        i <
        result.data.images.length;
        i++
      ) {

        const imageUrl =
          result.data.images[i];

        const imageResponse =
          await axios.get(
            imageUrl,
            {
              responseType:
                "arraybuffer",
              timeout: 60000,
              headers: {
                Accept: "*/*",
                "User-Agent":
                  "Mozilla/5.0",
              },
            }
          );

        const imgPath =
          path.join(
            cacheDir,
            `mj_${Date.now()}_${i}.png`
          );

        fs.writeFileSync(
          imgPath,
          imageResponse.data
        );

        attachments.push(
          fs.createReadStream(imgPath)
        );
      }

      const body =
        `${UNISpectra.charm} 🎨 MidJourney Generated\n\n` +
        `📝 Prompt: ${prompt}`;

      await output.reply({
        body,
        attachment: attachments,
      });

      for (const file of attachments) {

        try {

          if (
            file?.path &&
            fs.existsSync(file.path)
          ) {
            fs.unlinkSync(file.path);
          }

        } catch {}
      }

      output.react("✅");

    } catch (err: any) {

      console.error(
        "MidJourney Error:",
        err?.message || err
      );

      output.react("❌");

      return output.reply(
        `${
          getLang("failed")
        }\n\n📝 ${
          err?.response?.data?.error ||
          err?.message ||
          "Unknown error"
        }`
      );
    }
  }
);
