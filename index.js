const { Client, GatewayIntentBits } = require("discord.js");
const express = require("express");

const auth = require("./auth");

// Webサーバー（Render用）
const app = express();
app.get("/", (req, res) => res.send("Bot is alive!"));
app.listen(process.env.PORT || 3000);

// Bot
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// 認証読み込み
auth(client);

// 起動
client.login(process.env.TOKEN);
