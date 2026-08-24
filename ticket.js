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

  // =========================
  // パネル設置
  // =========================
  client.once(Events.ClientReady, async () => {
    try {
      const channel = await client.channels.fetch(TICKET_CHANNEL_ID);
      if (!channel) return console.log("チケットチャンネル取得失敗");

      const embed = new EmbedBuilder()
        .setTitle("ご質問・お問い合わせチケット")
        .setDescription(
`下のボタンをクリックするとチケットが作成されます。
利用規約同意扱いになります。`
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

      const exists = messages.some(m =>
        m.author.id === client.user.id && m.components.length > 0
      );

      if (exists) return;

      await channel.send({ embeds: [embed], components: [row] });

    } catch (err) {
      console.error(err);
    }
  });

  // =========================
  // Interaction
  // =========================
  client.on(Events.InteractionCreate, async (interaction) => {

    try {

      if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;

      // =========================
      // チケット作成
      // =========================
      if (interaction.customId === "ticket_create") {

        const user = interaction.user;
        const guild = interaction.guild;

        if (creatingUsers.has(user.id)) {
          return interaction.reply({
            content: "作成中です",
            ephemeral: true
          });
        }

        creatingUsers.add(user.id);

        const existsChannel = guild.channels.cache.find(
          c => c.parentId === CATEGORY_ID && c.topic === user.id
        );

        creatingUsers.delete(user.id);

        if (existsChannel) {
          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(0xFF4D4D)
                .setDescription("既にチケットがあります")
            ],
            ephemeral: true
          });
        }

        const channel = await guild.channels.create({
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

        const now = new Date().toLocaleString("ja-JP", {
          timeZone: "Asia/Tokyo"
        });

        const embed = new EmbedBuilder()
          .setAuthor({ name: user.username, iconURL: user.displayAvatarURL() })
          .setDescription(`作成者: <@${user.id}>\n日時: ${now}`)
          .setColor(0x57F287);

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("ticket_close")
            .setLabel("チケット削除")
            .setStyle(ButtonStyle.Danger)
        );

        await channel.send({ embeds: [embed], components: [row] });

        return interaction.reply({
          content: `作成しました: ${channel}`,
          ephemeral: true
        });
      }

      // =========================
      // 削除確認UI
      // =========================
      else if (interaction.customId === "ticket_close") {

        const embed = new EmbedBuilder()
          .setColor(0xFF4D4D)
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

      // =========================
      // OK → 削除
      // =========================
      else if (interaction.customId === "ticket_close_confirm") {

        await interaction.update({
          content: "削除中...",
          embeds: [],
          components: []
        });

        setTimeout(() => {
          interaction.channel.delete().catch(() => {});
        }, 1000);
      }

      // =========================
      // キャンセル → UI閉じる
      // =========================
      else if (interaction.customId === "ticket_close_cancel") {

        return interaction.update({
          content: "キャンセルしました",
          embeds: [],
          components: []
        });
      }

    } catch (err) {
      console.error(err);

      if (interaction.replied || interaction.deferred) return;

      interaction.reply({
        content: "エラー",
        ephemeral: true
      }).catch(() => {});
    }
  });
};
