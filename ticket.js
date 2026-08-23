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
  let creatingGlobal = false;

  client.once(Events.ClientReady, async () => {
    try {
      const channel = await client.channels.fetch(TICKET_CHANNEL_ID);
      if (!channel) return console.log("チケットチャンネル取得失敗");

      const embed = new EmbedBuilder()
        .setTitle("ご質問・お問い合わせチケット")
        .setDescription(
`下のボタンをクリックするとチケットが作成されます。
利用規約に同意したものとみなされます。`
        )
        .setColor(0x4aa3ff);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("ticket_create")
          .setLabel("チケットを作成")
          .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
          .setLabel("利用規約")
          .setStyle(ButtonStyle.Link)
          .setURL(`https://discord.com/channels/${channel.guildId}/${TERMS_CHANNEL_ID}`)
      );

      const messages = await channel.messages.fetch({ limit: 10 });

      const exists = messages.some(
        m => m.author.id === client.user.id && m.components.length > 0
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
      // チケット作成（完全1回保証）
      // =========================
      if (interaction.customId === "ticket_create") {

        if (creatingGlobal || creatingUsers.has(interaction.user.id)) {
          return interaction.reply({
            content: "処理中です",
            ephemeral: true
          }).catch(() => {});
        }

        // 既存チェック（最重要）
        if (activeTickets.has(interaction.user.id)) {
          return interaction.reply({
            content: "すでにチケットがあります",
            ephemeral: true
          }).catch(() => {});
        }

        creatingGlobal = true;
        creatingUsers.add(interaction.user.id);

        // ★重要：即ロック（ここで2重防止）
        await interaction.deferUpdate().catch(() => {});

        const uid = interaction.user.id;
        const guild = interaction.guild;
        const user = interaction.user;

        try {

          // 再チェック（超重要）
          const existsChannel = guild.channels.cache.find(
            c => c.parentId === CATEGORY_ID && c.topic === uid
          );

          if (existsChannel) {
            activeTickets.add(uid);
            return;
          }

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

          activeTickets.add(uid);

          const embed = new EmbedBuilder()
            .setColor(0x57F287)
            .setDescription(`チケット作成: <@${uid}>`);

          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("ticket_close")
              .setLabel("削除")
              .setStyle(ButtonStyle.Danger)
          );

          const selectMenu = new StringSelectMenuBuilder()
            .setCustomId("ticket_category")
            .setPlaceholder("お問い合わせ内容を選択")
            .addOptions([
              { label: "reWASD", value: "rewasd" },
              { label: "Steamジッターマクロ", value: "steam_jitter" },
              { label: "その他", value: "other" }
            ]);

          await channel.send({
            embeds: [embed],
            components: [row]
          });

          await channel.send({
            embeds: [
              new EmbedBuilder()
                .setColor(0x4aa3ff)
                .setDescription("内容を選択してください")
            ],
            components: [new ActionRowBuilder().addComponents(selectMenu)]
          });

        } finally {
          setTimeout(() => {
            creatingUsers.delete(uid);
            creatingGlobal = false;
          }, 2000);
        }
      }

      // =========================
      // カテゴリ（水色固定）
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
        await interaction.channel.delete().catch(() => {});
        activeTickets.delete(interaction.user.id);
      }

    } catch (err) {
      console.error(err);
    }
  });
};
