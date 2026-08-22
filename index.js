const { 
  Client, 
  GatewayIntentBits, 
  Events, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle 
} = require('discord.js');

const express = require("express");

// 🔵 Render用Webサーバー
const app = express();
app.get("/", (req, res) => {
  res.send("Bot is alive!");
});
app.listen(3000, () => {
  console.log("Webサーバー起動");
});

// 🔵 Bot設定
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

const TOKEN = process.env.TOKEN;

const ROLE_ID = "1540560312602988594";
const CHANNEL_ID = "1540606154093367336";

// 🔵 起動時
client.once(Events.ClientReady, async () => {
  console.log(`ログイン: ${client.user.tag}`);

  const channel = await client.channels.fetch(CHANNEL_ID);

  // 認証メッセージ送信
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("verify")
      .setLabel("👍 認証する")
      .setStyle(ButtonStyle.Success)
  );

  await channel.send({
    content:
      "サーバールールをお読みください。\n" +
      "ボタンを押すと認証されます。\n\n" +
      "Please read the rules and click the button to verify.",
    components: [row]
  });
});

// 🔵 ボタン押した時
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId === "verify") {
    const member = await interaction.guild.members.fetch(interaction.user.id);

    if (member.roles.cache.has(ROLE_ID)) {
      return interaction.reply({
        content: "すでに認証済みです",
        ephemeral: true
      });
    }

    await member.roles.add(ROLE_ID);

    await interaction.reply({
      content: "認証完了しました 👍",
      ephemeral: true
    });

    console.log(`${interaction.user.tag} を認証しました`);
  }
});

client.login(TOKEN);
