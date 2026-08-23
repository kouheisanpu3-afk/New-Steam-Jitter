const { Events, EmbedBuilder } = require("discord.js");

// =======================
// 監視チャンネルID
const WATCH_CHANNEL_ID = "1540932243826942002";

module.exports = (client) => {

  client.on(Events.MessageCreate, async (message) => {

    // bot無視
    if (message.author.bot) return;

    // 指定チャンネル以外は無視
    if (message.channel.id !== WATCH_CHANNEL_ID) return;

    // サーバー外（DM）無視
    if (!message.guild) return;

    const member = message.member;

    // キック不可チェック
    if (!member || !member.kickable) return;

    try {
      // メッセージ削除（ログ消し）
      await message.delete().catch(() => {});

      // キック実行
      await member.kick("Sent message in anti-spam channel");

      // 通知用ログ（必要なら）
      const logEmbed = new EmbedBuilder()
        .setColor(0x6f8fa6) // グレー×青系（指定）
        .setTitle("🚨 自動キック")
        .setDescription(
          `このチャンネルにメッセージを送信したためキックされました。\n\n` +
          `ユーザー: ${member.user.tag}`
        );

      console.log(`[AUTO KICK] ${member.user.tag} sent message in watch channel`);

      // （任意）同じチャンネルに通知したい場合
      message.channel.send({ embeds: [logEmbed] }).catch(() => {});

    } catch (err) {
      console.error("自動キックエラー:", err);
    }
  });

};
