const { sql, getConnection } = require('../config/database');

class Licenza {
  static async getAll() {
    try {
      const pool = await getConnection();
      const result = await pool.request().query(`
        SELECT l.id, l.clienteId, l.softwareId, l.numeroLicenze, l.seriali,
               l.dataAttivazione, l.dataScadenza, l.dataOrdine, l.resellerCode,
               l.note, l.riferimentoContratto, l.stato, l.createdAt, l.updatedAt,
               c.ragioneSociale as clienteNome,
               s.nomeSoftware, s.versione as softwareVersione, s.costo as softwareCosto
        FROM Licenze l
        INNER JOIN Clienti c ON l.clienteId = c.id
        INNER JOIN Software s ON l.softwareId = s.id
        ORDER BY l.dataScadenza DESC
      `);
      return result.recordset;
    } catch (error) {
      throw new Error(`Errore nel recupero licenze: ${error.message}`);
    }
  }

  static async getById(id) {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('id', sql.Int, id)
        .query(`
          SELECT l.id, l.clienteId, l.softwareId, l.numeroLicenze, l.seriali,
                 l.dataAttivazione, l.dataScadenza, l.dataOrdine, l.resellerCode,
                 l.note, l.riferimentoContratto, l.stato, l.createdAt, l.updatedAt,
                 c.ragioneSociale as clienteNome,
                 s.nomeSoftware, s.costo as softwareCosto
          FROM Licenze l
          INNER JOIN Clienti c ON l.clienteId = c.id
          INNER JOIN Software s ON l.softwareId = s.id
          WHERE l.id = @id
        `);
      return result.recordset[0];
    } catch (error) {
      throw new Error(`Errore nel recupero licenza: ${error.message}`);
    }
  }

  static async create(licenzaData) {
  try {
    const pool = await getConnection();
    // Inserisco la nuova licenza e recupero l'ID generato
    const insertResult = await pool.request()
      .input('clienteId', sql.Int, licenzaData.clienteId)
      .input('softwareId', sql.Int, licenzaData.softwareId)
      .input('numeroLicenze', sql.Int, licenzaData.numeroLicenze)
      .input('seriali', sql.NVarChar(sql.MAX), licenzaData.seriali)
      .input('dataAttivazione', sql.Date, licenzaData.dataAttivazione)
      .input('dataScadenza', sql.Date, licenzaData.dataScadenza)
      .input('dataOrdine', sql.Date, licenzaData.dataOrdine)
      .input('resellerCode', sql.Decimal(10, 2), licenzaData.resellerCode)
      .input('note', sql.NVarChar(sql.MAX), licenzaData.note)
      .input('riferimentoContratto', sql.NVarChar, licenzaData.riferimentoContratto)
      .query(`
        INSERT INTO Licenze (clienteId, softwareId, numeroLicenze, seriali, dataAttivazione, 
                            dataScadenza, dataOrdine, resellerCode, note, riferimentoContratto, stato)
        VALUES (@clienteId, @softwareId, @numeroLicenze, @seriali, @dataAttivazione, 
                @dataScadenza, @dataOrdine, @resellerCode, @note, @riferimentoContratto, 
                CASE 
                  WHEN @dataScadenza < CAST(GETDATE() AS DATE) THEN 'scaduta'
                  WHEN DATEDIFF(day, CAST(GETDATE() AS DATE), @dataScadenza) <= 30 THEN 'in_scadenza'
                  ELSE 'valida'
                END);

        SELECT SCOPE_IDENTITY() AS newId;
      `);

    const newId = insertResult.recordset[0].newId;

    // Recupero l'intero record appena creato
    const getResult = await pool.request()
      .input('id', sql.Int, newId)
      .query('SELECT * FROM Licenze WHERE id = @id');

    return getResult.recordset[0];
  } catch (error) {
    throw new Error(`Errore nella creazione licenza: ${error.message}`);
  }
}


  static async update(id, licenzaData) {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('id', sql.Int, id)
        .input('clienteId', sql.Int, licenzaData.clienteId)
        .input('softwareId', sql.Int, licenzaData.softwareId)
        .input('numeroLicenze', sql.Int, licenzaData.numeroLicenze)
        .input('seriali', sql.NVarChar(sql.MAX), licenzaData.seriali)
        .input('dataAttivazione', sql.Date, licenzaData.dataAttivazione)
        .input('dataScadenza', sql.Date, licenzaData.dataScadenza)
        .input('dataOrdine', sql.Date, licenzaData.dataOrdine)
        .input('resellerCode', sql.Decimal(10, 2), licenzaData.resellerCode)
        .input('note', sql.NVarChar(sql.MAX), licenzaData.note)
        .input('riferimentoContratto', sql.NVarChar, licenzaData.riferimentoContratto)
        .query(`
          UPDATE Licenze 
          SET clienteId = @clienteId, softwareId = @softwareId, numeroLicenze = @numeroLicenze,
              seriali = @seriali, dataAttivazione = @dataAttivazione, dataScadenza = @dataScadenza,
              dataOrdine = @dataOrdine, resellerCode = @resellerCode, note = @note, 
              riferimentoContratto = @riferimentoContratto,
              stato = CASE 
                WHEN @dataScadenza < CAST(GETDATE() AS DATE) THEN 'scaduta'
                WHEN DATEDIFF(day, CAST(GETDATE() AS DATE), @dataScadenza) <= 30 THEN 'in_scadenza'
                ELSE 'valida'
              END,
              updatedAt = GETDATE()
          WHERE id = @id
        `);
		const getResult = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM Licenze WHERE id = @id');
      return getResult.recordset[0];
    } catch (error) {
      throw new Error(`Errore nell'aggiornamento licenza: ${error.message}`);
    }
  }

  static async delete(id) {
    try {
      const pool = await getConnection();
      await pool.request()
        .input('id', sql.Int, id)
        .query('DELETE FROM Licenze WHERE id = @id');
      return true;
    } catch (error) {
      throw new Error(`Errore nell'eliminazione licenza: ${error.message}`);
    }
  }

  static async getStats() {
    try {
      const pool = await getConnection();
      const result = await pool.request().query(`
        SELECT 
          COUNT(*) as licenzeTotali,
          SUM(CASE WHEN stato = 'valida' THEN 1 ELSE 0 END) as licenzeValide,
          SUM(CASE WHEN stato = 'in_scadenza' THEN 1 ELSE 0 END) as licenzeInScadenza,
          SUM(CASE WHEN stato = 'scaduta' THEN 1 ELSE 0 END) as licenzeScadute
        FROM Licenze
      `);
      return result.recordset[0];
    } catch (error) {
      throw new Error(`Errore nel recupero statistiche: ${error.message}`);
    }
  }

  static async updateAllStates() {
    try {
      const pool = await getConnection();
      await pool.request().execute('UpdateLicenseStatus');
      return true;
    } catch (error) {
      throw new Error(`Errore nell'aggiornamento stati: ${error.message}`);
    }
  }
}

module.exports = Licenza;