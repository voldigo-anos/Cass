import axios from "axios";
import http from "http";
import https from "https";
import { defineEntry } from "@cass/define";
import { UNISpectra } from "@cassidy/unispectra";

export const meta: CommandMeta = {
  name: "alldl",
  description:
    "Fast video downloader for Facebook, TikTok, Instagram and YouTube",
  author: "Christus dev AI",
  version: "1.0.0",
  usage: "{prefix}alldl <url>",
  category: "Media",
  role: 0,
  waitingTime: 5,
  icon: "📥",
  noLevelUI: true,
};

export const style: CommandStyle = {
  title: "AllDL • Media Downloader 📥",
  titleFont: "bold",
  contentFont: "fancy",
};

export const langs = {
  en: {
    noURL:
      "❌ No URL found!\nExample: {prefix}alldl <url>\nOr reply to a supported video.",

    invalid:
      "❌ Unsupported URL!",

    downloading:
      "📥 Downloading video...\nPlease wait...",

    success:
      "✅ Download completed successfully!",

    failed:
      "❌ Failed to download video.",
  },
};

const supportedDomains = [
  "facebook",
  "fb.watch",
  "tiktok",
  "instagram",
  "youtu",
  "youtube",
];

function extractURL(text: string) {

  if (!text) {
    return null;
  }

  const match =
    text.match(/(https?:\/\/[^\s]+)/g);

  return match?.[0] || null;
}

async function downloadVideo(
  url: string,
  output: CommandContext["output"],
) {

  const apiURL =
    `https://azadx69x-alldl-cdi-bai.vercel.app/alldl?url=${encodeURIComponent(url)}&quality=sd`;

  const response =
    await axios.get(apiURL, {
      responseType: "stream",
      timeout: 60000,
      maxContentLength:
        50 * 1024 * 1024,
      maxBodyLength:
        50 * 1024 * 1024,
      decompress: true,

      headers: {
        Accept: "*/*",
        Connection: "keep-alive",
        "User-Agent":
          "Mozilla/5.0",
      },

      httpAgent:
        new http.Agent({
          keepAlive: true,
        }),

      httpsAgent:
        new https.Agent({
          keepAlive: true,
        }),
    });

  if (!response.data) {
    throw new Error(
      "Empty response"
    );
  }

  return output.replyStyled(
    {
      body:
        `${UNISpectra.charm} Download Complete\n\n` +
        `╭〔 VIDEO DOWNLOAD 〕\n` +
        `├‣ ✅ Successfully Downloaded\n` +
        `╰‣ 🤖 Cassidy Media System`,

      attachment:
        response.data,
    },

    style
  );
}

export const entry = defineEntry(
  async ({
    args,
    output,
    input,
    langParser,
  }) => {

    const getLang =
      langParser.createGetLang(langs);

    let url: string | null =
      null;

    const replied =
      input.replier;

    if (replied) {

      const replyBody =
        replied.body || "";

      const replyAttachments =
        replied.attachments || [];

      url =
        extractURL(replyBody);

      if (
        !url &&
        replyAttachments.length > 0
      ) {

        const att =
          replyAttachments[0];

        if (
          att.type === "video" ||
          att.type === "share"
        ) {

          url =
            att.url ||
            att.source ||
            att.playable_url;
        }
      }
    }

    if (!url && args[0]) {
      url = args[0];
    }

    if (
      !url &&
      input.body
    ) {

      url =
        extractURL(input.body);
    }

    if (!url) {

      output.react("❌");

      return output.reply(
        getLang("noURL")
      );
    }

    const isValid =
      supportedDomains.some(
        (domain) =>
          url!.includes(domain)
      );

    if (!isValid) {

      output.react("❌");

      return output.reply(
        getLang("invalid")
      );
    }

    try {

      output.react("📥");

      await downloadVideo(
        url,
        output
      );

      output.react("✅");

    } catch (err: any) {

      console.error(
        "[AllDL Error]",
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

export async function event({
  input,
  output,
}: CommandContext) {

  try {

    if (!input.body) {
      return;
    }

    const url =
      extractURL(input.body);

    if (!url) {
      return;
    }

    const isValid =
      supportedDomains.some(
        (domain) =>
          url.includes(domain)
      );

    if (!isValid) {
      return;
    }

    output.react("📥");

    await downloadVideo(
      url,
      output
    );

    output.react("✅");

  } catch (err) {

    console.error(
      "[AutoDL Event Error]",
      err
    );

    output.react("❌");
  }
  }
