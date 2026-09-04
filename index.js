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

app.listen(PORT, "0.0.0.0", () => {
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
// モジュール読み込み
// =======================

try {
  require("./ticket.js")(client);
  console.log("ticket.js loaded");
} catch (e) {
  console.error("ticket.js error:", e);
}

try {
  require("./auth.js")(client);
  console.log("auth.js loaded");
} catch (e) {
  console.log("auth.jsなし（スキップ）");
}

try {
  require("./kick.js")(client);
  console.log("kick.js loaded");
} catch (e) {
  console.log("kick.jsなし（スキップ）");
}

// =======================
// 起動ログ
// =======================

console.log("🚀 BEFORE LOGIN");

// ★ここ追加（重要）
setTimeout(() => {
  console.log("🚀 CALLING client.login()");
  client.login(process.env.TOKEN);
}, 1000);

// =======================
// ready
// =======================

client.once("ready", () => {
  console.log(`ログイン: ${client.user.tag}`);
});

// =======================
// エラーハンドリング
// =======================

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection:", err);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});
