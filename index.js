const {
  Client,
  GatewayIntentBits,
  Events,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require('discord.js');

const express = require("express");

// Webサーバー（Render用）
const app = express();
app.get("/", (req, res) => {
  res.send("Bot is alive!");
});
app.listen(3000, () => {
  console.log("Webサーバー起動");
});

// Bot設定
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

const TOKEN = process.env.TOKEN;

const ROLE_ID = "1540560312602988594";
const CHANNEL_ID = "1540606154093367336";

client.once(Events.ClientReady, async () => {
  console.log(`ログイン: ${client.user.tag}`);

  try {
    const channel = await client.channels.fetch(CHANNEL_ID);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("verify")
        .setLabel("認証/Verify")
        .setStyle(ButtonStyle.Primary)
    );

    await channel.send({
      components: [row]
    });

  } catch (err) {
    console.log("❌ チャンネル取得エラー:");
    console.log(err);
  }
});

// ボタン処理
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;

  // 認証 → 言語選択だけ表示
  if (interaction.customId === "verify") {

    const langEmbed = new EmbedBuilder()
      .setDescription("```言語を選択してください / Select Language```");

    const langRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("lang_jp")
        .setLabel("日本語")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("lang_en")
        .setLabel("English")
        .setStyle(ButtonStyle.Primary)
    );

    return interaction.reply({
      embeds: [langEmbed],
      components: [langRow],
      ephemeral: true
    });
  }
});

client.login(TOKEN);
