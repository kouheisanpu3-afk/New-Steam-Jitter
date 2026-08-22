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

  // 🔥 すでにメッセージあるかチェック
  const messages = await channel.messages.fetch({ limit: 10 });

  const exists = messages.some(msg =>
    msg.author.id === client.user.id &&
    msg.content.includes("Verification")
  );

  if (exists) return; // ← これで重複防止

  // 🔵 ボタン作成
  const row = new ActionRowBuilder().addComponents( 
    new ButtonBuilder() 
      .setCustomId("verify") 
      .setLabel("Verify") 
      .setStyle(ButtonStyle.Success) 
  ); 

  // 🔵 メッセージ送信（新しい文言）
  await channel.send({ 
    content: 
      "認証\n" +
      "下のボタンをクリックすると、認証が完了します。認証を完了すると利用規約に同意したものとみなされます。\n\n" +
      "Verification\n" +
      "Click the button below to complete verification. By completing verification, you agree to the Terms of Service.",
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
