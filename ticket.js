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

    } catch (err) {
      console.error("パネル設置エラー:", err);
    }
  });

  client.on(Events.InteractionCreate, async (interaction) => {

    try {

      if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;

      // =========================
      // セレクトメニュー
      // =========================
      if (interaction.isStringSelectMenu() && interaction.customId === "ticket_category") {

        const value = interaction.values[0];

        await interaction.deferUpdate().catch(() => {});

        const embed = new EmbedBuilder().setColor(0x4aa3ff);

        if (value === "rewasd") {
          embed.setDescription("**reWASDについてのお問い合わせ**\n内容を記入してください。");
        } else if (value === "steam_jitter") {
          embed.setDescription("**Steamジッターマクロについてのお問い合わせ**\n内容を記入してください。");
        } else {
          embed.setDescription("**その他のお問い合わせ**\n内容を記入してください。");
        }

        return interaction.channel.send({ embeds: [embed] });
      }

      // =========================
      // チケット作成（ここ修正）
      // =========================
      if (interaction.customId === "ticket_create") {

        const existsChannel = interaction.guild.channels.cache.find(
          c => c.parentId === CATEGORY_ID && c.topic === interaction.user.id
        );

        if (existsChannel) {
          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(0xff9999)
                .setDescription("既に作成されたチケットが存在します\n既存のチャンネルを使用してください。")
            ],
            ephemeral: true
          }).catch(() => {});
        }

        await interaction.deferUpdate().catch(() => {});

        const guild = interaction.guild;
        const user = interaction.user;

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

        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId("ticket_category")
          .setPlaceholder("お問い合わせ内容を選択")
          .addOptions([
            {
              label: "reWASD",
              value: "rewasd",
              description: "reWASDに関するご質問・お問い合わせ",
              emoji: { id: "1541059202737512508", name: "reWASD" }
            },
            {
              label: "Steamジッターマクロ",
              value: "steam_jitter",
              description: "Steamジッターマクロに関するご質問・お問い合わせ",
              emoji: { id: "1541060018567254076", name: "pngwingcom" }
            },
            {
              label: "その他",
              value: "other",
              description: "上記に当てはまらないご質問・お問い合わせ",
              emoji: { id: "1541062193863327744", name: "chat" }
            }
          ]);

        await channel.send({ embeds: [embed], components: [row] });
        await channel.send({
          embeds: [
            new EmbedBuilder()
              .setColor(0x4aa3ff)
              .setDescription("**ご質問・お問い合わせ内容の選択**\n下のボックスからご質問・お問い合わせ内容を選択してください。")
          ],
          components: [new ActionRowBuilder().addComponents(selectMenu)]
        });

        return interaction.followUp({
          embeds: [
            new EmbedBuilder()
              .setColor(0x4aa3ff)
              .setDescription(`チケットが作成されました\n\nチャンネル：${channel}`)
          ],
          ephemeral: true
        });
      }

      // =========================
      // 戻る
      // =========================
      else if (interaction.customId === "ticket_back") {

        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId("ticket_category")
          .setPlaceholder("お問い合わせ内容を選択")
          .addOptions([
            {
              label: "reWASD",
              value: "rewasd",
              description: "reWASDに関するご質問・お問い合わせ",
              emoji: { id: "1541059202737512508", name: "reWASD" }
            },
            {
              label: "Steamジッターマクロ",
              value: "steam_jitter",
              description: "Steamジッターマクロに関するご質問・お問い合わせ",
              emoji: { id: "1541060018567254076", name: "pngwingcom" }
            },
            {
              label: "その他",
              value: "other",
              description: "上記に当てはまらないご質問・お問い合わせ",
              emoji: { id: "1541062193863327744", name: "chat" }
            }
          ]);

        return interaction.update({
          embeds: [
            new EmbedBuilder()
              .setColor(0x4aa3ff)
              .setDescription("**ご質問・お問い合わせ内容の選択**\n下のボックスからご質問・お問い合わせ内容を選択してください。")
          ],
          components: [new ActionRowBuilder().addComponents(selectMenu)]
        });
      }

      // =========================
      // チケット削除
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

      else if (interaction.customId === "ticket_close_confirm") {
        await interaction.deferUpdate().catch(() => {});
        setTimeout(() => interaction.channel.delete().catch(() => {}), 500);
      }

      else if (interaction.customId === "ticket_close_cancel") {
        return interaction.deferUpdate().catch(() => {});
      }

    } catch (err) {
      console.error(err);
    }
  });
};
