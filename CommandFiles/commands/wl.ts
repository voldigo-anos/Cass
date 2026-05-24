import { writeFileSync } from "fs-extra";

import {
  SpectralCMDHome,
  Config,
} from "@cass-modules/spectralCMDHome";

import {
  UNIRedux,
  UNISpectra,
} from "@cassidy/unispectra";

import {
  defineCommand,
  defineHome,
} from "@cass/define";

const style: CommandStyle = {
  title: "Whitelist 👑",
  titleFont: "bold",
  contentFont: "fancy",
};

function initializeConfig() {

  if (
    !global.Cassidy.config
      .whiteListMode
  ) {

    global.Cassidy.config
      .whiteListMode = {
      enable: false,
      whiteListIds: [],
    };
  }

  if (
    !global.Cassidy.config
      .whiteListMode
      .whiteListIds
  ) {

    global.Cassidy.config
      .whiteListMode
      .whiteListIds = [];
  }

  if (
    !global.Cassidy.config
      .whiteListModeThread
  ) {

    global.Cassidy.config
      .whiteListModeThread = {
      enable: false,
      whiteListThreadIds: [],
    };
  }

  if (
    !global.Cassidy.config
      .whiteListModeThread
      .whiteListThreadIds
  ) {

    global.Cassidy.config
      .whiteListModeThread
      .whiteListThreadIds = [];
  }
}

function saveConfig() {

  try {

    const configPath =
      process.cwd() +
      "/settings.json";

    writeFileSync(
      configPath,

      JSON.stringify(
        global.Cassidy.config,
        null,
        2
      )
    );

  } catch (err) {

    console.error(
      "Whitelist Save Error:",
      err
    );
  }
}

