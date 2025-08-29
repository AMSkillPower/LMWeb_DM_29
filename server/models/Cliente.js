const { sql, getConnection } = require('../config/database');

class Cliente {
  static async getAll() {
    try {
      const pool = await getConnection();
      const result = await pool.request().query(`
        SELECT id, ragioneSociale, email, telefono, nomeReferente, telefonoReferente, 
               indirizzo, comune, cap, provincia, paese, partitaIva, codiceFiscale, indirizzoPEC, iban, 
               emailFatturazione, sdi, bancaAppoggio, logo, sitoWeb, createdAt, updatedAt, inAssistenza, passZendesk
        FROM Clienti 
        ORDER BY ragioneSociale
      `);
      return result.recordset;
    } catch (error) {
      throw new Error(`Errore nel recupero clienti: ${error.message}`);
    }
  }

  static async getById(id) {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('id', sql.Int, id)
        .query(`
          SELECT id, ragioneSociale, email, telefono, nomeReferente, telefonoReferente, 
                 indirizzo, comune, cap, provincia, paese, partitaIva, codiceFiscale, indirizzoPEC, iban, 
                 emailFatturazione, sdi, bancaAppoggio, logo, sitoWeb, createdAt, updatedAt, inAssistenza, passZendesk
          FROM Clienti 
          WHERE id = @id
        `);
      return result.recordset[0];
    } catch (error) {
      throw new Error(`Errore nel recupero cliente: ${error.message}`);
    }
  }

  static async create(clienteData) {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('ragioneSociale', sql.NVarChar, clienteData.ragioneSociale)
        .input('email', sql.NVarChar, clienteData.email)
        .input('telefono', sql.NVarChar, clienteData.telefono)
        .input('nomeReferente', sql.NVarChar, clienteData.nomeReferente)
        .input('telefonoReferente', sql.NVarChar, clienteData.telefonoReferente)
        .input('indirizzo', sql.NVarChar, clienteData.indirizzo)
        .input('comune', sql.NVarChar, clienteData.comune)
        .input('cap', sql.NVarChar, clienteData.cap)
        .input('provincia', sql.NVarChar, clienteData.provincia)
        .input('paese', sql.NVarChar, clienteData.paese)
        .input('partitaIva', sql.NVarChar, clienteData.partitaIva)
        .input('codiceFiscale', sql.NVarChar, clienteData.codiceFiscale)
        .input('indirizzoPEC', sql.NVarChar, clienteData.indirizzoPEC)
        .input('iban', sql.NVarChar, clienteData.iban)
        .input('emailFatturazione', sql.NVarChar, clienteData.emailFatturazione)
        .input('sdi', sql.NVarChar, clienteData.sdi)
        .input('bancaAppoggio', sql.NVarChar, clienteData.bancaAppoggio)
        .input('logo', sql.NVarChar(sql.MAX), clienteData.logo)
        .input('sitoWeb', sql.NVarChar, clienteData.sitoWeb)
        .input('inAssistenza', sql.Bit, clienteData.inAssistenza)
        .input('passZendesk', sql.NVarChar, clienteData.passZendesk)
        .query(`
          INSERT INTO Clienti (ragioneSociale, email, telefono, nomeReferente, telefonoReferente, 
                              indirizzo, comune, cap, provincia, paese, partitaIva, codiceFiscale, indirizzoPEC, iban, 
                              emailFatturazione, sdi, bancaAppoggio, logo, sitoWeb, inAssistenza, passZendesk)
          OUTPUT INSERTED.id, INSERTED.ragioneSociale, INSERTED.email, INSERTED.telefono, 
                 INSERTED.nomeReferente, INSERTED.telefonoReferente, INSERTED.indirizzo, 
                 INSERTED.comune, INSERTED.cap, INSERTED.provincia, INSERTED.paese,
                 INSERTED.partitaIva, INSERTED.codiceFiscale, INSERTED.indirizzoPEC, 
                 INSERTED.iban, INSERTED.emailFatturazione, INSERTED.sdi, INSERTED.bancaAppoggio,
                 INSERTED.logo, INSERTED.sitoWeb, 
                 INSERTED.createdAt, INSERTED.updatedAt, INSERTED.inAssistenza, INSERTED.passZendesk
          VALUES (@ragioneSociale, @email, @telefono, @nomeReferente, @telefonoReferente, 
                  @indirizzo, @comune, @cap, @provincia, @paese, @partitaIva, @codiceFiscale, @indirizzoPEC, @iban, 
                  @emailFatturazione, @sdi, @bancaAppoggio, @logo, @sitoWeb, @inAssistenza, @passZendesk)
        `);
      return result.recordset[0];
    } catch (error) {
      throw new Error(`Errore nella creazione cliente: ${error.message}`);
    }
  }

  static async update(id, clienteData) {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('id', sql.Int, id)
        .input('ragioneSociale', sql.NVarChar, clienteData.ragioneSociale)
        .input('email', sql.NVarChar, clienteData.email)
        .input('telefono', sql.NVarChar, clienteData.telefono)
        .input('nomeReferente', sql.NVarChar, clienteData.nomeReferente)
        .input('telefonoReferente', sql.NVarChar, clienteData.telefonoReferente)
        .input('indirizzo', sql.NVarChar, clienteData.indirizzo)
        .input('comune', sql.NVarChar, clienteData.comune)
        .input('cap', sql.NVarChar, clienteData.cap)
        .input('provincia', sql.NVarChar, clienteData.provincia)
        .input('paese', sql.NVarChar, clienteData.paese)
        .input('partitaIva', sql.NVarChar, clienteData.partitaIva)
        .input('codiceFiscale', sql.NVarChar, clienteData.codiceFiscale)
        .input('indirizzoPEC', sql.NVarChar, clienteData.indirizzoPEC)
        .input('iban', sql.NVarChar, clienteData.iban)
        .input('emailFatturazione', sql.NVarChar, clienteData.emailFatturazione)
        .input('sdi', sql.NVarChar, clienteData.sdi)
        .input('bancaAppoggio', sql.NVarChar, clienteData.bancaAppoggio)
        .input('logo', sql.NVarChar(sql.MAX), clienteData.logo)
        .input('sitoWeb', sql.NVarChar, clienteData.sitoWeb)
        .input('inAssistenza', sql.NVarChar, clienteData.inAssistenza)
        .input('passZendesk', sql.NVarChar, clienteData.passZendesk)
        .query(`
          UPDATE Clienti 
          SET ragioneSociale = @ragioneSociale, email = @email, telefono = @telefono,
              nomeReferente = @nomeReferente, telefonoReferente = @telefonoReferente,
              indirizzo = @indirizzo, comune = @comune, cap = @cap, provincia = @provincia, paese = @paese,
              partitaIva = @partitaIva, codiceFiscale = @codiceFiscale,
              indirizzoPEC = @indirizzoPEC, iban = @iban, emailFatturazione = @emailFatturazione,
              sdi = @sdi, bancaAppoggio = @bancaAppoggio, logo = @logo,
              sitoWeb = @sitoWeb, updatedAt = GETDATE(), inAssistenza = @inAssistenza, passZendesk = @passZendesk
          WHERE id = @id
        `);
		const getResult = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM Clienti WHERE id = @id');
      return getResult.recordset[0];
    } catch (error) {
      throw new Error(`Errore nell'aggiornamento cliente: ${error.message}`);
    }
  }

  static async delete(id) {
    try {
      const pool = await getConnection();
      await pool.request()
        .input('id', sql.Int, id)
        .query('DELETE FROM Clienti WHERE id = @id');
      return true;
    } catch (error) {
      throw new Error(`Errore nell'eliminazione cliente: ${error.message}`);
    }
  }
}

module.exports = Cliente;