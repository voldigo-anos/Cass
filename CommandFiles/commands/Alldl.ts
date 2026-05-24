import axios from "axios";
import fs from "fs-extra";
import path from "path";
import http from "http";
import https from "https";
import { fileURLToPath } from "url";
import { defineEntry } from "@cass/define";

export const meta: CommandMeta = {
  name: "autodl",
  description: "Téléchargement automatique de vidéos et médias",
  version: "4.0.0",
  author: "Christus",
  icon: "📥",
  category: "Media",
  role: 0,
  noPrefix: true,
};

export const style: CommandStyle = {
  title: "📥 Auto Downloader",
  titleFont: "bold",
  contentFont: "fancy",
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CACHE_DIR = path.join(__dirname, "cache");

const patterns = {
  supported:
    /(facebook\.com|fb\.watch|tiktok\.com|instagram\.com|youtu\.be|youtube\.com)/i
};

const cooldown = new Map();

async function handleDownload(url: string, output: any) {
  try {
    output.react("📥");

    const apiUrl =
      `https://azadx69x-alldl-cdi-bai.vercel.app/alldl?url=${encodeURIComponent(url)}&quality=sd`;

    const response = await axios.get(apiUrl, {
      responseType: "stream",
      timeout: 60000,
      maxContentLength: 50 * 1024 * 1024,
      maxBodyLength: 50 * 1024 * 1024,
      decompress: true,
      headers: {
        Accept: "*/*",
        Connection: "keep-alive"
      },
      httpAgent: new http.Agent({
        keepAlive: true
      }),
      httpsAgent: new https.Agent({
        keepAlive: true
      })
    });

    if (!response.data) {
      output.react("❌");
      return;
    }

    await fs.ensureDir(CACHE_DIR);

    const filePath = path.join(
      CACHE_DIR,
      `autodl_${Date.now()}.mp4`
    );

    const writer = fs.createWriteStream(filePath);

    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    await output.replyStyled(
      {
        body:
          "╭〔 📥 AUTO DOWNLOAD 〕\n" +
          "├‣ ✅ Download Complete\n" +
          "╰‣ 🤖 Christus AutoDL",
        attachment: fs.createReadStream(filePath)
      },
      style
    );

    setTimeout(async () => {
      if (await fs.pathExists(filePath)) {
        await fs.remove(filePath);
      }
    }, 10000);

    output.react("✅");

  } catch (err) {
    console.error("AutoDL Error:", err);

    output.react("❌");
  }
}

export const entry = defineEntry(async ({ args, output, event }) => {
  const input = args.join(" ");

  const match = input.match(/https?:\/\/\S+/i);

  if (!match) {
    return output.reply("❌ Veuillez fournir un lien valide.");
  }

  const url = match[0];

  if (!patterns.supported.test(url)) {
    return output.reply("❌ Plateforme non supportée.");
  }

  await handleDownload(url, output);
});

export const event = async ({ event, output }: CommandContext) => {
  if (!event.body) return;

  const match = event.body.match(/https?:\/\/\S+/i);

  if (!match) return;

  const url = match[0];

  if (!patterns.supported.test(url)) return;

  const key = `${event.senderID}`;

  const now = Date.now();

  if (cooldown.has(key)) {
    const last = cooldown.get(key);

    if (now - last < 15000) return;
  }

  cooldown.set(key, now);

  await handleDownload(url, output);
};
