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
// BOT
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
// ID管理
const ROLE_ID = "1540560312602988594";
const ENGLISH_ROLE_ID = "1540560377866362950";

const AUTH_CHANNEL_ID = "1540606154093367336";   // 認証
const WATCH_CHANNEL_ID = "1540694105305124904";  // キック監視
const RULES_CHANNEL_ID = "1540626614982025327";
const TOS_CHANNEL_ID = "1540627413136973824";

// キック回数
const kickCount = {};

// アイコン
const NO_ENTRY_ICON =
  "https://images-ext-1.discordapp.net/external/V3wsBTSebz_y5_eqHOENkSM6E2SRWyZ0jE66pG9qFKs/https/emojicdn.elk.sh/%F0%9F%9A%AB?format=webp";

// =======================
// 起動処理（完全分離）
client.once(Events.ClientReady, async () => {
  console.log(`ログイン: ${client.user.tag}`);

  // =======================
  // ① 認証チャンネル
  try {
    const channel = await client.channels.fetch(AUTH_CHANNEL_ID);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("verify")
        .setLabel("認証/Verify")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("change_lang")
        .setLabel("言語変更")
        .setStyle(ButtonStyle.Secondary)
    );

    const rulesText = `利用規約`;
    const tosText = `Terms of Service`;

    const embedJP = new EmbedBuilder()
      .setColor(0x0099ff)
      .setThumbnail(NO_ENTRY_ICON)
      .setDescription(
        "## 認証\n\n" +
        "このチャンネルにメッセージを送信しないでください\n\n" +
        "このチャンネルはスパムボットを検知するために使用されます。\n" +
        "メッセージを送信したユーザーは即座にキックされます。\n\n" +
        `${rulesText}`
      );

    const embedEN = new EmbedBuilder()
      .setColor(0x0099ff)
      .setThumbnail(NO_ENTRY_ICON)
      .setDescription(
        "## Verification\n\n" +
        "DO NOT SEND MESSAGES IN THIS CHANNEL\n\n" +
        "This channel is used to detect spam bots.\n" +
        "Users will be kicked immediately.\n\n" +
        `${tosText}`
      );

    await channel.send({ embeds: [embedJP], components: [row] });
    await channel.send({ embeds: [embedEN] });

  } catch (e) {
    console.log("AUTH ERROR:", e);
  }

  // =======================
  // ② WATCHチャンネル（キック専用）
  try {
    const watch = await client.channels.fetch(WATCH_CHANNEL_ID);

    const jp = new EmbedBuilder()
      .setColor(0x6C8EA4)
      .setThumbnail(NO_ENTRY_ICON)
      .setDescription(
        "🚫 このチャンネルにメッセージを送信しないでください\n" +
        "スパム検知用です"
      );

    const en = new EmbedBuilder()
      .setColor(0x6C8EA4)
      .setThumbnail(NO_ENTRY_ICON)
      .setDescription(
        "🚫 DO NOT SEND MESSAGES HERE\n" +
        "Used for spam detection"
      );

    await watch.send({ embeds: [jp] });
    await watch.send({ embeds: [en] });

  } catch (e) {
    console.log("WATCH ERROR:", e);
  }
});

// =======================
// キック処理（WATCHのみ反応）
client.on(Events.MessageCreate, async (message) => {

  if (message.author.bot) return;
  if (!message.guild) return;
  if (message.channel.id !== WATCH_CHANNEL_ID) return;

  try {
    const member = await message.guild.members.fetch(message.author.id);

    if (member.permissions.has("Administrator")) return;

    await message.delete().catch(() => {});

    kickCount[message.author.id] =
      (kickCount[message.author.id] || 0) + 1;

    const count = kickCount[message.author.id];

    await member.kick(`スパム検知 (${count}回目)`);

    console.log(`🚫 KICK: ${message.author.tag} (${count})`);

  } catch (err) {
    console.log(err);
  }
});

// =======================
// ボタン処理（認証だけ）
client.on(Events.InteractionCreate, async (interaction) => {

  if (!interaction.isButton()) return;

  if (interaction.customId === "verify" || interaction.customId === "change_lang") {

    const select = new StringSelectMenuBuilder()
      .setCustomId("select_lang")
      .setPlaceholder("言語選択")
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

// =======================
client.login(TOKEN);
