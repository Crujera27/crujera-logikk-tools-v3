const express = require('express');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const mysql = require('mysql');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const bodyParser = require('body-parser')
const db = mysql.createPool({
  host     : process.env.mysql_host,
  user     : process.env.mysql_username,
  password : process.env.mysql_pass,
  database : process.env.mysql_database
});
const connection = db
module.exports.db = connection
const Sequelize = require('sequelize');
const sequelize = new Sequelize(process.env.mysql_database, process.env.mysql_username, process.env.mysql_pass, {
  host: process.env.mysql_host,
  dialect: 'mysql'
});

module.exports.sequelize = sequelize;
const app = express();
app.set('view engine', 'ejs');
app.use(session({
  secret: process.env.web_loginsecret,
  resave: false,
  saveUninitialized: false,
}));
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(passport.initialize());
app.use(passport.session());
const execInAllRoutesExcept = (exceptRoutes, middleware) => {
  return (req, res, next) => {
    if (exceptRoutes.includes(req.path)) {
      return next();
    }
    return middleware(req, res, next);
  };
};
// Ban controller
app.use(execInAllRoutesExcept(["/", "/legal", "/legal/privacidad", "/legal/tos", "/logout", "/auth/discord", "/auth/discord/callback"], (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/')
  }
  const userId = req.user.id;

  db.query('SELECT banned FROM users WHERE id = ?', [userId], (error, results) => {
    if (error) {
      console.error(error);
      return res.status(500).json({ error: '500 | Server Error' });
    }

    const isBanned = results[0].banned === 1;

    if (isBanned) {
      return res.render('punishments/not-approved', {
        user: req.user,
    });
    } else {
      next();
    }
  });
}));
// staff midelware
app.use(execInAllRoutesExcept(["/", "/legal", "/legal/privacidad", "/legal/tos", "/logout", "/auth/discord", "/auth/discord/callback", "/reactivar"], (req, res, next) => {
  db.query('SELECT isStaff FROM users WHERE id = ?', [req.user.id], (error, results) => {
    if (error) {
      console.error(error);
      return res.status(500).json({ error: '500 | Server Error' });
    }
    const isStaffBuffer = results[0] && results[0].isStaff;
    const isStaff = isStaffBuffer ? isStaffBuffer[0] === 1 : false;

    res.locals.isStaff = isStaff;
    next();
  });
}));


app.use(execInAllRoutesExcept(["/", "/legal", "/legal/privacidad", "/legal/tos", "/logout", "/auth/discord", "/auth/discord/callback", "/reactivar"], (req, res, next) => {
  const userId = req.user.discord_id;

  db.query('SELECT * FROM warns WHERE user_id = ? AND `read` = 0', [userId], (error, results) => {
    if (error) {
      console.error(error);
      return res.status(500).json({ error: '500 | Server Error' });
    }

    const hasUnreadWarns = results.length > 0;
    if (hasUnreadWarns) {
      return res.render('punishments/readwarns', { warns: results, user: req.user });
    } else {
      next();
    }
  });
}));






passport.use(new DiscordStrategy({
  clientID: process.env.oAuth_clientID,
  clientSecret: process.env.oAuth_clientSecret,
  callbackURL: process.env.app_callbackURL,
  scope: ['identify'],
}, (accessToken, refreshToken, profile, done) => {
  const { id, username, discriminator } = profile;

  db.query('SELECT * FROM users WHERE discord_id = ?', [id], (error, results) => {
    if (error) throw error;

    if (results.length === 0) {
      db.query('INSERT INTO users (discord_id, username, discriminator) VALUES (?, ?, ?)', [id, username, discriminator], (error) => {
        if (error) throw error;
        return done(null, profile);
      });
    } else {
      db.query('UPDATE users SET username = ?, discriminator = ? WHERE discord_id = ?', [username, discriminator, id], (error) => {
        if (error) throw error;
        return done(null, profile);
      });
    }
  });
}));

// Serializar y deserializar el usuario
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  db.query('SELECT * FROM users WHERE discord_id = ?', [id], (error, results) => {
    if (error) throw error;
    done(null, results[0]);
  });
});


