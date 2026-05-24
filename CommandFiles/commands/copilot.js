import axios from "axios";

const config = {
  name: "copilot",
  version: "1.0.0",
  permissions: [0],
  noPrefix: "both",
  credits: "Christus",
  description: "Chat with AI Copilot",
  category: "AI",
  usages: "[message]",
  cooldown: 3,
};

const style = {
  titleFont: "bold",
  title: "🤖 AI Copilot",
  contentFont: "fancy",
};

async function onCall({ message, args }) {
  const text = args.join(" ");

  if (!text) {
    return message.reply(
      "Please provide a message to talk with Copilot."
    );
  }

  try {
    const api = `https://christus-api.vercel.app/ai/copilot?message=${encodeURIComponent(
      text
    )}&model=default`;

    const res = await axios.get(api);

    if (!res.data.answer) {
      return message.reply("No response received from API.");
    }

    message.reply(res.data.answer);
  } catch (e) {
    message.reply(
      `An error occurred while fetching data: ${e.message}\nPlease contact admin of bot for assistance.`
    );
  }
}

export default {
  config,
  onCall,
  style,
};
