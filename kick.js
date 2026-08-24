const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

const KICK_CHANNEL_ID = "1540932243826942002";

// グレー寄りブルー
const EMBED_COLOR = 0x5f6f82;

// 🚫画像（Embed用）
const NO_ENTRY_IMG = "https://images-ext-1.discordapp.net/external/V3wsBTSebz_y5_eqHOENkSM6E2SRWyZ0jE66pG9qFKs/https/emojicdn.elk.sh/%F0%9F%9A%AB?format=webp";

// 日本語
const JP_TEXT =
`このチャンネルにメッセージを送信しないでください
このチャンネルはスパムボットを検知するために使用されます。メッセージを送信したユーザーは即座にキックされます。`;

// 英語
const EN_TEXT =
`DO NOT SEND MESSAGES IN THIS CHANNEL
This channel is used to detect spam bots. Any user who sends a message here will be kicked immediately.`;

// カスタム絵文字ID
const NO_ENTRY_EMOJI_ID = "1540993447278805042";

// =======================
// ★変更①：永続カウント用（リアルタイム安定化）
let kickCount = 0;

// =======================
// ボタン（そのまま）
function createJPButton() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("kick_button_jp")
      .setEmoji(NO_ENTRY_EMOJI_ID)
      .setLabel(`キック：${kickCount}`)
      .setStyle(ButtonStyle.Secondary)
  );
}

function createENButton() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("kick_button_en")
      .setEmoji(NO_ENTRY_EMOJI_ID)
      .setLabel(`Kick：${kickCount}`)
      .setStyle(ButtonStyle.Secondary)
  );
}

module.exports = (client) => {

  let jpMsgRef = null;
  let enMsgRef = null;

  client.once(Events.ClientReady, async () => {
    try {
      const channel = await client.channels.fetch(KICK_CHANNEL_ID);
      if (!channel) return console.log("チャンネル取得失敗");

      const messages = await channel.messages.fetch({ limit: 20 });

      const alreadyJP = messages.find(msg =>
        msg.author.id === client.user.id &&
        msg.embeds.length > 0 &&
        msg.embeds[0].description?.includes("このチャンネルにメッセージを送信しないでください")
      );

      const alreadyEN = messages.find(msg =>
        msg.author.id === client.user.id &&
        msg.embeds.length > 0 &&
        msg.embeds[0].description?.includes("DO NOT SEND MESSAGES IN THIS CHANNEL")
      );

      if (alreadyJP || alreadyEN) {
        console.log("既に警告メッセージあり（スキップ）");
        return;
      }

      const jpEmbed = new EmbedBuilder()
        .setDescription(JP_TEXT)
        .setColor(EMBED_COLOR)
        .setThumbnail(NO_ENTRY_IMG);

      jpMsgRef = await channel.send({
        embeds: [jpEmbed],
        components: [createJPButton()]
      });

      const enEmbed = new EmbedBuilder()
        .setDescription(EN_TEXT)
        .setColor(EMBED_COLOR)
        .setThumbnail(NO_ENTRY_IMG);

      enMsgRef = await channel.send({
        embeds: [enEmbed],
        components: [createENButton()]
      });

      console.log("警告メッセージ設置完了");

    } catch (err) {
      console.error("初期メッセージ送信エラー:", err);
    }
  });

  client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;
    if (message.channel.id !== KICK_CHANNEL_ID) return;

    try {
      console.log(`⚠ WARNING: ${message.author.tag}`);

      if (message.deletable) {
        await message.delete().catch(() => {});
      }

      await message.member.kick("Restricted channel violation");

      // =======================
      // ★変更②：即時更新用に先に加算
      kickCount++;

      console.log(`KICKED: ${message.author.tag} / total: ${kickCount}`);

      // =======================
      // ★変更③：毎回確実に再編集
      if (jpMsgRef) {
        await jpMsgRef.edit({
          components: [createJPButton()]
        });
      }

      if (enMsgRef) {
        await enMsgRef.edit({
          components: [createENButton()]
        });
      }

    } catch (err) {
      console.error("Kick error:", err);
    }
  });

};
