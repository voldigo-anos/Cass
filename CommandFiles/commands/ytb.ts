import axios from "axios";
import fs from "fs";
import path from "path";
import moment from "moment-timezone";
import yts from "yt-search";
import { defineEntry } from "@cass/define";
import { UNISpectra } from "@cassidy/unispectra";

/* ================= META ================= */

export const meta: CommandMeta = {
  name: "youtube",
  otherNames: ["ytb"],
  author: "dipto • converted by Christus Dev AI",
  version: "1.1.4",
  description: "Download video, audio, and info from YouTube",
  category: "Media",
  usage:
    "{prefix}{name} -v <query|url>\n" +
    "{prefix}{name} -a <query|url>\n" +
    "{prefix}{name} -i <query|url>",
  role: 0,
  waitingTime: 5,
  icon: "📺",
  noLevelUI: true,
};

/* ================= STYLE ================= */

export const style: CommandStyle = {
  title: "Christus • YouTube Downloader 🪽",
  titleFont: "bold",
  contentFont: "fancy",
};

/* ================= LANGS ================= */

export const langs = {
  en: {
    usage: "❌ Usage: -v | -a | -i <query or url>",
    noQuery: "❌ Provide a YouTube URL or search keyword.",
    noResults: "⭕ No results found.",
    invalidSelect: "❌ Invalid selection (1–6 only).",
    downloadFail: "❌ Failed to download media.",
    infoFail: "❌ Failed to retrieve video info.",
  },
};

/* ================= API ================= */

const BASE_API_URL =
  "https://raw.githubusercontent.com/Mostakim0978/D1PT0/refs/heads/main/baseApiUrl.json";

async function getAPIBase(): Promise<string> {
  const { data } = await axios.get<{ api: string }>(BASE_API_URL);
  return data.api;
}

async function streamFromURL(url: string) {
  const res = await axios({ url, responseType: "stream" });
  return res.data;
}

/* ================= ENTRY ================= */

export const entry = defineEntry(
  async ({ input, output, args, langParser }) => {
    const t = langParser.createGetLang(langs);

    const action = args[0] as "-v" | "-a" | "-i";
    const query = args.slice(1).join(" ");

    if (!["-v", "-a", "-i"].includes(action)) return output.reply(t("usage"));
    if (!query) return output.reply(t("noQuery"));

    const apiBase = await getAPIBase();

    /* ===== DIRECT URL ===== */

    if (query.startsWith("http")) {
      try {
        if (action === "-i") {
          const { data } = await axios.get(
            `${apiBase}/ytfullinfo?videoID=${query}`
          );

          return output.reply({
            body:
              `✨ Title: ${data.title}\n` +
              `⏳ Duration: ${data.duration / 60} minutes\n` +
              `👀 Views: ${data.view_count}\n` +
              `👍 Likes: ${data.like_count}\n` +
              `🌐 Channel: ${data.channel}`,
            attachment: await streamFromURL(data.thumbnail),
          });
        }

        const type = action === "-a" ? "mp3" : "mp4";
        const { data } = await axios.get(
          `${apiBase}/ytDl3?link=${query}&format=${type}&quality=3`
        );

        const filePath = path.join(
          __dirname,
          `yt_${Date.now()}.${type}`
        );

        const res = await axios({
          url: data.downloadLink,
          responseType: "stream",
        });

        const writer = fs.createWriteStream(filePath);
        res.data.pipe(writer);

        await new Promise<void>((r) => writer.on("finish", r));

        await output.reply({
          body: `• Title: ${data.title}\n• Quality: ${data.quality}`,
          attachment: fs.createReadStream(filePath),
        });

        fs.unlinkSync(filePath);
      } catch {
        output.reply(t("downloadFail"));
      }
      return;
    }

    /* ===== SEARCH ===== */

    const search = await yts(query);
    const results = search.videos.slice(0, 6);

    if (!results.length) return output.reply(t("noResults"));

    const time = moment().tz("UTC").format("MMMM D, YYYY h:mm A");

    const list = results
      .map(
        (v, i) =>
          ` • ${i + 1}. ${v.title}\n   ⏱️ ${v.timestamp}`
      )
      .join("\n\n");

    const msg = await output.reply({
      body:
        `${UNISpectra.charm} Temporal Coordinates\n` +
        ` • 📅 ${time}\n` +
        `${UNISpectra.standardLine}\n` +
        `${list}\n` +
        `${UNISpectra.standardLine}\n` +
        `Reply with a number (1–6)`,
      attachment: await Promise.all(
        results.map((v) => streamFromURL(v.thumbnail))
      ),
    });

    input.setReply(msg.messageID, {
      key: "youtube",
      author: input.senderID,
      action,
      results,
      apiBase,
    });
  }
);

/* ================= REPLY ================= */

export async function reply({
  input,
  output,
  repObj,
}: CommandContext & {
  repObj: {
    author: string;
    action: "-v" | "-a" | "-i";
    results: any[];
    apiBase: string;
  };
}) {
  if (input.senderID !== repObj.author) return;

  const choice = parseInt(input.body);
  if (isNaN(choice) || choice < 1 || choice > repObj.results.length) {
    return output.reply("❌ Invalid selection.");
  }

  const video = repObj.results[choice - 1];

  try {
    if (repObj.action === "-i") {
      const { data } = await axios.get(
        `${repObj.apiBase}/ytfullinfo?videoID=${video.videoId}`
      );

      return output.reply({
        body:
          `✨ Title: ${data.title}\n` +
          `⏳ Duration: ${data.duration / 60} minutes\n` +
          `👀 Views: ${data.view_count}`,
        attachment: await streamFromURL(data.thumbnail),
      });
    }

    const type = repObj.action === "-a" ? "mp3" : "mp4";

    const { data } = await axios.get(
      `${repObj.apiBase}/ytDl3?link=${video.videoId}&format=${type}&quality=3`
    );

    const filePath = path.join(
      __dirname,
      `yt_${Date.now()}.${type}`
    );

    const res = await axios({
      url: data.downloadLink,
      responseType: "stream",
    });

    const writer = fs.createWriteStream(filePath);
    res.data.pipe(writer);

    await new Promise<void>((r) => writer.on("finish", r));

    await output.reply({
      body: `• Title: ${data.title}\n• Quality: ${data.quality}`,
      attachment: fs.createReadStream(filePath),
    });

    fs.unlinkSync(filePath);
  } catch {
    output.reply("❌ Action failed.");
  }
                    }
