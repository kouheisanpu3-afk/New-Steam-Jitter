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

const TICKET_CHANNEL_ID = "1551134186021322853";
const CATEGORY_ID = "1541000895167201300";
const TERMS_CHANNEL_ID = "1535174181341786";

module.exports = (client) => {

  const creatingUsers = new Set();
  const ticketState = new Map();
  const activeTickets = new Set();

  // 🔥追加（最重要：全体ロック）
  let globalTicketLock = false;

  client.once(Events.ClientReady, async () => {

    try {

      const channel = await client.channels.fetch(TICKET_CHANNEL_ID);

      if (!channel) return console.log("チケットチャンネル取得失敗");

      const embed = new EmbedBuilder()
        .setTitle("ご質問・お問い合わせチケット")
        .setDescription(
`下のボタンをクリックすると、ご質問・お問い合わせチケットが作成されます。チケットを作成すると [利用規約](https://discord.com/channels/${channel.guildId}/${TERMS_CHANNEL_ID}) に同意したものとみなされます。`
        )
        .setColor(0x4aa3ff);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("ticket_create")
          .setLabel("チケットを作成")
          .setStyle(ButtonStyle.Primary)
      );

      await channel.send({ embeds: [embed], components: [row] });

    } catch (err) {
      console.error("パネル設置エラー:", err);
    }
  });

  client.on(Events.InteractionCreate, async (interaction) => {

    try {

      if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;

      // =========================
      // 🔥チケット作成（完全1個保証版）
      // =========================
      if (interaction.customId === "ticket_create") {

        const guild = interaction.guild;
        const user = interaction.user;

        // 🔥全体ロック（同時2回作成防止）
        if (globalTicketLock) {
          return interaction.reply({
            content: "チケット作成処理中です。少し待ってください。",
            ephemeral: true
          });
        }

        globalTicketLock = true;

        try {

          await guild.channels.fetch();

          // ① 既存チェック（最初）
          const existsChannel = guild.channels.cache.find(
            c =>
              c.type === ChannelType.GuildText &&
              c.parentId === CATEGORY_ID &&
              c.topic === user.id
          );

          if (existsChannel) {
            return interaction.reply({
              embeds: [
                new EmbedBuilder()
                  .setColor(0xFF4D4D)
                  .setDescription("すでにチケットが存在します。")
              ],
              ephemeral: true
            });
          }

          // ② 作成直前再チェック（超重要）
          const doubleCheck = guild.channels.cache.find(
            c =>
              c.type === ChannelType.GuildText &&
              c.parentId === CATEGORY_ID &&
              c.topic === user.id
          );

          if (doubleCheck) {
            return interaction.reply({
              content: "既にチケットがあります。",
              ephemeral: true
            });
          }

          // ③ 作成
          const channel = await guild.channels.create({
            name: `ticket-${user.username}`,
            type: ChannelType.GuildText,
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

          // ④ 作成後チェック（保険）
          await guild.channels.fetch();

          const verify = guild.channels.cache.filter(
            c => c.topic === user.id && c.parentId === CATEGORY_ID
          );

          if (verify.size > 1) {
            console.log("⚠ チケット重複発生、削除推奨");
          }

          await interaction.reply({
            content: `作成完了: ${channel}`,
            ephemeral: true
          });

        } finally {
          globalTicketLock = false;
        }
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
