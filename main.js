const fs = require('fs');

console.log('ℹ > Cargando...')
try {
  const watermark = fs.readFileSync('watermark.txt', 'utf8');
  console.log(watermark);
} catch (err) {
  console.error(`❌> Error al intentar cargar un archivo: ${err.message}`);
  return process.exit()
}
console.log('ℹ > Versión: ' + require('./package.json').version)
// App
require('dotenv').config();
const Discord = require('discord.js');
const emojis = require('./config/emojis.json')
const mysql = require('mysql2');
const { Client, Intents, MessageActionRow, MessageButton, TextInputComponent } = require('discord.js');
require('./server')
console.log('pterodactyl, bot started')
const client = new Client({ 
    intents: [
      Intents.FLAGS.GUILDS, 
      Intents.FLAGS.GUILD_MESSAGES, 
      Intents.FLAGS.DIRECT_MESSAGES,
      Intents.FLAGS.GUILD_MEMBERS
    ] 
  });
const db = mysql.createPool({
  host     : process.env.mysql_host,
  user     : process.env.mysql_username,
  password : process.env.mysql_pass,
  database : process.env.mysql_database
});
client.on('ready', () => {
  console.log(`✅ > Conectado como ${client.user.tag}`);
  let loaded = false
  function checkLoaded(){
    return loaded = true
  }
  module.exports.checkLoaded = checkLoaded
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
    console.log('Se ha cambiado el estado de la interrupción del servicio a '+status)
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
      if (!message.member.permissions.has('MANAGE_MESSAGES')) {
          return;
        }
        const user = message.mentions.users.first();
        if (!user) {
          return message.reply(':x: | Debes mencionar a un usuario para aplicarle un warn.');
        }
        const warnLevelArg = message.content.split(' ')[2];
        let warnLevel = warnLevelArg ? warnLevelArg.toLowerCase() : 'leve';
      
        if (warnLevel !== 'leve' && warnLevel !== 'medio' && warnLevel !== 'grave') {
          return message.reply('El grado de warn debe ser `leve`, `medio` o `grave`.');
        }
        const reason = message.content.split(' ').slice(3).join(' ');
        if (!reason) {
          return message.reply('Debes proporcionar una razón para aplicar el warn.');
        }
        addwarn(user, warnLevel, reason, message.channel, message.guild, message.author.id, false, true)        
  } else if (message.content.startsWith('lt!historial')) {
      	      if (!message.member.permissions.has('MANAGE_ROLES')) {
 		            return;
              }
    const args = message.content.trim().split(/ +/g);
    const user = message.mentions.users.first();
    const user_id = user ? user : args[1];

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
          .setDescription(`**Usuario baneado:** ${member.user.tag} (${member.user})\n**Moderador:** ${message.author.tag}\n**Razón:** ${reason}`);
         message.channel.send(modEmbed);
        member.ban({ reason: `${reason} (Moderador: ${message.author.tag})` }).catch(err => console.log(err));
      }*/
    })
