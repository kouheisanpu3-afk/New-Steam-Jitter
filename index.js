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

  // 認証 → 言語選択
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

  // 日本語認証
  if (interaction.customId === "lang_jp") {
    try {
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

    } catch (err) {
      console.log(err);
    }
  }

  // English認証
  if (interaction.customId === "lang_en") {
    try {
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

    } catch (err) {
      console.log(err);
    }
  }
});

client.login(TOKEN);
