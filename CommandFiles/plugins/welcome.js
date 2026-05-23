// @ts-check
import { formatTimeSentenceV2 } from "@cass-modules/ArielUtils";
import { UNIRedux } from "@cassidy/unispectra";
import axios from "axios";

export const meta = {
  name: "welcome",
  author: "Christus",
  version: "4.0.0",
  description: "Souhaite la bienvenue aux nouveaux membres avec une image personnalisée.",
  supported: "^4.0.0",
  order: 10,
  type: "plugin",
  after: ["input", "output"],
};

/**
 * @param {CommandContext} obj
 */
export async function use(obj) {
  const { event, api, output } = obj;

  // Vérifie si le message est un ajout de membre
  if (event.logMessageType !== "log:subscribe") {
    return obj.next();
  }

  const { threadID, logMessageData } = event;
  const newUsers = logMessageData.addedParticipants;
  const botID = api.getCurrentUserID();

  // Ne rien faire si c'est le bot lui-même qui rejoint
  if (newUsers.some((u) => u.userFbId === botID)) {
    return obj.next();
  }

  try {
    const threadInfo = await api.getThreadInfo(threadID);
    const groupName = threadInfo.threadName || "ce groupe";
    const memberCount = threadInfo.participantIDs.length;

    for (const user of newUsers) {
      const userId = user.userFbId;
      const fullName = user.fullName;

      // Formatage de la date ( Dhaka comme dans l'original )
      const timeStr = new Date().toLocaleString("en-BD", {
        timeZone: "Asia/Dhaka",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        weekday: "long",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour12: true,
      });

      // Appel de l'API de bienvenue
      const apiUrl = `https://xsaim8x-xxx-api.onrender.com/api/welcome?name=${encodeURIComponent(
        fullName
      )}&uid=${userId}&threadname=${encodeURIComponent(groupName)}&members=${memberCount}`;

      const response = await axios.get(apiUrl, { responseType: "stream" });

      await output.replyStyled(
        {
          body: `‎𝐇𝐞𝐥𝐥𝐨 ${fullName}\n𝐖𝐞𝐥𝐜𝐨𝐦𝐞 𝐭𝐨 ${groupName}\n𝐘𝐨𝐮'𝐫𝐞 𝐭𝐡𝐞 ${memberCount} 𝐦𝐞𝐦𝐛𝐞𝐫 𝐨𝐧 𝐭𝐡𝐢𝐬 group, 𝐩𝐥𝐞𝐚𝐬𝐞 𝐞𝐧𝐣𝐨𝐲 🎉\n${UNIRedux.standardLine}\n📅 ${timeStr}`,
          attachment: response.data,
          mentions: [{ tag: fullName, id: userId }],
        },
        {
          title: "WELCOME MESSAGE",
          titleFont: "none",
          contentFont: "none",
        }
      );
    }
  } catch (err) {
    console.error("❌ Error in welcome plugin:", err);
  }

  return obj.next();
          }
