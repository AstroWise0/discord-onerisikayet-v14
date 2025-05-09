const { botOwner, botToken, botVoiceChannelID, logChannelID } = require('./ayarlar.json');
const { Client, GatewayIntentBits, Partials, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ActivityType, ChannelType } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ],
  partials: [Partials.Channel]
});

client.on("ready", async () => {
  client.user.setPresence({ activities: [{ name: "Astro Was Here ❤️", type: ActivityType.Playing }], status: "dnd" });
  let botVoiceChannel = client.channels.cache.get(botVoiceChannelID);
  if (botVoiceChannel && botVoiceChannel.type === ChannelType.GuildVoice) {
    try {
      const connection = joinVoiceChannel({
        channelId: botVoiceChannel.id,
        guildId: botVoiceChannel.guild.id,
        adapterCreator: botVoiceChannel.guild.voiceAdapterCreator,
        selfDeaf: true,
        selfMute: true
      });
      
      connection.on('error', (error) => {
        console.error(`Voice connection error: ${error.message}`);
        setTimeout(() => {
          try {
            joinVoiceChannel({
              channelId: botVoiceChannel.id,
              guildId: botVoiceChannel.guild.id,
              adapterCreator: botVoiceChannel.guild.voiceAdapterCreator,
              selfDeaf: true,
              selfMute: true
            });
            console.log('Attempting to reconnect to voice channel...');
          } catch (reconnectError) {
            console.error(`Failed to reconnect: ${reconnectError.message}`);
          }
        }, 10000);
      });
    } catch (error) {
      console.error(`Failed to join voice channel: ${error.message}`);
    }
  }
  console.log(`✧ ${client.user.tag} olarak giriş yapıldı!`);
});

let userInteractionMap = new Map();

client.on("messageCreate", async message => {
  if (message.author.bot) return;

  if (message.channel.type === ChannelType.DM) {
    if (userInteractionMap.has(message.author.id)) return;

    const row = new ActionRowBuilder()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('select')
          .setPlaceholder('Bir seçenek belirleyin')
          .addOptions([
            {
              label: 'Öneri',
              description: 'Önerinizi belirtin',
              value: 'oneri',
            },
            {
              label: 'Şikayet',
              description: 'Şikayetinizi belirtin',
              value: 'sikayet',
            },
          ]),
      );

    await message.reply({ content: 'Merhaba! Size nasıl yardımcı olabilirim?', components: [row] });
    userInteractionMap.set(message.author.id, true);
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isStringSelectMenu()) return;

  const logChannel = client.channels.cache.get(logChannelID);
  if (!logChannel) return;

  if (interaction.customId === 'select') {
    const selected = interaction.values[0];
    let promptMessage = '';

    if (selected === 'oneri') {
      promptMessage = 'Önerinizi belirtin:';
    } else if (selected === 'sikayet') {
      promptMessage = 'Şikayetinizi belirtin:';
    }

    await interaction.reply(promptMessage);

    const filter = response => response.author.id === interaction.user.id;
    const collected = await interaction.channel.awaitMessages({ filter, max: 1, time: 60000, errors: ['time'] });

    const userMessage = collected.first();
    if (userMessage) {
      const embed = new EmbedBuilder()
        .setTitle(selected === 'oneri' ? 'Yeni Öneri' : 'Yeni Şikayet')
        .setDescription(userMessage.content)
        .setFooter({ text: `Gönderen: ${interaction.user.tag}` })
        .setTimestamp();

      logChannel.send({ embeds: [embed] });
      userMessage.reply('Teşekkürler! Mesajınız iletildi.');
    }

    userInteractionMap.delete(interaction.user.id);
  }
});

client.kufurler = [""];

client.chatKoruma = async message => {
  if (!message || !message.content) return;
  let mesajIcerik = message.content;

  let inv = /(https:\/\/)?(www\.)?(discord\.gg|discord\.me|discordapp\.com\/invite|discord\.com\/invite)\/([a-z0-9-.]+)?/i;
  if (inv.test(mesajIcerik)) return "reklamKoruma";

  let link = /(http[s]?:\/\/)(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&/=]*)/gi;
  if (link.test(mesajIcerik)) return "linkKoruma";

  if (mesajIcerik.toLowerCase().includes('@everyone') || mesajIcerik.toLowerCase().includes('@here') || (message.mentions.users.size + message.mentions.roles.size) >= 5 || message.mentions.channels.size >= 5) return "etiketKoruma";
  if (isNaN(message.content.replace(/[^a-zA-ZığüşöçĞÜŞİÖÇ]+/g, "")) && mesajIcerik.replace(/[^a-zA-ZığüşöçĞÜŞİÖÇ]+/g, "") === mesajIcerik.replace(/[^a-zA-ZığüşöçĞÜŞİÖÇ]+/g, "").toUpperCase()) return "capsKoruma";
  if ((client.kufurler).some(word => new RegExp("(\\b)+(" + word + ")+(\\b)", "gui").test(mesajIcerik))) return "kufurKoruma";

  let msjlar = await message.channel.messages.fetch({ limit: 30 });
  let sonKisiMesaj = msjlar.filter(x => x.author.id === message.author.id).array()[1];
  if ((sonKisiMesaj && sonKisiMesaj.content && mesajIcerik === sonKisiMesaj.content && message.createdTimestamp - sonKisiMesaj.createdTimestamp <= 3 * 60 * 1000)) return "spamKoruma";

  let nativeEmojisRegExp = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83c\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|[\ud83c\ude32-\ude3a]|[\ud83c\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g;
  let customEmojisRegExp = /<(?:a)?:[a-z0-9_-]{1,256}:[0-9]{16,19}>/gi;
  let nativeEmojis = mesajIcerik.match(nativeEmojisRegExp) || [];
  let customEmojis = mesajIcerik.match(customEmojisRegExp) || [];
  let emojis = nativeEmojis.concat(customEmojis);
  let cleanMessage = mesajIcerik.replace(nativeEmojisRegExp, '');
  cleanMessage = cleanMessage.replace(customEmojisRegExp, '');
  cleanMessage = cleanMessage.trim();
  if (emojis.length > 5) {
    let emojiPercentage = emojis.length / (cleanMessage.length + emojis.length) * 100;
    if (emojiPercentage > 50) return "emojiSpamKoruma";
  };
  return false;
};

client.login(botToken).catch(err => console.error("Bota giriş yapılırken başarısız olundu!"));