const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { logActivity, saveOriginalData } = require('../middleware/activityLogger');

// Applica autenticazione a tutte le route
router.use(authenticateToken);

// GET /api/users - Recupera tutti gli utenti (solo admin)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const users = await User.getAll();
    res.json(users);
  } catch (error) {
    console.error('Errore nel recupero utenti:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/users/:id - Recupera un utente specifico (solo admin)
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Utente non trovato' });
    }
    res.json(user);
  } catch (error) {
    console.error('Errore nel recupero utente:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/users - Crea un nuovo utente (solo admin)
router.post('/', requireAdmin, logActivity('User'), async (req, res) => {
  try {
    const { username, password, role, fullName, email, isActive } = req.body;
    
    if (!username || !password || !role || !fullName) {
      return res.status(400).json({ 
        error: 'Username, password, ruolo e nome completo sono obbligatori' 
      });
    }

    if (!['User', 'Admin'].includes(role)) {
      return res.status(400).json({ error: 'Ruolo deve essere User o Admin' });
    }

    const newUser = await User.create({
      username,
      password,
      role,
      fullName,
      email: email || null,
      isActive: isActive !== undefined ? isActive : true
    });

    res.status(201).json(newUser);
  } catch (error) {
    console.error('Errore nella creazione utente:', error);
    if (error.message.includes('UNIQUE')) {
      res.status(400).json({ error: 'Username già esistente' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// PUT /api/users/:id - Aggiorna un utente (solo admin)
router.put('/:id', requireAdmin, saveOriginalData(User), logActivity('User'), async (req, res) => {
  try {
    const { password, role, fullName, email, isActive } = req.body;
    
    if (!role || !fullName) {
      return res.status(400).json({ 
        error: 'Ruolo e nome completo sono obbligatori' 
      });
    }

    if (!['User', 'Admin'].includes(role)) {
      return res.status(400).json({ error: 'Ruolo deve essere User o Admin' });
    }

    const updateData = {
      role,
      fullName,
      email: email || null,
      isActive: isActive !== undefined ? isActive : true
    };

    if (password) {
      updateData.password = password;
    }

    const updatedUser = await User.update(req.params.id, updateData);

    if (!updatedUser) {
      return res.status(404).json({ error: 'Utente non trovato' });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error('Errore nell\'aggiornamento utente:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/users/:id - Elimina un utente (solo admin)
router.delete('/:id', requireAdmin, saveOriginalData(User), logActivity('User'), async (req, res) => {
  try {
    // Impedisci l'eliminazione del proprio account
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ error: 'Non puoi eliminare il tuo stesso account' });
    }

    await User.delete(req.params.id);
    res.json({ message: 'Utente eliminato con successo' });
  } catch (error) {
    console.error('Errore nell\'eliminazione utente:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;