import axios from "axios";
import fs from "fs";
import path from "path";
import os from "os";
import yts from "yt-search";
import moment from "moment-timezone";
import { fileURLToPath } from "url";
import { defineEntry } from "@cass/define";
import { UNISpectra } from "@cassidy/unispectra";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE = "https://azadx69x.is-a.dev";

interface YTVideo {
  title: string;
  url: string;
  seconds: number;
  thumbnail: string;
  author?: {
    name?: string;
  };
}

export const meta: CommandMeta = {
  name: "youtube",
  otherNames: ["ytb"],
  author: "Christus dev AI",
  version: "2.0.0",
  description: "Search and download YouTube video/audio",
  category: "Media",
  usage: "{prefix}{name} -v <query|url>\n{prefix}{name} -a <query|url>",
  role: 0,
  waitingTime: 5,
  icon: "📺",
  noLevelUI: true,
};

export const style: CommandStyle = {
  title: "Christus • YouTube Downloader 🏂",
  titleFont: "bold",
  contentFont: "fancy",
};

export const langs = {
  en: {
    usage: "❌ Usage: -v <query|url> | -a <query|url>",
    noQuery: "❌ Provide a search query or YouTube URL.",
    noResults: "❌ No results found.",
    invalidSelect: "❌ Invalid selection. Choose 1–6.",
    downloadFail: "❌ Failed to download media.",
  },
};

function buildList(videos: YTVideo[], type: "-v" | "-a") {
  const time = moment().tz("UTC").format("MMMM D, YYYY h:mm A");

  const list = videos
    .map((v, i) => {
      const quality = type === "-v" ? "HD" : "128kbps";

      return ` • ${i + 1}. ${v.title}
   👤 ${v.author?.name || "Unknown"}
   🎚️ ${quality}`;
    })
    .join("\n\n");

  return `${UNISpectra.charm} Temporal Coordinates
 • 📅 ${time}
${UNISpectra.standardLine}
${UNISpectra.charm} Select a media
${list}
${UNISpectra.standardLine}
${UNISpectra.charm} Reply with a number (1–6)
${UNISpectra.charm} ChristusBot 🏂`;
}

async function streamFromURL(url: string) {
  const res = await axios({
    url,
    responseType: "stream",
    timeout: 15000
  });

  return res.data;
}

async function downloadMedia(
  videoUrl: string,
  type: "audio" | "video",
  output: any
) {
  const downloadUrl =
    `${API_BASE}/api/ytdown?url=${encodeURIComponent(videoUrl)}&type=${type}`;

  const { data: dlData } = await axios.get(downloadUrl, {
    timeout: 30000,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
  });

  if (!dlData.success) {
    throw new Error(dlData.error || "Download API failed");
  }

  const mediaItems = dlData.result?.api?.mediaItems || [];

  if (!mediaItems.length) {
    throw new Error("No media items found");
  }

  let picked = null;

  if (type === "audio") {
    picked =
      mediaItems.find(
        (x: any) =>
          x.type === "Audio" &&
          x.mediaQuality === "128K" &&
          x.mediaExtension === "MP3"
      ) ||
      mediaItems.find(
        (x: any) =>
          x.type === "Audio" &&
          x.mediaQuality === "128K"
      ) ||
      mediaItems.find((x: any) => x.type === "Audio");
  } else {
    picked =
      mediaItems.find(
        (x: any) =>
          x.type === "Video" &&
          x.mediaQuality === "HD"
      ) ||
      mediaItems.find(
        (x: any) =>
          x.type === "Video" &&
          x.mediaQuality === "SD"
      ) ||
      mediaItems.find((x: any) => x.type === "Video");
  }

  if (!picked) {
    throw new Error("No suitable media found");
  }

  let fileUrl = picked.mediaPreviewUrl || picked.mediaUrl;

  if (!fileUrl || !fileUrl.startsWith("http")) {
    throw new Error("Invalid media URL");
  }

  if (picked.mediaUrl?.startsWith("http")) {
    try {
      const workerHeaders = {
        Accept: "application/json, text/plain, */*",
        Referer: "https://app.ytdown.to/",
        Origin: "https://app.ytdown.to",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      };

      let resolvedUrl = null;

      for (let i = 0; i < 10; i++) {
        const workerRes = await axios.get(picked.mediaUrl, {
          timeout: 20000,
          headers: workerHeaders
        });

        const candidate = workerRes.data?.fileUrl;

        if (candidate && candidate !== "Waiting...") {
          resolvedUrl = candidate;
          break;
        }

        await new Promise((r) => setTimeout(r, 3000));
      }

      if (resolvedUrl) {
        fileUrl = resolvedUrl;
      }
    } catch {}
  }

  const ext = type === "audio" ? "mp3" : "mp4";

  const tempFile = path.join(
    os.tmpdir(),
    `yt_${Date.now()}.${ext}`
  );

  const response = await axios({
    url: fileUrl,
    responseType: "stream",
    timeout: 120000,
    maxRedirects: 10,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Referer: "https://www.youtube.com/"
    }
  });

  const writer = fs.createWriteStream(tempFile);

  response.data.pipe(writer);

  await new Promise<void>((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });

  await output.reply({
    attachment: fs.createReadStream(tempFile)
  });

  setTimeout(() => {
    try {
      fs.unlinkSync(tempFile);
    } catch {}
  }, 15000);
}

export const entry = defineEntry(
  async ({ input, output, args, langParser }) => {
    const t = langParser.createGetLang(langs);

    const mode = args[0] as "-v" | "-a";

    const query = args.slice(1).join(" ");

    if (!["-v", "-a"].includes(mode)) {
      return output.reply(t("usage"));
    }

    if (!query) {
      return output.reply(t("noQuery"));
    }

    if (query.startsWith("http")) {
      try {
        await downloadMedia(
          query,
          mode === "-v" ? "video" : "audio",
          output
        );
      } catch {
        return output.reply(t("downloadFail"));
      }

      return;
    }

    try {
      const res = await yts(query);

      const videos = res.videos.slice(0, 6);

      if (!videos.length) {
        return output.reply(t("noResults"));
      }

      const thumbs = await Promise.all(
        videos.map((v) => streamFromURL(v.thumbnail))
      );

      const msg = await output.reply({
        body: buildList(videos as YTVideo[], mode),
        attachment: thumbs,
      });

      input.setReply(msg.messageID, {
        key: "youtube",
        id: input.senderID,
        results: videos,
        type: mode,
      });

    } catch {
      output.reply(t("noResults"));
    }
  }
);

export async function reply({
  input,
  output,
  repObj,
  detectID,
  langParser,
}: CommandContext & {
  repObj: {
    id: string;
    results: YTVideo[];
    type: "-v" | "-a";
  };
}) {
  const t = langParser.createGetLang(langs);

  if (input.senderID !== repObj.id) return;

  const choice = parseInt(input.body);

  if (
    isNaN(choice) ||
    choice < 1 ||
    choice > repObj.results.length
  ) {
    return output.reply(t("invalidSelect"));
  }

  const selected = repObj.results[choice - 1];

  input.delReply(String(detectID));

  try {
    await downloadMedia(
      selected.url,
      repObj.type === "-v" ? "video" : "audio",
      output
    );
  } catch {
    output.reply(t("downloadFail"));
  }
}
