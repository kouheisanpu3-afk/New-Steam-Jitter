client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;

  // 認証
  if (interaction.customId === "verify") {

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("open_lang")
        .setLabel("言語を選択 / Select Language") // ←ここがクリック対象になる
        .setStyle(ButtonStyle.Secondary)
    );

    return interaction.reply({
      components: [row],
      ephemeral: true
    });
  }

  // 言語選択ボタンを押した後
  if (interaction.customId === "open_lang") {

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("lang_jp")
        .setLabel("日本語")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("lang_en")
        .setLabel("English")
        .setStyle(ButtonStyle.Primary)
    );

    return interaction.reply({
      content: "```言語を選択 / Select Language```",
      components: [row],
      ephemeral: true
    });
  }
});
