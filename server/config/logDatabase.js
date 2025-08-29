const sql = require('mssql');
require('dotenv').config();

const logConfig = {
  server: process.env.DB_SERVER,
  database: 'skpw_LicenseManager', // Database specifico per logging
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

// Pool separato per logging
const logPool = new sql.ConnectionPool(logConfig);
const logPoolConnect = logPool.connect();

// Funzione per ottenere connessione log
const getLogConnection = async () => {
  await logPoolConnect;
  return logPool;
};

module.exports = {
  sql,
  getLogConnection,
  logPool
};