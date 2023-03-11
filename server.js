const express = require('express');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const mysql = require('mysql');
const dbconf = require('./conf.d/mysql.json')
// Crear una conexión a la base de datos MySQL
const db = mysql.createConnection({
  host: dbconf.host,
  user: dbconf.username,
  password: dbconf.pass,
  database: dbconf.db,
});
const connection = db
module.exports.db = connection
const Sequelize = require('sequelize');
const sequelize = new Sequelize(dbconf.db, dbconf.username, dbconf.pass, {
  host: dbconf.host,
  dialect: 'mysql'
});

module.exports.sequelize = sequelize;
// Crear una aplicación de Express
const app = express();
app.set('view engine', 'ejs');

// Configurar la sesión de Express
app.use(session({
  secret: 'vX7RsvhD44enVUPerHCKWuEws9PleC',
  resave: false,
  saveUninitialized: false,
}));

// Inicializar Passport y configurar la estrategia de Discord
app.use(passport.initialize());
app.use(passport.session());

passport.use(new DiscordStrategy({
  clientID: require('./conf.d/web.json').clientID,
  clientSecret: require('./conf.d/web.json').clientSecret,
  callbackURL: 'http://localhost:3000/auth/discord/callback',
  scope: ['identify'],
}, (accessToken, refreshToken, profile, done) => {
  // Buscar al usuario en la base de datos o crear uno nuevo si no existe
  const { id, username, discriminator } = profile;
  db.query('SELECT * FROM users WHERE discord_id = ?', [id], (error, results) => {
    if (error) throw error;
    if (results.length === 0) {
      db.query('INSERT INTO users (discord_id, username, discriminator) VALUES (?, ?, ?)', [id, username, discriminator], (error) => {
        if (error) throw error;
        return done(null, profile);
      });
    } else {
      return done(null, profile);
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

// Crear las rutas para la autenticación de Discord
app.get('/auth/discord', passport.authenticate('discord'));
app.get('/auth/discord/callback', passport.authenticate('discord', {
  failureRedirect: '/error',
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
  res.render('tickets', { tickets, user: req.user });
}else{
  return res.redirect('/auth/discord')}})
  const ticketController = require('./models/ticketController');
  app.post('/tickets', ticketController.createTicket);
  app.get('/tickets/:id', ticketController.viewTicket);
  function isAuthenticatedAndOwner(req, res, next) {
    // Verificar si el usuario tiene una sesión iniciada
    if (!req.session.user) {
      // Si el usuario no tiene sesión, redirigirlo a la página de inicio de sesión
      return res.redirect('/login');
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
  // Verificar si el usuario ha iniciado sesión
  if (req.isAuthenticated()) {
    // Pasar los datos del usuario a la página de inicio
    res.redirect('/dash');
  } else {
    res.render('login', {
      user: req.user,
  });
  }
});
app.get('/dash', (req, res) => {
  // Verificar si el usuario ha iniciado sesión
  if (req.isAuthenticated()) {
    // Pasar los datos del usuario a la página de inicio
    res.render('index', {
      user: req.user,
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
  const staffIds = ['id1', 'id2', 'id3'];

  function isStaff(req, res, next) {
    if (staffIds.includes(req.user.discord_id)) {
      return next(); 
    } else {
      res.status(403).send('No tienes permisos para acceder a esta página.');
    }
  }
  
  // Ejemplo de uso del middleware en una ruta:
  app.get('/staff', isStaff, (req, res) => {
    if (req.isAuthenticated()) {
    res.render('staff');
    }else{
        return res.redirect('/auth/discord')
    }
  });
    

  // Iniciar el servidor
  app.listen(3000, () => {
    console.log('Servidor iniciado en http://localhost:3000');
  });