app.get('/reactivar', async (req, res) => {
  try {
    await db.query('UPDATE warns SET `read` = 1 WHERE user_id = ' + req.user.discord_id);
    res.redirect('/dash');
  } catch (err) {
    console.error(err);
    res.status(500).send('500 | Server Error');
  }
});
app.get('/auth/discord', passport.authenticate('discord'));
app.get('/auth/discord/callback', passport.authenticate('discord', {
  failureRedirect: '/',
}), (req, res) => {
  res.redirect('/');
});
app.get('/logout', function(req, res, next){
    if (req.isAuthenticated()) {
    req.logout(function(err) {
      if (err) { return next(err); }
      res.render('loggedout', {});
    });
}else{
    return res.redirect('/')
}});
app.get('/not-approved', function(req, res, next){
    if (req.isAuthenticated()) {
        res.render('not-approved', {
            user: req.user,
        });
}else{
    return res.redirect('/auth/discord')
}});
app.get('/tickets', async (req, res) => {
  if (req.isAuthenticated()) {
  const Ticket = require('./models/ticket');
  // Obtener todos los tickets del usuario desde la base de datos
  const tickets = await Ticket.findAll({
    where: { userId: req.user.id },
    order: [['updatedAt', 'DESC']]
  });
  res.render('tickets', { tickets, user: req.user, noti: req.query.noti });
}else{
  return res.redirect('/auth/discord')}})
  const ticketController = require('./models/ticketController');
const { copyFileSync } = require('fs');
  app.post('/tickets', ticketController.createTicket);
  app.get('/tickets/:id', ticketController.viewTicket);
  function isAuthenticatedAndOwner(req, res, next) {
    // Verificar si el usuario tiene una sesión iniciada
    if (!req.session.user) {
      // Si el usuario no tiene sesión, redirigirlo a la página de inicio de sesión
      return res.redirect('/');
    }
  
    // Obtener el ID del ticket de la URL
    const ticketId = req.params.id;
  
    // Obtener el ID del usuario de la sesión
    const userId = req.session.user.id;
  
    // Verificar si el usuario es el dueño del ticket
    db.query('SELECT user_id FROM tickets WHERE id = ?', [ticketId], (err, results) => {
      if (err) throw err;
  
      const ticketOwnerId = results[0].user_id;
  
      if (ticketOwnerId !== userId) {
        // Si el usuario no es el dueño del ticket, mostrar un error 403 (prohibido)
        return res.status(403).send('No estás autorizado para ver este ticket');
      }
  
      // Si el usuario tiene una sesión iniciada y es el dueño del ticket, continuar con la siguiente función middleware o el controlador correspondiente
      next();
    });
  }
  app.get('/legal', (req, res) => {
    res.redirect('/')
  });
  app.get('/legal/privacidad', (req, res) => {
    const filePath = path.join(__dirname, './views/docs', 'Logikk\'s Dash - Política de Privacidad.pdf');
    res.sendFile(filePath)
  });
  app.get('/legal/tos', (req, res) => {
    const filePath = path.join(__dirname, './views/docs', 'Logikk\'s Dash - ToS.pdf');
    res.sendFile(filePath)
  });  
  app.get('/tickets/:id', isAuthenticatedAndOwner, (req, res) => {
    ticketController.viewTicket(req, res, req.user);
  });
  app.get('/img/discord.png', (req, res) => {
    // Verificar si el usuario ha iniciado sesión
    if (req.isAuthenticated()) {
      // Pasar los datos del usuario a la página de inicio
      res.redirect('/dash');
    } else {
      res.render('discord.png')
    }
  }); 



app.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    res.redirect('/dash');
  } else {
    res.render('login', {
      user: req.user,
      version: require('./package.json').version,
  });
  }
});

