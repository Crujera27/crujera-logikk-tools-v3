require('dotenv').config();
const Discord = require('discord.js');
const emojis = require('./config/emojis.json')
const mysql = require('mysql2');
const { Client, Intents } = require('discord.js');
require('./server')
console.log('pterodactyl, bot started')
const client = new Client({ 
    intents: [
      Intents.FLAGS.GUILDS, 
      Intents.FLAGS.GUILD_MESSAGES, 
      Intents.FLAGS.DIRECT_MESSAGES
    ] 
  });
const db = mysql.createConnection({
  host     : process.env.mysql_host,
  user     : process.env.mysql_username,
  password : process.env.mysql_pass,
  database : process.env.mysql_database
});

client.on('ready', () => {
  console.log(`Conectado como ${client.user.tag}`);
  clearOldWarns()
  client.user.setPresence({
    status: 'online',
  });
  const activities = [
    { name: 'Logikk\'s Discord', type: 'WATCHING' },
    { name: 'logikk.galnod.com', type: 'WATCHING' },
    { name: 'v'+require('./package.json').version, type: 'PLAYING'},
  ];
  let servicedisruptionge = false
  module.exports.setservicedisruptionge = function(status){
    servicedisruptionge == status
    console.log('Se ha cambiado el estado de la interrupción del servicio a'+status)
  }
  module.exports.getservicedisruptionge = function(){
    return servicedisruptionge;
  }
  let activityIndex = 0;
  client.user.setActivity(activities[activityIndex].name, { type: activities[activityIndex].type });
  setInterval(() => {
    if(servicedisruptionge=='parcial'){
      client.user.setPresence({
        status: 'dnd',
      });
      client.user.setActivity('interrupción parcial del servicio', { type: 'WATCHING' });
    }
    if(servicedisruptionge=='total'){
      client.user.setPresence({
        status: 'dnd',
      });
      client.user.setActivity('interrupción total del servicio', { type: 'WATCHING' });
    }
    client.user.setPresence({
      status: 'online',
    });
    activityIndex = (activityIndex + 1) % activities.length;
    client.user.setActivity(activities[activityIndex].name, { type: activities[activityIndex].type });
  }, 15000);
});
async function isBanned(userId) {
  const guild = await client.guilds.fetch('901587289954730004');
  const bans = await guild.fetchBans();
  return bans.has(userId);
}
module.exports.isBanned == isBanned

