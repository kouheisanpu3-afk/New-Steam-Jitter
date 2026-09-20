client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith("!post2")) return;

  if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
    return message.reply("❌ 権限がありません");
  }

  // ★ここ修正（splitやめる）
  const raw = message.content.trim();

  const firstSpace = raw.indexOf(" ");
  if (firstSpace === -1) return;

  const argsRaw = raw.slice(firstSpace + 1);

  const args = argsRaw.split(" ");

  const channelInput = args[0];
  const mode = args[1];
  const colorInput = args[2];

  const text = args.slice(3).join(" ");

  if (!channelInput || !mode || !text) {
    return message.reply("使い方: !post2 #channel on/off 色 メッセージ");
  }

  const channel =
    message.mentions.channels.first() ||
    message.guild.channels.cache.get(channelInput.replace("#", ""));

  if (!channel) {
    return message.reply("❌ チャンネルが見つかりません");
  }

  let color = 0x5f6f82;

  const colors = {
    red: 0xff0000,
    赤: 0xff0000,
    blue: 0x0099ff,
    青: 0x0099ff,
    green: 0x00ff00,
    緑: 0x00ff00,
    yellow: 0xffff00,
    黄色: 0xffff00,
    purple: 0x9b59b6,
    紫: 0x9b59b6,
    pink: 0xff69b4,
    ピンク: 0xff69b4,
    orange: 0xffa500,
    オレンジ: 0xffa500,
    cyan: 0x00ffff,
    水色: 0x00ffff,
    black: 0x000000,
    黒: 0x000000,
    white: 0xffffff,
    白: 0xffffff,
    gray: 0x808080,
    grey: 0x808080,
    灰色: 0x808080,
    gold: 0xffd700,
    金: 0xffd700
  };

  if (colors[colorInput]) color = colors[colorInput];

  if (mode === "off") {
    return channel.send(text);
  }

  const embed = new EmbedBuilder()
    .setColor(color)
    .setDescription(text);

  await channel.send({ embeds: [embed] });

  message.reply(`✅ ${channel} に投稿しました`);
});
