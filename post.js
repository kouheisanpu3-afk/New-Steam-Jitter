const {   
  Client,   
  GatewayIntentBits,   
  Partials, 
  PermissionsBitField, 
  EmbedBuilder 
} = require("discord.js");   
  
const express = require("express");   
const app = express();   
  
// =======================   
// Webサーバー（Render用）   
// =======================   
app.get("/", (req, res) => {   
  res.send("Bot is alive!");   
});   
  
const PORT = process.env.PORT || 3000;   
app.listen(PORT, () => {   
  console.log("Web server started on port", PORT);   
});   
  
// =======================   
// Discord Bot   
// =======================   
const client = new Client({   
  intents: [   
    GatewayIntentBits.Guilds,   
    GatewayIntentBits.GuildMembers,   
    GatewayIntentBits.GuildMessages,   
    GatewayIntentBits.MessageContent,   
    GatewayIntentBits.GuildMessageReactions   
  ],   
  partials: [   
    Partials.Message,   
    Partials.Channel,   
    Partials.Reaction,   
    Partials.GuildMember   
  ]   
});   
  
// =======================   
// モジュール読み込み   
// =======================   
try { require("./ticket.js")(client); } catch (e) {}   
try { require("./auth.js")(client); } catch (e) {}   
try { require("./kick.js")(client); } catch (e) {}   
try { require("./leaveLog.js")(client); } catch (e) {}   
try { require("./joinLog.js")(client); } catch (e) {}   
try { require("./roleLog.js")(client); } catch (e) {}   
  
// =======================   
// ★ !post2（拡張版）   
// =======================   
client.on("messageCreate", async (message) => {   
  if (message.author.bot) return;   
  if (!message.content.startsWith("!post2")) return;   
 
  // 権限チェック   
  if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {   
    return message.reply("❌ 権限がありません");   
  }   
 
  const args = message.content.split(" ");   
  const channelInput = args[1];   
  const mode = args[2];   
  const colorInput = args[3];   
  const text = args.slice(4).join(" ");   
 
  if (!channelInput || !mode || !text) {   
    return message.reply("使い方: !post2 #channel on/off color メッセージ");   
  }   
 
  const channel =   
    message.mentions.channels.first() ||   
    message.guild.channels.cache.get(channelInput.replace("#", ""));   
 
  if (!channel) {   
    return message.reply("❌ チャンネルが見つかりません");   
  }   
 
  // =======================   
  // 色設定（できるだけ多く）   
  // =======================   
  let color = 0x5f6f82; // デフォルト
 
  const colors = {
    red: 0xff0000,
    blue: 0x0099ff,
    green: 0x00ff00,
    yellow: 0xffff00,
    purple: 0x9b59b6,
    pink: 0xff69b4,
    orange: 0xffa500,
    cyan: 0x00ffff,
    black: 0x000000,
    white: 0xffffff,
    gray: 0x808080,
    grey: 0x808080,
    lime: 0x32cd32,
    gold: 0xffd700,
    navy: 0x000080
  };
 
  if (colors[colorInput]) {
    color = colors[colorInput];
  }
 
  // =======================   
  // Embed ON / OFF 切り替え   
  // =======================   
 
  // OFF → 普通メッセージ（背景なし風）
  if (mode === "off") {
    return channel.send(text);
  }
 
  // ON → Embed投稿
  const embed = new EmbedBuilder()   
    .setColor(color)   
    .setDescription(text)   
    .setFooter({ text: `Posted by ${message.author.tag}` });   
 
  await channel.send({ embeds: [embed] });   
 
  message.reply(`✅ ${channel} に投稿しました`);   
});   
  
// =======================   
// 起動ログ   
// =======================   
client.once("ready", () => {   
  console.log(`ログイン: ${client.user.tag}`);   
});   
  
process.on("unhandledRejection", console.error);   
process.on("uncaughtException", console.error);   
  
client.login(process.env.TOKEN).catch(console.error);
