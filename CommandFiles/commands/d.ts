import axios from "axios";
import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { defineEntry } from "@cass/define";
import { UNISpectra } from "@cassidy/unispectra";

const BASE = "https://christus-downloader.vercel.app";
const AUTO_URL = `${BASE}/api/auto`;
const SUPPORTED_URL = `${BASE}/api/supported`;

const FB_BASE = "https://your-download-hub.vercel.app";
const FB_AUTO_URL = `${FB_BASE}/api/auto`;
const FB_DOMAINS = ["facebook.com", "fb.watch"];

const TIMEOUT_API = 30_000;
const TIMEOUT_DL = 60_000;
const MAX_BYTES = 50 * 1024 * 1024;
const REFRESH_MS = 30 * 60 * 1000;
const CACHE_DIR = path.join(process.cwd(), "CommandFiles", "cache");
const URL_RE = /^https?:\/\/\S+$/i;

const FALLBACK_DOMAINS = [
  "facebook.com", "fb.watch",
  "youtube.com", "youtu.be",
  "tiktok.com",
  "instagram.com", "instagr.am",
  "likee.com", "likee.video",
  "capcut.com",
  "spotify.com",
  "terabox.com",
  "twitter.com", "x.com",
  "drive.google.com",
  "soundcloud.com",
  "ndown.app",
  "pinterest.com", "pin.it",
];

let supportedDomains: string[] = FALLBACK_DOMAINS;
let domainsLoaded = false;

async function loadSupportedDomains(): Promise<void> {
  try {
    const res = await axios.get(SUPPORTED_URL, { timeout: 15_000 });
    const list = Array.isArray(res.data) ? res.data : res.data?.domains;
    if (Array.isArray(list) && list.length) {
      supportedDomains = list;
      domainsLoaded = true;
    }
  } catch {}
}

void loadSupportedDomains().finally(() => {
  const timer = setInterval(() => void loadSupportedDomains(), REFRESH_MS);
  (timer as any)?.unref?.();
});

const inFlight = new Set<string>();

export const meta: CommandMeta = {
  name: "alldl",
  description:
    "All-in-one media downloader (video/audio) for 19+ platforms",
  author: "Christus dev AI",
  version: "2.0.0",
  usage: "{prefix}alldl <url>\nOr simply send a supported URL.",
  category: "Media",
  role: 0,
  waitingTime: 5,
  icon: "📥",
  noLevelUI: true,
  noPrefix: "both",
};

export const style: CommandStyle = {
  title: "AllDL • Media Downloader 📥",
  titleFont: "bold",
  contentFont: "fancy",
};

export const langs = {
  en: {
    noURL:
      "❌ No URL found!\nExample: {prefix}alldl <url>\nOr reply to a supported link.",
    invalid: "❌ Unsupported URL!",
    success: "✅ Download completed successfully!",
    failed: "❌ Failed to download media.",
    busy: "⏳ A download is already in progress.",
    tooBig: "⚠️ Media too large (max 50 MB).",
  },
  fr: {
    noURL:
      "❌ Aucune URL trouvée !\nExemple : {prefix}alldl <url>\nOu réponds à un lien supporté.",
    invalid: "❌ URL non supportée !",
    success: "✅ Téléchargement terminé avec succès !",
    failed: "❌ Échec du téléchargement.",
    busy: "⏳ Un téléchargement est déjà en cours.",
    tooBig: "⚠️ Média trop volumineux (max 50 Mo).",
  },
};

interface MediaResponse {
  title?: string;
  platform?: string;
  medias?: { type: string; url: string }[];
  high_quality?: string;
  low_quality?: string;
  audio?: string;
  data?: { mp4?: string; mp3?: string };
}

function extractURL(text?: string | null): string | null {
  if (!text) return null;
  const match = text.match(URL_RE);
  return match?.[0] ?? null;
}

function classifyUrl(rawUrl: string): { ok: boolean; isFacebook: boolean } {
  try {
    const host = new URL(rawUrl).hostname.replace(/^www\./, "").toLowerCase();
    const isFacebook = FB_DOMAINS.some(
      (d) => host === d || host.endsWith(`.${d}`)
    );
    const ok =
      isFacebook ||
      supportedDomains.some((d) => host === d || host.endsWith(`.${d}`));
    return { ok, isFacebook };
  } catch {
    return { ok: false, isFacebook: false };
  }
}

function extractMedia(data: MediaResponse): {
  url: string | null;
  isAudio: boolean;
} {
  const videoURL =
    data.medias?.find((m) => m.type === "video")?.url ||
    data.high_quality ||
    data.low_quality ||
    data.data?.mp4 ||
    null;

  const audioURL =
    data.medias?.find((m) => m.type === "audio")?.url ||
    data.audio ||
    data.data?.mp3 ||
    null;

  if (videoURL) return { url: videoURL, isAudio: false };
  if (audioURL) return { url: audioURL, isAudio: true };
  return { url: null, isAudio: false };
}

