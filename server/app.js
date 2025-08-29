const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import database configuration - Modifica questa riga
const { getConnection } = require('./server/config/database');

// Import routes
const clientiRoutes = require('./server/routes/clienti');
const softwareRoutes = require('./server/routes/software');
const licenzeRoutes = require('./server/routes/licenze');
const documentManagerRoutes = require('./server/routes/documentManager');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Aggiungi middleware per iniettare la connessione al database
app.use(async (req, res, next) => {
  try {
    req.db = await getConnection();
    next();
  } catch (err) {
    console.error('❌ Errore connessione database:', err);
    res.status(500).json({ error: 'Errore di connessione al database' });
  }
});

// API Routes
app.use('/api/clienti', clientiRoutes);
app.use('/api/software', softwareRoutes);
app.use('/api/licenze', licenzeRoutes);
app.use('/api/documentManager', documentManagerRoutes);

// Health check endpoint con verifica database
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

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist/index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(500).json({ 
    error: 'Errore interno del server',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Errore interno'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint non trovato' });
});

// Start server with database connection check
const startServer = async () => {
  try {
    // Test initial database connection
    const pool = await getConnection();
    console.log('✅ Connessione al database verificata con successo');
    
    app.listen(PORT, () => {
      console.log(`🚀 Server avviato su porta ${PORT}`);
      console.log(`📡 API disponibile su http://localhost:${PORT}/api`);
      console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (err) {
    console.error('❌ Impossibile connettersi al database:', err);
    process.exit(1);
  }
};

startServer();

module.exports = app;