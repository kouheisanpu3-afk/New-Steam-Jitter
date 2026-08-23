const {
  Client,
  GatewayIntentBits,
  Events,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  MessageFlags
} = require("discord.js");

const express = require("express");

// =======================
// Webサーバー（Render用）
const app = express();

app.get("/", (req, res) => {
  res.send("Bot is alive!");
});

app.listen(3000, () => {
  console.log("Web server started");
});

// =======================
// Discord Bot

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// =======================
// 起動ログ
client.once(Events.ClientReady, (c) => {
  console.log(`ログイン: ${c.user.tag}`);

  // 例：認証メッセージ重複防止ログ
  console.log("既に認証メッセージあり");
});

// =======================
// ボタン認証処理
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;

  // 例：認証ボタン
  if (interaction.customId === "verify") {
    try {
      const member = interaction.member;

      // ロール付与（ROLE_IDは自分で設定）
      const ROLE_ID = "YOUR_ROLE_ID_HERE";

      await member.roles.add(ROLE_ID);

      // ✅ ephemeral修正済み
      await interaction.reply({
        content: "認証が完了しました！",
        flags: MessageFlags.Ephemeral
      });

    } catch (err) {
      console.error(err);

      await interaction.reply({
        content: "認証に失敗しました",
        flags: MessageFlags.Ephemeral
      });
    }
  }
});

// =======================
// Botログイン
client.login(process.env.TOKEN);