client.on('message', message => {
        if (message.author.bot || !message.guild) return;
    
      
      if (message.content.startsWith('lt!warn')) {
      if (!message.member.permissions.has('MANAGE_ROLES')) {
          return;
        }
        // Obtenemos el usuario que recibirá el warn
        const user = message.mentions.users.first();
        if (!user) {
          return message.reply(':x: | Debes mencionar a un usuario para aplicarle un warn.');
        }
      
        // Obtenemos el grado de warn
        const warnLevelArg = message.content.split(' ')[2];
        let warnLevel = warnLevelArg ? warnLevelArg.toLowerCase() : 'leve'; // si no se especifica, se asume leve
      
        if (warnLevel !== 'leve' && warnLevel !== 'medio' && warnLevel !== 'grave') {
          return message.reply('El grado de warn debe ser `leve`, `medio` o `grave`.');
        }
      
        // Obtenemos la razón del warn
        const reason = message.content.split(' ').slice(3).join(' ');
        if (!reason) {
          return message.reply('Debes proporcionar una razón para aplicar el warn.');
        }
        addwarn(user, warnLevel, reason, message.channel, message.guild, message.author.id, false)        
  } else if (message.content.startsWith('lt!historial')) {
      	      if (!message.member.permissions.has('MANAGE_ROLES')) {
 		            return;
              }
    const args = message.content.trim().split(/ +/g);
    const user = message.mentions.users.first();
    const user_id = user ? user.id : args[1];

    if (!user_id) {
      return message.reply('Debes proporcionar la ID de un usuario.');
    }

    db.query(`SELECT * FROM warns WHERE user_id = '${user_id}' ORDER BY timestamp DESC`, (err, results) => {
        if (err) {
          console.log(err);
          return message.channel.send(':x: | Ha ocurrido un error al obtener los warns del usuario (BACKEND-CONNECTION-TIMEOUT). Pruébalo más tarde.');
        }
      
        if (results.length === 0) {
            message.channel.send(`:x: | El usuario **${user.tag}** no tiene ningún registro vigente en su historial.`);
          } else {
            let warnList = "";
            for (let i = 0; i < results.length; i++) {
              const warn = results[i];
              warnList += `${i + 1}. **Staff:** <@${warn.staff}>(${warn.staff}) **Razón:** ${warn.reason} **Gravedad:** ${warn.level} **Insinuado el:** ${warn.timestamp}\n`;
            }
            //message.channel.send(`Lista de warns para  **${user.tag}**:\n${warnList}`);
            let embed = new Discord.MessageEmbed()
              .setTitle(`Lista de warns para  **${user.tag}**`)
              .setDescription(warnList)
              .setColor("#0099ff")
              message.channel.send({ embeds: [embed] })
          }
        })
      }else if(message.content.startsWith('lt!help')) {
        let embed = new Discord.MessageEmbed()
        .setTitle(`Ayuda | Logikk's Tools`)
        .setDescription(':wrench: Moderación: \n`lt!warn <@usuario> <nivel: leve, medio, grave> <razón>` \n`lt!historial <@usuario | ID>`')
        .setColor("#ff0000")
        message.channel.send({ embeds: [embed] })
      }
      
      
      
      /*else if (message.content.startsWith('lt!ban')) {
        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        if (!member) {
          return message.reply('Por favor mencione un usuario válido');
        }
        // Pedir razón al moderador
        const filter = m => m.author.id === message.author.id;
        const reasonEmbed = new Discord.MessageEmbed()
          .setTitle('Razón del baneo')
          .setDescription('Por favor, proporcione una razón para el baneo.');
         message.author.send(reasonEmbed);
        const collected =  message.author.dmChannel
        const reason = collected.first().content;
    
        // Enviar mensaje de DM al usuario
        const userEmbed = new Discord.MessageEmbed()
          .setTitle('Baneado')
          .setDescription(`Has sido baneado del servidor por la siguiente razón: ${reason} \nSi cree que podría ser un error, puede apelar en https://logikk.galnod.com/support`);
         member.send(userEmbed).catch(err => console.log(`No se pudo enviar DM al usuario  ${member.user.tag}`));
    
        // Banear usuario y registrar en el canal de registro de baneos
        const modEmbed = new Discord.MessageEmbed()
          .setTitle('Usuario baneado')
          .setDescription(`**Usuario baneado:** ${member.user.tag} (${member.user.id})\n**Moderador:** ${message.author.tag}\n**Razón:** ${reason}`);
         message.channel.send(modEmbed);
        member.ban({ reason: `${reason} (Moderador: ${message.author.tag})` }).catch(err => console.log(err));
      }*/
    })
