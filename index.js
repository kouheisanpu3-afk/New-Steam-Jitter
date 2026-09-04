const {  
  Client,  
  GatewayIntentBits,  
  Partials  
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
    GatewayIntentBits.GuildMessages, 
    GatewayIntentBits.MessageContent, 
    GatewayIntentBits.GuildMembers, 
    GatewayIntentBits.GuildMessageReactions 
  ], 
  partials: [ 
    Partials.Message, 
    Partials.Channel, 
    Partials.Reaction 
  ] 
}); 
 
// ======================= 
// モジュール読み込み（安全版） 
// ======================= 
 
// チケット 
try { 
  require("./ticket.js")(client); 
  console.log("ticket.js loaded"); 
} catch (e) { 
  console.error("ticket.js error:", e); 
} 
 
// 認証 
try { 
  require("./auth.js")(client); 
  console.log("auth.js loaded"); 
} catch (e) { 
  console.log("auth.jsなし（スキップ）"); 
} 
 
// キック 
try { 
  require("./kick.js")(client); 
  console.log("kick.js loaded"); 
} catch (e) { 
  console.log("kick.jsなし（スキップ）"); 
} 
 
// ======================= 
// 起動ログ 
// ======================= 
 
client.once("ready", () => { 
  console.log(`ログイン: ${client.user.tag}`); 
}); 
 
// ======================= 
// エラーハンドリング（重要） 
// ======================= 
 
process.on("unhandledRejection", (err) => { 
  console.error("Unhandled Promise Rejection:", err); 
}); 
 
process.on("uncaughtException", (err) => { 
  console.error("Uncaught Exception:", err); 
}); 
 
// ======================= 
// ログイン 
// ======================= 
 
client.login(process.env.TOKEN).catch((err) => { 
  console.error("ログイン失敗:", err); 
});　index.js
