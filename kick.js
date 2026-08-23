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

// ボタン作成関数（回数更新用）
function createButton() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("kick_button")
      .setLabel(`🚫 キック：${kickCount}回`)
      .setStyle(ButtonStyle.Secondary)
  );
}

module.exports = (client) => {         
         
  let messageRef = null;

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
      // 🇯🇵 Embed
      const jpEmbed = new EmbedBuilder()         
        .setDescription(JP_TEXT)         
        .setColor(EMBED_COLOR)         
        .setThumbnail(NO_ENTRY_IMG);         

      const jpMsg = await channel.send({    
        embeds: [jpEmbed],   
        components: [createButton()]   
      });         

      // =======================
      // 🇺🇸 Embed
      const enEmbed = new EmbedBuilder()         
        .setDescription(EN_TEXT)         
        .setColor(EMBED_COLOR)         
        .setThumbnail(NO_ENTRY_IMG);         

      const enMsg = await channel.send({    
        embeds: [enEmbed],   
        components: [createButton()]   
      });         

      messageRef = [jpMsg, enMsg];

      console.log("警告メッセージを設置しました（JP / EN + 回数ボタン）");         
         
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
         
      await message.member.kick("Restricted channel violation");         
         
      kickCount++; // ←ここで増やす
         
      console.log(`KICKED: ${message.author.tag} / total: ${kickCount}`);         

      // ボタン更新（JP/EN両方更新）
      if (messageRef) {
        for (const msg of messageRef) {
          await msg.edit({
            components: [createButton()]
          });
        }
      }
         
    } catch (err) {         
      console.error("Kick error:", err);         
    }         
  });         
         
};         