app.get('/dash', (req, res) => {
  if (req.isAuthenticated()) {
    const appstatus = require('./main').getservicedisruptionge
    console.log(appstatus)
    res.render('index', {
      user: req.user,
      status: appstatus,
      error: req.query.error,
      version: require('./package.json').version,
  });
  } else {
    res.redirect('/auth/discord');
  }
});
app.get('/support', (req, res) => {
  if (req.isAuthenticated()) {
    res.render('support/seleccionar', {
      user: req.user,
  });
  } else {
    res.redirect('/auth/discord');
  }
});
app.get('/support/appeal-warn/procedure', (req, res) => {
  if (req.isAuthenticated()) {
    const warnId = req.query['warn-id'];
    const sql = 'SELECT * FROM warns WHERE id = ? AND user_id = ?';
    db.query(sql, [warnId, req.user.discord_id], (err, results) => {
      if (err) throw err;
      if (results.length === 0) {
        return res.redirect('/dash?error=403-warnnotownedbyuser');
      }
      res.render('support/warn-appeal', { warn: results[0], user: req.user });
    });
  } else {
    return res.redirect('/auth/discord');
  }
});
app.post('/support/appeal-warn/procedure', (req, res) => {
  if (req.isAuthenticated()) {
    const { userId, warnId, longReason } = req.body;
    const sql1 = 'SELECT * FROM warns WHERE id = ? AND user_id = ?';
    db.query(sql1, [warnId, req.user.discord_id], (err, results) => {
      if (err) throw err;
      if (results.length === 0) {
        return res.redirect('/dash?error=403-warnnotownedbyuser');
      }

      const sql2 = 'SELECT * FROM appeals WHERE user_id = ? AND warn_id = ?';
      db.query(sql2, [req.user.discord_id, warnId], (err, appealResults) => {
        if (err) throw err;
        if (appealResults.length > 0) {
          return res.redirect('/dash?error=500-appealexists');
        }

        const sql3 = 'INSERT INTO appeals (user_id, warn_id, reason) VALUES (?, ?, ?)';
        db.query(sql3, [req.user.discord_id, warnId, longReason], (err, results) => {
          if (err) throw err;
        });

        const sql4 = 'INSERT INTO tickets (title, description, status, userId, discord_id) VALUES (?, ?, ?, ?, ?)';
        db.query(sql4, ['Apelación del warn n.º ' + warnId, longReason, 'en progreso', req.user.id, req.user.discord_id], (err, results) => {
          if (err) throw err;
          res.redirect('/dash?error=200-warnprocedure');
        });
      });
    });
  } else {
    return res.redirect('/auth/discord');
  }
});



