const {
  Client,
  GatewayIntentBits,
  Events,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
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

const ROLE_ID = "1540560312602988594";
const CHANNEL_ID = "1540606154093367336";

const RULES_CHANNEL_ID = "1540626614982025327";
const TOS_CHANNEL_ID = "1540627413136973824";

// =======================
// 起動時メッセージ（日本語＋英語復活）
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
// ボタン処理
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;

  // ① 認証 → そのまま言語UI表示（ここが変更）
  if (interaction.customId === "verify") {

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("lang_jp")
        .setLabel("日本語")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("lang_en")
        .setLabel("English")
        .setStyle(ButtonStyle.Primary)
    );

    return interaction.reply({
      content: "```言語を選択してください / Select Language```",
      components: [row],
      ephemeral: true
    });
  }

  // ② 日本語認証
  if (interaction.customId === "lang_jp") {
    const member = await interaction.guild.members.fetch(interaction.user.id);

    if (member.roles.cache.has(ROLE_ID)) {
      return interaction.reply({
        content: "すでに認証済みです",
        ephemeral: true
      });
    }

    await member.roles.add(ROLE_ID);

    return interaction.reply({
      content: "認証完了しました 👍",
      ephemeral: true
    });
  }

  // ③ English認証
  if (interaction.customId === "lang_en") {
    const member = await interaction.guild.members.fetch(interaction.user.id);

    if (member.roles.cache.has(ROLE_ID)) {
      return interaction.reply({
        content: "Already verified.",
        ephemeral: true
      });
    }

    await member.roles.add(ROLE_ID);

    return interaction.reply({
      content: "Verification completed 👍",
      ephemeral: true
    });
  }
});

// =======================
client.login(TOKEN);
