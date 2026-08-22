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

client.once(Events.ClientReady, async () => {
  console.log(`ログイン: ${client.user.tag}`);
});

// ボタン処理
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;

  // ① 認証 → 言語選択（その場で展開）
  if (interaction.customId === "verify") {

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("open_lang")
        .setLabel("言語を選択 / Select Language")
        .setStyle(ButtonStyle.Secondary)
    );

    return interaction.reply({
      content: "認証メニュー",
      components: [row],
      ephemeral: true
    });
  }

  // ② 同じメッセージを編集して展開
  if (interaction.customId === "open_lang") {

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("lang_jp")
        .setLabel("日本語")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("lang_en")
        .setLabel("English")
        .setStyle(ButtonStyle.Primary)
    );

    const embed = new EmbedBuilder()
      .setDescription("```言語を選択してください / Select Language```");

    return interaction.update({
      content: null,
      embeds: [embed],
      components: [row]
    });
  }

  // ③ 日本語
  if (interaction.customId === "lang_jp") {
    const member = await interaction.guild.members.fetch(interaction.user.id);

    if (member.roles.cache.has(ROLE_ID)) {
      return interaction.reply({
        content: "すでに認証済みです",
        ephemeral: true
      });
    }

    await member.roles.add(ROLE_ID);

    return interaction.reply({
      content: "認証完了しました 👍",
      ephemeral: true
    });
  }

  // ④ English
  if (interaction.customId === "lang_en") {
    const member = await interaction.guild.members.fetch(interaction.user.id);

    if (member.roles.cache.has(ROLE_ID)) {
      return interaction.reply({
        content: "Already verified.",
        ephemeral: true
      });
    }

    await member.roles.add(ROLE_ID);

    return interaction.reply({
      content: "Verification completed 👍",
      ephemeral: true
    });
  }
});

client.login(TOKEN);
