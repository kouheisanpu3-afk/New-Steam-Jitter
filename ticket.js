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

const TERMS_CHANNEL_ID = "1540626614982025327"; 
 
module.exports = (client) => { 
 
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
 
      if (exists) { 
        console.log("既にチケットパネルあり"); 
        return; 
      } 
 
      await channel.send({ 
        embeds: [embed], 
        components: [row] 
      }); 
 
      console.log("チケットパネル設置完了"); 
 
    } catch (err) { 
      console.error("パネル設置エラー:", err); 
    } 
  }); 
 
  client.on(Events.InteractionCreate, async (interaction) => { 
 
    if (!interaction.isButton()) return; 
 
    if (interaction.customId === "ticket_create") { 
 
      const guild = interaction.guild; 
      const user = interaction.user; 
 
      const existing = guild.channels.cache.find( 
        c => c.name === `ticket-${user.id}` 
      ); 
 
      if (existing) { 
        return interaction.reply({ 
          content: "すでにチケットがあります", 
          ephemeral: true 
        }); 
      } 
 
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
 
      const now = new Date(); 
 
      const embed = new EmbedBuilder() 
        .setTitle("🎫 チケット") 
        // 👇ここが追加部分（作成者アイコン＋メンション） 
        .setAuthor({ 
          name: `${user.username}`, 
          iconURL: user.displayAvatarURL({ dynamic: true }), 
          url: `https://discord.com/users/${user.id}` 
        }) 
        .setDescription(
`チケットが作成されました

作成者: <@${user.id}>
作成日時: ${now.toLocaleString("ja-JP")}

        ) 
        .setColor(0x4aa3ff); 
 
      const row = new ActionRowBuilder().addComponents( 
        new ButtonBuilder() 
          .setCustomId("ticket_close") 
          .setLabel("チケットを消去") 
          .setStyle(ButtonStyle.Danger) 
      ); 
 
      await channel.send({ 
        content: `<@${user.id}>`, 
        embeds: [embed], 
        components: [row] 
      }); 
 
      return interaction.reply({ 
        content: "チケットを作成しました", 
        ephemeral: true 
      }); 
    } 
 
    if (interaction.customId === "ticket_close") { 
 
      await interaction.reply({ 
        content: "チケットを削除します", 
        ephemeral: true 
      }); 
 
      setTimeout(() => { 
        interaction.channel.delete().catch(() => {}); 
      }, 2000); 
    } 
  }); 
}; 
