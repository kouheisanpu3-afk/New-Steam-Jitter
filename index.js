const { Client, GatewayIntentBits, Partials } = require("discord.js");
const express = require("express");

// =======================
// Express（Render対策）
const app = express();
app.get("/", (req, res) => {
  res.send("Bot is alive");
});
app.listen(process.env.PORT || 3000, () => {
  console.log("Web server started");
});

// =======================
// Discord Bot
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

// ====== TOKEN確認 ======
client.login(process.env.TOKEN);

// ====== ログイン ======
client.once("clientReady", () => {
  console.log(`ログイン: ${client.user.tag}`);
});

// ====== モジュール読み込み（例） ======
require("./auth.js")(client);
require("./kick.js")(client);
require("./ticket.js")(client);
