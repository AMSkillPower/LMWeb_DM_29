const { sql, getAuthConnection } = require('../config/authDatabase');
const bcrypt = require('bcryptjs');

class User {
  static async findByUsername(username) {
    try {
      const pool = await getAuthConnection();
      const result = await pool.request()
        .input('username', sql.NVarChar, username)
        .query(`
          SELECT id, username, password, role, fullName, email, isActive, createdAt, updatedAt
          FROM Users 
          WHERE username = @username AND isActive = 1
        `);
      return result.recordset[0];
    } catch (error) {
      throw new Error(`Errore nel recupero utente: ${error.message}`);
    }
  }

  static async findById(id) {
    try {
      const pool = await getAuthConnection();
      const result = await pool.request()
        .input('id', sql.Int, id)
        .query(`
          SELECT id, username, role, fullName, email, isActive, createdAt, updatedAt
          FROM Users 
          WHERE id = @id AND isActive = 1
        `);
      return result.recordset[0];
    } catch (error) {
      throw new Error(`Errore nel recupero utente: ${error.message}`);
    }
  }

  static async getAll() {
    try {
      const pool = await getAuthConnection();
      const result = await pool.request().query(`
        SELECT id, username, role, fullName, email, isActive, createdAt, updatedAt
        FROM Users 
        ORDER BY fullName
      `);
      return result.recordset;
    } catch (error) {
      throw new Error(`Errore nel recupero utenti: ${error.message}`);
    }
  }

  static async create(userData) {
    try {
      const pool = await getAuthConnection();
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const result = await pool.request()
        .input('username', sql.NVarChar, userData.username)
        .input('password', sql.NVarChar, hashedPassword)
        .input('role', sql.NVarChar, userData.role)
        .input('fullName', sql.NVarChar, userData.fullName)
        .input('email', sql.NVarChar, userData.email)
        .input('isActive', sql.Bit, userData.isActive !== undefined ? userData.isActive : true)
        .query(`
          INSERT INTO Users (username, password, role, fullName, email, isActive)
          OUTPUT INSERTED.id, INSERTED.username, INSERTED.role, INSERTED.fullName, 
                 INSERTED.email, INSERTED.isActive, INSERTED.createdAt, INSERTED.updatedAt
          VALUES (@username, @password, @role, @fullName, @email, @isActive)
        `);
      return result.recordset[0];
    } catch (error) {
      throw new Error(`Errore nella creazione utente: ${error.message}`);
    }
  }

  static async update(id, userData) {
    try {
      const pool = await getAuthConnection();
      let query = `
        UPDATE Users 
        SET fullName = @fullName, email = @email, role = @role, isActive = @isActive, updatedAt = GETDATE()
      `;
      
      const request = pool.request()
        .input('id', sql.Int, id)
        .input('fullName', sql.NVarChar, userData.fullName)
        .input('email', sql.NVarChar, userData.email)
        .input('role', sql.NVarChar, userData.role)
        .input('isActive', sql.Bit, userData.isActive);

      if (userData.password) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        query += `, password = @password`;
        request.input('password', sql.NVarChar, hashedPassword);
      }

      query += ` WHERE id = @id`;
      
      await request.query(query);

      // Recupera l'utente aggiornato
      const getResult = await pool.request()
        .input('id', sql.Int, id)
        .query(`
          SELECT id, username, role, fullName, email, isActive, createdAt, updatedAt
          FROM Users WHERE id = @id
        `);
      return getResult.recordset[0];
    } catch (error) {
      throw new Error(`Errore nell'aggiornamento utente: ${error.message}`);
    }
  }

  static async delete(id) {
    try {
      const pool = await getAuthConnection();
      await pool.request()
        .input('id', sql.Int, id)
        .query('DELETE FROM Users WHERE id = @id');
      return true;
    } catch (error) {
      throw new Error(`Errore nell'eliminazione utente: ${error.message}`);
    }
  }

  static async validatePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = User;