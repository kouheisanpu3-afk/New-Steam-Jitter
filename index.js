const { Client, GatewayIntentBits } = require("discord.js");

// =======================
// Bot作成
// =======================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
});

// =======================
// 各機能を読み込み
// =======================
require("./auth")(client);
require("./kick")(client);
require("./ticket")(client);

// =======================
// 起動ログ
// =======================
client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// =======================
// ログイン（これ1つだけ！）
// =======================
client.login(process.env.TOKEN);
