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
`下のボタンでチケット作成できます`
        )
        .setColor(0x4aa3ff);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("ticket_create")
          .setLabel("チケットを作成")
          .setStyle(ButtonStyle.Primary)
      );

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
      // チケット作成（完全修正版）
      // =========================
      if (interaction.customId === "ticket_create") {

        const uid = interaction.user.id;

        // 🔥即ロック（最重要）
        if (creatingUsers.has(uid)) {
          return interaction.reply({
            content: "少し待ってください",
            ephemeral: true
          });
        }

        if (activeTickets.has(uid)) {
          return interaction.reply({
            content: "既にチケットがあります",
            ephemeral: true
          });
        }

        // ★先にチェック（ここが重要）
        const exists = interaction.guild.channels.cache.find(
          c => c.parentId === CATEGORY_ID && c.topic === uid
        );

        if (exists) {
          activeTickets.add(uid);
          return interaction.reply({
            content: "既にチャンネルが存在します",
            ephemeral: true
          });
        }

        creatingUsers.add(uid);

        try {

          const guild = interaction.guild;
          const user = interaction.user;

          const channel = await guild.channels.create({
            name: `ticket-${user.username}`,
            type: ChannelType.GuildText,
            parent: CATEGORY_ID,
            topic: uid,
            permissionOverwrites: [
              { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
              {
                id: uid,
                allow: [
                  PermissionsBitField.Flags.ViewChannel,
                  PermissionsBitField.Flags.SendMessages
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

          activeTickets.add(uid);

          await interaction.reply({
            content: `チケット作成完了: ${channel}`,
            ephemeral: true
          });

          const selectMenu = new StringSelectMenuBuilder()
            .setCustomId("ticket_category")
            .setPlaceholder("お問い合わせ内容を選択")
            .addOptions([
              { label: "reWASD", value: "rewasd" },
              { label: "Steam", value: "steam_jitter" },
              { label: "その他", value: "other" }
            ]);

          await channel.send({
            embeds: [
              new EmbedBuilder()
                .setColor(0x4aa3ff)
                .setDescription("内容を選択してください")
            ],
            components: [
              new ActionRowBuilder().addComponents(selectMenu)
            ]
          });

        } finally {
          setTimeout(() => creatingUsers.delete(uid), 1500);
        }
      }

      // =========================
      // カテゴリ
      // =========================
      else if (interaction.customId === "ticket_category") {

        const value = interaction.values[0];

        let label = "不明";
        if (value === "rewasd") label = "reWASD";
        if (value === "steam_jitter") label = "Steam";
        if (value === "other") label = "その他";

        ticketState.set(interaction.channel.id, label);

        return interaction.update({
          embeds: [
            new EmbedBuilder()
              .setColor(0x4aa3ff)
              .setDescription(`選択: ${label}`)
          ],
          components: []
        });
      }

      // =========================
      // 削除
      // =========================
      else if (interaction.customId === "ticket_close") {
        activeTickets.delete(interaction.user.id);
        await interaction.channel.delete().catch(() => {});
      }

      // =========================
      // 解決
      // =========================
      else if (interaction.customId === "ticket_resolved") {

        await interaction.channel.send({
          embeds: [
            new EmbedBuilder()
              .setTitle("解決済み")
              .setColor(0x57F287)
          ]
        });
      }

    } catch (err) {
      console.error(err);

      if (!interaction.replied) {
        interaction.reply({
          content: "エラー",
          ephemeral: true
        }).catch(() => {});
      }
    }
  });
};