//Automod handler
client.on('messageCreate', message => {
  const automodconf = require('./config/automod.json')
  const badWords = ["puta", "hdp", "tpm", "tu puta madre", "payaso", "polla", "maricon", "pene", "polla", "vagina", "chocho", "chumino", "prepucio", "glande", "puto", "gilipollas"]
  if (message.author.bot || !message.guild) return;

  // Check if message contains any bad words
  const messageContent = message.content.toLowerCase();
    let flaggedWord = '';
    const containsBadWord = badWords.some(word => {
    if (messageContent.includes(word)) {
      flaggedWord = word;
      return true;
    }
  });

  if (containsBadWord) {
    const channel = message.guild.channels.cache.get(automodconf.alertas);
    if (channel) {
      const embed = new Discord.MessageEmbed()
        .setColor('#ff0000')
        .setTitle('Logikk\'s Tools | AutoMod - Alertas de bad words')
        .setDescription(`Autor: **${message.author.tag}**(${message.author.id})\nPalabra filtrada: **${flaggedWord}**\nCanal: <#${message.channel.id}>\n **[${"Click para ir al mensaje"}](https://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.id})** \n\nContenido:`+"```"+`\n${message.content}`+"```")
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

      db.query(`INSERT INTO automod_queue (message_content, message_author, user_name, discriminator, message_id, warn_level_interaction_id, warn_medio_interaction_id, warn_grave_interaction_id, falsopositivo_interaction_id, channel_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
        [message.content, message.author.id, message.author.username, message.author.discriminator, message.id, warnLevelInteractionId, warnMedioInteractionId, warnGraveInteractionId, falsopositivoId, message.channel.id],
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
      console.error(`No row | warn_level_interaction_id = ${buttonId}`);
      return;
    }
  
    const matchingRow = rows2[0];
    const logchannel = client.guilds.cache.get(automodconf.guild).channels.cache.get(automodconf.log)
    const log = new Discord.MessageEmbed()
    .setColor('#ff0000')
    .setTitle('Logikk\'s Tools | Sanción Aplicada vía automod')
    .setDescription(`ID: **${matchingRow.id}**\nModerador: **${interaction.user}(${interaction.user.id})**\nSanción: **Warn Leve**\nUsuario: **<@${matchingRow.message_author}>(${matchingRow.message_author})**\nContenido del mensaje:\n\n\`\`\`\n${matchingRow.message_content}\n\`\`\``)
    logchannel.send({ embeds: [log]})
    const user = await client.users.fetch(matchingRow.message_author);
    const embed = new Discord.MessageEmbed()
      .setColor('#ff0000')
      .setTitle('Mensaje de la moderación de Logikk\'s Discord')
      .setDescription('```\nEstimado/a usuario/a,\n\nPor medio del presente comunicado, nos dirigimos a usted para informarle que nuestros moderadores han evaluado su comportamiento en el servidor de Discord y han determinado que ha incumplido con las normativas establecidas en nuestra comunidad.\n\nPor consiguiente, nos vemos en la obligación de aplicarle una sanción en nuestro sistema, en cumplimiento de nuestros protocolos de seguridad y convivencia en línea. Es importante que tenga en cuenta que estas medidas se aplican con el objetivo de garantizar un ambiente de respeto y tolerancia entre todos los miembros de nuestra comunidad.\n\nLe recomendamos revisar detenidamente las normativas del servidor para evitar futuras sanciones y contribuir a mantener un espacio seguro y amigable para todos los usuarios. Si tiene alguna duda o desea apelar esta sanción, por favor no dude en ponerse en contacto con nuestro equipo de moderación.\n\nAgradecemos su comprensión y cooperación en este asunto.\n\nAtentamente,\nEl equipo de moderación de Logikk\'s Discord```\n\nInformación respecto a la sanción aplicada:\n\nSanción: **Warn Leve**\n\nModerador: <@'+interaction.user+'>\n\nContenido ofensivo:\n```\n'+matchingRow.message_content+'\n```\n\nPuedes encontrar una lista completa de tus warns en: https://logikk.galnod.com/warns')
    user.send({ embeds: [embed] });
    interaction.message.delete();
    db.promise().query(`DELETE FROM automod_queue WHERE id = ?`, [matchingRow.id]);
    addwarn(interaction.guild.members.cache.get(matchingRow.message_author), 'leve', 'Uso de lenguaje inapropiado y/o promoción de contenido inadecuado hacia ciertos grupos de personas.', interaction.channel, interaction.guild, interaction.user.id, true, false)
    client.guilds.cache.get(interaction.guild.id).channels.cache.get(matchingRow.channel_id)?.messages.fetch(matchingRow.message_id)?.then(msg => msg.delete()).catch(() => console.error("El mensaje no se ha encontrado (Mnessage no borrado)"));
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
      .setDescription(`ID: **${matchingRow.id}**\nModerador: **${interaction.user}(${interaction.user.id})**\nSanción: **Warn Medio**\nUsuario: **<@${matchingRow.message_author}>(${matchingRow.message_author})**\nContenido del mensaje:\n\n\`\`\`\n${matchingRow.message_content}\n\`\`\``)
      logchannel.send({ embeds: [log]})
      const user = await client.users.fetch(matchingRow.message_author);
      const embed = new Discord.MessageEmbed()
        .setColor('#ff0000')
        .setTitle('Mensaje de la moderación de Logikk\'s Discord')
        .setDescription('```\nEstimado/a usuario/a,\n\nPor medio del presente comunicado, nos dirigimos a usted para informarle que nuestros moderadores han evaluado su comportamiento en el servidor de Discord y han determinado que ha incumplido con las normativas establecidas en nuestra comunidad.\n\nPor consiguiente, nos vemos en la obligación de aplicarle una sanción en nuestro sistema, en cumplimiento de nuestros protocolos de seguridad y convivencia en línea. Es importante que tenga en cuenta que estas medidas se aplican con el objetivo de garantizar un ambiente de respeto y tolerancia entre todos los miembros de nuestra comunidad.\n\nLe recomendamos revisar detenidamente las normativas del servidor para evitar futuras sanciones y contribuir a mantener un espacio seguro y amigable para todos los usuarios. Si tiene alguna duda o desea apelar esta sanción, por favor no dude en ponerse en contacto con nuestro equipo de moderación.\n\nAgradecemos su comprensión y cooperación en este asunto.\n\nAtentamente,\nEl equipo de moderación de Logikk\'s Discord```\n\nInformación respecto a la sanción aplicada:\n\nSanción: **Warn Medio**\n\nModerador: <@'+interaction.user+'>\n\nContenido ofensivo:\n```\n'+matchingRow.message_content+'\n```\n\nPuedes encontrar una lista completa de tus warns en: https://logikk.galnod.com/warns')
      user.send({ embeds: [embed] });
      interaction.message.delete();
      db.promise().query(`DELETE FROM automod_queue WHERE id = ?`, [matchingRow.id]);
      addwarn(interaction.guild.members.cache.get(matchingRow.message_author), 'medio', 'Uso de lenguaje inapropiado y/o promoción de contenido inadecuado hacia ciertos grupos de personas.', interaction.channel, interaction.guild, interaction.user.id, true, false)
      client.guilds.cache.get(interaction.guild.id).channels.cache.get(matchingRow.channel_id)?.messages.fetch(matchingRow.message_id)?.then(msg => msg.delete()).catch(() => console.error("El mensaje no se ha encontrado (Mnessage no borrado)"));
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
      .setDescription(`ID: **${matchingRow.id}**\nModerador: **${interaction.user}(${interaction.user.id})**\nSanción: **Warn Grave**\nUsuario: **<@${matchingRow.message_author}>(${matchingRow.message_author})**\nContenido del mensaje:\n\n\`\`\`\n${matchingRow.message_content}\n\`\`\``)
      logchannel.send({ embeds: [log]})
      const user = await client.users.fetch(matchingRow.message_author);
      const embed = new Discord.MessageEmbed()
        .setColor('#ff0000')
        .setTitle('Mensaje de la moderación de Logikk\'s Discord')
        .setDescription('```\nEstimado/a usuario/a,\n\nPor medio del presente comunicado, nos dirigimos a usted para informarle que nuestros moderadores han evaluado su comportamiento en el servidor de Discord y han determinado que ha incumplido con las normativas establecidas en nuestra comunidad.\n\nPor consiguiente, nos vemos en la obligación de aplicarle una sanción en nuestro sistema, en cumplimiento de nuestros protocolos de seguridad y convivencia en línea. Es importante que tenga en cuenta que estas medidas se aplican con el objetivo de garantizar un ambiente de respeto y tolerancia entre todos los miembros de nuestra comunidad.\n\nLe recomendamos revisar detenidamente las normativas del servidor para evitar futuras sanciones y contribuir a mantener un espacio seguro y amigable para todos los usuarios. Si tiene alguna duda o desea apelar esta sanción, por favor no dude en ponerse en contacto con nuestro equipo de moderación.\n\nAgradecemos su comprensión y cooperación en este asunto.\n\nAtentamente,\nEl equipo de moderación de Logikk\'s Discord```\n\nInformación respecto a la sanción aplicada:\n\nSanción: **Warn Grave**\n\nModerador: <@'+interaction.user+'>\n\nContenido ofensivo:\n```\n'+matchingRow.message_content+'\n```\n\nPuedes encontrar una lista completa de tus warns en: https://logikk.galnod.com/warns')
      user.send({ embeds: [embed] });
      interaction.message.delete();
      db.promise().query(`DELETE FROM automod_queue WHERE id = ?`, [matchingRow.id]);
      addwarn(interaction.guild.members.cache.get(matchingRow.message_author), 'grave', 'Uso de lenguaje inapropiado y/o promoción de contenido inadecuado hacia ciertos grupos de personas.', interaction.channel, interaction.guild, interaction.user.id, true, false)
      client.guilds.cache.get(interaction.guild.id).channels.cache.get(matchingRow.channel_id)?.messages.fetch(matchingRow.message_id)?.then(msg => msg.delete()).catch(() => console.error("El mensaje no se ha encontrado (Mnessage no borrado)"));
      }
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
      .setDescription(`ID: **${matchingRow.id}**\nModerador: **${interaction.user}(${interaction.user.id})**\nConclusión: **Falso positivo**\nUsuario: **<@${matchingRow.message_author}>(${matchingRow.message_author})**\nContenido del mensaje:\n\n\`\`\`\n${matchingRow.message_content}\n\`\`\``)
      logchannel.send({ embeds: [log]})
      interaction.reply({ content: '✅ | Se ha marcado la alerta como **Falso positivo**', ephemeral: true });
      interaction.message.delete()
  } else {
    console.error(`No conozco el botón con ID: ${interaction.customId}`);
    return;
  }
})
/*
function timeoutmember(user, time, mod, reason, deletemessage){

  const usuario = user
  const tiempo = time
  const razon = reason


  if(!interaction.guild.me.permissions.has("MODERATE_MEMBERS")) return interaction.reply(`No tengo permisos para esto.`)

  if(!usuario) return interaction.reply(`${no} | No se ha encontrado al usuario.`)

          if(usuario.id === '678268422156582919'){
      return interaction.reply(`${no} | No puedo timeoutearme a mí mismo.`)
  }

          if(interaction.member.roles.highest.position <= usuario.roles.highest.position)
  return interaction.reply(`${no} | El usuario mencionado tiene el mismo rango que tú o uno superior.`)

  if(interaction.guild.me.roles.highest.position <= usuario.roles.highest.position)
  return interaction.reply(`${no} | El usuario mencionado tiene un rango superior al mío.`)



  const member = interaction.guild.members.fetch(usuario.user.id)
  if(member.isCommunicationDisabled()) return interaction.reply(`${no} | El usuario ya estaba timeouteado.`)



  const time = ms(tiempo)
  if(!time){
      return interaction.reply(`${no} | Debes introducir un tiempo válido. Ejemplo: 1d`)
  }



   member.timeout(time, razon).catch(err => interaction.reply(`Ha ocurrido un error: \n${err}`.replace("DiscordAPIError: Missing Permissions", `${no} Me faltan permisos para ejecutar esta acción.`)))  
}
*/
function addwarn(user, nivel, reason, channel, guild, modid, deletemessage, senddm) {
    let warnLevel = nivel;
    db.query(`SELECT * FROM warns WHERE user_id = '${user.id}'`, (err, rows) => {
      if (err) throw err;
  
      let warnCount = {
        leve: 0,
        medio: 0,
        grave: 0
      };
  
      if (rows && rows.length > 0) {
        rows.forEach(row => {
          warnCount[row.level]++;
        });
      }
  
      let applyWarn = true;
      let banMessage = '';
  
      if (warnLevel === 'leve' && warnCount.leve >= 2) {
        warnLevel = 'medio';
        applyWarn = false;
        banMessage = emojis.warn + ` | **<@${user.id}>**(${user.id}) ha superado el máximo de warns leve. Este debería de ser aislado temporalmente.`;
        db.query(`DELETE FROM warns WHERE user_id = '${user.id}' AND level = 'leve' LIMIT 3`, (err) => {
          if (err) throw err;
          console.log(`✅ > Se han eliminado 3 warns leves de ${user.id}.`);
          if (deletemessage == false) {
            addwarn(user, 'medio', 'Acumular un total de 3 warns leves (Último warn leve: ' + reason + ' ) - Autoinsinuado por automod', channel, guild, modid, senddm);
          } else {
            addwarn(user, 'medio', 'Acumular un total de 3 warns leves (Último warn leve: ' + reason + ' ) - Autoinsinuado por automod', channel, guild, modid, true, senddm);
          }
        });
      } else if (warnLevel === 'medio' && warnCount.medio >= 2) {
        warnLevel = 'grave';
        applyWarn = false;
        banMessage = emojis.warn + ` | **<@${user.id}>**(${user.id}) ha superado el máximo de warns medios. Este debería de ser aislado temporalmente.`;
        db.query(`DELETE FROM warns WHERE user_id = '${user}' AND level = 'medio' LIMIT 3`, (err) => {
          if (err) throw err;
          console.log(`✅ > Se han eliminado 3 warns medios de ${user.id}.`);
          if (deletemessage == false) {
            addwarn(user, 'grave', 'Acumular un total de 3 warns medios (Último warn medio: ' + reason + ' ) - Autoinsinuado por automod', channel, guild, modid, senddm);
          } else {
            addwarn(user, 'medio', 'Acumular un total de 3 warns leves (Último warn leve: ' + reason + ' ) - Autoinsinuado por automod', channel, guild, modid, true, senddm);
          }
        });
      } else if (warnLevel === 'grave' && warnCount.grave >= 2) {
        applyWarn = false;
        banMessage = emojis.warn + ` | **<@${user.id}>**(${user.id})  debe de ser baneado por superar la cantidad máxima de warns graves. (*Todos sus datos ya han sido eliminados*)`;
        db.query(`DELETE FROM warns WHERE user_id = '${user}'`, (err) => {
          if (err) throw err;
          console.log(`✅ > Se han eliminado todos los warns de ${user.id}.`);
          if (guild && guild.member) {
            const member = guild.members.cache.get(user);
            member.ban({ reason: "Máximo de warns graves superados" })
              .then(() => console.log(`Usuario ${user.id} baneado`))
              .catch(console.error);
          } else {
            console.error("❌ > No se pudo obtener el objeto member para banear al usuario");
          }
        });
      }
  
      if (applyWarn) {
        db.query(`INSERT INTO warns (user_id, reason, level, staff) VALUES ('${user.id}', '${reason}', '${warnLevel}', '${modid}')`, (err) => {
          if (err) {
            console.error(err);
            return channel.send('¡Me cachis! Ha ocurrido un error al guardar el warn en la base de datos.');
          }
  
          if (senddm) {
            const embed = new Discord.MessageEmbed()
              .setColor('#FF0000')
              .setTitle(`Mensaje de la moderación de Logikk\'s Discord`)
              .setDescription(`Hola, <@${user.id}>. Nos ponemos en contacto con usted mediante el presente comunicado para informarle sobre las medidas que se han tomado debido a su conducta.\n\nSanción impuest: Warn **${warnLevel}**\nRazón: **${reason}**\n\nLe recomendamos visitar el canal de <#901587290093158442> y echar un vistazo para evitar futuras sanciones.\nPuede encontrar una lista de sus warns en https://logikk.galnod.com/warns\nSi considera que esta sanción ha sido aplicada de forma incorrecta / injusta, puede enviar una solitud de apelación en https://logikk.galnod.com/support\n\n\nUn saludo,\n**Equipo administrativo de Logikk's Discord**`)
              .setTimestamp();
    
            user.send({ embeds: [embed] })
              .catch((dmError) => {
                console.error(dmError);
                channel.send(`${emojis.warn} | No he podido informar al usuario por DM **<@${user.id}>**(${user.id}).`);
              });
          }
  
          channel.send(`**<@${user.id}>**(${user.id}) ha recibido un warn **${warnLevel}** con la razón: \`${reason}\``)
            .then(message => {
              if (deletemessage == true) {
                setTimeout(() => {
                  message.delete();
                }, 5000);
              }
            });
        });
      } else {
        channel.send(banMessage)
          .then(message => {
            if (deletemessage == true) {
              setTimeout(() => {
                message.delete();
              }, 8000);
            }
          });
      }
    });
  }
  


