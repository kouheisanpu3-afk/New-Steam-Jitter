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
  let ticketNumber = 1;

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

        const guild = interaction.guild;
        const user = interaction.user;

        if (creatingUsers.has(user.id)) {
          return interaction.reply({
            content: "チケット作成中です。少し待ってください。",
            ephemeral: true
          });
        }

        creatingUsers.add(user.id);

        const existsChannel = interaction.guild.channels.cache.find(
          c => c.parentId === CATEGORY_ID && c.topic === user.id
        );

        creatingUsers.delete(user.id);

        if (existsChannel) {
          const embed = new EmbedBuilder()
            .setColor(0xFF4D4D)
            .setDescription(
              "既に作成されたチケットが存在します\n既存のチャンネルを使用してください。"
            );

          return interaction.reply({
            embeds: [embed],
            ephemeral: true
          });
        }

        // ⭐ここだけ変更：parent削除（カテゴリー外作成）
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
            {
              label: "reWASD",
              value: "rewasd",
              description: "reWASDに関するご質問・お問い合わせ",
              emoji: { id: "1550853538618417272", name: "reWASD" }
            },
            {
              label: "Steamジッターマクロ",
              value: "steam_jitter",
              description: "Steamジッターマクロに関するご質問・お問い合わせ",
              emoji: { id: "1550853288919048282", name: "pngwingcom" }
            },
            {
              label: "その他",
              value: "other",
              description: "上記に当てはまらないご質問・お問い合わせ",
              emoji: { id: "1550853719061565460", name: "chat" }
            }
          ]);

        const selectRow = new ActionRowBuilder().addComponents(selectMenu);

        await channel.send({ embeds: [embed], components: [row] });
        await channel.send({ embeds: [selectInfo], components: [selectRow] });

        const createdEmbed = new EmbedBuilder()
          .setColor(0x4aa3ff)
          .setDescription(
`チケットが作成されました
チャンネル： ${channel}`
          );

        return interaction.reply({
          embeds: [createdEmbed],
          ephemeral: true
        });
      }

      // ↓↓↓以下全部そのまま（変更なし）
      else if (interaction.customId === "ticket_category") {
        const value = interaction.values[0];

        let label = "不明";

        if (value === "steam_jitter") label = "Steamジッターマクロ";
        if (value === "rewasd") label = "reWASD";
        if (value === "other") label = "その他";

        ticketState.set(interaction.channel.id, { value, label });

        const embed = new EmbedBuilder()
          .setColor(0x4aa3ff)
          .setDescription(
`**ご質問・お問い合わせ内容の選択**

選択内容：${label}

続けて下のボックスからメンションの要否を選択してください。`
          );

        const followSelect = new StringSelectMenuBuilder()
          .setCustomId("ticket_ping_choice")
          .setPlaceholder("メンションの要否")
          .addOptions([
            {
              label: "🔔対応時にメンションを要する",
              value: "ping_yes",
              description: "管理者が対応開始時にメンションします。"
            },
            {
              label: "🔕対応時にメンションを要しない",
              value: "ping_no",
              description: "メンションは行いません。"
            }
          ]);

        const backButton = new ButtonBuilder()
          .setCustomId("ticket_back")
          .setLabel("戻る")
          .setStyle(ButtonStyle.Secondary);

        return interaction.update({
          embeds: [embed],
          components: [
            new ActionRowBuilder().addComponents(followSelect),
            new ActionRowBuilder().addComponents(backButton)
          ]
        });
      }

      else if (interaction.customId === "ticket_ping_choice") {

        const state = ticketState.get(interaction.channel.id);
        const isYes = interaction.values[0] === "ping_yes";

        const embed = new EmbedBuilder()
          .setColor(isYes ? 0xFFFF00 : 0x4aa3ff)
          .setDescription(
`**ご質問・お問い合わせ内容の選択**

選択内容：${state?.label ?? "不明"}
メンション：${isYes ? "要する" : "要しない"}

以下にご質問・お問い合わせをご記入ください。`
          );

        const changeButton = new ButtonBuilder()
          .setCustomId("ticket_back")
          .setLabel("ご質問・お問い合わせ内容を変更")
          .setStyle(ButtonStyle.Secondary);

        return interaction.update({
          embeds: [embed],
          components: [new ActionRowBuilder().addComponents(changeButton)]
        });
      }

    } catch (err) {
      console.error("Interaction Error:", err);

      if (!interaction.replied) {
        interaction.reply({
          content: "エラーが発生しました",
          ephemeral: true
        }).catch(() => {});
      }
    }
  });
};
