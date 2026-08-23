const {
  Events,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField,
  ChannelType
} = require("discord.js");

const TICKET_CHANNEL_ID = "1541001019880640573";
const CATEGORY_ID = "1541000895167201300";

module.exports = (client) => {

  // =========================
  // パネル設置
  client.once(Events.ClientReady, async () => {
    try {
      const channel = await client.channels.fetch(TICKET_CHANNEL_ID);
      if (!channel) return console.log("チケットチャンネル取得失敗");

      const embed = new EmbedBuilder()
        .setTitle("ご質問・お問い合わせチケット")
        .setDescription(
`下のボタンをクリックすると、ご質問・お問い合わせチケットが作成されます。チケットを作成すると利用規約に同意したものとみなされます。どんな些細なご質問・お問い合わせでも、管理者が丁寧に対応させていただきます。ご気軽にご利用ください。`
        )
        .setColor(0x2b2d31);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("ticket_create")
          .setLabel("🎫 チケット作成")
          .setStyle(ButtonStyle.Primary)
      );

      await channel.send({
        embeds: [embed],
        components: [row]
      });

      console.log("チケットパネル設置完了");

    } catch (err) {
      console.error("パネル設置エラー:", err);
    }
  });

  // =========================
  // ボタン処理
  client.on(Events.InteractionCreate, async (interaction) => {

    if (!interaction.isButton()) return;

    // 🎫作成
    if (interaction.customId === "ticket_create") {

      const guild = interaction.guild;
      const user = interaction.user;

      try {
        const channel = await guild.channels.create({
          name: `ticket-${user.username}`,
          type: ChannelType.GuildText,
          parent: CATEGORY_ID,
          permissionOverwrites: [
            {
              id: guild.id,
              deny: [PermissionsBitField.Flags.ViewChannel]
            },
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

        const embed = new EmbedBuilder()
          .setTitle("🎫 チケット")
          .setDescription("管理者が対応するまでお待ちください")
          .setColor(0x57F287);

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("ticket_close")
            .setLabel("🔒 チケットを閉じる")
            .setStyle(ButtonStyle.Danger)
        );

        await channel.send({
          content: `<@${user.id}>`,
          embeds: [embed],
          components: [row]
        });

        await interaction.reply({
          content: "チケットを作成しました",
          ephemeral: true
        });

      } catch (err) {
        console.error("チケット作成エラー:", err);
        await interaction.reply({
          content: "作成に失敗しました",
          ephemeral: true
        });
      }
    }

    // 🔒削除
    if (interaction.customId === "ticket_close") {

      const channel = interaction.channel;

      await interaction.reply({
        content: "チケットを削除します",
        ephemeral: true
      });

      setTimeout(() => {
        channel.delete().catch(() => {});
      }, 2000);
    }
  });
};