app.get('/support/appeal-warn', (req, res) => {
  if (req.isAuthenticated()) {
  const sql = 'SELECT * FROM warns WHERE user_id = ?';
  db.query(sql, [req.user.discord_id], (err, results) => {
  if (err) throw err;
  res.render('support/select-warn-appeal', { warns: results, user: req.user});
  });
  }else{
      return res.redirect('/auth/discord')
  }
});
app.get('/jobs', (req, res) => {
  if (req.isAuthenticated()) {
    res.render('jobs', {
      user: req.user,
      error: req.query.error,
  });
  } else {
    res.redirect('/auth/discord');
  }
});
  app.get('/warns', (req, res) => {
    if (req.isAuthenticated()) {
    const sql = 'SELECT * FROM warns WHERE user_id = ?';
    db.query(sql, [req.user.discord_id], (err, results) => {
    if (err) throw err;
    res.render('warns', { warns: results, user: req.user});
    });
    }else{
        return res.redirect('/auth/discord')
    }
  });
  const staffIds = process.env.staffs_ids.split(',');

  function isStaff(req, res, next) {
    const supportconf = require('./config/support.json')
    let test = false
    var staffIds = require('./config/staff.json').staff.split(',');
    if (staffIds.includes(req.user.discord_id)) {
      return true;
    } else {
      return false
    }
  }
  
  // Staff controller
  app.get('/staff', (req, res) => {
    if (req.isAuthenticated()) {
      if(isStaff(req, res)==true){
        function getCurrentHourInMadrid() {
          const madridTime = new Date().toLocaleString("es-ES", {
            timeZone: "Europe/Madrid",
          });
          return new Date(madridTime).getHours();
        }


       return res.render('staff/staff', {user: req.user, getCurrentHourInMadrid: getCurrentHourInMadrid()});
      }
      return res.redirect('/dash?error=403');
    }else{
        return res.redirect('/auth/discord')
    }
  });
  app.get('/staff/managewarns', (req, res) => {
    if (req.isAuthenticated()) {
      if (isStaff(req, res)) {
        const userId = req.query.userId;
  
        // Check if userId is provided
        if (!userId) {
          return res.render('staff/warnmanager', { warns: [], user: req.user, error: 'userIdMissing', done: req.query.done });
        }
  
        db.query(`SELECT * FROM warns WHERE user_id = ?`, [userId], (err, results) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ error: '500 | Server Error' });
          } else {
            return res.render('staff/warnmanager', { warns: results, user: req.user, error: null, done: req.query.done }); 
          }
        });
      } else {
        return res.redirect('/dash?error=403');
      }
    } else {
      return res.redirect('/auth/discord');
    }
  });
  app.get('/staff/revokeWarn', (req, res) => {
    if (req.isAuthenticated()) {
      if (isStaff(req, res)) {
    const { warnId } = req.query;
    if (!req.query.userId) {
      return res.status(400).json({ error: 'La URL ha sido manipulada. Las acciones han sido registradas' });
    }
    if (!warnId || isNaN(warnId)) {
      return res.status(400).json({ error: 'ID del warn inválida' });
    }
    require('./main').removedwarnstaffLog(req.user.discord_id, req.query.userId, warnId)
    db.query('DELETE FROM warns WHERE id = ?', [warnId], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: '500 | Server Error' });
      }
      res.redirect('/staff/managewarns?done=true')
    });
  } else {
    return res.redirect('/dash?error=403');
  }
} else {
  return res.redirect('/auth/discord');
}
});
  
  app.get('/staff/addwarn', (req, res) => {
    if (req.isAuthenticated()) {
      if(isStaff(req, res)==true){
        //desactivado
        return res.redirect('/staff')
      return res.render('staff/addwarn', {user: req.user});
      }
      return res.redirect('/dash?error=403');
    }else{
        return res.redirect('/auth/discord')
    }
  }); 
  app.get('/staff/tickets', (req, res) => {
    if (req.isAuthenticated()) {
      if (isStaff(req, res)) {
        connection.query("SELECT * FROM tickets WHERE status = 'en progreso'", (error, results, fields) => {
          if (error) throw error;
          return res.render('staff/ticketlist', {user: req.user, tickets: results, noti: req.query.noti});
        });
      } else {
        return res.redirect('/dash?error=403');
      }
    } else {
      return res.redirect('/auth/discord')
    }
  });
  app.post('/staff/system/addwarn', (req, res) => {
    if (req.isAuthenticated()) {
      if(isStaff(req, res)==true){
        //desactivado
        return res.redirect('/staff')
    const { userId, reason, level, staffID } = req.body;
    console.log(userId. reason, level, staffID)
    db.query(`INSERT INTO warns (user_id, reason, level, staff) VALUES ('${userId}', '${reason}', '${level}', '${staffid}')`, (err) => {
      if (err) {
        return console.error(err);
      }
    });
    console.log(`Nuevo warn agregado para el usuario con ID ${userId}`);
    res.redirect('/staff');
  }}else{
    return res.redirect('/')
  }
});
app.post('/staff/tickets/:id/update-status', (req, res) => {
  const id = req.params.id;
  const status = req.body.status;

  // actualiza el estado del ticket en la base de datos
  connection.query('UPDATE tickets SET status = ? WHERE id = ?', [status, id], (error, results, fields) => {
    if (error) throw error;
    res.redirect('/staff/tickets?noti=done');
  });
  });
  
  // Manejador de rutas para cambiar el estado del ticket a 'abierto'
  app.put('/staff/tickets/:id/status/abierto', (req, res) => {
  const id = req.params.id;
  changeTicketStatus(id, 'abierto')
  .then(() => {
  res.redirect('/staff/tickets?noti=done');
  })
  .catch((error) => {
  console.error(error);
  res.status(500).send('Error al cambiar el estado del ticket');
  });
  });
  
  // Manejador de rutas para cambiar el estado del ticket a 'cerrado'
  app.put('/staff/tickets/:id/status/cerrado', (req, res) => {
  const id = req.params.id;
  changeTicketStatus(id, 'cerrado')
  .then(() => {
  res.redirect('/staff/tickets?noti=done');
  })
  .catch((error) => {
  console.error(error);
  res.status(500).send('Error al cambiar el estado del ticket');
  });
  });  
  

  app.use(function(req, res, next) {
    res.status(404).redirect('/dash?error=404');
  });

  // Iniciar el servidor
  app.listen(process.env.app_port || 3000, () => {
    console.log('Servidor activo en '+process.env.app_public+' (Puerto: '+process.env.app_port+')');
  });
