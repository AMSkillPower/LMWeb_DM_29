const express = require('express');
const router = express.Router();
const Cliente = require('../models/Cliente');


// GET /api/clienti - Recupera tutti i clienti
// routes/clienti.js
router.get('/', async (req, res) => {
  try {
    const result = await req.db.request().query('SELECT * FROM Clienti');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/clienti/:id - Recupera un cliente specifico
router.get('/:id', async (req, res) => {
  try {
    const cliente = await Cliente.getById(req.params.id);
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente non trovato' });
    }
    res.json(cliente);
  } catch (error) {
    console.error('Errore nel recupero cliente:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/clienti - Crea un nuovo cliente
router.post('/', async (req, res) => {
  try {
    const { ragioneSociale, email, telefono, nomeReferente, telefonoReferente, indirizzo, comune, cap, provincia, paese, partitaIva, codiceFiscale, indirizzoPEC, iban, emailFatturazione, sdi, bancaAppoggio, logo, sitoWeb, inAssistenza, passZendesk } = req.body;
    
    if (!ragioneSociale) {
      return res.status(400).json({ error: 'Ragione Sociale è obbligatoria' });
    }

    const nuovoCliente = await Cliente.create({
      ragioneSociale,
      email: email || null,
      telefono: telefono || null,
      nomeReferente: nomeReferente || null,
      telefonoReferente: telefonoReferente || null,
      indirizzo: indirizzo || null,
      comune: comune || null,
      cap: cap || null,
      provincia: provincia || null,
      paese: paese || 'Italia',
      partitaIva: partitaIva || null,
      codiceFiscale: codiceFiscale || null,
      indirizzoPEC: indirizzoPEC || null,
      iban: iban || null,
      emailFatturazione: emailFatturazione || null,
      sdi: sdi || null,
      bancaAppoggio: bancaAppoggio || null,
      logo: logo || null,
      sitoWeb: sitoWeb || null,
      inAssistenza: inAssistenza || false,
      passZendesk:  passZendesk || null
    });

    res.status(201).json(nuovoCliente);
  } catch (error) {
    console.error('Errore nella creazione cliente:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/clienti/:id - Aggiorna un cliente
router.put('/:id', async (req, res) => {
  try {
    const { ragioneSociale, email, telefono, nomeReferente, telefonoReferente, indirizzo, comune, cap, provincia, paese, partitaIva, codiceFiscale, indirizzoPEC, iban, emailFatturazione, sdi, bancaAppoggio, logo, sitoWeb, inAssistenza, passZendesk } = req.body;
    
    if (!ragioneSociale) {
      return res.status(400).json({ error: 'Ragione Sociale è obbligatoria' });
    }

    const clienteAggiornato = await Cliente.update(req.params.id, {
      ragioneSociale,
      email: email || null,
      telefono: telefono || null,
      nomeReferente: nomeReferente || null,
      telefonoReferente: telefonoReferente || null,
      indirizzo: indirizzo || null,
      comune: comune || null,
      cap: cap || null,
      provincia: provincia || null,
      paese: paese || 'Italia',
      partitaIva: partitaIva || null,
      codiceFiscale: codiceFiscale || null,
      indirizzoPEC: indirizzoPEC || null,
      iban: iban || null,
      emailFatturazione: emailFatturazione || null,
      sdi: sdi || null,
      bancaAppoggio: bancaAppoggio || null,
      logo: logo || null,
      sitoWeb: sitoWeb || null,
      inAssistenza: inAssistenza || false,
      passZendesk:  passZendesk || null
    });

    if (!clienteAggiornato) {
      return res.status(404).json({ error: 'Cliente non trovato' });
    }

    res.json(clienteAggiornato);
  } catch (error) {
    console.error('Errore nell\'aggiornamento cliente:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/clienti/:id - Elimina un cliente
router.delete('/:id', async (req, res) => {
  try {
    await Cliente.delete(req.params.id);
    res.json({ message: 'Cliente eliminato con successo' });
  } catch (error) {
    console.error('Errore nell\'eliminazione cliente:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;