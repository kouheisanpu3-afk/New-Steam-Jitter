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
  const ticketState = new Map();
  const activeTickets = new Set();

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

    try {

      if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;

      // =========================
      // チケット作成
      // =========================
      if (interaction.customId === "ticket_create") {

        if (activeTickets.has(interaction.user.id)) {
          return interaction.reply({
            content: "すでにチケットが存在します。",
            ephemeral: true
          }).catch(() => {});
        }

        const existsChannel = interaction.guild.channels.cache.find(
          c => c.parentId === CATEGORY_ID && c.topic === interaction.user.id
        );

        if (existsChannel) {
          activeTickets.add(interaction.user.id);
          return interaction.reply({
            content: "既にチケットチャンネルが存在します。",
            ephemeral: true
          }).catch(() => {});
        }

        await interaction.deferUpdate().catch(() => {});

        const guild = interaction.guild;
        const user = interaction.user;

        const newChannel = await guild.channels.create({
          name: `ticket-${user.username}`,
          type: ChannelType.GuildText,
          parent: CATEGORY_ID,
          topic: user.id,
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

        activeTickets.add(user.id);

        // ★ここ追加（作成通知）
        const notifyEmbed = new EmbedBuilder()
          .setColor(0x4aa3ff)
          .setDescription(
`チケットが作成されました

チャンネル：${newChannel}`
          );

        const panelChannel = await client.channels.fetch(TICKET_CHANNEL_ID);
        await panelChannel.send({ embeds: [notifyEmbed] });

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
            { label: "reWASD", value: "rewasd" },
            { label: "Steamジッターマクロ", value: "steam_jitter" },
            { label: "その他", value: "other" }
          ]);

        await newChannel.send({ embeds: [embed], components: [row] });
        await newChannel.send({
          embeds: [selectInfo],
          components: [new ActionRowBuilder().addComponents(selectMenu)]
        });
      }

      // =========================
      // 削除確認UI
      // =========================
      else if (interaction.customId === "ticket_close") {

        const embed = new EmbedBuilder()
          .setColor(0xff6b6b)
          .setDescription("このチケットを消去しますか？");

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("ticket_close_confirm")
            .setLabel("OK")
            .setStyle(ButtonStyle.Success),

          new ButtonBuilder()
            .setCustomId("ticket_close_cancel")
            .setLabel("キャンセル")
            .setStyle(ButtonStyle.Secondary)
        );

        return interaction.reply({
          embeds: [embed],
          components: [row],
          ephemeral: true
        });
      }

      else if (interaction.customId === "ticket_close_confirm") {

        await interaction.update({
          content: "削除します...",
          embeds: [],
          components: []
        });

        setTimeout(() => {
          interaction.channel.delete().catch(() => {});
        }, 1000);
      }

      else if (interaction.customId === "ticket_close_cancel") {
        return interaction.update({
          content: "キャンセルしました",
          embeds: [],
          components: []
        });
      }

      // =========================
      // 戻るボタン
      // =========================
      else if (interaction.customId === "ticket_back") {

        const embed = new EmbedBuilder()
          .setColor(0x4aa3ff)
          .setDescription(
`**ご質問・お問い合わせ内容の選択**
下のボックスからご質問・お問い合わせ内容を選択してください。`
          );

        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId("ticket_category")
          .setPlaceholder("お問い合わせ内容を選択")
          .addOptions([
            { label: "reWASD", value: "rewasd" },
            { label: "Steamジッターマクロ", value: "steam_jitter" },
            { label: "その他", value: "other" }
          ]);

        return interaction.update({
          embeds: [embed],
          components: [new ActionRowBuilder().addComponents(selectMenu)]
        });
      }

      else if (interaction.customId === "ticket_resolved") {
        await interaction.channel.send({
          embeds: [
            new EmbedBuilder()
              .setDescription("このチケットは解決済みとしてマークされました")
              .setColor(0x57F287)
          ]
        });
      }

    } catch (err) {
      console.error(err);
    }
  });
};
