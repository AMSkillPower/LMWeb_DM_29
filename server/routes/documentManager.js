const express = require('express');
const router = express.Router();
const DocumentManager = require('../models/DocumentManager');
const { sql } = require('../config/database');

// Forza il content-type a JSON per tutte le risposte
router.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  next();
});

// GET /api/documentManager - Ottieni tutti i documenti
router.get('/', async (req, res) => {
  try {
    const pool = req.db;
    const result = await pool.request().query('SELECT * FROM DocumentManager');
    res.json(result.recordset);
  } catch (err) {
    console.error('Errore nel recupero documenti:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/documentManager/:id - Ottieni un singolo documento
router.get('/:id', async (req, res) => {
  try {
    const pool = req.db;

    const result = await pool.request()
      .input('id', sql.Int, Number(req.params.id))
      .query('SELECT * FROM DocumentManager WHERE id = @id');
    
    if (result.recordset.length > 0) {
      res.json(result.recordset[0]);
    } else {
      res.status(404).json({ error: 'Documento non trovato' });
    }
  } catch (err) {
    console.error('Errore nel recupero documento:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/documentManager - Crea nuovo documento
router.post('/', async (req, res) => {
  try {
    const pool = req.db;
    const result = await pool.request()
      .input('documentManagerKey', sql.VarChar, req.body.documentManagerKey)
      .input('anno', sql.Int, req.body.anno)
      .input('note', sql.Text, req.body.note)
      .input('clienteId', sql.Int, req.body.clienteId)
      .query(`
        INSERT INTO DocumentManager 
        (documentManagerKey, anno, note, clienteId, createdAt, updatedAt)
        OUTPUT INSERTED.*
        VALUES 
        (@documentManagerKey, @anno, @note, @clienteId, GETDATE(), GETDATE())
      `);
    res.status(201).json(result.recordset[0]);
  } catch (err) {
    console.error('Errore nella creazione documento:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/documentManager/:id - Aggiorna documento
router.put('/:id', async (req, res) => {
  try {
    const pool = req.db;
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('documentManagerKey', sql.VarChar, req.body.documentManagerKey)
      .input('anno', sql.Int, req.body.anno)
      .input('note', sql.Text, req.body.note)
      .query(`
        UPDATE DocumentManager 
        SET 
          documentManagerKey = @documentManagerKey,
          anno = @anno,
          note = @note,
          updatedAt = GETDATE()
        WHERE id = @id
      `);
    
    if (result.rowsAffected[0] > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Documento non trovato' });
    }
  } catch (err) {
    console.error('Errore nell\'aggiornamento documento:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/documentManager/1 - Elimina documento
router.delete('/:id', async (req, res) => {
  try {
    const pool = req.db;
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('DELETE FROM DocumentManager WHERE id = @id');
    if (result.rowsAffected[0] > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Documento non trovato' });
    }
  } catch (err) {
    console.error('Errore nell\'eliminazione documento:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/documentManager/cliente/:clienteId - Documenti per cliente
router.get('/cliente/:clienteId', async (req, res) => {
  try {
    const pool = req.db;
    const result = await pool.request()
      .input('clienteId', sql.Int, req.params.clienteId)
      .query('SELECT * FROM DocumentManager WHERE clienteId = @clienteId');
    res.json(result.recordset);
  } catch (err) {
    console.error('Errore nel recupero documenti per cliente:', err);
    res.status(500).json({ error: err.message });
  }
});


router.use(async (req, res, next) => {
  if (!req.db) {
    return res.status(500).json({ error: 'Database connection not available' });
  }
  next();
});

// GET /api/documentManager
router.get('/', async (req, res) => {
  try {
    const result = await req.db.request().query('SELECT * FROM DocumentManager');
    res.json(result.recordset);
  } catch (err) {
    console.error('Errore nel recupero documenti:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;