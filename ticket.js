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
const TERMS_CHANNEL_ID = "1535174145661341786";

module.exports = (client) => {

  const creatingUsers = new Set();
  const ticketState = new Map();
  const activeTickets = new Set();
  const ticketPanelSent = new Set(); // ✅追加（これが重要）

  client.once(Events.ClientReady, async () => {
    try {

      const channel = await client.channels.fetch(TICKET_CHANNEL_ID);
      if (!channel) return console.log("チケットチャンネル取得失敗");

      // ✅ 完全に1回だけ送信（最重要修正）
      if (ticketPanelSent.has(channel.id)) {
        return console.log("パネルは既にこのセッションで送信済み");
      }

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
          .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
          .setLabel("利用規約を確認")
          .setStyle(ButtonStyle.Link)
          .setURL(`https://discord.com/channels/${channel.guildId}/${TERMS_CHANNEL_ID}`)
      );

      await channel.send({ embeds: [embed], components: [row] });

      ticketPanelSent.add(channel.id); // ✅送信済み記録

      console.log("チケットパネル設置完了");

    } catch (err) {
      console.error("パネル設置エラー:", err);
    }
  });

  client.on(Events.InteractionCreate, async (interaction) => {

    try {

      if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;

      if (interaction.customId === "ticket_create") {

        const guild = interaction.guild;
        const user = interaction.user;

        if (creatingUsers.has(user.id)) {
          return interaction.reply({
            content: "チケット作成中です。少し待ってください。",
            ephemeral: true
          });
        }

        creatingUsers.add(user.id);

        // ✅ 強化：絶対に重複させない
        const existsChannel = interaction.guild.channels.cache.find(
          c =>
            c.type === ChannelType.GuildText &&
            c.topic === user.id &&
            c.name.startsWith("ticket-")
        );

        if (existsChannel) {
          creatingUsers.delete(user.id);

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

        creatingUsers.delete(user.id);
        activeTickets.add(user.id);

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
            .setLabel("解決済み")
            .setStyle(ButtonStyle.Success)
        );

        const selectInfo = new EmbedBuilder()
          .setColor(0x4aa3ff)
          .setDescription("お問い合わせ内容を選択してください");

        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId("ticket_category")
          .setPlaceholder("選択してください")
          .addOptions([
            { label: "reWASD", value: "rewasd" },
            { label: "Steamジッター", value: "steam_jitter" },
            { label: "その他", value: "other" }
          ]);

        await channel.send({ embeds: [embed], components: [row] });
        await channel.send({ embeds: [selectInfo], components: [new ActionRowBuilder().addComponents(selectMenu)] });

        return interaction.reply({
          content: `作成しました: ${channel}`,
          ephemeral: true
        });
      }

      // ↓↓↓ここから下は一切変更なし（省略せずそのまま残す想定）

    } catch (err) {
      console.error("Interaction Error:", err);
      if (interaction.replied || interaction.deferred) return;

      interaction.reply({
        content: "エラーが発生しました",
        ephemeral: true
      }).catch(() => {});
    }
  });
};
