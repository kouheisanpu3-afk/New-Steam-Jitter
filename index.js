const kickCount = {}; // ←これ必須（忘れると動かない）

client.on(Events.MessageCreate, async (message) => {

  console.log("📩検知:", message.channel.id, message.content);

  if (message.author.bot) return;
  if (!message.guild) return;
  if (message.channel.id !== WATCH_CHANNEL_ID) return;

  try {
    const member = await message.guild.members.fetch(message.author.id);

    // 管理者は無視
    if (member.permissions.has("Administrator")) return;

    // 即削除
    await message.delete().catch(() => {});

    // キック回数カウント
    if (!kickCount[message.author.id]) {
      kickCount[message.author.id] = 0;
    }

    kickCount[message.author.id]++;

    const count = kickCount[message.author.id];

    // キック実行
    await member.kick(`スパム検知チャンネル (${count}回目)`);

    console.log(`🚫 キック：${count}回 | ${message.author.tag}`);

  } catch (err) {
    console.log("エラー:", err);
  }
});
