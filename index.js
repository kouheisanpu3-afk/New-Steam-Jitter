const {
  Client,
  GatewayIntentBits,
  Events,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  StringSelectMenuBuilder
} = require('discord.js');

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
// Bot作成
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

const TOKEN = process.env.TOKEN;

const ROLE_ID = "1540560312602988594"; // 認証ロール
const ENGLISH_ROLE_ID = "1540560377866362950"; // Englishロール
const JAPANESE_ROLE_ID = "1540560312602988594"; // ←もし日本語専用ロールあるならここ変更

const CHANNEL_ID = "1540606154093367336";

const RULES_CHANNEL_ID = "1540626614982025327";
const TOS_CHANNEL_ID = "1540627413136973824";

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
        .setStyle(ButtonStyle.Primary)
    );

    const rulesText = `[利用規約](https://discord.com/channels/${channel.guild.id}/${RULES_CHANNEL_ID})`;
    const tosText = `[Terms of Service](https://discord.com/channels/${channel.guild.id}/${TOS_CHANNEL_ID})`;

    const embedJP = new EmbedBuilder()
      .setColor(0x0099ff)
      .setDescription(
        "## 認証\n\n" +
        "下のボタンをクリックすると、認証が完了します。認証を完了すると" +
        `${rulesText}に同意したものとみなされます。`
      );

    const embedEN = new EmbedBuilder()
      .setColor(0x0099ff)
      .setDescription(
        "## Verification\n\n" +
        `Click the button below to complete verification. By completing verification, you agree to the ${tosText}.`
      );

    await channel.send({ embeds: [embedJP] });
    await channel.send({ embeds: [embedEN], components: [row] });

  } catch (err) {
    console.log(err);
  }
});

// =======================
// ボタン & セレクト処理
client.on(Events.InteractionCreate, async (interaction) => {

  if (!interaction.isStringSelectMenu()) return;

  const member = await interaction.guild.members.fetch(interaction.user.id);

  if (interaction.values[0] === "jp") {

    // 既に認証済み
    if (member.roles.cache.has(ROLE_ID)) {
      return interaction.update({
        embeds: [
          new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle("認証済み")
            .setDescription("すでに認証済みです")
        ],
        components: []
      });
    }

    // 日本語ロール付与 + 英語ロール削除
    await member.roles.add(ROLE_ID);
    await member.roles.remove(ENGLISH_ROLE_ID);

    return interaction.update({
      embeds: [
        new EmbedBuilder()
          .setColor(0x00ff99)
          .setTitle("認証完了")
          .setDescription("認証が完了しました 👍")
      ],
      components: []
    });
  }

  if (interaction.values[0] === "en") {

    // 既に認証済み
    if (member.roles.cache.has(ROLE_ID)) {
      return interaction.update({
        embeds: [
          new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle("Already Verified")
            .setDescription("You are already verified.")
        ],
        components: []
      });
    }

    // 英語ロール付与 + 日本語ロール削除
    await member.roles.add(ROLE_ID);
    await member.roles.add(ENGLISH_ROLE_ID);
    await member.roles.remove(JAPANESE_ROLE_ID);

    return interaction.update({
      embeds: [
        new EmbedBuilder()
          .setColor(0x00ff99)
          .setTitle("Verification Complete")
          .setDescription("Verification completed 👍")
      ],
      components: []
    });
  }
});

// =======================
client.login(TOKEN);
