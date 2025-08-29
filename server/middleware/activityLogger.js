const ActivityLog = require('../models/ActivityLog');
const { getClientInfo } = require('./auth');

// Middleware per loggare le attività
const logActivity = (entityType) => {
  return (req, res, next) => {
    // Salva il metodo originale res.json
    const originalJson = res.json;
    
    // Override del metodo res.json per intercettare la risposta
    res.json = function(data) {
      // Chiama il metodo originale
      const result = originalJson.call(this, data);
      
      // Log dell'attività solo se la richiesta è andata a buon fine
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        setImmediate(async () => {
          try {
            const clientInfo = getClientInfo(req);
            let action = '';
            let entityId = null;
            let entityName = '';
            let oldValues = null;
            let newValues = null;

            // Determina l'azione basata sul metodo HTTP
            switch (req.method) {
              case 'POST':
                action = 'CREATE';
                entityId = data.id || data.recordset?.[0]?.id;
                entityName = getEntityName(entityType, data);
                newValues = JSON.stringify(sanitizeData(data));
                break;
              case 'PUT':
                action = 'UPDATE';
                entityId = req.params.id ? parseInt(req.params.id) : data.id;
                entityName = getEntityName(entityType, data);
                oldValues = req.originalData ? JSON.stringify(sanitizeData(req.originalData)) : null;
                newValues = JSON.stringify(sanitizeData(data));
                break;
              case 'DELETE':
                action = 'DELETE';
                entityId = req.params.id ? parseInt(req.params.id) : null;
                entityName = req.originalData ? getEntityName(entityType, req.originalData) : `${entityType} ID: ${entityId}`;
                oldValues = req.originalData ? JSON.stringify(sanitizeData(req.originalData)) : null;
                break;
              default:
                return; // Non logga GET e altri metodi
            }

            if (action && entityId) {
              await ActivityLog.create({
                userId: req.user.id,
                username: req.user.username,
                action,
                entityType,
                entityId,
                entityName,
                oldValues,
                newValues,
                ipAddress: clientInfo.ipAddress,
                userAgent: clientInfo.userAgent
              });

              console.log(`📝 Log: ${req.user.username} (${req.user.role}) ${action} ${entityType} "${entityName}" (ID: ${entityId})`);
            }
          } catch (error) {
            console.error('Errore nel logging attività:', error);
          }
        });
      }
      
      return result;
    };
    
    next();
  };
};

// Middleware per salvare i dati originali prima dell'aggiornamento/eliminazione
const saveOriginalData = (model) => {
  return async (req, res, next) => {
    if (['PUT', 'DELETE'].includes(req.method) && req.params.id) {
      try {
        const originalData = await model.getById(req.params.id);
        req.originalData = originalData;
      } catch (error) {
        console.error('Errore nel recupero dati originali:', error);
      }
    }
    next();
  };
};

// Funzione helper per ottenere il nome dell'entità
const getEntityName = (entityType, data) => {
  switch (entityType) {
    case 'Cliente':
      return data.ragioneSociale || data.nomeAzienda || `Cliente ID: ${data.id}`;
    case 'Software':
      return data.nomeSoftware || `Software ID: ${data.id}`;
    case 'Licenza':
      return `Licenza ID: ${data.id}`;
    case 'DocumentManager':
      return data.documentManagerKey || `Documento ID: ${data.id}`;
    default:
      return `${entityType} ID: ${data.id}`;
  }
};

// Funzione per rimuovere dati sensibili dai log
const sanitizeData = (data) => {
  if (!data) return data;
  
  const sanitized = { ...data };
  
  // Rimuovi campi sensibili
  delete sanitized.password;
  delete sanitized.logo; // Rimuovi base64 per ridurre dimensione log
  
  // Tronca campi molto lunghi
  if (sanitized.seriali && sanitized.seriali.length > 500) {
    sanitized.seriali = sanitized.seriali.substring(0, 500) + '...';
  }
  
  if (sanitized.note && sanitized.note.length > 1000) {
    sanitized.note = sanitized.note.substring(0, 1000) + '...';
  }
  
  return sanitized;
};

module.exports = {
  logActivity,
  saveOriginalData
};