import axios from "axios";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import { defineEntry } from "@cass/define";
import { UNISpectra } from "@cassidy/unispectra";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CACHE_DIR = path.join(__dirname, "cache");

export const meta: CommandMeta = {
  name: "sing",
  description: "Download songs from YouTube",
  author: "Christus dev AI",
  version: "3.0.0",
  usage: "{prefix}{name} <song name>",
  category: "Media",
  role: 0,
  otherNames: ["song", "music"],
  icon: "🎶",
  waitingTime: 5,
  noLevelUI: true,
};

export const style: CommandStyle = {
  title: "Christus • Music Downloader 🎧",
  titleFont: "bold",
  contentFont: "fancy",
};

export const langs = {
  en: {
    noQuery:
      "❌ Please provide a song name.\nExample: {prefix}sing mockingbird",
    apiError:
      "❌ Failed to fetch audio.",
    downloadError:
      "❌ Failed to download song.",
  },
};

function formatSongInfo(info: any) {
  return `${UNISpectra.charm} Music Download Complete 🎵
 • 🎶 Title: ${info.title || "Unknown"}
 • 👤 Artist: ${info.artist || "Unknown"}
${UNISpectra.standardLine}
${UNISpectra.charm} Christus-Midnight 🌃`;
}

export const entry = defineEntry(
  async ({ output, args, langParser }) => {

    const getLang =
      langParser.createGetLang(langs);

    const query =
      args.join(" ").trim();

    if (!query) {
      return output.reply(
        getLang("noQuery")
      );
    }

    try {

      await fs.ensureDir(CACHE_DIR);

      output.react("🔍");

      const apiUrl =
        `https://azadx69x-all-apis-top.vercel.app/api/sing?song=${encodeURIComponent(query)}`;

      const res = await axios.get(apiUrl, {
        timeout: 30000,
        headers: {
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0"
        }
      });

      if (
        !res.data?.success ||
        !res.data?.audio?.url
      ) {
        output.react("❌");

        return output.reply(
          getLang("apiError")
        );
      }

      const { info, audio } =
        res.data;

      const filePath = path.join(
        CACHE_DIR,
        `sing_${Date.now()}.m4a`
      );

      output.react("⬇️");

      const downloadRes =
        await axios({
          url: audio.url,
          method: "GET",
          responseType: "arraybuffer",
          timeout: 120000,
          headers: {
            "User-Agent": "Mozilla/5.0"
          }
        });

      await fs.writeFile(
        filePath,
        Buffer.from(downloadRes.data)
      );

      await output.reply({
        body: formatSongInfo(info),
        attachment: fs.createReadStream(filePath),
      });

      output.react("✅");

      if (await fs.pathExists(filePath)) {
        await fs.remove(filePath);
      }

    } catch (err: any) {

      console.error(
        "Sing Error:",
        err?.message || err
      );

      output.react("❌");

      return output.reply(
        `${getLang("downloadError")}\n\n📝 ${
          err?.message || "Unknown error"
        }`
      );
    }
  }
);