async function downloadAndSend(
  rawUrl: string,
  output: CommandContext["output"],
  getLang: (k: string) => string
): Promise<void> {
  const { ok, isFacebook } = classifyUrl(rawUrl);
  if (!ok) throw new Error("UNSUPPORTED");

  const targetUrl = isFacebook ? FB_AUTO_URL : AUTO_URL;

  const apiRes = await axios.get(targetUrl, {
    params: { url: rawUrl },
    timeout: TIMEOUT_API,
  });

  if (!apiRes.data) throw new Error("EMPTY_API");

  const data = apiRes.data as MediaResponse;
  const { url: mediaURL, isAudio } = extractMedia(data);

  if (!mediaURL) throw new Error("NO_MEDIA");

  const extension = isAudio ? "mp3" : "mp4";
  await fs.mkdir(CACHE_DIR, { recursive: true });
  const filePath = path.join(
    CACHE_DIR,
    `auto_media_${Date.now()}_${randomUUID()}.${extension}`
  );

  try {
    const mediaRes = await axios.get(mediaURL, {
      responseType: "arraybuffer",
      timeout: TIMEOUT_DL,
      maxContentLength: MAX_BYTES,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Referer: targetUrl,
      },
    });

    const buffer = Buffer.from(mediaRes.data);
    if (buffer.byteLength > MAX_BYTES) throw new Error("TOO_BIG");
    await fs.writeFile(filePath, buffer);

    await output.reply({
      body:
        `${UNISpectra.charm} ${getLang("success")}\n\n` +
        `╭〔 MEDIA DOWNLOAD 〕\n` +
        `├‣ 📄 Title: ${data.title || "Unknown"}\n` +
        `├‣ 🌐 Platform: ${data.platform || (isFacebook ? "Facebook" : "Unknown")}\n` +
        `├‣ 🎚️ Type: ${isAudio ? "Audio (mp3)" : "Video (mp4)"}\n` +
        `╰‣ 🤖 Cassidy Media System`,
      attachment: filePath,
    });
  } finally {
    try {
      await fs.unlink(filePath);
    } catch {}
  }
}

async function resolveURL(
  input: CommandContext["input"],
  args: string[]
): Promise<string | null> {
  const replied = input.replier;
  if (replied) {
    const fromBody = extractURL(replied.body);
    if (fromBody) return fromBody;

    const att = replied.attachments?.find(
      (a: any) =>
        (a?.type === "video" ||
          a?.type === "share" ||
          a?.type === "animated_image") &&
        (a?.url || a?.source || a?.playable_url)
    );
    if (att) return att.url || att.source || att.playable_url;
  }

  if (args[0] && URL_RE.test(args[0])) return args[0];
  return extractURL(input.body);
}

export const entry = defineEntry(
  async ({ args, output, input, langParser, event }) => {
    const getLang = langParser.createGetLang(langs);
    const userId = event?.senderID ?? "anon";

    if (!domainsLoaded) void loadSupportedDomains();

    const url = await resolveURL(input, args);

    if (!url) {
      try { await output.react("❌"); } catch {}
      return output.reply(getLang("noURL"));
    }

    const { ok } = classifyUrl(url);
    if (!ok) {
      try { await output.react("❌"); } catch {}
      return output.reply(getLang("invalid"));
    }

    if (inFlight.has(userId)) {
      try { await output.react("⏳"); } catch {}
      return output.reply(getLang("busy"));
    }
    inFlight.add(userId);

    try {
      try { await output.react("📥"); } catch {}
      await downloadAndSend(url, output, getLang);
      try { await output.react("✅"); } catch {}
    } catch (err: any) {
      console.error("[AllDL Error]", err?.response?.data ?? err?.message ?? err);
      try { await output.react("❌"); } catch {}
      const msg =
        err?.message === "TOO_BIG"
          ? getLang("tooBig")
          : err?.message === "UNSUPPORTED"
          ? getLang("invalid")
          : getLang("failed");
      return output.reply(msg);
    } finally {
      inFlight.delete(userId);
    }
  }
);

export async function event({
  input,
  output,
  langParser,
  event,
}: CommandContext) {
  try {
    const body = (input.body || "").trim();
    if (!body.startsWith("http://") && !body.startsWith("https://")) return;

    const url = extractURL(body);
    if (!url) return;

    const { ok } = classifyUrl(url);
    if (!ok) return;

    const userId = event?.senderID ?? "anon";
    if (inFlight.has(userId)) return;
    inFlight.add(userId);

    if (!domainsLoaded) void loadSupportedDomains();
    const getLang = langParser.createGetLang(langs);

    try {
      try { await output.react("📥"); } catch {}
      await downloadAndSend(url, output, getLang);
      try { await output.react("✅"); } catch {}
    } catch (err: any) {
      console.error("[AutoDL Error]", err?.response?.data ?? err?.message ?? err);
      try { await output.react("❌"); } catch {}
    } finally {
      inFlight.delete(userId);
    }
  } catch (err) {
    console.error("[AutoDL Wrapper]", err);
  }
    }
