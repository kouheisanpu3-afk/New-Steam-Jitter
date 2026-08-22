const { Client, GatewayIntentBits, Events, Partials } = require('discord.js');
const express = require("express");

// 🔵 Webサーバー（Render対策）
const app = express();
app.get("/", (req, res) => {
  res.send("Bot is alive!");
});
app.listen(3000, () => {
  console.log("Webサーバー起動");
});

// 🔵 Bot本体
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction
  ]
});

const TOKEN = process.env.TOKEN;

const ROLE_ID = "1540560312602988594";
const CHANNEL_ID = "1540606154093367336";

// 🔵 起動時
client.once(Events.ClientReady, async () => {
  console.log(`ログイン: ${client.user.tag}`);

  const channel = await client.channels.fetch(CHANNEL_ID);

  const messages = await channel.messages.fetch({ limit: 10 });

  const exists = messages.some(
    msg =>
      msg.author.id === client.user.id &&
      msg.content.includes("サーバールールをお読みいただき")
  );

  if (!exists) {
    const message = await channel.send({
      content:
        "サーバールールをお読みいただき、下のリアクションを押して認証してください。\n" +
        "※リアクションを押した場合、サーバールールに同意したこととなります。\n" +
        "Please read the server rules and click the reaction below.\n" +
        "By adding the reaction, you agree to the server rules."
    });

    await message.react("👍");
  }
});

// 👍追加
client.on(Events.MessageReactionAdd, async (reaction, user) => {
  if (user.bot) return;

  // 🔴 partial対応（超重要）
  if (reaction.partial) await reaction.fetch();

  if (reaction.message.channel.id !== CHANNEL_ID) return;

  if (reaction.emoji.name === "👍") {
    const member = await reaction.message.guild.members.fetch(user.id);

    if (!member.roles.cache.has(ROLE_ID)) {
      await member.roles.add(ROLE_ID);
      console.log(`${user.tag} に認証ロールを付与しました`);
    }
  }
});

// 👍削除
client.on(Events.MessageReactionRemove, async (reaction, user) => {
  if (user.bot) return;

  // 🔴 partial対応
  if (reaction.partial) await reaction.fetch();

  if (reaction.message.channel.id !== CHANNEL_ID) return;

  if (reaction.emoji.name === "👍") {
    const member = await reaction.message.guild.members.fetch(user.id);

    if (member.roles.cache.has(ROLE_ID)) {
      await member.roles.remove(ROLE_ID);
      console.log(`${user.tag} の認証ロールを削除しました`);
    }
  }
});

client.login(TOKEN);
