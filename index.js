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

  // 🔥 重複防止           
  const messages = await channel.messages.fetch({ limit: 10 });           

  const exists = messages.some(msg =>           
    msg.author.id === client.user.id &&           
    msg.content.includes("Verification")           
  );           

  if (exists) return;           

  // 🔵 ボタン           
  const row = new ActionRowBuilder().addComponents(           
    new ButtonBuilder()           
      .setCustomId("verify")           
      .setLabel("VERIFY ACCESS")           
      .setStyle(ButtonStyle.Success)           
  );           

  // 🔥 日本語（コンパクト＋強調）
  const embedJP = new EmbedBuilder()           
    .setColor(0x00c8ff)           
    .setDescription(
      "## 🇯🇵 **認証**\n" +
      "下のボタンをクリックすると認証が完了します。認証後は利用規約に同意したものとみなされます。"
    );           

  // 🔥 English（コンパクト＋強調）
  const embedEN = new EmbedBuilder()           
    .setColor(0x00c8ff)           
    .setDescription(
      "## 🇺🇸 **Verification**\n" +
      "Click the button below to complete verification. By verifying, you agree to the Terms of Service."
    );           

  // 🔵 送信           
  await channel.send({           
    embeds: [embedJP]           
  });           

  await channel.send({           
    embeds: [embedEN],           
    components: [row]           
  });           
});           

// 🔵 ボタン処理           
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