//Automod handler
client.on('messageCreate', message => {
  const automodconf = require('./config/automod.json')
  const badWords = ["aberrante", "abominable", "anormal", "asqueroso", "aterrador", "bestia", "cobarde", "cochino", "corrupto", "desagradable", "desalmado", "despreciable", "diabólico", "doloroso", "egoísta", "enfermo", "envidioso", "estafador", "estúpido", "feo", "fétido", "falso", "grosero", "gruñón", "herético", "hipócrita", "horrible", "idiota", "ignorante", "incompetente", "indeciso", "indeseable", "indignante", "infame", "inmoral", "insensible", "intolerante", "irrespetuoso", "ladrón", "lastimoso", "lamentable", "lento", "macabro", "malcriado", "malvado", "mediocre", "mentiroso", "miedoso", "miserable", "monstruoso", "nefasto", "negativo", "nervioso", "noctámbulo", "obsceno", "odioso", "ofensivo", "perverso", "prepotente", "putrefacto", "repugnante", "resentido", "ridículo", "ruin", "sádico", "sinvergüenza", "soberbio", "sucio", "tacaño", "temeroso", "tenebroso", "terrible", "tonto", "traicionero", "tramposo", "turbio", "vergonzoso", "vil", "violento", "zafio", "zarrapastroso", "zopenco", "zurdo", "pelotudo", "idiota", "imbécil", "gil", "boludo", "maricón", "pendejo", "cagón", "culiado", "huevón", "huevudo", "huevonazo", "guevón", "guevonada", "chuchaqui", "borracho", "alcohólico", "vago", "flojo", "mamerto", "malparido", "hijueputa", "puta", "puto", "culeado", "pajero", "masturbador", "asqueroso", "inmundo", "desgraciado", "maldito", "mierda", "cabrón", "pendejada", "jodido", "perra", "perrero", "cabeza de chorlito", "retardado", "anormal", "cabestro", "conchetumadre", "malnacido", "estúpido", "retrasado", "imbécil", "pajúa", "cagapalos", "malparido", "mierdero", "zorra", "váyanse al carajo", "mejor mueran", "mamagüevo", "malcojido", "cagado", "chupamedias", "malnacido", "cagada", "culicagado", "charlatán", "arrastrado", "patán", "sinvergüenza", "ladronzuelo", "estafador", "charlatán", "farolero", "payaso", "estúpido", "hueso", "tontolculo", "charlatán", "mentiroso", "sinvergüenza", "pérfido", "traidor", "golfo", "deshonesto", "ruin", "desleal", "farsante", "mentecato", "zopenco", "imbécil", "necio", "papanatas", "cretino", "nabo", "gilipollas", "pelma", "plasta", "caradura", "cínico", "hipócrita", "falso", "envidioso", "mentiroso", "calumniador", "difamador", "malintencionado", "agorero", "profeta de desgracias", "matón", "brutal", "cruel", "desalmado", "sádico", "bestia", "despiadado", "insensible", "inclemente", "traumatizado", "ass", "bitch", "bastard", "shit", "crap", "damn", "fuck", "hell", "piss", "dick", "cock", "pussy", "cunt", "twat", "douche", "jerk", "prick", "wanker", "dipshit", "idiot", "moron", "stupid", "retard", "lunatic", "psycho", "crazy", "nuts", "maniac", "baldy", "fatty", "ugly", "chicken", "asshole", "motherfucker", "son of a bitch", "whore", "slut", "skank", "hoe", "tramp", "cum", "shithead", "cockblocker", "asshat", "dumbass", "dumbfuck", "shitbag", "scumbag", "jackass", "sucker", "dickhead", "twatwaffle", "bitchface", "fuckwit", "fuckface", "shitforbrains", "shitstain", "buttface", "douchebag", "cockbite", "knobhead", "dickweed", "dingleberry", "piss off", "bugger off", "bloody", "bollocks", "wanker", "git", "tosser", "naff off", "sod off", "arsehole", "shite", "fanny", "knob", "minger", "prat", "numpty", "plonker", "wazzock", "gobshite", "chav", "bellend", "minge", "cack", "turd", "fart", "shart", "boob", "tits", "nipples", "balls", "schlong", "boner", "clit", "vagina", "labia", "muff", "arse", "butt", "booty", "tush", "crapola", "bollocks", "dagnabbit"]
  if (message.author.bot || !message.guild) return;

  // Check if message contains any bad words
  const messageContent = message.content.toLowerCase();
  const containsBadWord = badWords.some(word => messageContent.includes(word));

  if (containsBadWord) {
    // Send a notification message in a specific channel
    const channel = message.guild.channels.cache.get(automodconf.alertas);
    if (channel) {
      const embed = new Discord.MessageEmbed()
        .setColor('#ff0000')
        .setTitle('Logikk\'s Tools | AutoMod')
        .setDescription(`Autor: **${message.author.tag}**(${message.author.id})\n Contenido:`+"```"+`\n${message.content}`+"```")
      
      // Store interaction IDs in database while inserting flagged message into automod_queue table
      const components = [
        {
          type: 'BUTTON',
          label: 'Warn Leve',
          style: 'DANGER',
          customId: 'warn_level_button'+message.id
        },
        {
          type: 'BUTTON',
          label: 'Warn Medio',
          style: 'DANGER',
          customId: 'warn_medio_button'+message.id
        },
        {
          type: 'BUTTON',
          label: 'Warn Grave',
          style: 'DANGER',
          customId: 'warn_grave_button'+message.id
        },
        {
          type: 'BUTTON',
          label: 'Falso positivo',
          style: 'PRIMARY',
          customId: 'falsopositivo'+message.id
        }        
      ];

      const warnLevelInteractionId = components[0].customId
      const warnMedioInteractionId = components[1].customId
      const warnGraveInteractionId = components[2].customId
      const falsopositivoId = components[3].customId

      db.query(`INSERT INTO automod_queue (message_content, message_author, user_name, discriminator, message_id, warn_level_interaction_id, warn_medio_interaction_id, warn_grave_interaction_id, falsopositivo_interaction_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
        [message.content, message.author.id, message.author.username, message.author.discriminator, message.id, warnLevelInteractionId, warnMedioInteractionId, warnGraveInteractionId, falsopositivoId],
        (err, results) => {
          if (err) {
            console.error(err);
            return;
          }

          channel.send({ embeds: [embed], components: [
            {
              type: 'ACTION_ROW',
              components: components
            }
          ]}).catch(console.error);
        }
      );
    }
    //message.react('1089508318415962242');
  }
});
// Handle button clickss
client.on('interactionCreate', async interaction => {
  const automodconf = require('./config/automod.json')
  if (!interaction.isButton()) return;
  const [rows] = await db.promise().query(`SELECT * FROM automod_queue`);
  const buttonId = interaction.customId;
  const matchingRow = rows.find(row => buttonId === `warn_level_button${row.message_id}`) || rows.find(row => buttonId === `warn_medio_button${row.message_id}`) || rows.find(row => buttonId === `warn_grave_button${row.message_id}`) ||  rows.find(row => buttonId === `falsopositivo${row.message_id}`)
  if (!matchingRow) return;
  if (buttonId === `warn_level_button${matchingRow.message_id}`) {  
    const [rows2] = await db.promise().query(`SELECT * FROM automod_queue WHERE warn_level_interaction_id = ?`, [buttonId]);
    if (rows2.length === 0) {
      console.error(`No row found with warn_level_interaction_id = ${buttonId}`);
      return;
    }
  
    const matchingRow = rows2[0];
    const logchannel = client.guilds.cache.get(automodconf.guild).channels.cache.get(automodconf.log)
    const log = new Discord.MessageEmbed()
    .setColor('#ff0000')
    .setTitle('Logikk\'s Tools | Sanción Aplicada vía automod')
    .setDescription(`ID: **${matchingRow.id}**\nModerador: **<@${interaction.user.id}>(${interaction.user.id})**\nSanción: **Warn Leve**\nUsuario: **<@${matchingRow.message_author}>(${matchingRow.message_author})**\nContenido del mensaje:\n\n\`\`\`\n${matchingRow.message_content}\n\`\`\``)
    logchannel.send({ embeds: [log]})
    const user = await client.users.fetch(matchingRow.message_author);
    const embed = new Discord.MessageEmbed()
      .setColor('#ff0000')
      .setTitle('Mensaje de la moderación de Logikk\'s Discord')
      .setDescription('```\nEstimado/a usuario/a,\n\nPor medio del presente comunicado, nos dirigimos a usted para informarle que nuestros moderadores han evaluado su comportamiento en el servidor de Discord y han determinado que ha incumplido con las normativas establecidas en nuestra comunidad.\n\nPor consiguiente, nos vemos en la obligación de aplicarle una sanción en nuestro sistema, en cumplimiento de nuestros protocolos de seguridad y convivencia en línea. Es importante que tenga en cuenta que estas medidas se aplican con el objetivo de garantizar un ambiente de respeto y tolerancia entre todos los miembros de nuestra comunidad.\n\nLe recomendamos revisar detenidamente las normativas del servidor para evitar futuras sanciones y contribuir a mantener un espacio seguro y amigable para todos los usuarios. Si tiene alguna duda o desea apelar esta sanción, por favor no dude en ponerse en contacto con nuestro equipo de moderación.\n\nAgradecemos su comprensión y cooperación en este asunto.\n\nAtentamente,\nEl equipo de moderación de Logikk\'s Discord```\n\nInformación respecto a la sanción aplicada:\n\nSanción: **Warn Leve**\n\nModerador: <@'+interaction.user.id+'>\n\nContenido ofensivo:\n```\n'+matchingRow.message_content+'\n```\n\nPuedes encontrar una lista completa de tus warns en: https://logikk.galnod.com/warns')
    user.send({ embeds: [embed] });
    interaction.message.delete();
    db.promise().query(`DELETE FROM automod_queue WHERE id = ?`, [matchingRow.id]);
    addwarn(interaction.guild.members.cache.get(matchingRow.message_author), 'leve', 'Uso de lenguaje inapropiado y/o promoción de contenido inadecuado hacia ciertos grupos de personas.', interaction.channel, interaction.guild, interaction.user.id, true)
    const msg = await interaction.channel.messages.fetch(matchingRow.message_id);
    if (msg) {
      msg.delete().catch((error) => {
        console.error(`Error deleting message: ${error}`);
        interaction.reply({ content: ':x: | No he podido eliminar el mensaje del usuario.', ephemeral: true });
      });
    }
    
  } else if (buttonId === `warn_medio_button${matchingRow.message_id}`) {
    const [rows2] = await db.promise().query(`SELECT * FROM automod_queue WHERE warn_medio_interaction_id = ?`, [buttonId]);
    if (rows2.length === 0) {
      console.error(`No row found with warn_medio_interaction_id = ${buttonId}`);
      return;
    }
      const matchingRow = rows2[0];
      const logchannel = client.guilds.cache.get(automodconf.guild).channels.cache.get(automodconf.log)
      const log = new Discord.MessageEmbed()
      .setColor('#ff0000')
      .setTitle('Logikk\'s Tools | Sanción Aplicada vía automod')
      .setDescription(`ID: **${matchingRow.id}**\nModerador: **<@${interaction.user.id}>(${interaction.user.id})**\nSanción: **Warn Medio**\nUsuario: **<@${matchingRow.message_author}>(${matchingRow.message_author})**\nContenido del mensaje:\n\n\`\`\`\n${matchingRow.message_content}\n\`\`\``)
      logchannel.send({ embeds: [log]})
      const user = await client.users.fetch(matchingRow.message_author);
      const embed = new Discord.MessageEmbed()
        .setColor('#ff0000')
        .setTitle('Mensaje de la moderación de Logikk\'s Discord')
        .setDescription('```\nEstimado/a usuario/a,\n\nPor medio del presente comunicado, nos dirigimos a usted para informarle que nuestros moderadores han evaluado su comportamiento en el servidor de Discord y han determinado que ha incumplido con las normativas establecidas en nuestra comunidad.\n\nPor consiguiente, nos vemos en la obligación de aplicarle una sanción en nuestro sistema, en cumplimiento de nuestros protocolos de seguridad y convivencia en línea. Es importante que tenga en cuenta que estas medidas se aplican con el objetivo de garantizar un ambiente de respeto y tolerancia entre todos los miembros de nuestra comunidad.\n\nLe recomendamos revisar detenidamente las normativas del servidor para evitar futuras sanciones y contribuir a mantener un espacio seguro y amigable para todos los usuarios. Si tiene alguna duda o desea apelar esta sanción, por favor no dude en ponerse en contacto con nuestro equipo de moderación.\n\nAgradecemos su comprensión y cooperación en este asunto.\n\nAtentamente,\nEl equipo de moderación de Logikk\'s Discord```\n\nInformación respecto a la sanción aplicada:\n\nSanción: **Warn Medio**\n\nModerador: <@'+interaction.user.id+'>\n\nContenido ofensivo:\n```\n'+matchingRow.message_content+'\n```\n\nPuedes encontrar una lista completa de tus warns en: https://logikk.galnod.com/warns')
      user.send({ embeds: [embed] });
      interaction.message.delete();
      db.promise().query(`DELETE FROM automod_queue WHERE id = ?`, [matchingRow.id]);
      addwarn(interaction.guild.members.cache.get(matchingRow.message_author), 'medio', 'Uso de lenguaje inapropiado y/o promoción de contenido inadecuado hacia ciertos grupos de personas.', interaction.channel, interaction.guild, interaction.user.id, true)
      const msg = await interaction.channel.messages.fetch(matchingRow.message_id)
      if (msg) {
        msg.delete().catch((error) => {
          console.error(`Error deleting message: ${error}`);
          interaction.reply({ content: ':x: | No he podido eliminar el mensaje del usuario.', ephemeral: true });
        });
      }
  } else if (buttonId === `warn_grave_button${matchingRow.message_id}`) {
    const [rows2] = await db.promise().query(`SELECT * FROM automod_queue WHERE warn_grave_interaction_id = ?`, [buttonId]);
    if (rows2.length === 0) {
      console.error(`No row found with warn_grave_interaction_id = ${buttonId}`);
      return;
    }
      const matchingRow = rows2[0];
      const logchannel = client.guilds.cache.get(automodconf.guild).channels.cache.get(automodconf.log)
      const log = new Discord.MessageEmbed()
      .setColor('#ff0000')
      .setTitle('Logikk\'s Tools | Sanción Aplicada vía automod')
      .setDescription(`ID: **${matchingRow.id}**\nModerador: **<@${interaction.user.id}>(${interaction.user.id})**\nSanción: **Warn Grave**\nUsuario: **<@${matchingRow.message_author}>(${matchingRow.message_author})**\nContenido del mensaje:\n\n\`\`\`\n${matchingRow.message_content}\n\`\`\``)
      logchannel.send({ embeds: [log]})
      const user = await client.users.fetch(matchingRow.message_author);
      const embed = new Discord.MessageEmbed()
        .setColor('#ff0000')
        .setTitle('Mensaje de la moderación de Logikk\'s Discord')
        .setDescription('```\nEstimado/a usuario/a,\n\nPor medio del presente comunicado, nos dirigimos a usted para informarle que nuestros moderadores han evaluado su comportamiento en el servidor de Discord y han determinado que ha incumplido con las normativas establecidas en nuestra comunidad.\n\nPor consiguiente, nos vemos en la obligación de aplicarle una sanción en nuestro sistema, en cumplimiento de nuestros protocolos de seguridad y convivencia en línea. Es importante que tenga en cuenta que estas medidas se aplican con el objetivo de garantizar un ambiente de respeto y tolerancia entre todos los miembros de nuestra comunidad.\n\nLe recomendamos revisar detenidamente las normativas del servidor para evitar futuras sanciones y contribuir a mantener un espacio seguro y amigable para todos los usuarios. Si tiene alguna duda o desea apelar esta sanción, por favor no dude en ponerse en contacto con nuestro equipo de moderación.\n\nAgradecemos su comprensión y cooperación en este asunto.\n\nAtentamente,\nEl equipo de moderación de Logikk\'s Discord```\n\nInformación respecto a la sanción aplicada:\n\nSanción: **Warn Grave**\n\nModerador: <@'+interaction.user.id+'>\n\nContenido ofensivo:\n```\n'+matchingRow.message_content+'\n```\n\nPuedes encontrar una lista completa de tus warns en: https://logikk.galnod.com/warns')
      user.send({ embeds: [embed] });
      interaction.message.delete();
      db.promise().query(`DELETE FROM automod_queue WHERE id = ?`, [matchingRow.id]);
      addwarn(interaction.guild.members.cache.get(matchingRow.message_author), 'grave', 'Uso de lenguaje inapropiado y/o promoción de contenido inadecuado hacia ciertos grupos de personas.', interaction.channel, interaction.guild, interaction.user.id, true)
      const msg = await interaction.channel.messages.fetch(matchingRow.message_id)
      if (msg) {
        msg.delete().catch((error) => {
          console.error(`Error deleting message: ${error}`);
          interaction.reply({ content: ':x: | No he podido eliminar el mensaje del usuario.', ephemeral: true });
        });
      }}
    else if (buttonId === `falsopositivo${matchingRow.message_id}`){
      const [rows2] = await db.promise().query(`SELECT * FROM automod_queue WHERE falsopositivo_interaction_id = ?`, [buttonId]);
    if (rows2.length === 0) {
      console.error(`No row found with falsopositivo_interaction_id = ${buttonId}`);
      return;
    }
      const logchannel = client.guilds.cache.get(automodconf.guild).channels.cache.get(automodconf.log)
      const log = new Discord.MessageEmbed()
      .setColor('#ff0000')
      .setTitle('Logikk\'s Tools | Alertas del automod')
      .setDescription(`ID: **${matchingRow.id}**\nModerador: **<@${interaction.user.id}>(${interaction.user.id})**\nConclusión: **Falso positivo**\nUsuario: **<@${matchingRow.message_author}>(${matchingRow.message_author})**\nContenido del mensaje:\n\n\`\`\`\n${matchingRow.message_content}\n\`\`\``)
      logchannel.send({ embeds: [log]})
      interaction.reply({ content: '✅ | Se ha marcado la alerta como **Falso positivo**', ephemeral: true });
      interaction.message.delete()
  } else {
    console.error(`No conozco el botón con ID: ${interaction.customId}`);
    return;
  }
})



function addwarn(user, nivel, reason, channel, guild, modid, deletemessage){
  let warnLevel = nivel
  //'Uso de lenguaje inapropiado y/o promoción de contenido inadecuado hacia ciertos grupos de personas.'

  // Comprobamos si el usuario ya tiene warns
  db.query(`SELECT * FROM warns WHERE user_id = '${user.id}'`, (err, rows) => {
    if (err) throw err;

    let warnCount = {
      leve: 0,
      medio: 0,
      grave: 0
    };

    if (rows.length > 0) {
      rows.forEach(row => {
        warnCount[row.level]++;
      });
    }

    // Determinamos si se debe aplicar un warn y de qué grado
    let applyWarn = true;
    let banMessage = '';
    if (warnLevel === 'leve' && warnCount.leve >= 2) {
      warnLevel = 'medio';
      applyWarn = false;
      banMessage = emojis.warn+` | **<@${user.id}>**(${user.id}) ha superado el máximo de warns leve. Este debería de ser aislado temporalmente.`;
      db.query(`DELETE FROM warns WHERE user_id = '${user.id}' AND level = 'leve' LIMIT 3`, (err) => {
        if (err) throw err;
        console.log(`Se han eliminado 3 warns leves de ${user.id}.`);
        addwarn(user, 'medio', 'Acumular un total de 3 warns leves (Último warn leve: '+reason+' ) - Autoinsinuado por automod', channel, guild, modid)
      });
    } else if (warnLevel === 'medio' && warnCount.medio >= 2) {
      warnLevel = 'grave';
      applyWarn = false;
      banMessage = emojis.warn+` | **<@${user.id}>**(${user.id}) ha superado el máximo de warns medios. Este debería de ser aislado temporalmente.`;
      db.query(`DELETE FROM warns WHERE user_id = '${user.id}' AND level = 'medio' LIMIT 3`, (err) => {
        if (err) throw err;
        console.log(`Se han eliminado 3 warns medios de ${user.id}.`);
        addwarn(user, 'grave', 'Acumular un total de 3 warns medios (Último warn medio: '+reason+' ) - Autoinsinuado por automod', channel, guild, modid)
      });
  } else if (warnLevel === 'grave' && warnCount.grave >= 2) {
      applyWarn = false;
      banMessage = emojis.warn` | **<@${user.id}>**(${user.id})  debe de ser baneado por superar la cantidad máxima de warns graves. (*Todos sus datos ya han sido eliminados*)`;
      db.query(`DELETE FROM warns WHERE user_id = '${user.id}'`, (err) => {
          if (err) throw err;
          console.log(`Se han eliminado todos los warns de ${user.id}.`);
          if (guild && guild.member) {
              const member = guild.members.cache.get(user.id);
            member.ban({reason: "Máximo de warns graves superados"})
              .then(() => console.log(`Usuario ${user.username} baneado`))
              .catch(console.error);
          } else {
            console.error("No se pudo obtener el objeto member para banear al usuario");
          }
        })}
    if (applyWarn) {
      // Aplicamos el warn
      db.query(`INSERT INTO warns (user_id, reason, level, staff) VALUES ('${user.id}', '${reason}', '${warnLevel}', '${modid}')`, (err) => {
        if (err) {
          console.error(err);
          return channel.send('¡Me cachis! Ha ocurrido un error al guardar el warn en la base de datos.');
        }
        channel.send(`**<@${user.id}>**(${user.id}) ha recibido un warn **${warnLevel}** con la razón: \`${reason}\``)
          .then(message => {
          if(deletemessage==true){
          setTimeout(() => {
          message.delete();
          }, 5000);
      }});

      });
    } else {
      // Si no se aplica el warn, se envía un mensaje de advertencia y se sugiere el baneo
      channel.send(banMessage)
      .then(message => {
      if(deletemessage==true){
      setTimeout(() => {
      message.delete();
      }, 5000);
    }
      });
    }
  }) 
}


function clearOldWarns() {
    const now = new Date();
    console.log("["+now+"] Comprobando warns...");
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  
    db.query(`SELECT * FROM warns`, (err, results) => {
      if (err) throw err;
  
      results.forEach((warn) => {
        const warnDate = new Date(warn.timestamp);
        const diffInDays = (now - warnDate) / (24 * 60 * 60 * 1000);
  
        if (warn.level === "leve" && diffInDays > 30) {
          console.log(`[`+now+`] Borrando warn leve del usuario con ID ${warn.user_id}...`);
          db.query(`DELETE FROM warns WHERE id=${warn.id}`, (err, result) => {
            if (err) throw err;
          });
        }
  
        if (warn.level === "medio" && diffInDays > 90) {
          console.log(`[`+now+`] Borrando warn medio del usuario con ID ${warn.user_id}...`);
          db.query(`DELETE FROM warns WHERE id=${warn.id}`, (err, result) => {
            if (err) throw err;
          });
        }
      });
    });
  }
  
  setInterval(clearOldWarns, 3600000);
  
function nuevoTicket(userId){
  const serverId = '905124554303762552';
  const channelId = '1015309508777615360';
  const channel = client.guilds.cache.get(serverId).channels.cache.get(channelId);

  channel.send('El usuario con ID de Discord `'+userId+ '` ha creado un nuevo ticket. \nPuedes revisarlo en https://logikk.galnod.com/staff/tickets');
}


module.exports.nuevoTicket = nuevoTicket
client.login(process.env.discord_token)