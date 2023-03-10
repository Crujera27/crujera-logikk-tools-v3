const Discord = require('discord.js');
const emojis = require('./config/emojis.json')
const mysql = require('mysql');
const { Client, Intents } = require('discord.js');
const client = new Client({ 
    intents: [
      Intents.FLAGS.GUILDS, 
      Intents.FLAGS.GUILD_MESSAGES, 
      Intents.FLAGS.DIRECT_MESSAGES
    ] 
  });
const dbconf = require('./conf.d/mysql.json')
const db = mysql.createConnection({
  host     : dbconf.host,
  user     : dbconf.username,
  password : dbconf.pass,
  database : dbconf.db
});

client.on('ready', () => {
  console.log(`Conectado como ${client.user.tag}!`);
  clearOldWarns()
  client.user.setPresence({
    status: 'dnd',
  });
  client.user.setActivity('Logikk\'s Discord', { type: 'WATCHING' })
});

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
          if (warnLevel === 'leve' && warnCount.leve >= 3) {
            warnLevel = 'medio';
            applyWarn = false;
            banMessage = emojis.warn+` | ${user.username} ha superado el máximo de warns leve. Este debería de ser aislado temporalmente y aplicarle un warn medio de acuerdo con la normativa vigente.`;
            db.query(`DELETE FROM warns WHERE user_id = '${user.id}' AND level = 'leve' LIMIT 3`, (err) => {
              if (err) throw err;
              console.log(`Se han eliminado 3 warns leves de ${user.username}.`);
            });
          } else if (warnLevel === 'medio' && warnCount.medio >= 3) {
            warnLevel = 'grave';
            applyWarn = false;
            banMessage = emojis.warn+` | ${user.username} ha superado el máximo de warns medios. Este debería de ser aislado temporalmente y aplicarle un warn grave de acuerdo con la normativa vigente.`;
            db.query(`DELETE FROM warns WHERE user_id = '${user.id}' AND level = 'medio' LIMIT 3`, (err) => {
              if (err) throw err;
              console.log(`Se han eliminado 3 warns medios de ${user.username}.`);
            });
        } else if (warnLevel === 'grave' && warnCount.grave >= 3) {
            applyWarn = false;
            banMessage = emojis.warn` | ${user.username} debe de ser baneado por superar la cantidad máxima de warns graves. (*Todos sus datos ya han sido eliminados*)`;
            db.query(`DELETE FROM warns WHERE user_id = '${user.id}'`, (err) => {
                if (err) throw err;
                console.log(`Se han eliminado todos los warns de ${user.username}.`);
                if (message.guild && message.guild.member) {
                    const member = message.guild.members.cache.get(user.id);
                  member.ban({reason: "Máximo de warns graves superados"})
                    .then(() => console.log(`Usuario ${user.username} baneado`))
                    .catch(console.error);
                } else {
                  console.error("No se pudo obtener el objeto member para banear al usuario");
                }
              })}
          if (applyWarn) {
            // Aplicamos el warn
            db.query(`INSERT INTO warns (user_id, reason, level, staff) VALUES ('${user.id}', '${reason}', '${warnLevel}', '${message.author.id}')`, (err) => {
              if (err) {
                console.error(err);
                return message.reply('Me cachis! Ha ocurrido un error al guardar el warn en la base de datos.');
              }
              message.channel.send(`**${user.tag}** ha recibido un warn **${warnLevel}** con la razón: \`${reason}\``);
            });
          } else {
            // Si no se aplica el warn, se envía un mensaje de advertencia y se sugiere el baneo
            message.channel.send(banMessage);
          }
        })        
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
            message.channel.send(`Lista de warns para  **${user.tag}**:\n${warnList}`);
          }
          
      
    
      })}})


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
  


client.login(require('./conf.d/secret.json').token);