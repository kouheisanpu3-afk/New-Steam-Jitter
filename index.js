const { Client, GatewayIntentBits } = require("discord.js");
const express = require("express");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// =======================
// 機能読み込み
require("./auth")(client);
require("./kick")(client);
require("./ticket")(client); // ←これが無かった原因

// =======================
// Webサーバー（Render用）
const app = express();

app.get("/", (req, res) => {
  res.send("Bot is alive!");
});

// Render対策：必ず3000
app.listen(3000, () => {
  console.log("Web server started");
});

// =======================
// ログイン
client.once("ready", () => {
  console.log(`ログイン: ${client.user.tag}`);
});

client.login(process.env.TOKEN);
