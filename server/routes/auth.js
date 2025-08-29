const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { generateToken, getClientInfo } = require('../middleware/auth');
const ActivityLog = require('../models/ActivityLog');

// POST /api/auth/login - Login utente
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username e password sono obbligatori' });
    }

    // Trova l'utente
    const user = await User.findByUsername(username);
    if (!user) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }

    // Verifica la password
    const isValidPassword = await User.validatePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }

    // Genera token JWT
    const token = generateToken(user);
    const clientInfo = getClientInfo(req);

    // Log dell'accesso
    try {
      await ActivityLog.create({
        userId: user.id,
        username: user.username,
        action: 'LOGIN',
        entityType: 'User',
        entityId: user.id,
        entityName: user.fullName,
        oldValues: null,
        newValues: JSON.stringify({ loginTime: new Date().toISOString() }),
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent
      });
    } catch (logError) {
      console.error('Errore nel log di accesso:', logError);
    }

    // Rimuovi la password dalla risposta
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Login effettuato con successo',
      token,
      user: userWithoutPassword
    });

    console.log(`✅ Login: ${user.username} (${user.role}) da ${clientInfo.ipAddress}`);
  } catch (error) {
    console.error('Errore nel login:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// POST /api/auth/logout - Logout utente (opzionale, per logging)
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      // Decodifica il token per ottenere info utente (senza verificarlo)
      const jwt = require('jsonwebtoken');
      try {
        const decoded = jwt.decode(token);
        if (decoded) {
          const clientInfo = getClientInfo(req);
          
          // Log del logout
          await ActivityLog.create({
            userId: decoded.userId,
            username: decoded.username,
            action: 'LOGOUT',
            entityType: 'User',
            entityId: decoded.userId,
            entityName: decoded.username,
            oldValues: null,
            newValues: JSON.stringify({ logoutTime: new Date().toISOString() }),
            ipAddress: clientInfo.ipAddress,
            userAgent: clientInfo.userAgent
          });

          console.log(`👋 Logout: ${decoded.username} da ${clientInfo.ipAddress}`);
        }
      } catch (decodeError) {
        console.error('Errore nel decode token per logout:', decodeError);
      }
    }

    res.json({ message: 'Logout effettuato con successo' });
  } catch (error) {
    console.error('Errore nel logout:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// GET /api/auth/me - Verifica token e restituisce info utente
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token di accesso richiesto' });
    }

    const jwt = require('jsonwebtoken');
    const { JWT_SECRET } = require('../middleware/auth');
    
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Utente non valido o disattivato' });
    }

    res.json({
      id: user.id,
      username: user.username,
      role: user.role,
      fullName: user.fullName,
      email: user.email
    });
  } catch (error) {
    console.error('Errore nella verifica token:', error);
    res.status(403).json({ error: 'Token non valido' });
  }
});

module.exports = router;