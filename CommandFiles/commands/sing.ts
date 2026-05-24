import axios from "axios";
import fs from "fs";
import path from "path";
import { defineEntry } from "@cass/define";
import { UNISpectra } from "@cassidy/unispectra";

export const meta: CommandMeta = {
  name: "sing",
  description: "Search and download music from YouTube",
  author: "Christus dev AI",
  version: "1.0.0",
  usage: "{prefix}sing <song name>",
  category: "Media",
  role: 0,
  waitingTime: 5,
  icon: "🎵",
  otherNames: [
    "song",
    "music",
  ],
  noLevelUI: true,
};

export const style: CommandStyle = {
  title: "Sing • Music Downloader 🎵",
  titleFont: "bold",
  contentFont: "fancy",
};

export const langs = {
  en: {
    noQuery:
      "⚠️ Please provide a song name.\nExample: {prefix}sing Shape of You",

    searching:
      "🔍 Searching song...\nPlease wait...",

    downloading:
      "⬇️ Downloading audio...",

    failed:
      "❌ Failed to fetch audio.",

    success:
      "✅ Audio downloaded successfully!",
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

    const query =
      args.join(" ").trim();

    if (!query) {

      output.react("⚠️");

      return output.reply(
        getLang("noQuery")
      );
    }

    try {

      output.react("🔍");

      const apiURL =
        `https://azadx69x-all-apis-top.vercel.app/api/sing?song=${encodeURIComponent(query)}`;

      const response =
        await axios.get(apiURL, {
          timeout: 30000,
        });

      if (
        !response.data?.success ||
        !response.data?.audio?.url
      ) {

        output.react("❌");

        return output.reply(
          getLang("failed")
        );
      }

      const {
        info,
        audio,
      } = response.data;

      output.react("⬇️");

      const cacheFolder =
        path.join(
          process.cwd(),
          "CommandFiles",
          "cache"
        );

      if (
        !fs.existsSync(cacheFolder)
      ) {

        fs.mkdirSync(
          cacheFolder,
          {
            recursive: true,
          }
        );
      }

      const fileName =
        `sing_${Date.now()}.m4a`;

      const filePath =
        path.join(
          cacheFolder,
          fileName
        );

      const audioResponse =
        await axios({
          url: audio.url,
          method: "GET",
          responseType:
            "arraybuffer",
          timeout: 60000,

          headers: {
            "User-Agent":
              "Mozilla/5.0",
          },
        });

      fs.writeFileSync(
        filePath,
        Buffer.from(
          audioResponse.data
        )
      );

      await output.replyStyled(
        {
          body:
            `${UNISpectra.charm} ${getLang("success")}\n\n` +
            `🎵 Title: ${info.title}\n` +
            `👤 Artist: ${info.artist}`,

          attachment:
            fs.createReadStream(
              filePath
            ),
        },

        style
      );

      output.react("✅");

      fs.unlink(
        filePath,
        () => {}
      );

    } catch (err: any) {

      console.error(
        "Sing Error:",
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
