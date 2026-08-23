const { Client, GatewayIntentBits, Partials } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions
  ],
  partials: [Partials.Channel, Partials.Message, Partials.Reaction]
});

// =======================
// 各モジュール読み込み
require("./auth")(client);
require("./kick")(client);
require("./ticket")(client);

// =======================
// 起動ログ
client.once("ready", () => {
  console.log(`ログイン: ${client.user.tag}`);
});

client.login("YOUR_BOT_TOKEN");
