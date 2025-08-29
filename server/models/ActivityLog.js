const { sql, getLogConnection } = require('../config/logDatabase');

class ActivityLog {
  static async create(logData) {
    try {
      const pool = await getLogConnection();
      const result = await pool.request()
        .input('userId', sql.Int, logData.userId)
        .input('username', sql.NVarChar, logData.username)
        .input('action', sql.NVarChar, logData.action)
        .input('entityType', sql.NVarChar, logData.entityType)
        .input('entityId', sql.Int, logData.entityId)
        .input('entityName', sql.NVarChar, logData.entityName)
        .input('oldValues', sql.NVarChar(sql.MAX), logData.oldValues)
        .input('newValues', sql.NVarChar(sql.MAX), logData.newValues)
        .input('ipAddress', sql.NVarChar, logData.ipAddress)
        .input('userAgent', sql.NVarChar, logData.userAgent)
        .query(`
          INSERT INTO ActivityLogs (userId, username, action, entityType, entityId, entityName, oldValues, newValues, ipAddress, userAgent)
          OUTPUT INSERTED.*
          VALUES (@userId, @username, @action, @entityType, @entityId, @entityName, @oldValues, @newValues, @ipAddress, @userAgent)
        `);
      return result.recordset[0];
    } catch (error) {
      console.error('Errore nel salvataggio log:', error);
      // Non lanciare errore per non bloccare l'operazione principale
    }
  }

  static async getAll(filters = {}) {
    try {
      const pool = await getLogConnection();
      let query = `
        SELECT id, userId, username, action, entityType, entityId, entityName, 
               oldValues, newValues, ipAddress, userAgent, createdAt
        FROM ActivityLogs
      `;
      
      const conditions = [];
      const request = pool.request();

      if (filters.userId) {
        conditions.push('userId = @userId');
        request.input('userId', sql.Int, filters.userId);
      }

      if (filters.action) {
        conditions.push('action = @action');
        request.input('action', sql.NVarChar, filters.action);
      }

      if (filters.entityType) {
        conditions.push('entityType = @entityType');
        request.input('entityType', sql.NVarChar, filters.entityType);
      }

      if (filters.dateFrom) {
        conditions.push('createdAt >= @dateFrom');
        request.input('dateFrom', sql.DateTime2, filters.dateFrom);
      }

      if (filters.dateTo) {
        conditions.push('createdAt <= @dateTo');
        request.input('dateTo', sql.DateTime2, filters.dateTo);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY createdAt DESC';

      if (filters.limit) {
        query = `SELECT TOP ${filters.limit} * FROM (${query}) AS limited_results`;
      }

      const result = await request.query(query);
      return result.recordset;
    } catch (error) {
      throw new Error(`Errore nel recupero log: ${error.message}`);
    }
  }

  static async getByEntity(entityType, entityId) {
    try {
      const pool = await getLogConnection();
      const result = await pool.request()
        .input('entityType', sql.NVarChar, entityType)
        .input('entityId', sql.Int, entityId)
        .query(`
          SELECT id, userId, username, action, entityType, entityId, entityName, 
                 oldValues, newValues, ipAddress, userAgent, createdAt
          FROM ActivityLogs
          WHERE entityType = @entityType AND entityId = @entityId
          ORDER BY createdAt DESC
        `);
      return result.recordset;
    } catch (error) {
      throw new Error(`Errore nel recupero log entità: ${error.message}`);
    }
  }

  static async deleteOldLogs(daysToKeep = 365) {
    try {
      const pool = await getLogConnection();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      const result = await pool.request()
        .input('cutoffDate', sql.DateTime2, cutoffDate)
        .query('DELETE FROM ActivityLogs WHERE createdAt < @cutoffDate');
      
      return result.rowsAffected[0];
    } catch (error) {
      throw new Error(`Errore nella pulizia log: ${error.message}`);
    }
  }
}

module.exports = ActivityLog;