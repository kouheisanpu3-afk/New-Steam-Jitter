module.exports = (client) => {
  const WATCH_CHANNEL_ID = "1540932243826942002";

  client.on("messageCreate", async (message) => {
    try {
      if (!message.guild) return;
      if (message.author.bot) return;

      if (message.channel.id !== WATCH_CHANNEL_ID) return;

      const member = await message.guild.members.fetch(message.author.id);

      await message.channel.send("このチャンネルは禁止です");

      await member.kick("Anti spam channel");

    } catch (err) {
      console.error(err);
    }
  });
};
