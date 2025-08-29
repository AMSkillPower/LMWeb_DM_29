const sql = require('mssql');
require('dotenv').config();

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT),
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_CERT === 'true',
    enableArithAbort: true,
    requestTimeout: parseInt(process.env.DB_REQUEST_TIMEOUT),
    connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT)
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

// Crea il pool immediatamente
const pool = new sql.ConnectionPool(config);
const poolConnect = pool.connect();

// Funzione per ottenere una connessione
const getConnection = async () => {
  await poolConnect;
  return pool;
};

module.exports = {
  sql,
  getConnection,
  pool // esporta anche il pool direttamente se necessario
};