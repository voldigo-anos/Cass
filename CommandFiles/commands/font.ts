import axios from "axios";
import { defineEntry } from "@cass/define";
import { UNISpectra } from "@cassidy/unispectra";

export const meta: CommandMeta = {
  name: "font",
  otherNames: ["fonts"],
  description: "Convert text into stylish fonts",
  author: "Azadx69x x Christus",
  version: "1.0.0",
  usage:
    "{prefix}font list\n{prefix}font <1-30> <text>",
  category: "Utility",
  role: 0,
  waitingTime: 5,
  icon: "🎨",
  noLevelUI: true,
};

export const style: CommandStyle = {
  title: "Font • Stylish Generator 🎨",
  titleFont: "bold",
  contentFont: "fancy",
};

export const langs = {
  en: {
    usage:
      "╭─❯ USAGE\n" +
      "│╭─❯ font list\n" +
      "│╰─❯ font <1-30> <text>\n" +
      "╰─────────────╯",

    invalid:
      "⚠️ Invalid style number.\nChoose between 1-30.",

    missingText:
      "⚠️ Please provide text to convert.",

    failed:
      "❌ Failed to generate stylish font.",

    loading:
      "🎨 Generating stylish text...",

    listLoading:
      "📜 Fetching all font styles...",
  },
};

export const entry = defineEntry(
  async ({
    args,
    output,
    langParser,
  }) => {

    const getLang =
      langParser.createGetLang(langs);

    if (!args.length) {

      output.react("⚠️");

      return output.reply(
        getLang("usage")
      );
    }

    const firstArg =
      String(args[0]).toLowerCase();

    try {

      output.react("🎨");

      if (
        firstArg === "list" ||
        firstArg === "all"
      ) {

        await output.reply(
          getLang("listLoading")
        );

        let body =
          `╭━━━━━━━━━━━━━━━╮\n` +
          `│  ALL FONT STYLES\n` +
          `├━━━━━━━━━━━━━━━┤\n`;

        const previewText =
          "Christus";

        for (
          let i = 1;
          i <= 30;
          i++
        ) {

          try {

            const res =
              await axios.get(
                "https://azadx69x.is-a.dev/api/font",
                {
                  params: {
                    text: previewText,
                    style: i,
                  },
                  timeout: 5000,
                }
              );

            const preview =
              res.data?.output ||
              previewText;

            const num =
              i
                .toString()
                .padStart(2, "0");

            body +=
              `│❯ ${num}. ${preview}\n`;

          } catch {

            const num =
              i
                .toString()
                .padStart(2, "0");

            body +=
              `│❯ ${num}. Error\n`;
          }
        }

        body +=
          `├━━━━━━━━━━━━━━━┤\n` +
          `│ font <1-30> <text>\n` +
          `╰━━━━━━━━━━━━━━━╯`;

        output.react("🪄");

        return output.reply(body);
      }

      const styleNum =
        parseInt(firstArg);

      if (
        isNaN(styleNum) ||
        styleNum < 1 ||
        styleNum > 30
      ) {

        output.react("❌");

        return output.reply(
          getLang("invalid")
        );
      }

      const text =
        args.slice(1).join(" ").trim();

      if (!text) {

        output.react("⚠️");

        return output.reply(
          getLang("missingText")
        );
      }

      const apiUrl =
        "https://azadx69x.is-a.dev/api/font";

      const res =
        await axios.get(apiUrl, {
          params: {
            text,
            style: styleNum,
          },
          timeout: 15000,
        });

      if (!res.data?.output) {
        throw new Error("No output");
      }

      output.react("🪄");

      return output.reply(
        `${UNISpectra.charm} ✨ Stylish Font\n\n${res.data.output}`
      );

    } catch (err: any) {

      console.error(
        "Font Error:",
        err?.message || err
      );

      output.react("❌");

      return output.reply(
        getLang("failed")
      );
    }
  }
);
