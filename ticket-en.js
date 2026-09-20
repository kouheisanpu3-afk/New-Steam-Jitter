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

const TICKET_CHANNEL_ID = "1551230131421454447";
const CATEGORY_ID = "1541000895167201300";
const TERMS_CHANNEL_ID = "1517448679013744773";

module.exports = (client) => {

  const creatingUsers = new Set();
  const ticketState = new Map();
  const activeTickets = new Set();
  const processingInteractions = new Set();
  let ticketNumber = 1;

  client.once(Events.ClientReady, async () => {

    try {

      const channel = await client.channels.fetch(TICKET_CHANNEL_ID);

      if (!channel) return console.log("Failed to fetch ticket channel");

      const embed = new EmbedBuilder()
        .setTitle("Support & Inquiry Ticket")
        .setDescription(
`Click the button below to create a support/inquiry ticket. By creating a ticket, you agree to the [Terms of Service](https://discord.com/channels/${channel.guildId}/${TERMS_CHANNEL_ID}). Our staff will respond to all inquiries, no matter how small. Please feel free to use this system.`
        )
        .setColor(0x4aa3ff);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("ticket_create")
          .setLabel("Create Ticket")
          .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
          .setLabel("View Terms")
          .setStyle(ButtonStyle.Link)
          .setURL(`https://discord.com/channels/${channel.guildId}/${TERMS_CHANNEL_ID}`)
      );

      const messages = await channel.messages.fetch({ limit: 10 });

      const exists = messages.some(m =>
        m.author.id === client.user.id &&
        m.components.length > 0
      );

      if (exists) return console.log("Ticket panel already exists");

      await channel.send({ embeds: [embed], components: [row] });

      console.log("Ticket panel created");

    } catch (err) {
      console.error("Panel setup error:", err);
    }
  });

  client.on(Events.InteractionCreate, async (interaction) => {

    try {

      if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;

      if (processingInteractions.has(interaction.id)) return;
      processingInteractions.add(interaction.id);
      setTimeout(() => processingInteractions.delete(interaction.id), 5000);

      if (interaction.customId === "ticket_create") {

        const guild = interaction.guild;
        const user = interaction.user;

        await guild.channels.fetch();

        const remainingTickets = guild.channels.cache.filter(
          c =>
            c.type === ChannelType.GuildText &&
            c.parentId === CATEGORY_ID &&
            c.topic
        );

        if (remainingTickets.size === 0) {
          activeTickets.clear();
        }

        const existingChannel = guild.channels.cache.find(
          c =>
            c.type === ChannelType.GuildText &&
            c.parentId === CATEGORY_ID &&
            c.topic === user.id
        );

        if (existingChannel) {
          activeTickets.add(user.id);

          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(0xFF4D4D)
                .setTitle("Ticket Creation Error")
                .setDescription("You already have an active ticket.\nPlease use your existing ticket channel.")
            ],
            ephemeral: true
          });
        }

        if (creatingUsers.has(user.id) || activeTickets.has(user.id)) {
          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(0xFF4D4D)
                .setDescription("You already have an active ticket.\nPlease use your existing ticket.")
            ],
            ephemeral: true
          });
        }

        creatingUsers.add(user.id);

        try {

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

          const now = new Date().toLocaleString("en-US", {
            timeZone: "Asia/Tokyo"
          });

          const embed = new EmbedBuilder()
            .setAuthor({
              name: user.username,
              iconURL: user.displayAvatarURL()
            })
            .setDescription(
`Ticket has been created

Creator: <@${user.id}>
Created at: ${now}`
            )
            .setColor(0x57F287);

          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("ticket_close")
              .setLabel("Close Ticket")
              .setStyle(ButtonStyle.Danger),

            new ButtonBuilder()
              .setCustomId("ticket_resolved")
              .setLabel("Mark as Resolved")
              .setStyle(ButtonStyle.Success)
          );

          const selectInfo = new EmbedBuilder()
            .setColor(0x4aa3ff)
            .setDescription(
`**Select Inquiry Category**
Please select the category of your inquiry from the menu below.`
            );

          const selectMenu = new StringSelectMenuBuilder()
            .setCustomId("ticket_category")
            .setPlaceholder("Select a category")
            .addOptions([
              {
                label: "reWASD",
                value: "rewasd",
                description: "Questions about reWASD",
                emoji: { id: "1550853538618417272", name: "reWASD" }
              },
              {
                label: "Steam Jitter Macro",
                value: "steam_jitter",
                description: "Questions about Steam jitter macros",
                emoji: { id: "1550853288919048282", name: "pngwingcom" }
              },
              {
                label: "Other",
                value: "other",
                description: "Anything else",
                emoji: { id: "1550853719061565460", name: "chat" }
              }
            ]);

          await channel.send({ embeds: [embed], components: [row] });
          await channel.send({ embeds: [selectInfo], components: [new ActionRowBuilder().addComponents(selectMenu)] });

          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(0x4aa3ff)
                .setDescription(`Ticket created\nChannel: ${channel}`)
            ],
            ephemeral: true
          });

        } finally {
          creatingUsers.delete(user.id);
        }
      }

      else if (interaction.customId === "ticket_category") {

        const value = interaction.values[0];

        let label = "Unknown";
        if (value === "steam_jitter") label = "Steam Jitter Macro";
        if (value === "rewasd") label = "reWASD";
        if (value === "other") label = "Other";

        ticketState.set(interaction.channel.id, { value, label });

        const embed = new EmbedBuilder()
          .setColor(0x4aa3ff)
          .setDescription(
`**Inquiry Category Selected**

Selected: ${label}

Next, choose whether you want to receive mentions when staff respond.`
          );

        const followSelect = new StringSelectMenuBuilder()
          .setCustomId("ticket_ping_choice")
          .setPlaceholder("Mention preference")
          .addOptions([
            {
              label: "🔔 Mention when staff respond",
              value: "ping_yes",
              description: "Staff will mention you when responding."
            },
            {
              label: "🔕 No mentions",
              value: "ping_no",
              description: "Staff will not mention you."
            }
          ]);

        const backButton = new ButtonBuilder()
          .setCustomId("ticket_back")
          .setLabel("Back")
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
`**Inquiry Category Selected**

Category: ${state?.label ?? "Unknown"}
Mention: ${isYes ? "Yes" : "No"}

Please describe your inquiry below.`
          );

        const changeButton = new ButtonBuilder()
          .setCustomId("ticket_back")
          .setLabel("Change Category")
          .setStyle(ButtonStyle.Secondary);

        return interaction.update({
          embeds: [embed],
          components: [new ActionRowBuilder().addComponents(changeButton)]
        });
      }

      else if (interaction.customId === "ticket_back") {

        ticketState.delete(interaction.channel.id);

        const embed = new EmbedBuilder()
          .setColor(0x4aa3ff)
          .setDescription(
`**Select Inquiry Category**
Please choose a category from the menu below.`
          );

        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId("ticket_category")
          .setPlaceholder("Select a category")
          .addOptions([
            {
              label: "reWASD",
              value: "rewasd",
              description: "Questions about reWASD",
              emoji: { id: "1550853538618417272", name: "reWASD" }
            },
            {
              label: "Steam Jitter Macro",
              value: "steam_jitter",
              description: "Questions about Steam jitter macros",
              emoji: { id: "1550853288919048282", name: "pngwingcom" }
            },
            {
              label: "Other",
              value: "other",
              description: "Anything else",
              emoji: { id: "1550853719061565460", name: "chat" }
            }
          ]);

        return interaction.update({
          embeds: [embed],
          components: [new ActionRowBuilder().addComponents(selectMenu)]
        });
      }

      else if (interaction.customId === "ticket_close") {

        const embed = new EmbedBuilder()
          .setColor(0xFF4D4D)
          .setDescription("Are you sure you want to close this ticket?");

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("ticket_close_confirm")
            .setLabel("Confirm")
            .setStyle(ButtonStyle.Danger),

          new ButtonBuilder()
            .setCustomId("ticket_close_cancel")
            .setLabel("Cancel")
            .setStyle(ButtonStyle.Secondary)
        );

        return interaction.reply({
          embeds: [embed],
          components: [row],
          ephemeral: true
        });
      }

      else if (interaction.customId === "ticket_close_confirm") {

        await interaction.reply({
          content: "Closing ticket...",
          ephemeral: true
        });

        setTimeout(() => {
          interaction.channel.delete().catch(() => {});
        }, 1000);
      }

      else if (interaction.customId === "ticket_close_cancel") {

        return interaction.update({
          embeds: [],
          components: [],
          content: "Cancelled"
        }).catch(() => {});
      }

      else if (interaction.customId === "ticket_resolved") {

        const embed = new EmbedBuilder()
          .setTitle("Marked as Resolved")
          .setDescription("This ticket has been marked as resolved.")
          .setColor(0x57F287);

        await interaction.channel.send({ embeds: [embed] });
      }

    } catch (err) {
      console.error("Interaction Error:", err);

      if (!interaction.replied) {
        interaction.reply({
          content: "An error occurred",
          ephemeral: true
        }).catch(() => {});
      }
    }
  });
};
