const sql = require('mssql');
require('dotenv').config();

const authConfig = {
  server: process.env.DB_SERVER,
  database: 'skpw_TaskManager', // Database specifico per autenticazione
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT),
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_CERT === 'true',
    enableArithAbort: true,
    requestTimeout: parseInt(process.env.DB_REQUEST_TIMEOUT) || 30000,
    connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 30000
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

// Pool separato per autenticazione
const authPool = new sql.ConnectionPool(authConfig);
const authPoolConnect = authPool.connect();

// Funzione per ottenere connessione auth
const getAuthConnection = async () => {
  await authPoolConnect;
  return authPool;
};

module.exports = {
  sql,
  getAuthConnection,
  authPool
};