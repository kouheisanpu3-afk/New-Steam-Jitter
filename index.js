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

  // 🔥 重複防止チェック       
  const messages = await channel.messages.fetch({ limit: 10 });       

  const exists = messages.some(msg =>       
    msg.author.id === client.user.id &&       
    msg.content.includes("Verification")       
  );       

  if (exists) return;       

  // 🔵 ボタン作成（大きめ＆強調）
  const row = new ActionRowBuilder().addComponents(       
    new ButtonBuilder()       
      .setCustomId("verify")       
      .setLabel("✔ VERIFY NOW")       
      .setStyle(ButtonStyle.Success)       
  );       

  // 🔥 Embed（見た目強化・大きく見える）
  const embed = new EmbedBuilder()       
    .setColor(0x00c8ff) // 水色ライン       
    .setTitle("🚀  ENTER VERIFICATION SYSTEM  🚀")       
    .setDescription("下のボタンを押して認証を完了してください / Complete verification below")       
    .addFields(       
      {       
        name: "🇯🇵 【日本語】認証について",       
        value:       
          "━━━━━━━━━━━━━━━━━━\n" +       
          "このボタンを押すことで認証が完了します。\n" +       
          "認証後、利用規約への同意が自動で行われます。\n" +       
          "━━━━━━━━━━━━━━━━━━",       
        inline: false       
      },       
      {       
        name: "🇺🇸 【English】Verification Info",       
        value:       
          "━━━━━━━━━━━━━━━━━━\n" +       
          "Press the button below to complete verification.\n" +       
          "By verifying, you agree to the Terms of Service.\n" +       
          "━━━━━━━━━━━━━━━━━━",       
        inline: false       
      }       
    )       
    .setFooter({ text: "Verification System • Secure Access" });       

  // 🔵 認証メッセージ送信       
  await channel.send({       
    embeds: [embed],       
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
      content: "🎉 認証完了しました！ / Verification Complete!",       
      ephemeral: true       
    });       

    console.log(`${interaction.user.tag} を認証しました`);       
  }       
});       

client.login(TOKEN);
