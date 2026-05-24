// @ts-check
import { formatTimeSentenceV2 } from "@cass-modules/ArielUtils";
import { UNIRedux } from "@cassidy/unispectra";

export const meta = {
  name: "prefix",
  author: "Christus",
  version: "4.0.0",
  description: "Affiche le préfixe du bot.",
  supported: "^4.0.0",
  order: 4,
  type: "plugin",
  after: ["input", "output"],
};

const REPLY_TEXT = (prefix, prefixes) =>
  `🐄 𝗖𝗵𝗿𝗶𝘀𝘁𝘂𝘀𝗕𝗼𝘁 𝗧𝗲𝗰𝗵𝗻𝗼𝗹𝗼𝗴𝗶𝗲𝘀\n🔥 𝗣𝗿𝗶𝗺𝗮𝗿𝘆 𝗣𝗿𝗲𝗳𝗶𝘅: [ ${prefix} ]  \n🔑 𝗔𝗹𝘁𝗲𝗿𝗻𝗮𝘁𝗲 𝗣𝗿𝗲𝗳𝗶𝘅𝗲𝘀: [ ${[...prefixes].slice(1).join(", ")} ]  \n━━━━━━━━━━━━━━━\n📖 𝗡𝗮𝘃𝗶𝗴𝗮𝘁𝗶𝗼𝗻  \n• ${prefix}𝗵𝗲𝗹𝗽 → ChristusBot Manual  \n• ${prefix}𝘀𝘁𝗮𝗿𝘁 → Command Directory  \n• ${prefix}𝗦𝘂𝗽𝗽𝗼𝗿𝘁 → Join the Support Group\n━━━━━━━━━━━━━━━  \n🐄 𝗖𝗵𝗿𝗶𝘀𝘁𝘂𝘀𝗕𝗼𝘁 𝗧𝗲𝗰𝗵𝗻𝗼𝗹𝗼𝗴𝗶𝗲𝘀 interface standing by. Issue a command to proceed. 🌠`;

/**
 *
 * @param {CommandContext} obj
 * @returns
 */
export async function use(obj) {
  const { input, output, prefix, prefixes } = obj;

  // Mots qui déclenchent la réponse avec photo
  const motsAvecPhoto = ["prefix", "cassidy", "cassieah", "ieah", "zeah"];
  const estMotPrefix = motsAvecPhoto.some(
    (w) => `${w}`.toLowerCase() === input.toLowerCase()
  );
  const estPrefixSeul = input.text.trim() === prefix;

  // Si aucune des deux conditions, on passe au plugin suivant
  if (!estMotPrefix && !estPrefixSeul) {
    return obj.next();
  }

  // Préfixe seul (ex: taper "+") → texte simple, sans photo
  if (estPrefixSeul && !estMotPrefix) {
    return output.reply(REPLY_TEXT(prefix, prefixes));
  }

  // Mot "prefix" (ou cassidy, ieah, etc.) → texte + photo canvas
  const canv = new CanvCass(CanvCass.preW, CanvCass.preH / 1.7);
  await canv.drawBackground();

  const container = CanvCass.createRect({
    top: canv.top + 50,
    centerX: canv.centerX,
    height: 260,
    width: canv.width,
  });

  canv.drawBox({
    rect: container,
    fill: "rgba(0, 0, 0, 0.5)",
  });

  const margin = 100;
  const ymargin = 20;

  canv.drawText(`🏂 Christus BoT`, {
    fontType: "cbold",
    size: 65,
    x: container.left + margin,
    y: container.top + ymargin,
    vAlign: "bottom",
    align: "left",
    fill: "white",
  });
  canv.drawText(`v${global.package.version}`, {
    fontType: "cbold",
    size: 50,
    x: container.right - margin,
    y: container.top + ymargin,
    vAlign: "bottom",
    align: "right",
    fill: "rgba(255, 255, 255, 0.7)",
  });

  canv.drawText(`Préfixes:`, {
    fontType: "cbold",
    size: 50,
    x: container.left + margin,
    y: container.bottom - ymargin,
    vAlign: "top",
    align: "left",
    fill: "rgba(255, 255, 255, 0.7)",
  });

  canv.drawText(`Temps actif:`, {
    fontType: "cbold",
    size: 50,
    x: container.left + margin,
    y: container.bottom - ymargin - 50 - ymargin,
    vAlign: "top",
    align: "left",
    fill: "rgba(255, 255, 255, 0.7)",
  });

  const offsetx = container.width / 4;
  canv.drawText(`[ ${[...prefixes].join(", ")} ]`, {
    fontType: "cbold",
    size: 50,
    x: container.left + margin + offsetx,
    y: container.bottom - ymargin,
    vAlign: "top",
    align: "left",
    fill: "rgba(255, 255, 255, 0.9)",
  });

  canv.drawText(`${formatTimeSentenceV2(Cassidy.uptime, { abbr: true })}`, {
    fontType: "cbold",
    size: 50,
    x: container.left + margin + offsetx,
    y: container.bottom - ymargin - 50 - ymargin,
    vAlign: "top",
    align: "left",
    fill: "rgba(255, 255, 255, 0.9)",
  });

  canv.drawText(`✨`, {
    fontType: "cbold",
    size: 150,
    x: canv.right - 150 / 2,
    y: canv.bottom - 250 / 2 + 20,
    align: "center",
    fill: "white",
  });
  canv.drawText(`✨`, {
    fontType: "cbold",
    size: 250,
    x: canv.right - 250 / 2,
    y: canv.bottom,
    align: "center",
    fill: "white",
  });

  canv.drawText(`Utilise "${prefix}help" pour les commandes.`, {
    fontType: "cbold",
    size: 40,
    x: container.left + ymargin,
    y: canv.bottom - 40 - ymargin * 1.5,
    vAlign: "top",
    align: "left",
    fill: "rgba(255, 255, 255, 0.9)",
  });
  canv.drawText(`Essaie "${prefix}help search" pour chercher.`, {
    fontType: "cbold",
    size: 40,
    x: container.left + ymargin,
    y: canv.bottom - ymargin,
    vAlign: "top",
    align: "left",
    fill: "rgba(255, 255, 255, 0.7)",
  });

  return output.replyStyled(
    {
      body: REPLY_TEXT(prefix, prefixes),
      attachment: await canv.toStream(),
    },
    {
      title: global.Cassidy.logo,
      titleFont: "none",
      contentFont: "none",
    }
  );
}
  
