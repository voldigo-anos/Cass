import axios from "axios";
import { defineEntry } from "@cass/define";

const baseApi = async () => {
  const res = await axios.get(
    "https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json",
    { timeout: 10000 }
  );
  return res.data.mahmud;
};

export const meta: CommandMeta = {
  name: "cdp",
  description: "Envoie une image aléatoire de couple DP",
  author: "Christus dev AI",
  version: "1.7.0",
  category: "love",
  usage: "{prefix}cdp",
  role: 0,
  waitingTime: 5,
  icon: "💑",
};

export const entry = defineEntry(async ({ output, args }) => {
  await output.react("⏳");

  try {
    const baseURL = await baseApi();

    if (args[0] === "list") {
      const listRes = await axios.get(`${baseURL}/api/cdp/list`, {
        timeout: 15000
      });

      const total = listRes.data?.total ?? "N/A";

      await output.react("📊");
      return output.reply(`🎀 Total Couple DPs: ${total}`);
    }

    const res = await axios.get(`${baseURL}/api/cdp`, {
      timeout: 15000
    });

    const boy = res.data?.boy;
    const girl = res.data?.girl;

    if (!boy || !girl) {
      await output.react("❌");
      return output.reply("❌ No Couple DP found.");
    }

    const [boyStream, girlStream] = await Promise.all([
      global.utils.getStreamFromURL(boy),
      global.utils.getStreamFromURL(girl),
    ]);

    await output.react("✅");

    return output.reply({
      body: "✨ Voici ton couple DP !",
      attachment: [boyStream, girlStream],
    });

  } catch (err) {
    console.error("CDP ERROR:", err);
    await output.react("❌");
    return output.reply("❌ Failed to fetch Couple DP.");
  }
});
