const { Events } = require("discord.js");

// キック監視チャンネル
const KICK_CHANNEL_ID = "1540932243826942002";

module.exports = (client) => {

  client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;

    // 指定チャンネルでメッセージ送ったらキック
    if (message.channel.id === KICK_CHANNEL_ID) {
      try {
        await message.member.kick("Restricted channel violation");

        console.log(`KICK: ${message.user?.tag || message.author.tag}`);
      } catch (err) {
        console.error("Kick error:", err);
      }
    }
  });

};
