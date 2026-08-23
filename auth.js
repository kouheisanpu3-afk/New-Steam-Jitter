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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Webサーバー起動:", PORT);
});

// =======================
// Bot作成
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
// ロール・ID
const ROLE_ID_JP = "1540560312602988594";
const ROLE_ID_EN = "1540560377866362950";

const CHANNEL_ID = "1540606154093367336";
const RULES_CHANNEL_ID = "1540626614982025327";
const TOS_CHANNEL_ID = "1540627413136973824";

// =======================
// 起動時メッセージ送信
client.once(Events.ClientReady, async () => {
  console.log(`ログイン: ${client.user.tag}`);

  try {
    const channel = await client.channels.fetch(CHANNEL_ID);

    const messages = await channel.messages.fetch({ limit: 10 });

    const exists = messages.some(m =>
      m.author.id === client.user.id &&
      m.embeds.length > 0 &&
      m.embeds[0].description?.includes("認証")
    );

    if (exists) {
      console.log("既に認証メッセージあり");
      return;
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("verify")
        .setLabel("認証/Verify")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("change_lang")
        .setLabel("言語変更/Change Language")
        .setStyle(ButtonStyle.Secondary)
    );

    const rulesText = `[利用規約](https://discord.com/channels/${channel.guild.id}/${RULES_CHANNEL_ID})`;
    const tosText = `[Terms of Service](https://discord.com/channels/${channel.guild.id}/${TOS_CHANNEL_ID})`;

    const embedJP = new EmbedBuilder()
      .setColor(0x6f8fa6)
      .setTitle("認証")
      .setDescription(
        "下のボタンをクリックすると認証できます。\n" +
        `認証すると${rulesText}に同意したものとみなされます。`
      );

    const embedEN = new EmbedBuilder()
      .setColor(0x6f8fa6)
      .setTitle("Verification")
      .setDescription(
        `Click the button below to verify.\nYou agree to ${tosText}.`
      );

    await channel.send({ embeds: [embedJP] });
    await channel.send({ embeds: [embedEN], components: [row] });

  } catch (err) {
    console.error("起動時エラー:", err);
  }
});

// =======================
// インタラクション処理
client.on(Events.InteractionCreate, async (interaction) => {

  // =======================
  // ボタン
  if (interaction.isButton()) {

    const select = new StringSelectMenuBuilder()
      .setCustomId("select_lang")
      .setPlaceholder("言語を選択 / Select Language")
      .addOptions([
        { label: "日本語", value: "jp", emoji: "🇯🇵" },
        { label: "English", value: "en", emoji: "🇺🇸" }
      ]);

    const row = new ActionRowBuilder().addComponents(select);

    if (interaction.customId === "verify" || interaction.customId === "change_lang") {
      return interaction.reply({
        content: "言語を選択してください",
        components: [row],
        ephemeral: true
      });
    }
  }

  // =======================
  // セレクト
  if (interaction.isStringSelectMenu()) {

    const member = await interaction.guild.members.fetch(interaction.user.id);

    const value = interaction.values[0];

    if (value === "jp") {
      await member.roles.remove(ROLE_ID_EN).catch(() => {});
      await member.roles.add(ROLE_ID_JP);

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

    if (value === "en") {
      await member.roles.remove(ROLE_ID_JP).catch(() => {});
      await member.roles.add(ROLE_ID_EN);

      return interaction.update({
        embeds: [
          new EmbedBuilder()
            .setColor(0x00ff99)
            .setTitle("Verification Complete")
            .setDescription("Verification completed")
        ],
        components: []
      });
    }
  }
});

// =======================
// 起動
client.login(TOKEN);
