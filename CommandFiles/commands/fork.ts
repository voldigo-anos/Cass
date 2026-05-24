// CommandFiles/commands/fork.ts

import { defineEntry } from "@cass/define";

/* ================= META ================= */

export const meta: CommandMeta = {
  name: "fork",
  otherNames: ["repo", "source"],
  author: "Christus Dev AI",
  version: "1.0.0",
  description: "Returns the link to the updated fork of the bot",
  category: "System",
  usage: "{prefix}{name}",
  role: 0,
  waitingTime: 3,
  icon: "🔗",
  noLevelUI: true,
};

/* ================= STYLE ================= */

export const style: CommandStyle = {
  title: "Cassidybot • Fork 🔗",
  titleFont: "bold",
  contentFont: "fancy",
};

/* ================= LANGS ================= */

export const langs = {
  en: {
    message:
      "https://github.com/lianecagara/CassieahBoT.git\n\n" +
      "Cassieah is the first ever all-around (Personal Fb bot, Page Bot, Discord Bot, Web Bot) chatbot with the best Typescript Tooling and Rich Libraries. " +
      "Cassieah is also a fork of CassidySpectra which is a revamped version of CassidyBoT with enhanced features and improved performance, created and well-maintained by lianecagara.",
  },
};

/* ================= ENTRY ================= */

export const entry = defineEntry(async ({ output, langParser }) => {
  const t = langParser.createGetLang(langs);
  await output.reply(t("message"));
});
