const {
  Events,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField,
  ChannelType,
  StringSelectMenuBuilder
} = require("discord.js");

const TICKET_CHANNEL_ID = "1541001019880640573";
const CATEGORY_ID = "1541000895167201300";
const TERMS_CHANNEL_ID = "1540626614982025327";

module.exports = (client) => {

  const creatingUsers = new Set();

  client.once(Events.ClientReady, async () => {
    try {
      const channel = await client.channels.fetch(TICKET_CHANNEL_ID);
      if (!channel) return console.log("チケットチャンネル取得失敗");

      const embed = new EmbedBuilder()
        .setTitle("ご質問・お問い合わせチケット")
        .setDescription(
`下のボタンをクリックすると、ご質問・お問い合わせチケットが作成されます。チケットを作成すると [利用規約](https://discord.com/channels/${channel.guildId}/${TERMS_CHANNEL_ID}) に同意したものとみなされます。どんな些細なご質問・お問い合わせでも、管理者が丁寧に対応させていただきます。ご気軽にご利用ください。`
        )
        .setColor(0x4aa3ff);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("ticket_create")
          .setLabel("チケットを作成")
          .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
          .setLabel("利用規約を確認")
          .setStyle(ButtonStyle.Link)
          .setURL(`https://discord.com/channels/${channel.guildId}/${TERMS_CHANNEL_ID}`)
      );

      const messages = await channel.messages.fetch({ limit: 10 });
      const exists = messages.some(m =>
        m.author.id === client.user.id &&
        m.components.length > 0
      );

      if (exists) return console.log("既にチケットパネルあり");

      await channel.send({ embeds: [embed], components: [row] });

      console.log("チケットパネル設置完了");

    } catch (err) {
      console.error("パネル設置エラー:", err);
    }
  });

  client.on(Events.InteractionCreate, async (interaction) => {

    if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;

    // =========================
    // チケット作成
    if (interaction.customId === "ticket_create") {

      if (creatingUsers.has(interaction.user.id)) return;
      creatingUsers.add(interaction.user.id);

      try {
        const guild = interaction.guild;
        const user = interaction.user;

        // 🔥 超強化チェック（ユーザーIDベース）
        const existing = guild.channels.cache.find(
          c => c.type === ChannelType.GuildText &&
               c.name === `ticket-${user.id}`
        );

        if (existing) {
          return interaction.reply({
            content: "既に作成されたチケットが存在します。既存のチャンネルを使用してください。",
            ephemeral: true
          });
        }

        const channel = await guild.channels.create({
          name: `ticket-${user.id}`, // ← ユーザーID固定で重複防止
          type: ChannelType.GuildText,
          parent: CATEGORY_ID,
          permissionOverwrites: [
            { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
            {
              id: user.id,
              allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.ReadMessageHistory
              ]
            },
            {
              id: client.user.id,
              allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages
              ]
            }
          ]
        });

        const now = new Date().toLocaleString("ja-JP", {
          timeZone: "Asia/Tokyo"
        });

        const embed = new EmbedBuilder()
          .setAuthor({
            name: user.username,
            iconURL: user.displayAvatarURL()
          })
          .setDescription(
`チケットが作成されました

作成者: <@${user.id}>
作成日時: ${now}`
          )
          .setColor(0x57F287);

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("ticket_close")
            .setLabel("チケットを消去")
            .setStyle(ButtonStyle.Danger),

          new ButtonBuilder()
            .setCustomId("ticket_resolved")
            .setLabel("このチケットを解決済みとしてマーク")
            .setStyle(ButtonStyle.Success)
        );

        const selectInfo = new EmbedBuilder()
          .setColor(0x4aa3ff)
          .setDescription(
`**ご質問・お問い合わせ内容の選択**
下のボックスからご質問・お問い合わせ内容を選択してください。`
          );

        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId("ticket_category")
          .setPlaceholder("お問い合わせ内容を選択")
          .addOptions([
            { label: "一般質問", value: "general" },
            { label: "不具合報告", value: "bug" },
            { label: "その他", value: "other" }
          ]);

        const selectRow = new ActionRowBuilder().addComponents(selectMenu);

        await channel.send({ embeds: [embed], components: [row] });
        await channel.send({ embeds: [selectInfo], components: [selectRow] });

        await interaction.deferReply({ ephemeral: true }).catch(() => {});
        await interaction.deleteReply().catch(() => {});

      } finally {
        setTimeout(() => creatingUsers.delete(interaction.user.id), 3000);
      }
    }

    else if (interaction.customId === "ticket_close") {
      await interaction.reply({
        content: "チケットを削除します",
        ephemeral: true
      });

      setTimeout(() => {
        interaction.channel.delete().catch(() => {});
      }, 2000);
    }

    else if (interaction.customId === "ticket_resolved") {
      const embed = new EmbedBuilder()
        .setTitle("✅ 解決済み")
        .setDescription("このチケットは解決済みとしてマークされました")
        .setColor(0x57F287);

      await interaction.reply({
        content: "解決済みとしてマークしました",
        ephemeral: true
      });

      await interaction.channel.send({ embeds: [embed] });
    }

    else if (interaction.customId === "ticket_category") {
      await interaction.reply({
        content: `選択: ${interaction.values[0]}`,
        ephemeral: true
      });
    }
  });
};
