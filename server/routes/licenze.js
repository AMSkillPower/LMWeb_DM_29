const express = require('express');
const router = express.Router();
const Licenza = require('../models/Licenza');

// GET /api/licenze - Recupera tutte le licenze
router.get('/', async (req, res) => {
    try {
        const licenze = await Licenza.getAll();
        res.json(licenze);
    } catch (err) {
        console.error('Errore nel recupero licenze:', err);
        res.status(500).json({ error: err.message });
    }
});

router.get('/stats', async (req, res) => {
    try {
        const stats = await Licenza.getStats();
        res.json(stats);
    } catch (err) {
        console.error('Errore nel recupero statistiche:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/licenze/:id - Recupera una licenza specifica
router.get('/:id', async (req, res) => {
  try {
    const licenza = await Licenza.getById(req.params.id);
    if (!licenza) {
      return res.status(404).json({ error: 'Licenza non trovata' });
    }
    res.json(licenza);
  } catch (error) {
    console.error('Errore nel recupero licenza:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/licenze - Crea una nuova licenza
router.post('/', async (req, res) => {
  try {
    const { 
      clienteId, 
      softwareId, 
      numeroLicenze, 
      seriali, 
      dataAttivazione, 
      dataScadenza, 
      dataOrdine,
      resellerCode,
      note, 
      riferimentoContratto 
    } = req.body;
    
    if (!clienteId || !softwareId || !numeroLicenze || !dataAttivazione || !dataScadenza) {
      return res.status(400).json({ 
        error: 'Cliente, Software, Numero Licenze, Data Attivazione e Data Scadenza sono obbligatori' 
      });
    }

    const nuovaLicenza = await Licenza.create({
      clienteId: parseInt(clienteId),
      softwareId: parseInt(softwareId),
      numeroLicenze: parseInt(numeroLicenze),
      seriali: seriali || null,
      dataAttivazione,
      dataScadenza,
      dataOrdine: dataOrdine || null,
      resellerCode: resellerCode ? parseFloat(resellerCode) : null,
      note: note || null,
      riferimentoContratto: riferimentoContratto || null
    });

    res.status(201).json(nuovaLicenza);
  } catch (error) {
    console.error('Errore nella creazione licenza:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/licenze/:id - Aggiorna una licenza
router.put('/:id', async (req, res) => {
  try {
    const { 
      clienteId, 
      softwareId, 
      numeroLicenze, 
      seriali, 
      dataAttivazione, 
      dataScadenza, 
      dataOrdine,
      resellerCode,
      note, 
      riferimentoContratto 
    } = req.body;
    
    if (!clienteId || !softwareId || !numeroLicenze || !dataAttivazione || !dataScadenza) {
      return res.status(400).json({ 
        error: 'Cliente, Software, Numero Licenze, Data Attivazione e Data Scadenza sono obbligatori' 
      });
    }

    const licenzaAggiornata = await Licenza.update(req.params.id, {
      clienteId: parseInt(clienteId),
      softwareId: parseInt(softwareId),
      numeroLicenze: parseInt(numeroLicenze),
      seriali: seriali || null,
      dataAttivazione,
      dataScadenza,
      dataOrdine: dataOrdine || null,
      resellerCode: resellerCode ? parseFloat(resellerCode) : null,
      note: note || null,
      riferimentoContratto: riferimentoContratto || null
    });

    if (!licenzaAggiornata) {
      return res.status(404).json({ error: 'Licenza non trovata' });
    }

    res.json(licenzaAggiornata);
  } catch (error) {
    console.error('Errore nell\'aggiornamento licenza:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/licenze/:id - Elimina una licenza
router.delete('/:id', async (req, res) => {
  try {
    await Licenza.delete(req.params.id);
    res.json({ message: 'Licenza eliminata con successo' });
  } catch (error) {
    console.error('Errore nell\'eliminazione licenza:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/licenze/update-states - Aggiorna tutti gli stati delle licenze
router.post('/update-states', async (req, res) => {
  try {
    await Licenza.updateAllStates();
    res.json({ message: 'Stati licenze aggiornati con successo' });
  } catch (error) {
    console.error('Errore nell\'aggiornamento stati:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;