const configs: Config[] = [

  {
    key: "useradd",

    description:
      "Add users to whitelist",

    aliases: [
      "uadd",
      "ua",
    ],

    args: ["<uid>"],

    icon: "➕",

    async handler(
      {
        input,
        output,
        money,
      },

      {
        spectralArgs,
      }
    ) {

      initializeConfig();

      if (!input.isAdmin) {

        return output.replyStyled(
          {
            body:
              `${UNIRedux.arrow} ❌ Permission Denied\n\n` +
              `Only admins can manage whitelist.`,
          },

          style
        );
      }

      let uids: string[] = [];

      if (input.detectID) {

        uids.push(
          input.detectID
        );

      } else {

        uids =
          spectralArgs.filter(
            (i) =>
              !isNaN(
                Number(i)
              )
          );
      }

      if (!uids.length) {

        return output.replyStyled(
          {
            body:
              `${UNIRedux.arrow} ⚠️ Missing User ID\n\n` +
              `Reply, mention, or provide a valid UID.`,
          },

          style
        );
      }

      const added: string[] = [];
      const already: string[] = [];

      for (const uid of uids) {

        if (
          global.Cassidy.config
            .whiteListMode
            .whiteListIds
            .includes(uid)
        ) {

          already.push(uid);

        } else {

          global.Cassidy.config
            .whiteListMode
            .whiteListIds
            .push(uid);

          added.push(uid);
        }
      }

      saveConfig();

      let body =
        `${UNISpectra.charm} User Whitelist\n\n`;

      if (added.length) {

        body +=
          `✅ Added (${added.length})\n`;

        for (const uid of added) {

          const data =
            await money.getItem(uid);

          body +=
            `• ${data.name} (${uid})\n`;
        }
      }

      if (already.length) {

        body +=
          `\n⚠️ Already Whitelisted (${already.length})\n`;

        for (const uid of already) {

          const data =
            await money.getItem(uid);

          body +=
            `• ${data.name} (${uid})\n`;
        }
      }

      return output.replyStyled(
        {
          body,
        },

        style
      );
    },
  },

  {
    key: "userremove",

    description:
      "Remove users from whitelist",

    aliases: [
      "uremove",
      "ur",
    ],

    args: ["<uid>"],

    icon: "➖",

    async handler(
      {
        input,
        output,
        money,
      },

      {
        spectralArgs,
      }
    ) {

      initializeConfig();

      if (!input.isAdmin) {

        return output.replyStyled(
          {
            body:
              `${UNIRedux.arrow} ❌ Permission Denied\n\n` +
              `Only admins can manage whitelist.`,
          },

          style
        );
      }

      let uids: string[] = [];

      if (input.detectID) {

        uids.push(
          input.detectID
        );

      } else {

        uids =
          spectralArgs.filter(
            (i) =>
              !isNaN(
                Number(i)
              )
          );
      }

      if (!uids.length) {

        return output.replyStyled(
          {
            body:
              `${UNIRedux.arrow} ⚠️ Missing User ID`,
          },

          style
        );
      }

      const removed: string[] = [];
      const missing: string[] = [];

      for (const uid of uids) {

        const index =
          global.Cassidy.config
            .whiteListMode
            .whiteListIds
            .indexOf(uid);

        if (index !== -1) {

          global.Cassidy.config
            .whiteListMode
            .whiteListIds
            .splice(index, 1);

          removed.push(uid);

        } else {

          missing.push(uid);
        }
      }

      saveConfig();

      let body =
        `${UNISpectra.charm} User Whitelist\n\n`;

      if (removed.length) {

        body +=
          `✅ Removed (${removed.length})\n`;

        for (const uid of removed) {

          const data =
            await money.getItem(uid);

          body +=
            `• ${data.name} (${uid})\n`;
        }
      }

      if (missing.length) {

        body +=
          `\n⚠️ Not Found (${missing.length})\n`;

        for (const uid of missing) {

          const data =
            await money.getItem(uid);

          body +=
            `• ${data.name} (${uid})\n`;
        }
      }

      return output.replyStyled(
        {
          body,
        },

        style
      );
    },
  },

  {
    key: "userlist",

    description:
      "View whitelisted users",

    aliases: [
      "ulist",
      "ul",
    ],

    icon: "📋",

    async handler(
      {
        output,
        money,
      }
    ) {

      initializeConfig();

      const list =
        global.Cassidy.config
          .whiteListMode
          .whiteListIds;

      if (!list.length) {

        return output.replyStyled(
          {
            body:
              `${UNIRedux.arrow} 📋 Empty List\n\n` +
              `No users are whitelisted.`,
          },

          style
        );
      }

      let body =
        `${UNISpectra.charm} Whitelisted Users (${list.length})\n\n`;

      let n = 1;

      for (const uid of list) {

        const data =
          await money.getItem(uid);

        body +=
          `${n}. ${data.name}\n` +
          `(${uid})\n\n`;

        n++;
      }

      return output.replyStyled(
        {
          body,
        },

        style
      );
    },
  },

  {
    key: "useron",

    description:
      "Enable user whitelist mode",

    aliases: [
      "uon",
    ],

    icon: "✅",

    async handler({
      input,
      output,
    }) {

      initializeConfig();

      if (!input.isAdmin) {

        return output.replyStyled(
          {
            body:
              `${UNIRedux.arrow} ❌ Permission Denied`,
          },

          style
        );
      }

      global.Cassidy.config
        .whiteListMode
        .enable = true;

      saveConfig();

      return output.replyStyled(
        {
          body:
            `${UNISpectra.charm} User whitelist mode enabled.`,
        },

        style
      );
    },
  },

  {
    key: "useroff",

    description:
      "Disable user whitelist mode",

    aliases: [
      "uoff",
    ],

    icon: "❌",

    async handler({
      input,
      output,
    }) {

      initializeConfig();

      if (!input.isAdmin) {

        return output.replyStyled(
          {
            body:
              `${UNIRedux.arrow} ❌ Permission Denied`,
          },

          style
        );
      }

      global.Cassidy.config
        .whiteListMode
        .enable = false;

      saveConfig();

      return output.replyStyled(
        {
          body:
            `${UNISpectra.charm} User whitelist mode disabled.`,
        },

        style
      );
    },
  },

  {
    key: "threadadd",

    description:
      "Add thread to whitelist",

    aliases: [
      "tadd",
      "ta",
    ],

    icon: "➕",

    args: ["<threadID>"],

    async handler(
      {
        input,
        output,
      },

      {
        spectralArgs,
      }
    ) {

      initializeConfig();

      if (!input.isAdmin) {

        return output.replyStyled(
          {
            body:
              `${UNIRedux.arrow} ❌ Permission Denied`,
          },

          style
        );
      }

      const threadID =
        spectralArgs[0] ||
        input.threadID;

      if (
        global.Cassidy.config
          .whiteListModeThread
          .whiteListThreadIds
          .includes(threadID)
      ) {

        return output.replyStyled(
          {
            body:
              `${UNIRedux.arrow} ⚠️ Thread already whitelisted.`,
          },

          style
        );
      }

      global.Cassidy.config
        .whiteListModeThread
        .whiteListThreadIds
        .push(threadID);

      saveConfig();

      return output.replyStyled(
        {
          body:
            `${UNISpectra.charm} Added thread (${threadID}) to whitelist.`,
        },

        style
      );
    },
  },

  {
    key: "threadremove",

    description:
      "Remove thread from whitelist",

    aliases: [
      "tremove",
      "tr",
    ],

    icon: "➖",

    args: ["<threadID>"],

    async handler(
      {
        input,
        output,
      },

      {
        spectralArgs,
      }
    ) {

      initializeConfig();

      if (!input.isAdmin) {

        return output.replyStyled(
          {
            body:
              `${UNIRedux.arrow} ❌ Permission Denied`,
          },

          style
        );
      }

      const threadID =
        spectralArgs[0] ||
        input.threadID;

      const index =
        global.Cassidy.config
          .whiteListModeThread
          .whiteListThreadIds
          .indexOf(threadID);

      if (index === -1) {

        return output.replyStyled(
          {
            body:
              `${UNIRedux.arrow} ⚠️ Thread not found.`,
          },

          style
        );
      }

      global.Cassidy.config
        .whiteListModeThread
        .whiteListThreadIds
        .splice(index, 1);

      saveConfig();

      return output.replyStyled(
        {
          body:
            `${UNISpectra.charm} Removed thread (${threadID}) from whitelist.`,
        },

        style
      );
    },
  },

  {
    key: "status",

    description:
      "View whitelist status",

    aliases: [
      "info",
    ],

    icon: "📊",

    async handler({
      output,
    }) {

      initializeConfig();

      const userWL =
        global.Cassidy.config
          .whiteListMode;

      const threadWL =
        global.Cassidy.config
          .whiteListModeThread;

      const body =
        `${UNISpectra.charm} WHITELIST STATUS\n\n` +

        `👤 User Whitelist: ${
          userWL.enable
            ? "ON"
            : "OFF"
        }\n` +

        `• Total Users: ${
          userWL
            .whiteListIds
            .length
        }\n\n` +

        `💬 Thread Whitelist: ${
          threadWL.enable
            ? "ON"
            : "OFF"
        }\n` +

        `• Total Threads: ${
          threadWL
            .whiteListThreadIds
            .length
        }`;

      return output.replyStyled(
        {
          body,
        },

        style
      );
    },
  },
];

const home =
  new SpectralCMDHome(
    {
      isHypen: false,
    },

    configs
  );

const command =
  defineCommand({
    meta: {
      name: "whitelist",

      description:
        "Manage bot whitelist system",

      otherNames: [
        "wl",
      ],

      version: "3.0.0",

      usage:
        "{prefix}whitelist <subcommand>",

      category: "Owner",

      author: "Christus dev AI",

      role: 2,

      waitingTime: 5,

      icon: "👑",
    },

    style,

    entry:
      defineHome(home),
  });

export default command;
