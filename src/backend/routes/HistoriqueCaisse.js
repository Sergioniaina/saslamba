// backend/routes/historiquesCaisse.js
const express = require('express');
const router = express.Router();
const HistoriqueCaisse = require('../models/HistoriqueCaisse');
const Caisse = require('../models/caisse');

// Récupérer tous les historiques de caisse
router.get('/', async (req, res) => {
    try {
      const historiquesCaisse = await HistoriqueCaisse.find();
   //   console.log("HistoriqueCaisse avec caisse peuplée:", historiquesCaisse); // Vérifiez la structure ici
      res.json(historiquesCaisse);
    } catch (error) {
      res.status(500).json({ erreur: error.message });
    }
  });
  

// Créer un nouvel historique de caisse
router.post('/', async (req, res) => {
  const { caisse, type, action, montant, motif, date } = req.body;
  try {
    const nouvelHistoriqueCaisse = new HistoriqueCaisse({
      caisse,
      type,
      action,
      montant,
      motif,
      date,
    });
    await nouvelHistoriqueCaisse.save();

    // Création d'un historique pour cette action (si nécessaire

    res.status(201).json(nouvelHistoriqueCaisse);
  } catch (error) {
    res.status(500).json({ erreur: error.message });
  }
});

// Mettre à jour un historique de caisse
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { caisse, type, action, montant, motif, date } = req.body;
  try {
    const historiqueMisAJour = await HistoriqueCaisse.findByIdAndUpdate(id, {
      caisse,
      type,
      action,
      montant,
      motif,
      date,
    }, { new: true });

    res.json(historiqueMisAJour);
  } catch (error) {
    res.status(500).json({ erreur: error.message });
  }
});

// Supprimer un historique de caisse
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const historiqueCaisse = await HistoriqueCaisse.findById(id);
    if (!historiqueCaisse) {
      return res.status(404).json({ erreur: 'Historique de caisse non trouvé' });
    }

    await HistoriqueCaisse.findByIdAndDelete(id);
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ erreur: error.message });
  }
});

// Récupérer un historique de caisse par ID
router.get('/:id', async (req, res) => {
  try {
    const historiqueCaisse = await HistoriqueCaisse.findById(req.params.id)
      .populate('caisse', 'nom'); // On récupère le nom de la caisse associée
    if (!historiqueCaisse) {
      return res.status(404).json({ erreur: 'Historique de caisse non trouvé' });
    }
    res.json(historiqueCaisse);
  } catch (error) {
    res.status(500).json({ erreur: error.message });
  }
});

// Exemple de route pour filtrer les historiques de caisse (par caisse, type, etc.)
router.get('/filtrer', async (req, res) => {
  const { caisseId, type, startDate, endDate } = req.query;

  try {
    const filter = {};

    if (caisseId) {
      filter.caisse = caisseId; // Filtrer par l'ID de la caisse
    }
    if (type) {
      filter.type = type; // Filtrer par type
    }
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        filter.date.$gte = new Date(startDate); // Date de début
      }
      if (endDate) {
        filter.date.$lte = new Date(endDate); // Date de fin
      }
    }

    const historiquesCaisse = await HistoriqueCaisse.find(filter)
      .populate('caisse', 'nom')
      .exec();

    res.status(200).json(historiquesCaisse);
  } catch (error) {
    res.status(500).json({ erreur: error.message });
  }
});

module.exports = router;
