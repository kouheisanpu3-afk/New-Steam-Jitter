const { Events, EmbedBuilder } = require("discord.js");

const WATCH_CHANNEL_ID = "1540932243826942002";

module.exports = (client) => {

  client.on(Events.MessageCreate, async (message) => {

    if (message.author.bot) return;
    if (!message.guild) return;

    if (message.channel.id !== WATCH_CHANNEL_ID) return;

    const member = message.member;
    if (!member || !member.kickable) return;

    try {
      await message.delete().catch(() => {});
      await member.kick("Anti spam channel rule violation");

      const embed = new EmbedBuilder()
        .setColor(0x6f8fa6)
        .setTitle("🚨 自動キック")
        .setDescription(
          "スパム検知チャンネルに投稿したためキックされました\n\n" +
          "DO NOT SEND MESSAGES IN THIS CHANNEL\n" +
          "This channel is used to detect spam bots."
        );

      message.channel.send({ embeds: [embed] }).catch(() => {});

    } catch (err) {
      console.error("kick error:", err);
    }
  });

};
