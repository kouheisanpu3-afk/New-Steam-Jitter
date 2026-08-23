const { Events, EmbedBuilder } = require("discord.js");

const KICK_CHANNEL_ID = "1540932243826942002";

// グレー＋青っぽい色（いい感じの中間色）
const EMBED_COLOR = 0x6b85a6;

const WARNING_TEXT =
`このチャンネルにメッセージを送信しないでください
このチャンネルはスパムボットを検知するために使用されます。メッセージを送信したユーザーは即座にキックされます。

DO NOT SEND MESSAGES IN THIS CHANNEL
This channel is used to detect spam bots. Any user who sends a message here will be kicked immediately.`;

module.exports = (client) => {

  client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;

    if (message.channel.id !== KICK_CHANNEL_ID) return;

    try {

      // ✅ Embed作成（背景＋左線）
      const embed = new EmbedBuilder()
        .setDescription(WARNING_TEXT)
        .setColor(EMBED_COLOR);

      // 送信
      await message.channel.send({ embeds: [embed] });

      console.log(`⚠ WARNING: ${message.author.tag}`);

      // 少し待つ
      await new Promise(res => setTimeout(res, 500));

      // キック
      await message.member.kick("Restricted channel violation");

      console.log(`KICKED: ${message.author.tag}`);

    } catch (err) {
      console.error("Kick error:", err);
    }
  });

};
