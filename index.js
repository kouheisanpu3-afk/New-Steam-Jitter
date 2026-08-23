const { Client, GatewayIntentBits } = require("discord.js");
const express = require("express");

const auth = require("./auth");

const app = express();
app.get("/", (req, res) => res.send("Bot is alive!"));
app.listen(process.env.PORT || 3000);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

auth(client);

client.login(process.env.TOKEN);
