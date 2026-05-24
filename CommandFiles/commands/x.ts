import axios from "axios";
import fs from "fs-extra";
import path from "path";
import { defineEntry } from "@cass/define";
import { UNISpectra } from "@cassidy/unispectra";

const cacheDir = path.join(process.cwd(), "CommandFiles", "cache", "x");

export const meta: CommandMeta = {
  name: "x",
  description: "Search and download videos",
  author: "SaGor x Christus",
  version: "1.0.0",
  usage: "{prefix}x <query>",
  category: "Media",
  role: 0,
  waitingTime: 5,
  icon: "🎬",
  noLevelUI: true,
};

export const style: CommandStyle = {
  title: "X • Video Search 🎬",
  titleFont: "bold",
  contentFont: "fancy",
};

export const langs = {
  en: {
    missingQuery:
      "⚠️ Please enter a search query.",

    searching:
      "🔎 Searching videos...",

    noResult:
      "❌ No videos found.",

    reply:
      "🎬 Video Results (≤10 min)\n\nReply with a number from 1-%1 to download.",

    invalid:
      "⚠️ Invalid selection.",

    downloading:
      "📥 Downloading video...",

    failed:
      "❌ Failed to fetch video.",

    apiError:
      "❌ API Error occurred.",
  },
};

export const entry = defineEntry(
  async ({
    input,
    output,
    args,
    commandName,
    langParser,
    commandReply,
  }) => {

    const getLang =
      langParser.createGetLang(langs);

    const query =
      args.join(" ").trim();

    if (!query) {
      output.react("⚠️");

      return output.reply(
        getLang("missingQuery")
      );
    }

    try {

      output.react("🔎");

      const apiUrl =
        `https://x-search-api-sagor.vercel.app/sagor?apikey=sagor&q=${encodeURIComponent(query)}`;

      const res =
        await axios.get(apiUrl, {
          timeout: 30000,
        });

      let results =
        res.data?.data || [];

      results = results.filter((item: any) => {

        const title =
          String(item.title || "")
            .toLowerCase();

        if (
          title.includes("sex") ||
          title.includes("porn") ||
          title.includes("xxx")
        ) {
          return false;
        }

        const duration =
          String(item.duration || "")
            .toLowerCase();

        if (duration.includes("min")) {

          const min =
            parseInt(duration);

          return min <= 10;
        }

        if (duration.includes("sec")) {
          return true;
        }

        return false;
      });

      const list =
        results.slice(0, 10);

      if (!list.length) {

        output.react("❌");

        return output.reply(
          getLang("noResult")
        );
      }

      fs.ensureDirSync(cacheDir);

      let body =
        `${UNISpectra.charm} ${getLang("reply", list.length)}\n\n`;

      const attachments: any[] = [];

      for (
        let i = 0;
        i < list.length;
        i++
      ) {

        const item =
          list[i];

        body +=
          `${i + 1}. ${item.title}\n` +
          `⏱️ ${item.duration}\n\n`;

        if (item.thumbnail) {

          try {

            const imgPath =
              path.join(
                cacheDir,
                `thumb_${Date.now()}_${i}.jpg`
              );

            const img =
              await axios({
                url: item.thumbnail,
                method: "GET",
                responseType: "stream",
              });

            const writer =
              fs.createWriteStream(imgPath);

            img.data.pipe(writer);

            await new Promise((resolve) =>
              writer.on("finish", resolve)
            );

            attachments.push(
              fs.createReadStream(imgPath)
            );

          } catch {}
        }
      }

      const sent =
        await output.reply({
          body,
          attachment: attachments,
        });

      commandReply.set(sent.messageID, {
        commandName,
        author: input.senderID,
        list,
      });

      output.react("✅");

    } catch (err: any) {

      console.error(
        "X Search Error:",
        err?.message || err
      );

      output.react("❌");

      return output.reply(
        getLang("apiError")
      );
    }
  }
);

export async function reply({
  input,
  output,
  repObj,
}: CommandContext) {

  const { author, list } =
    repObj;

  if (
    input.senderID !== author
  ) {
    return;
  }

  const index =
    parseInt(String(input.body));

  if (
    isNaN(index) ||
    index < 1 ||
    index > list.length
  ) {

    output.react("⚠️");

    return output.reply(
      "⚠️ Invalid number."
    );
  }

  try {

    output.react("📥");

    const selected =
      list[index - 1];

    const apiUrl =
      `https://x-down-api-sagor.vercel.app/sagor?apikey=sagor&q=${encodeURIComponent(selected.url)}`;

    const res =
      await axios.get(apiUrl, {
        timeout: 60000,
      });

    const data =
      res.data?.data;

    const videoUrl =
      data?.downloads?.[0]?.url;

    if (!videoUrl) {

      output.react("❌");

      return output.reply(
        "❌ No downloadable video found."
      );
    }

    const stream =
      (
        await axios({
          url: videoUrl,
          method: "GET",
          responseType: "stream",
          timeout: 120000,
          headers: {
            Accept: "*/*",
            "User-Agent":
              "Mozilla/5.0",
          },
        })
      ).data;

    await output.reply({
      body:
        `${UNISpectra.charm} 🎬 ${data.title}\n\n` +
        `⏱️ Duration: ${data.duration || "Unknown"}`,

      attachment: stream,
    });

    output.react("✅");

  } catch (err: any) {

    console.error(
      "X Download Error:",
      err?.message || err
    );

    output.react("❌");

    return output.reply(
      "❌ Failed to send video."
    );
  }
          }
