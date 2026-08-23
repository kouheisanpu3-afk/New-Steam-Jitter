const { Client, GatewayIntentBits, Partials } = require("discord.js");

// =======================
// Bot作成
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
// 各機能読み込み
require("./auth")(client);
require("./kick")(client);
require("./ticket")(client);

// =======================
// 起動ログ
client.once("ready", () => {
  console.log(`ログイン: ${client.user.tag}`);
});

// =======================
// 🔥 Render対応ログイン（ここが重要）
const TOKEN = process.env.TOKEN;

if (!TOKEN) {
  console.error("❌ TOKENが設定されていません（Renderの環境変数を確認）");
  process.exit(1);
}

client.login(TOKEN);
