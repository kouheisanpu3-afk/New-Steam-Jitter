const { 
  Client, 
  GatewayIntentBits, 
  Partials 
} = require("discord.js");

require("dotenv").config();

const express = require("express");
const app = express();

// =======================
// Webサーバー（Render用）
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
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

// =======================
// モジュール読み込み
// =======================

// チケット
require("./ticket.js")(client);

// 認証（ある場合）
try {
  require("./auth.js")(client);
} catch (e) {
  console.log("auth.jsなし（スキップ）");
}

// キック（ある場合）
try {
  require("./kick.js")(client);
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
// ログイン
// =======================

client.login(process.env.TOKEN).catch((err) => {
  console.error("ログイン失敗:", err);
});
