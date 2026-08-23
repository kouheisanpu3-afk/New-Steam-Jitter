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

// =======================
// Webサーバー（Render用）
const app = express();
app.get("/", (req, res) => {
  res.send("Bot is alive!");
});
app.listen(3000, () => {
  console.log("Webサーバー起動");
});

// =======================
// BOT作成
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const TOKEN = process.env.TOKEN;

// =======================
const ROLE_ID = "1540560312602988594";
const ENGLISH_ROLE_ID = "1540560377866362950";

const CHANNEL_ID = "1540606154093367336";
const RULES_CHANNEL_ID = "1540626614982025327";
const TOS_CHANNEL_ID = "1540627413136973824";

// 認証監視チャンネル
const WATCH_CHANNEL_ID = "1540694105305124904";

// 🔥キックログ送信先（ここが重要）
const LOG_CHANNEL_ID = "1540694105305124904";

// キック回数
const kickCount = {};
let totalKickCount = 0;

const NO_ENTRY_ICON =
  "https://images-ext-1.discordapp.net/external/V3wsBTSebz_y5_eqHOENkSM6E2SRWyZ0jE66pG9qFKs/https/emojicdn.elk.sh/%F0%9F%9A%AB?format=webp";

// =======================
// 起動時
client.once(Events.ClientReady, async () => {
  console.log(`ログイン: ${client.user.tag}`);

  try {
    const channel = await client.channels.fetch(CHANNEL_ID);

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

    // =========================
    // 日本語（認証）
    const embedJP = new EmbedBuilder()
      .setColor(0x0099ff)
      .setThumbnail(NO_ENTRY_ICON)
      .setDescription(
        "🚫 ## 認証\n\n" +
        "このチャンネルにメッセージを送信しないでください\n\n" +
        "このチャンネルはスパムボットを検知するために使用されます。\n" +
        "メッセージを送信したユーザーは即座にキックされます。\n\n" +
        `${rulesText}に同意したものとみなされます。`
      );

    // =========================
    // 英語（認証）
    const embedEN = new EmbedBuilder()
      .setColor(0x0099ff)
      .setThumbnail(NO_ENTRY_ICON)
      .setDescription(
        "🚫 ## Verification\n\n" +
        "DO NOT SEND MESSAGES IN THIS CHANNEL\n\n" +
        "This channel is used to detect spam bots.\n" +
        "Users will be kicked immediately.\n\n" +
        `By continuing, you agree to the ${tosText}.`
      );

    await channel.send({ embeds: [embedJP], components: [row] });
    await channel.send({ embeds: [embedEN] });

  } catch (err) {
    console.log(err);
  }
});

// =======================
// スパム検知
client.on(Events.MessageCreate, async (message) => {

  if (message.author.bot) return;
  if (!message.guild) return;
  if (message.channel.id !== WATCH_CHANNEL_ID) return;

  try {
    const member = await message.guild.members.fetch(message.author.id);

    if (member.permissions.has("Administrator")) return;

    await message.delete().catch(() => {});

    kickCount[message.author.id] = (kickCount[message.author.id] || 0) + 1;
    const count = kickCount[message.author.id];

    totalKickCount++;

    await member.kick(`スパム検知チャンネル (${count}回目)`);

    console.log(`🚫 キック：${count}回 | ${message.author.tag} | 総キック:${totalKickCount}`);

    // =========================
    // 🔥キックログ送信（別チャンネル）
    try {
      const logChannel = await client.channels.fetch(LOG_CHANNEL_ID);

      if (logChannel) {
        await logChannel.send(
          `🚫 キック発生\nユーザー: ${message.author.tag}\n個人回数: ${count}\n総キック: ${totalKickCount}`
        );
      }
    } catch (e) {
      console.log("ログ送信失敗:", e);
    }

  } catch (err) {
    console.log("エラー:", err);
  }
});

// =======================
// ボタン処理
client.on(Events.InteractionCreate, async (interaction) => {

  if (interaction.isButton()) {

    if (interaction.customId === "verify" || interaction.customId === "change_lang") {

      const select = new StringSelectMenuBuilder()
        .setCustomId("select_lang")
        .setPlaceholder("言語を選択 / Select Language")
        .addOptions([
          { label: "日本語", value: "jp", emoji: "🇯🇵" },
          { label: "English", value: "en", emoji: "🇺🇸" }
        ]);

      const row = new ActionRowBuilder().addComponents(select);

      return interaction.reply({
        content: "言語を選択してください",
        components: [row],
        ephemeral: true
      });
    }
  }

  if (!interaction.isStringSelectMenu()) return;

  const member = await interaction.guild.members.fetch(interaction.user.id);

  if (interaction.values[0] === "jp") {
    await member.roles.add(ROLE_ID);
    await member.roles.remove(ENGLISH_ROLE_ID);

    return interaction.update({
      embeds: [
        new EmbedBuilder()
          .setColor(0x00ff99)
          .setTitle("認証完了")
          .setDescription("認証が完了しました")
      ],
      components: []
    });
  }

  if (interaction.values[0] === "en") {
    await member.roles.add(ENGLISH_ROLE_ID);
    await member.roles.remove(ROLE_ID);

    return interaction.update({
      embeds: [
        new EmbedBuilder()
          .setColor(0x00ff99)
          .setTitle("Verification Complete")
          .setDescription("You have been verified.")
      ],
      components: []
    });
  }
});

client.login(TOKEN);
