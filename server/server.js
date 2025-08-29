const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Importa la connessione al database MSSQL
const { getConnection } = require('./config/database');

// Import routes
const clientiRoutes = require('./routes/clienti');
const softwareRoutes = require('./routes/software');
const licenzeRoutes = require('./routes/licenze');
const documentManagerRoutes = require('./routes/documentManager');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware per iniettare la connessione al database nelle richieste
app.use(async (req, res, next) => {
  try {
    req.db = await getConnection();
    next();
  } catch (err) {
    console.error('❌ Errore connessione database:', err);
    res.status(500).json({ error: 'Errore di connessione al database' });
  }
});

// Altri middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes API
app.use('/api/clienti', clientiRoutes);
app.use('/api/software', softwareRoutes);
app.use('/api/licenze', licenzeRoutes);
app.use('/api/documentManager', documentManagerRoutes);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const result = await req.db.request().query('SELECT 1 as test');
    res.json({ 
      status: 'OK', 
      database: 'connected',
      timestamp: new Date().toISOString() 
    });
  } catch (err) {
    res.status(500).json({ 
      status: 'ERROR', 
      database: 'disconnected',
      error: err.message 
    });
  }
});

// Serve static files from React build
app.use(express.static(path.join(__dirname, '../dist')));

// Handle React routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(500).json({ 
    error: 'Errore interno del server',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Errore interno'
  });
});

// Avvio server con verifica connessione al database
async function startServer() {
  try {
    // Verifica la connessione al database prima di avviare
    const pool = await getConnection();
    console.log('✅ Connessione al database verificata con successo');
    
    app.listen(PORT, () => {
      console.log(`🚀 Server avviato su porta ${PORT}`);
      console.log(`📊 Dashboard: http://localhost:${PORT}`);
      console.log(`🔗 API: http://localhost:${PORT}/api`);
      console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (err) {
    console.error('❌ Impossibile connettersi al database:', err);
    process.exit(1);
  }
}

startServer();