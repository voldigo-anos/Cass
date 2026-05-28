import axios from "axios";
import { UNIRedux, UNISpectra } from "@cassidy/unispectra";
import { defineCommand, defineEntry } from "@cass/define";

const PINTEREST_API = "https://egret-driving-cattle.ngrok-free.app/api/pin";
const IMAGES_PER_PAGE = 6;
const MAX_DIRECT = 50;
const BATCH_SIZE = 10;
const BATCH_DELAY = 1000;

async function fetchStreams(urls: string[]): Promise<any[]> {
  const results = await Promise.all(
    urls.map((url) =>
      global.utils.getStreamFromURL(url, "image.jpg").catch(() => null)
    )
  );
  return results.filter(Boolean);
}

async function fetchStreamsBatch(urls: string[]): Promise<any[]> {
  const results = [];
  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    const batch = urls.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map((url) =>
        global.utils.getStreamFromURL(url, "image.jpg").catch(() => null)
      )
    );
    results.push(...batchResults.filter(Boolean));
    
    if (i + BATCH_SIZE < urls.length) {
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
    }
  }
  return results;
}

function buildPageHeader(
  query: string,
  page: number,
  totalPages: number,
  total: number,
  startNum: number,
  endNum: number
): string {
  return (
    `${UNIRedux.charm} **Pinterest** 📌\n\n` +
    `${UNISpectra.arrow} Query: **${query}**\n` +
    `${UNISpectra.arrowFromT} **${total}** images found · Page **${page}/${totalPages}**\n` +
    `${UNISpectra.arrowFromT} Showing images **#${startNum}** to **#${endNum}**\n\n` +
    `${UNISpectra.arrow} Reply with a **number** to download that image\n` +
    `${UNISpectra.arrowFromT} Reply \`next\` for the next page · \`prev\` for previous`
  );
}

