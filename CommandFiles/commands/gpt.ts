import axios from "axios";
import { StrictOutputForm } from "output-cassidy";
import path from "path";
import fs from "fs/promises";
import { randomUUID } from "crypto";

const cmd = easyCMD({
  name: "gpt",
  meta: {
    otherNames: [],
    author: "From Haji Mix REST API, handled by Liane Cagara • API migrated by Christus",
    description:
      "Versatile AI assistant powered by GPT-4o via christus-s-apis.",
    icon: "🤖",
    version: "2.0.0",
    noPrefix: "both",
  },
  category: "AI",
  title: {
    content: "GPT-4O FREE 🖼️🎓",
    text_font: "bold",
    line_bottom: "default",
  },
  content: {
    content: null,
    text_font: "none",
    line_bottom: "hidden",
  },
  run(ctx) {
    return main(ctx);
  },
});

const API_URL = "https://christus-s-apis.vercel.app/api/prexzy/ai/askgpt5";
const TIMEOUT_MS = 60_000;
const MAX_INPUT = 2_000;
const TMP_DIR = path.join(process.cwd(), "temp");
const MODEL = "gpt-4o";

export interface ApiResponse {
  answer?: string;
  response?: string;
  reply?: string;
  message?: string;
  text?: string;
  result?: string;
  content?: string;
  images?: { description?: string; url?: string }[];
}

function extractReply(data: ApiResponse | string | null | undefined): string {
  if (!data) return "";
  if (typeof data === "string") return data.trim();
  const keys = ["answer", "response", "reply", "message", "text", "result", "content"] as const;
  for (const key of keys) {
    const v = (data as any)[key];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (v && typeof v === "object" && typeof v.content === "string" && v.content.trim()) {
      return v.content.trim();
    }
  }
  return "";
}

async function main(ctx: CommandContext) {
  const { output, args, commandName, prefix, input, cancelCooldown, usersDB } = ctx;

  let ask = args.join(" ").trim();
  await output.reaction("🟡");

  if (!ask) {
    cancelCooldown();
    await output.reaction("🔴");
    return output.reply(
      `🔎 Please provide a question for **gpt**.\n\n***Example*** ${prefix}${commandName} what is tralalero tralala?`
    );
  }

  if (ask.length > MAX_INPUT) {
    cancelCooldown();
    await output.reaction("🔴");
    return output.reply(`⚠️ Message too long (max ${MAX_INPUT} chars).`);
  }

  try {
    const user = await usersDB.getUserInfo(input.sid);
    const userGame = await usersDB.getCache(input.sid);
    const displayName = user?.name ?? userGame?.name;
    const balance = Number(userGame?.money);

    if (displayName) {
      const balanceStr = Number.isFinite(balance) ? balance.toLocaleString() : "unknown";
      const tone =
        Number.isFinite(balance) && balance > 500_000_000
          ? "wealthy, treat respectfully"
          : "humble, treat neutrally";
      ask = `[User Context]\nName: ${displayName}\nBalance: ${balanceStr}\nTone: ${tone}\n\n[User Question]\n${ask}`;
    }

    if (input.replier?.body) {
      ask += `\n\n[Replied Message]\n${input.replier.body}`;
    }

    let mediaUrl = "";
    const attachments = input.replier?.attachmentUrls ?? [];
    const photoUrl = attachments.find((u: string) =>
      /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(u)
    );
    if (photoUrl) mediaUrl = photoUrl;

    output.setStyle(cmd.style);

    const params = new URLSearchParams({
      prompt: ask,
      state: `${input.sid}_gpt`,
      model: MODEL,
      web_search: "true",
    });
    if (mediaUrl) params.append("media", mediaUrl);

    const httpRes = await axios.get(`${API_URL}?${params.toString()}`, {
      timeout: TIMEOUT_MS,
      maxContentLength: 10 * 1024 * 1024,
    });

    const data: ApiResponse = httpRes.data;
    const answerText = extractReply(data);

    if (!answerText) {
      console.error("GPT API - empty response:", JSON.stringify(data));
      await output.reaction("🔴");
      return output.reply("❌ The AI returned an empty response.");
    }

    const form: StrictOutputForm = { body: answerText };

    const firstImage = Array.isArray(data?.images)
      ? data.images.find((i) => typeof i?.url === "string")
      : undefined;

    let tmpFile: string | null = null;

    if (firstImage) {
      try {
        if (firstImage.description) {
          form.body = `${firstImage.description}\n\n${form.body}`;
        }
        await fs.mkdir(TMP_DIR, { recursive: true });
        tmpFile = path.join(TMP_DIR, `gpt-gen_${randomUUID()}.png`);
        const imgRes = await axios.get(firstImage.url!, {
          responseType: "arraybuffer",
          timeout: TIMEOUT_MS,
          maxContentLength: 20 * 1024 * 1024,
        });
        await fs.writeFile(tmpFile, Buffer.from(imgRes.data));
        form.attachment = tmpFile;
      } catch (imgErr) {
        console.error("GPT image error:", imgErr);
      }
    }

    form.body += `\n\n***You can reply to this conversation.***`;

    await output.reaction("🟢");
    const info = await output.reply(form);

    if (tmpFile) {
      try { await fs.unlink(tmpFile); } catch {}
    }

    info.atReply(async (rep) => {
      try {
        rep.output.setStyle(cmd.style);
        await main({ ...rep, args: rep.input.words });
      } catch (e) {
        console.error("GPT reply error:", e);
      }
    });
  } catch (e: any) {
    console.error("GPT main error:", e?.response?.data ?? e?.message);
    await output.reaction("🔴");
    await output.reply("❌ An error occurred. Please try again.");
  }
}

export default cmd;