function clearOldWarns() {
    const now = new Date();
    console.log("⌚ > ["+now+"] Comprobando warns...");
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  
    db.query(`SELECT * FROM warns`, (err, results) => {
      if (err) throw err;
  
      results.forEach((warn) => {
        const warnDate = new Date(warn.timestamp);
        const diffInDays = (now - warnDate) / (24 * 60 * 60 * 1000);
  
        if (warn.level === "leve" && diffInDays > 30) {
          RemovedwarnstaffLogByAutoMod(warn.user_id, warn.id, warn.level, warn.reason)
          console.log(`✅ > [`+now+`] Borrando warn leve del usuario con ID ${warn.user_id}...`);
          db.query(`DELETE FROM warns WHERE id=${warn.id}`, (err, result) => {
            if (err) throw err;
          });
        }
  
        if (warn.level === "medio" && diffInDays > 90) {
          RemovedwarnstaffLogByAutoMod(warn.user_id, warn.id, warn.level, warn.reason)
          console.log(`✅ > [`+now+`] Borrando warn medio del usuario con ID ${warn.user_id}...`);
          db.query(`DELETE FROM warns WHERE id=${warn.id}`, (err, result) => {
            if (err) throw err;
          });
        }
      });
    });
  }
  
  setInterval(clearOldWarns, 3600000);
  
