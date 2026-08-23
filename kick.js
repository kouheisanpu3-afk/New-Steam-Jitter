const { Events, EmbedBuilder } = require("discord.js");   
   
const KICK_CHANNEL_ID = "1540932243826942002";   
   
// グレー寄りブルー   
const EMBED_COLOR = 0x5f6f82;   
   
// 🚫絵文字
const NO_ENTRY = "🚫";
   
// 日本語（右端風に配置）
const JP_TEXT =   
`このチャンネルにメッセージを送信しないでください   
このチャンネルはスパムボットを検知するために使用されます。メッセージを送信したユーザーは即座にキックされます。                                    ${NO_ENTRY}`;   
   
// 英語（右端風に配置）
const EN_TEXT =   
`DO NOT SEND MESSAGES IN THIS CHANNEL   
This channel is used to detect spam bots. Any user who sends a message here will be kicked immediately.                                    ${NO_ENTRY}`;   
   
module.exports = (client) => {   
   
  // =======================   
  // 起動時：警告メッセージ設置（重複防止あり）   
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
        .setColor(EMBED_COLOR);   
   
      // =======================   
      // 🇺🇸 EnglishEmbed   
      const enEmbed = new EmbedBuilder()   
        .setDescription(EN_TEXT)   
        .setColor(EMBED_COLOR);   
   
      // 同時送信（別背景）   
      await channel.send({   
        embeds: [jpEmbed, enEmbed]   
      });   
   
      console.log("警告メッセージを設置しました");   
   
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
   
      console.log(`KICKED: ${message.author.tag}`);   
   
    } catch (err) {   
      console.error("Kick error:", err);   
    }   
  });   
   
};   
