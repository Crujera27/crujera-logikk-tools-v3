const mysql = require('mysql2/promise');

const config = {
  host: process.env.mysql_host,
  user: process.env.mysql_username,
  password: process.env.mysql_pass,
  database: process.env.mysql_database
};

const pool = mysql.createConnection(config);

pool.getConnection()
  .then((connection) => {
    console.log('Connected to MySQL database');
    connection.release();
  })
  .catch((err) => {
    console.error('Error connecting to MySQL database:', err);
    handleDisconnect();
  });

function handleDisconnect() {
  console.log('Reconnecting to MySQL database in 10 seconds...');
  setTimeout(() => {
    pool.getConnection()
      .then((connection) => {
        console.log('Reconnected to MySQL database');
        connection.release();
      })
      .catch((err) => {
        console.error('Error reconnecting to MySQL database:', err);
        handleDisconnect();
      });
  }, 10000);
}
module.exports = pool;