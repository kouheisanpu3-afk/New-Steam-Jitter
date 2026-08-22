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

// ロールID
const VERIFY_ROLE_ID = "1540560312602988594"; 
const ENGLISH_ROLE_ID = "1540560377866362950"; 

// チャンネルID
const CHANNEL_ID = "1540606154093367336";

const RULES_CHANNEL_ID = "1540626614982025327";
const TOS_CHANNEL_ID = "1540627413136973824";

// =======================
// 起動時メッセージ送信
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

    // =======================
    // 🇯🇵 日本語Embed（余白強化）
    const embedJP = new EmbedBuilder()
      .setColor(0x0099ff)
      .setDescription(
        "## 認証\n\n" +
        "下のボタンをクリックすると認証が完了します。\n\n" +
        "認証を完了すると以下に同意したものとみなされます。\n\n" +
        `${rulesText}\n\n\n`
      );

    // =======================
    // 🇺🇸 EnglishEmbed（余白強化）
    const embedEN = new EmbedBuilder()
      .setColor(0x0099ff)
      .setDescription(
        "## Verification\n\n" +
        "Click the button below to complete verification.\n\n" +
        "By continuing, you agree to the Terms of Service.\n\n" +
        `${tosText}\n\n\n`
      );

    await channel.send({ embeds: [embedJP] });
    await channel.send({ embeds: [embedEN], components: [row] });

  } catch (err) {
    console.log(err);
  }
});

// =======================
// インタラクション処理
client.on(Events.InteractionCreate, async (interaction) => {

  // =======================
  // ボタン処理
  if (interaction.isButton()) {

    if (interaction.customId === "verify") {

      const select = new StringSelectMenuBuilder()
        .setCustomId("select_lang")
        .setPlaceholder("言語を選択 / Select Language")
        .addOptions([
          {
            label: "日本語",
            value: "jp",
            emoji: "🇯🇵"
          },
          {
            label: "English",
            value: "en",
            emoji: "🇺🇸"
          }
        ]);

      const row = new ActionRowBuilder().addComponents(select);

      return interaction.reply({
        content: "言語を選択してください",
        components: [row],
        ephemeral: true
      });
    }
  }

  // =======================
  // セレクトメニュー
  if (!interaction.isStringSelectMenu()) return;

  const member = await interaction.guild.members.fetch(interaction.user.id);

  // =======================
  // 日本語選択
  if (interaction.values[0] === "jp") {

    await member.roles.add(VERIFY_ROLE_ID);

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

  // =======================
  // English選択（認証ロールなし）
  if (interaction.values[0] === "en") {

    await member.roles.add(ENGLISH_ROLE_ID);

    return interaction.update({
      embeds: [
        new EmbedBuilder()
          .setColor(0x00ff99)
          .setTitle("Selected")
          .setDescription("English selected 👍")
      ],
      components: []
    });
  }
});

// =======================
client.login(TOKEN);
