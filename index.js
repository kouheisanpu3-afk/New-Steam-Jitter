const {
  Client,
  GatewayIntentBits,
  Events,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  StringSelectMenuBuilder
} = require("discord.js");

const express = require("express");

const app = express();
app.get("/", (req, res) => {
  res.send("Bot is alive!");
});
app.listen(3000, () => {
  console.log("Webサーバー起動");
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const TOKEN = process.env.TOKEN;

const ROLE_ID = "1540560312602988594";
const ENGLISH_ROLE_ID = "1540560377866362950";

const CHANNEL_ID = "1540606154093367336";
const RULES_CHANNEL_ID = "1540626614982025327";
const TOS_CHANNEL_ID = "1540627413136973824";

const WATCH_CHANNEL_ID = "1540694105305124904";

const kickCount = {};

const NO_ENTRY_ICON =
  "https://images-ext-1.discordapp.net/external/V3wsBTSebz_y5_eqHOENkSM6E2SRWyZ0jE66pG9qFKs/https/emojicdn.elk.sh/%F0%9F%9A%AB?format=webp";

// =======================
// 起動時
client.once(Events.ClientReady, async () => {
  console.log(`ログイン: ${client.user.tag}`);

  try {
    const channel = await client.channels.fetch(CHANNEL_ID);

    // 🔥 強制送信（スキップ判定削除）
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("verify")
        .setLabel("認証/Verify")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("change_lang")
        .setLabel("言語を変更 / Change Language")
        .setStyle(ButtonStyle.Secondary)
    );

    const rulesText = `[利用規約](https://discord.com/channels/${channel.guild.id}/${RULES_CHANNEL_ID})`;
    const tosText = `[Terms of Service](https://discord.com/channels/${channel.guild.id}/${TOS_CHANNEL_ID})`;

    const embedJP = new EmbedBuilder()
      .setColor(0x0099ff)
      .setThumbnail(NO_ENTRY_ICON)
      .setDescription(
        "## 認証\n\n" +
        "このチャンネルにメッセージを送信しないでください\n\n" +
        "このチャンネルはスパムボットを検知するために使用されます。\n" +
        "メッセージを送信したユーザーは即座にキックされます。\n\n" +
        `${rulesText}に同意したものとみなされます。`
      );

    const embedEN = new EmbedBuilder()
      .setColor(0x0099ff)
      .setThumbnail(NO_ENTRY_ICON)
      .setDescription(
        "## Verification\n\n" +
        "DO NOT SEND MESSAGES IN THIS CHANNEL\n\n" +
        "This channel is used to detect spam bots.\n" +
        "Users will be kicked immediately.\n\n" +
        `By continuing, you agree to the ${tosText}.`
      );

    await channel.send({ embeds: [embedJP], components: [row] });
    await channel.send({ embeds: [embedEN] });

    console.log("認証メッセージ送信完了");

  } catch (err) {
    console.log("送信エラー:", err);
  }

  // WATCHチャンネル
  try {
    const watchChannel = await client.channels.fetch(WATCH_CHANNEL_ID);

    const jpEmbed = new EmbedBuilder()
      .setColor(0x6C8EA4)
      .setThumbnail(NO_ENTRY_ICON)
      .setDescription(
        "## このチャンネルにメッセージを送信しないでください\n" +
        "このチャンネルはスパムボットを検知するために使用されます。メッセージを送信したユーザーは即座にキックされます。"
      );

    const enEmbed = new EmbedBuilder()
      .setColor(0x6C8EA4)
      .setThumbnail(NO_ENTRY_ICON)
      .setDescription(
        "## DO NOT SEND MESSAGES IN THIS CHANNEL\n" +
        "This channel is used to detect spam bots. Any user who sends a message here will be kicked immediately."
      );

    await watchChannel.send({ embeds: [jpEmbed] });
    await watchChannel.send({ embeds: [enEmbed] });

    console.log("WATCHメッセージ送信完了");

  } catch (err) {
    console.log(err);
  }
});

// =======================
client.login(TOKEN);
