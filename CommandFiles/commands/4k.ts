import axios from "axios";
import fs from "fs";
import path from "path";
import { defineEntry } from "@cass/define";
import { UNISpectra } from "@cassidy/unispectra";

export const meta: CommandMeta = {
  name: "4k",
  description: "Upscale images to 4K quality",
  author: "Christus dev AI",
  version: "1.0.0",
  usage: "{prefix}4k <image_url> or reply to an image",
  category: "Image Generator",
  role: 0,
  waitingTime: 5,
  icon: "🖼️",
  noLevelUI: true,
};

export const style: CommandStyle = {
  title: "4K • Image Upscaler 🖼️",
  titleFont: "bold",
  contentFont: "fancy",
};

export const langs = {
  en: {
    noImage:
      "❌ Please reply to an image or provide an image URL.",

    processing:
      "😺 Boss - 4K Processing...\n⏳ Please Wait...",

    success:
      "✅ Image Upscaled To 4K Successfully!",

    failed:
      "❌ 4K Upscale Failed. Try Again.",

    saveFailed:
      "❌ Failed To Save Image.",
  },
};

export const entry = defineEntry(
  async ({
    args,
    output,
    input,
    langParser,
  }) => {

    const getLang =
      langParser.createGetLang(langs);

    let processingMessage: any;

    try {

      let imageURL:
        string | undefined;

      const repliedImage =
        input.replier?.attachments?.[0];

      if (
        repliedImage?.url
      ) {

        imageURL =
          repliedImage.url;

      } else if (
        args[0] &&
        args[0].startsWith(
          "http"
        )
      ) {

        imageURL =
          args[0];
      }

      if (!imageURL) {

        output.react("❌");

        return output.reply(
          getLang("noImage")
        );
      }

      output.react("⏳");

      processingMessage =
        await output.reply(
          getLang("processing")
        );

      const apiURL =
        `https://azadx69x-4k-apis.vercel.app/api/4k?imgUrl=${encodeURIComponent(imageURL)}`;

      const response =
        await axios.get(
          apiURL,
          {
            timeout: 60000,
          }
        );

      if (
        response.data.status !==
          "success" ||
        !response.data
          .upscaledImage
      ) {

        throw new Error(
          "Upscale failed"
        );
      }

      const upscaleURL =
        response.data
          .upscaledImage;

      const imageResponse =
        await axios({
          method: "GET",
          url: upscaleURL,
          responseType:
            "stream",
          timeout: 30000,
        });

      const cacheFolder =
        path.join(
          process.cwd(),
          "CommandFiles",
          "cache"
        );

      if (
        !fs.existsSync(
          cacheFolder
        )
      ) {

        fs.mkdirSync(
          cacheFolder,
          {
            recursive: true,
          }
        );
      }

      const filePath =
        path.join(
          cacheFolder,
          `upscaled_${Date.now()}.jpg`
        );

      const writer =
        fs.createWriteStream(
          filePath
        );

      imageResponse.data.pipe(
        writer
      );

      await new Promise(
        (
          resolve,
          reject
        ) => {

          writer.on(
            "finish",
            resolve
          );

          writer.on(
            "error",
            reject
          );
        }
      );

      if (
        processingMessage
          ?.messageID
      ) {

        await output.unsend(
          processingMessage
            .messageID
        );
      }

      await output.replyStyled(
        {
          body:
            `${UNISpectra.charm} ${getLang("success")}`,

          attachment:
            fs.createReadStream(
              filePath
            ),
        },

        style
      );

      output.react("✅");

      fs.unlink(
        filePath,
        () => {}
      );

    } catch (err: any) {

      console.error(
        "4K Error:",
        err?.message || err
      );

      output.react("❌");

      if (
        processingMessage
          ?.messageID
      ) {

        await output.unsend(
          processingMessage
            .messageID
        );
      }

      return output.reply(
        `${getLang("failed")}\n\n📝 ${
          err?.message || "Unknown error"
        }`
      );
    }
  }
);
