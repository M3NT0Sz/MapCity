const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root', // altere para seu usuário
  password: '', // altere para sua senha
  database: 'mapcity', // altere para o nome do seu banco
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
