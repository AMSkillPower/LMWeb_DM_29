const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Middleware per verificare il token JWT
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Token di accesso richiesto' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Utente non valido o disattivato' });
    }

    req.user = {
      id: user.id,
      username: user.username,
      role: user.role,
      fullName: user.fullName,
      email: user.email
    };

    next();
  } catch (error) {
    console.error('Errore autenticazione:', error);
    return res.status(403).json({ error: 'Token non valido' });
  }
};

// Middleware per verificare il ruolo admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ error: 'Accesso negato. Privilegi amministratore richiesti.' });
  }
  next();
};

// Middleware per verificare ruolo user o admin
const requireUser = (req, res, next) => {
  if (!['User', 'Admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Accesso negato. Privilegi utente richiesti.' });
  }
  next();
};

// Funzione per generare token JWT
const generateToken = (user) => {
  return jwt.sign(
    { 
      userId: user.id, 
      username: user.username, 
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Funzione per estrarre informazioni client
const getClientInfo = (req) => {
  return {
    ipAddress: req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown'
  };
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireUser,
  generateToken,
  getClientInfo,
  JWT_SECRET
};