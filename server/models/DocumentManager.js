// server/models/DocumentManager.js
const { getConnection, sql } = require('../config/database');

class DocumentManager {
    static async create(documentData) {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .input('documentManagerKey', sql.VarChar, documentData.documentManagerKey)
                .input('anno', sql.Int, documentData.anno)
                .input('note', sql.Text, documentData.note)
                .input('clienteId', sql.Int, documentData.clienteId)
                .query(`
                    INSERT INTO DocumentManager 
                    (documentManagerKey, anno, note, clienteId, createdAt, updatedAt)
                    OUTPUT INSERTED.*
                    VALUES 
                    (@documentManagerKey, @anno, @note, @clienteId, GETDATE(), GETDATE())
                `);
            return result.recordset[0];
        } catch (err) {
            console.error('Errore nella creazione del documento:', err);
            throw err;
        }
    }

    static async findByClienteId(clienteId) {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .input('clienteId', sql.Int, clienteId)
                .query('SELECT * FROM DocumentManager WHERE clienteId = @clienteId');
            return result.recordset;
        } catch (err) {
            console.error('Errore nel recupero documenti:', err);
            throw err;
        }
    }

    static async update(documentId, updateData) {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .input('id', sql.Int, documentId)
                .input('documentManagerKey', sql.VarChar, updateData.documentManagerKey)
                .input('anno', sql.Int, updateData.anno)
                .input('note', sql.Text, updateData.note)
                .query(`
                    UPDATE DocumentManager 
                    SET 
                        documentManagerKey = @documentManagerKey,
                        anno = @anno,
                        note = @note,
                        updatedAt = GETDATE()
                    WHERE id = @id
                `);
            return result.rowsAffected[0] > 0;
        } catch (err) {
            console.error('Errore nell\'aggiornamento del documento:', err);
            throw err;
        }
    }

    static async delete(documentId) {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .input('id', sql.Int, documentId)
                .query('DELETE FROM DocumentManager WHERE id = @id');
            return result.rowsAffected[0] > 0;
        } catch (err) {
            console.error('Errore nell\'eliminazione del documento:', err);
            throw err;
        }
    }
}

module.exports = DocumentManager;