const command = defineCommand({
  meta: {
    name: "pinterest",
    otherNames: ["pin", "pint"],
    description: "Search and browse Pinterest images",
    version: "1.0.0",
    author: "Christus",
    category: "Image",
    usage:
      "{prefix}{name} <query> — interactive browser\n" +
      "{prefix}{name} <query> -<count> — send images directly (max 50)",
    role: 0,
    noPrefix: false,
    waitingTime: 10,
    requirement: "3.0.0",
    icon: "📌",
  },
  style: {
    title: "📌 Pinterest",
    titleFont: "bold",
    contentFont: "fancy",
  },

  entry: defineEntry(async (ctx) => {
    const { input, output } = ctx;

    const rawArgs = [...(input.arguments ?? [])];

    let directCount: number | null = null;
    const countArgIdx = rawArgs.findIndex((a) => /^-\d+$/.test(a));
    if (countArgIdx !== -1) {
      directCount = Math.min(parseInt(rawArgs[countArgIdx].slice(1)), MAX_DIRECT);
      rawArgs.splice(countArgIdx, 1);
    }

    const query = rawArgs.join(" ").trim();
    if (!query) {
      return output.replyStyled(
        {
          body:
            `${UNIRedux.arrow} **Usage** ⚠️\n\n` +
            `${UNISpectra.arrow} \`pinterest <query>\` — interactive browser\n` +
            `${UNISpectra.arrowFromT} \`pinterest <query> -50\` — send 50 images directly`,
        },
        style
      );
    }

    const loading = await output.replyStyled(
      { body: `${UNIRedux.charm} **Pinterest** 🔍\n\n⏳ Searching for **${query}**...` },
      style
    );

    let allUrls: string[] = [];
    try {
      const res = await axios.get(PINTEREST_API, {
        params: { query, num: 90 },
        timeout: 15_000,
      });
      allUrls = (res.data?.results as string[]) ?? [];
    } catch (err) {
      await output.unsend(loading.messageID);
      return output.replyStyled(
        {
          body:
            `${UNIRedux.arrow} **API Error** ❌\n\n` +
            `Could not reach the Pinterest API. Please try again later.`,
        },
        style
      );
    }

    await output.unsend(loading.messageID);

    if (allUrls.length === 0) {
      return output.replyStyled(
        {
          body:
            `${UNIRedux.arrow} **No Results** 📭\n\n` +
            `No images found for **${query}**.`,
        },
        style
      );
    }

    if (directCount !== null) {
      const urls = allUrls.slice(0, directCount);
      const loadingDirect = await output.replyStyled(
        { body: `${UNIRedux.charm} **Pinterest** 📌\n\n⏳ Loading ${urls.length} image(s) in batches...\n⚠️ This may take up to 30 seconds...` },
        style
      );
      const streams = await fetchStreamsBatch(urls);
      await output.unsend(loadingDirect.messageID);

      if (streams.length === 0) {
        return output.replyStyled(
          { body: `${UNIRedux.arrow} **Error** ❌\n\nCould not load any images. Please try again.` },
          style
        );
      }

      return output.reply({
        body:
          `📌 **${streams.length}** image(s) for **"${query}"**\n` +
          `${UNISpectra.arrowFromT} Use \`pinterest ${query}\` for the interactive browser.`,
        attachment: streams,
      });
    }

    const totalPages = Math.ceil(allUrls.length / IMAGES_PER_PAGE);

    const sendPage = async (
      page: number,
      replyFn: (opts: any) => Promise<any>
    ) => {
      const startIdx = (page - 1) * IMAGES_PER_PAGE;
      const endIdx = Math.min(startIdx + IMAGES_PER_PAGE, allUrls.length);
      const pageUrls = allUrls.slice(startIdx, endIdx);

      const loadingPage = await replyFn({
        body: `⏳ Loading page ${page}/${totalPages}...`,
      });

      const streams = await fetchStreams(pageUrls);
      await output.unsend(loadingPage.messageID).catch(() => {});

      if (streams.length === 0) {
        return replyFn({
          body:
            `${UNIRedux.arrow} **Page ${page} Error** ❌\n\n` +
            `Could not load images for this page. Try \`next\`.`,
        });
      }

      const header = buildPageHeader(
        query,
        page,
        totalPages,
        allUrls.length,
        startIdx + 1,
        startIdx + streams.length
      );

      return replyFn({ body: header, attachment: streams });
    };

    const firstPageMsg = await sendPage(1, (opts) =>
      output.reply(opts)
    );

    const registerReply = (
      msg: any,
      currentPage: number,
      startIdx: number,
      pageLength: number
    ) => {
      msg.atReply(async (replyCtx: any) => {
        if (replyCtx.input.senderID !== input.senderID) return;

        const body = (replyCtx.input.body ?? "").trim().toLowerCase();

        if (body === "next") {
          if (currentPage >= totalPages) {
            return replyCtx.output.replyStyled(
              {
                body:
                  `${UNIRedux.arrow} **Last Page** ⚠️\n\n` +
                  `You are already on the last page (${totalPages}).`,
              },
              style
            );
          }
          const nextPage = currentPage + 1;
          const nextMsg = await sendPage(nextPage, (opts) =>
            replyCtx.output.reply(opts)
          );
          const nextStart = (nextPage - 1) * IMAGES_PER_PAGE;
          const nextEnd = Math.min(nextStart + IMAGES_PER_PAGE, allUrls.length);
          registerReply(nextMsg, nextPage, nextStart, nextEnd - nextStart);
          return;
        }

        if (body === "prev" || body === "previous" || body === "back") {
          if (currentPage <= 1) {
            return replyCtx.output.replyStyled(
              {
                body:
                  `${UNIRedux.arrow} **First Page** ⚠️\n\n` +
                  `You are already on the first page.`,
              },
              style
            );
          }
          const prevPage = currentPage - 1;
          const prevMsg = await sendPage(prevPage, (opts) =>
            replyCtx.output.reply(opts)
          );
          const prevStart = (prevPage - 1) * IMAGES_PER_PAGE;
          const prevEnd = Math.min(prevStart + IMAGES_PER_PAGE, allUrls.length);
          registerReply(prevMsg, prevPage, prevStart, prevEnd - prevStart);
          return;
        }

        const num = parseInt(body);
        if (!isNaN(num) && num >= 1 && num <= allUrls.length) {
          const targetUrl = allUrls[num - 1];
          const loadingImg = await replyCtx.output.replyStyled(
            { body: `⏳ Loading image **#${num}**...` },
            style
          );
          const stream = await global.utils
            .getStreamFromURL(targetUrl, "image.jpg")
            .catch(() => null);
          await output.unsend(loadingImg.messageID).catch(() => {});

          if (!stream) {
            return replyCtx.output.replyStyled(
              {
                body:
                  `${UNIRedux.arrow} **Download Error** ❌\n\n` +
                  `Could not load image **#${num}**. Please try another.`,
              },
              style
            );
          }

          return replyCtx.output.reply({
            body: `📌 Image **#${num}** for **"${query}"**`,
            attachment: stream,
          });
        }

        const pageNum = parseInt(body.replace("page", "").trim());
        if (!isNaN(pageNum) && body.startsWith("page")) {
          if (pageNum < 1 || pageNum > totalPages) {
            return replyCtx.output.replyStyled(
              {
                body:
                  `${UNIRedux.arrow} **Invalid Page** ⚠️\n\n` +
                  `Please enter a page between **1** and **${totalPages}**.`,
              },
              style
            );
          }
          const jumpMsg = await sendPage(pageNum, (opts) =>
            replyCtx.output.reply(opts)
          );
          const jumpStart = (pageNum - 1) * IMAGES_PER_PAGE;
          const jumpEnd = Math.min(jumpStart + IMAGES_PER_PAGE, allUrls.length);
          registerReply(jumpMsg, pageNum, jumpStart, jumpEnd - jumpStart);
          return;
        }

        return replyCtx.output.replyStyled(
          {
            body:
              `${UNIRedux.arrow} **Invalid Input** ⚠️\n\n` +
              `${UNISpectra.arrow} Reply with a **number** (1–${allUrls.length}) to download\n` +
              `${UNISpectra.arrowFromT} \`next\` / \`prev\` to browse pages\n` +
              `${UNISpectra.arrowFromT} \`page <n>\` to jump to a specific page`,
          },
          style
        );
      });
    };

    const firstStart = 0;
    const firstEnd = Math.min(IMAGES_PER_PAGE, allUrls.length);
    registerReply(firstPageMsg, 1, firstStart, firstEnd - firstStart);
  }),
});

const style = command.style;

export default command;
