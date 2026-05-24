import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { defineEntry } from "@cass/define";
import { UNISpectra } from "@cassidy/unispectra";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const meta: CommandMeta = {
  name: "gem",
  author: "Kay • fixed by Christus",
  version: "2.0.0",
  description: "Generate artistic AI images",
  category: "AI",
  usage: "{prefix}{name} <prompt> [--r X:Y] [--nw]",
  role: 2,
  waitingTime: 5,
  icon: "🎨",
  noLevelUI: true,
};

export const style: CommandStyle = {
  title: "🎨 Christus • GEM AI",
  titleFont: "bold",
  contentFont: "fancy",
};

export const langs = {
  en: {
    noPrompt: "🎨 | Please provide a prompt.",
    fail: "❌ | Failed to generate image.",
  },
};

const CACHE_DIR = path.join(__dirname, "tmp");

export const entry = defineEntry(
  async ({ output, args, event, langParser }) => {

    const t = langParser.createGetLang(langs);

    if (!args.length) {
      return output.reply(t("noPrompt"));
    }

    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR);
    }

    try {

      let promptParts: string[] = [];
      let ratioArg = "1:1";
      let artisticMode = false;

      for (let i = 0; i < args.length; i++) {

        if (args[i] === "--r" && args[i + 1]) {
          ratioArg = args[i + 1];
          i++;
        }

        else if (args[i] === "--nw") {
          artisticMode = true;
        }

        else {
          promptParts.push(args[i]);
        }
      }

      const userPrompt = promptParts.join(" ").trim();

      if (!userPrompt) {
        return output.reply(t("noPrompt"));
      }

      let finalPrompt = userPrompt;

      if (artisticMode) {
        finalPrompt =
          `Sophisticated fine art photography, classical figure study, artistic lighting, gallery quality: ${userPrompt}`;
      }

      const replied =
        event.messageReply?.attachments?.[0];

      let endpoint =
        "https://gem-tw6a.onrender.com/generate";

      let payload: any = {
        prompt: finalPrompt,
        ratio: ratioArg,
        format: "jpg"
      };

      if (replied && replied.type === "photo") {

        const imgRes = await axios.get(replied.url, {
          responseType: "arraybuffer",
          timeout: 60000
        });

        const imgBase64 =
          Buffer.from(imgRes.data, "binary")
            .toString("base64");

        endpoint =
          "https://gem-tw6a.onrender.com/edit";

        payload.image = imgBase64;

        delete payload.ratio;
      }

      const loading =
        await output.reply(
          "🎨 | Generating masterpiece..."
        );

      const res = await axios.post(
        endpoint,
        payload,
        {
          responseType: "arraybuffer",
          timeout: 180000,
          headers: {
            "Content-Type": "application/json",
            Accept: "*/*",
            "User-Agent": "Mozilla/5.0"
          }
        }
      );

      const filePath = path.join(
        CACHE_DIR,
        `gem_${Date.now()}.jpg`
      );

      fs.writeFileSync(filePath, res.data);

      await output.reply({
        body:
          `${UNISpectra.charm} 🎨✨ Masterpiece created!` +
          `${artisticMode ? " [Artistic Mode]" : ""}` +
          `${replied ? "\n🖌️ Edit Mode Enabled" : ""}` +
          `${ratioArg ? `\n📐 Ratio: ${ratioArg}` : ""}`,
        attachment: fs.createReadStream(filePath)
      });

      if (loading?.messageID) {
        output.unsend(loading.messageID);
      }

      setTimeout(() => {
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch {}
      }, 15000);

    } catch (error: any) {

      console.error("GEM ERROR:", error);

      output.reply(
        `${t("fail")}\n${error.message || "Unknown error"}`
      );
    }
  }
);
