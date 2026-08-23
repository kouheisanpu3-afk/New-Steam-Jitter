const { Events } = require("discord.js");

// キック監視チャンネル
const KICK_CHANNEL_ID = "1540932243826942002";

// 警告メッセージ
const WARNING_TEXT =
`このチャンネルにメッセージを送信しないでください
このチャンネルはスパムボットを検知するために使用されます。メッセージを送信したユーザーは即座にキックされます。

DO NOT SEND MESSAGES IN THIS CHANNEL
This channel is used to detect spam bots. Any user who sends a message here will be kicked immediately.`;

module.exports = (client) => {

  client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;

    if (message.channel.id === KICK_CHANNEL_ID) {

      try {
        // 🔥 ここで表示する（追加した部分）
        await message.channel.send(WARNING_TEXT);

        console.log(`⚠ WARNING TRIGGERED: ${message.author.tag}`);

        await message.member.kick("Restricted channel violation");

        console.log(`KICKED: ${message.author.tag}`);

      } catch (err) {
        console.error("Kick error:", err);
      }
    }
  });

};
