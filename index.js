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
// 🔥 超重要：二重起動防止
// =======================

if (global.__bot_started__) {
  console.log("⚠ Bot already started. Preventing duplicate instance.");
  process.exit(0);
}
global.__bot_started__ = true;

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
// 🌍 言語設定（ここで切替）
// =======================

const LANGUAGE = process.env.LANG || "ja"; 
// "ja" or "en"

// =======================
// モジュール読み込み（言語対応）
// =======================

try {
  if (LANGUAGE === "en") {
    require("./ticket-en.js")(client);
    console.log("ticket-en.js loaded");
  } else {
    require("./ticket-ja.js")(client);
    console.log("ticket-ja.js loaded");
  }
} catch (e) {
  console.error("ticket module error:", e);
}

// 共通モジュール（そのまま）
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

try {
  require("./post.js")(client);
  console.log("post.js loaded");
} catch (e) {
  console.log("post.jsなし（スキップ）");
}

// =======================
// 起動ログ
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

// =======================
// ログイン
// =======================

client.login(process.env.TOKEN).catch((err) => {
  console.error("ログイン失敗:", err);
});
