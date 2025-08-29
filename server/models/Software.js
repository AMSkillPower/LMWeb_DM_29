const { sql, getConnection } = require('../config/database');

class Software {
  static async getAll() {
    try {
      const pool = await getConnection();
      const result = await pool.request().query(`
        SELECT id, nomeSoftware, tipoLicenza, codice, categoria, logo, descrizione, costo, createdAt, updatedAt
        FROM Software 
        ORDER BY nomeSoftware
      `);
      return result.recordset;
    } catch (error) {
      throw new Error(`Errore nel recupero software: ${error.message}`);
    }
  }

  static async getById(id) {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('id', sql.Int, id)
        .query(`
          SELECT id, nomeSoftware, tipoLicenza, codice, categoria, logo, descrizione, costo, createdAt, updatedAt
          FROM Software 
          WHERE id = @id
        `);
      return result.recordset[0];
    } catch (error) {
      throw new Error(`Errore nel recupero software: ${error.message}`);
    }
  }

  static async create(softwareData) {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('nomeSoftware', sql.NVarChar, softwareData.nomeSoftware)
        .input('tipoLicenza', sql.NVarChar, softwareData.tipoLicenza)
        .input('codice', sql.NVarChar, softwareData.codice)
        .input('categoria', sql.NVarChar, softwareData.categoria)
        .input('logo', sql.NVarChar(sql.MAX), softwareData.logo)
        .input('descrizione', sql.NVarChar(sql.MAX), softwareData.descrizione)
        .input('costo', sql.Decimal(10, 2), softwareData.costo)
        .query(`
          INSERT INTO Software (nomeSoftware, tipoLicenza, codice, categoria, logo, descrizione, costo)
          OUTPUT INSERTED.id, INSERTED.nomeSoftware, INSERTED.tipoLicenza, INSERTED.codice, INSERTED.categoria,
                 INSERTED.logo, INSERTED.descrizione, INSERTED.costo,
                 INSERTED.createdAt, INSERTED.updatedAt
          VALUES (@nomeSoftware, @tipoLicenza, @codice, @categoria, @logo, @descrizione, @costo)
        `);
      return result.recordset[0];
    } catch (error) {
      throw new Error(`Errore nella creazione software: ${error.message}`);
    }
  }

  static async update(id, softwareData) {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('id', sql.Int, id)
        .input('nomeSoftware', sql.NVarChar, softwareData.nomeSoftware)
        .input('tipoLicenza', sql.NVarChar, softwareData.tipoLicenza)
        .input('codice', sql.NVarChar, softwareData.codice)
        .input('categoria', sql.NVarChar, softwareData.categoria)
        .input('logo', sql.NVarChar(sql.MAX), softwareData.logo)
        .input('descrizione', sql.NVarChar(sql.MAX), softwareData.descrizione)
        .input('costo', sql.Decimal(10, 2), softwareData.costo)
        .query(`
          UPDATE Software 
          SET nomeSoftware = @nomeSoftware, tipoLicenza = @tipoLicenza, codice = @codice, categoria = @categoria,
              logo = @logo, descrizione = @descrizione, costo = @costo,
              updatedAt = GETDATE()
          OUTPUT INSERTED.id, INSERTED.nomeSoftware, INSERTED.tipoLicenza, INSERTED.codice, INSERTED.categoria,
                 INSERTED.logo, INSERTED.descrizione, INSERTED.costo,
                 INSERTED.createdAt, INSERTED.updatedAt
          WHERE id = @id
        `);
      return result.recordset[0];
    } catch (error) {
      throw new Error(`Errore nell'aggiornamento software: ${error.message}`);
    }
  }

  static async delete(id) {
    try {
      const pool = await getConnection();
      await pool.request()
        .input('id', sql.Int, id)
        .query('DELETE FROM Software WHERE id = @id');
      return true;
    } catch (error) {
      throw new Error(`Errore nell'eliminazione software: ${error.message}`);
    }
  }
}

module.exports = Software;