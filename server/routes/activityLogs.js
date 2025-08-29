const express = require('express');
const router = express.Router();
const ActivityLog = require('../models/ActivityLog');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Applica autenticazione a tutte le route
router.use(authenticateToken);

// GET /api/activity-logs - Recupera tutti i log (solo admin)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const {
      userId,
      action,
      entityType,
      dateFrom,
      dateTo,
      limit = 100
    } = req.query;

    const filters = {};
    
    if (userId) filters.userId = parseInt(userId);
    if (action) filters.action = action;
    if (entityType) filters.entityType = entityType;
    if (dateFrom) filters.dateFrom = new Date(dateFrom);
    if (dateTo) filters.dateTo = new Date(dateTo);
    if (limit) filters.limit = parseInt(limit);

    const logs = await ActivityLog.getAll(filters);
    res.json(logs);
  } catch (error) {
    console.error('Errore nel recupero log:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/activity-logs/entity/:type/:id - Log per una specifica entità
router.get('/entity/:type/:id', requireAdmin, async (req, res) => {
  try {
    const { type, id } = req.params;
    const logs = await ActivityLog.getByEntity(type, parseInt(id));
    res.json(logs);
  } catch (error) {
    console.error('Errore nel recupero log entità:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/activity-logs/cleanup - Pulizia log vecchi (solo admin)
router.delete('/cleanup', requireAdmin, async (req, res) => {
  try {
    const { daysToKeep = 365 } = req.body;
    const deletedCount = await ActivityLog.deleteOldLogs(parseInt(daysToKeep));
    
    res.json({ 
      message: `Pulizia completata. ${deletedCount} log eliminati.`,
      deletedCount 
    });
  } catch (error) {
    console.error('Errore nella pulizia log:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;