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
      if (!channel) return;

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

      const messages = await channel.messages.fetch({ limit: 10 });
      const exists = messages.some(m => m.author.id === client.user.id && m.components.length > 0);
      if (exists) return;

      await channel.send({ embeds: [embed], components: [row] });

    } catch (err) {
      console.error(err);
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
            embeds: [
              new EmbedBuilder()
                .setColor(0xff9999)
                .setDescription("既に作成されたチケットが存在します\n既存のチャンネルを使用してください。")
            ],
            ephemeral: true
          });
        }

        const existsChannel = interaction.guild.channels.cache.find(
          c => c.parentId === CATEGORY_ID && c.topic === interaction.user.id
        );

        if (existsChannel) {
          activeTickets.add(interaction.user.id);
          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(0xff9999)
                .setDescription("既に作成されたチケットが存在します\n既存のチャンネルを使用してください。")
            ],
            ephemeral: true
          });
        }

        await interaction.deferUpdate();

        const channel = await interaction.guild.channels.create({
          name: `ticket-${interaction.user.username}`,
          type: ChannelType.GuildText,
          parent: CATEGORY_ID,
          topic: interaction.user.id,
          permissionOverwrites: [
            { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
            {
              id: interaction.user.id,
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

        activeTickets.add(interaction.user.id);

        await interaction.followUp({
          embeds: [
            new EmbedBuilder()
              .setColor(0x4aa3ff)
              .setDescription(`チケットが作成されました\n\nチャンネル：${channel}`)
          ],
          ephemeral: true
        });

        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId("ticket_category")
          .setPlaceholder("お問い合わせ内容を選択")
          .addOptions([
            {
              label: "reWASD",
              value: "rewasd",
              description: "reWASDに関するご質問・お問い合わせ"
            },
            {
              label: "Steamジッターマクロ",
              value: "steam_jitter",
              description: "Steamジッターマクロに関するご質問・お問い合わせ"
            },
            {
              label: "その他",
              value: "other",
              description: "その他の内容"
            }
          ]);

        await channel.send({
          embeds: [
            new EmbedBuilder()
              .setColor(0x4aa3ff)
              .setDescription("お問い合わせ内容を選択してください")
          ],
          components: [new ActionRowBuilder().addComponents(selectMenu)]
        });
      }

      // =========================
      // セレクトメニュー（復活）
      // =========================
      else if (interaction.customId === "ticket_category") {

        const value = interaction.values[0];

        return interaction.reply({
          content: `選択されました：${value}`,
          ephemeral: true
        });
      }

      // =========================
      // 削除確認
      // =========================
      else if (interaction.customId === "ticket_close") {

        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xff4d4d)
              .setDescription("このチケットを消去しますか？")
          ],
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId("ticket_close_confirm")
                .setLabel("OK")
                .setStyle(ButtonStyle.Success),
              new ButtonBuilder()
                .setCustomId("ticket_close_cancel")
                .setLabel("キャンセル")
                .setStyle(ButtonStyle.Secondary)
            )
          ],
          ephemeral: true
        });
      }

      // OK（無言削除）
      else if (interaction.customId === "ticket_close_confirm") {
        await interaction.deferUpdate();
        setTimeout(() => interaction.channel.delete().catch(() => {}), 500);
      }

      // キャンセル（無言閉じ）
      else if (interaction.customId === "ticket_close_cancel") {
        await interaction.deferUpdate();
      }

    } catch (err) {
      console.error(err);
    }
  });
};
