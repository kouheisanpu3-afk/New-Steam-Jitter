const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");    
    
const KICK_CHANNEL_ID = "1540932243826942002";    
    
// グレー寄りブルー    
const EMBED_COLOR = 0x5f6f82;    
    
// 🚫画像（指定URL）
const NO_ENTRY_IMG = "https://images-ext-1.discordapp.net/external/V3wsBTSebz_y5_eqHOENkSM6E2SRWyZ0jE66pG9qFKs/https/emojicdn.elk.sh/%F0%9F%9A%AB?format=webp";      
      
// 日本語           
const JP_TEXT =           
`このチャンネルにメッセージを送信しないでください           
このチャンネルはスパムボットを検知するために使用されます。メッセージを送信したユーザーは即座にキックされます。`;           
           
// 英語           
const EN_TEXT =           
`DO NOT SEND MESSAGES IN THIS CHANNEL           
This channel is used to detect spam bots. Any user who sends a message here will be kicked immediately.`;           

// ======================= 
// 🔢 キック回数カウント 
let kickCount = 0;

// =======================
// ボタン（日本語）
function createJPButton() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("kick_button_jp")
      .setLabel(`🚫 キック：${kickCount}`)
      .setStyle(ButtonStyle.Secondary)
  );
}

// =======================
// ボタン（英語）
function createENButton() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("kick_button_en")
      .setLabel(`🚫 Kick：${kickCount}`)
      .setStyle(ButtonStyle.Secondary)
  );
}

module.exports = (client) => {           
           
  let jpMsgRef = null;
  let enMsgRef = null;

  client.once(Events.ClientReady, async () => {           
    try {           
      const channel = await client.channels.fetch(KICK_CHANNEL_ID);           
           
      if (!channel) return console.log("チャンネル取得失敗");           
           
      const messages = await channel.messages.fetch({ limit: 10 });           
           
      const alreadyExists = messages.some(msg =>           
        msg.author.id === client.user.id &&           
        msg.embeds.length > 0           
      );           
           
      if (alreadyExists) {           
        console.log("既に警告メッセージあり");           
        return;           
      }           

      // =======================
      // 🇯🇵 日本語Embed
      const jpEmbed = new EmbedBuilder()           
        .setDescription(JP_TEXT)           
        .setColor(EMBED_COLOR)           
        .setThumbnail(NO_ENTRY_IMG);           

      jpMsgRef = await channel.send({
        embeds: [jpEmbed],
        components: [createJPButton()]
      });

      // =======================
      // 🇺🇸 英語Embed
      const enEmbed = new EmbedBuilder()           
        .setDescription(EN_TEXT)           
        .setColor(EMBED_COLOR)           
        .setThumbnail(NO_ENTRY_IMG);           

      enMsgRef = await channel.send({
        embeds: [enEmbed],
        components: [createENButton()]
      });

      console.log("警告メッセージを設置しました（JP / EN + 別ボタン）");           
           
    } catch (err) {           
      console.error("初期メッセージ送信エラー:", err);           
    }           
  });           

  // =======================
  // キック処理
  client.on(Events.MessageCreate, async (message) => {           
    if (message.author.bot) return;           
    if (message.channel.id !== KICK_CHANNEL_ID) return;           
           
    try {           
      console.log(`⚠ WARNING: ${message.author.tag}`);           

      // メッセージ削除
      if (message.deletable) {
        await message.delete().catch(() => {});
      }

      // キック
      await message.member.kick("Restricted channel violation");           

      kickCount++;           

      console.log(`KICKED: ${message.author.tag} / total: ${kickCount}`);           

      // ボタン更新（両方リアルタイム反映）
      if (jpMsgRef) {
        await jpMsgRef.edit({
          components: [createJPButton()]
        });
      }

      if (enMsgRef) {
        await enMsgRef.edit({
          components: [createENButton()]
        });
      }

    } catch (err) {           
      console.error("Kick error:", err);           
    }           
  });           
           
};           
