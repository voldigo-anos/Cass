import axios, { AxiosResponse } from "axios";
import { StrictOutputForm } from "output-cassidy";

interface GPTResponse {
  response: string;
}

async function baseApiUrl(): Promise<string> {
  const base = await axios.get(
    "https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json",
    {
      timeout: 15000
    }
  );

  return base.data.mahmud;
}

const cmd = easyCMD({
  name: "gpt",

  meta: {
    otherNames: ["chatgpt", "gpt4"],
    author: "Christus dev AI",
    description: "Chat with GPT AI",
    icon: "🤖",
    version: "2.0.0",
    noPrefix: "both",
  },

  title: {
    content: "ChatGPT 🤖",
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

const langs = {
  en: {
    noInput:
      "❓ Please provide a prompt.",
    fail:
      "❌ Failed to connect to GPT API.",
  },
};

async function main({
  output,
  args,
  cancelCooldown,
}: CommandContext) {

  const prompt =
    args.join(" ").trim();

  await output.reaction("⏳");

  if (!prompt) {

    cancelCooldown();

    await output.reaction("❌");

    return output.reply(
      langs.en.noInput
    );
  }

  try {

    const baseUrl =
      await baseApiUrl();

    const res: AxiosResponse<GPTResponse> =
      await axios.get(
        `${baseUrl}/api/ai`,
        {
          params: {
            prompt,
            ai: "gpt"
          },
          timeout: 30000,
          headers: {
            Accept: "application/json",
            "User-Agent": "Mozilla/5.0"
          }
        }
      );

    const replyText =
      res.data?.response ||
      "No response received.";

    const form: StrictOutputForm = {
      body:
        `🤖 **ChatGPT AI**\n\n` +
        `${replyText}\n\n` +
        `💬 Reply to continue chatting.`,
    };

    await output.reaction("✅");

    const info =
      await output.reply(form);

    info.atReply((rep) => {

      rep.output.setStyle(cmd.style);

      main({
        ...rep,
        args: rep.input.words,
      });
    });

  } catch (err: any) {

    console.error(
      "GPT API Error:",
      err?.message || err
    );

    cancelCooldown();

    await output.reaction("❌");

    return output.reply(
      `${langs.en.fail}\n\n` +
      `📝 ${err?.message || "Unknown error"}`
    );
  }
}

export default cmd;
