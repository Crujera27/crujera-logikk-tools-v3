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

// Crear una aplicación de Express
const app = express();
app.set('view engine', 'ejs');

// Configurar la sesión de Express
app.use(session({
  secret: 'mi-secreto',
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
app.get('/tickets', function(req, res, next){
  if (req.isAuthenticated()) {
      res.render('tickets', {
          user: req.user,
      });
}else{
  return res.redirect('/auth/discord')
}});
app.get('/', (req, res) => {
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