function nuevoTicket(userId){
  const supportconf = require('./config/support.json')
  const serverId = supportconf.supportServerId
  const channelId = supportconf.supportChannId
  const channel = client.guilds.cache.get(serverId).channels.cache.get(channelId);

  channel.send('El usuario con ID de Discord `'+userId+ '` ha creado un nuevo ticket de soporte en la web. \nPuedes revisarlo en https://logikk.galnod.com/staff/tickets');
}

function RemovedwarnstaffLog(modid, userid, warnid){
    const automodconf = require('./config/automod.json')
    const logchannel = client.guilds.cache.get(automodconf.guild).channels.cache.get(automodconf.log)
    const log = new Discord.MessageEmbed()
    .setColor('#ff0000')
    .setTitle('Logikk\'s Tools | Warn eleiminado')
    .setDescription(`ID warn: **${warnid}**\nModerador: **<@${modid}>(${modid})**\nSanción: **Warn**\nUsuario: **<@${userid}>(${userid})**`)
    logchannel.send({ embeds: [log]})
}
function RemovedwarnstaffLogByAutoMod(userid, warnid, warnLevel, warnReason){
  const automodconf = require('./config/automod.json')
  const logchannel = client.guilds.cache.get(automodconf.guild).channels.cache.get(automodconf.log)
  const log = new Discord.MessageEmbed()
  .setColor('#ff0000')
  .setTitle('Logikk\'s Tools | Warn eleiminado')
  .setDescription(`ID warn: **${warnid}**\nModerador: **<@${client.user.id}>(${client.user.id})**\nSanción: **Warn ${warnLevel} (Expirado)**\nUsuario: **<@${userid}>(${userid})**\nRazón del Warn: **${warnReason}**`)
  logchannel.send({ embeds: [log]})
}
async function getAvatar(userId) {
  try {
    const user = await client.users.fetch(userId);
    console.log(user.displayAvatarURL())
    return user.displayAvatarURL();
  } catch (error) {
    console.error(`Error fetching user: ${error.message}`);
    return 'https://i.imgur.com/qxzp6Ux.jpg';
  }
}
function checkDev(){
  if (client.user.id == "750312626478776420"){
    return false
  }else{
    return true
  }
}
async function checkrole(memberid, roleid, guildid) {
  try {
    const guild = await client.guilds.fetch(guildid);
    const role = guild.roles.cache.get(roleid);

    if (!role) {
      return false;
    }

    let member;
    let memberFound = false;
    let after = null;

    do {
      const members = await guild.members.fetch({ limit: 1000, after });
      
      for (const guildMember of members.values()) {
        if (guildMember.id === memberid) {
          member = guildMember;
          memberFound = true;
          break;
        }
      }

      after = members.lastKey();
    } while (!memberFound && after);

    if (memberFound && member.roles.cache.has(role.id)) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error(error);
    return false;
  }
}


module.exports.checkDev = checkDev
module.exports.getAvatar = getAvatar
module.exports.nuevoTicket = nuevoTicket
module.exports.removedwarnstaffLog = RemovedwarnstaffLog
module.exports.checkrole = checkrole
client.login(process.env.discord_token)