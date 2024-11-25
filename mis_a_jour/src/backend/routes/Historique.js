const express = require('express');
const router = express.Router();
const Historique = require('../models/Historique'); // Assurez-vous que le chemin est correct
const authMiddleware = require("../middleware/authMiddleware");

// Obtenir tous les événements de l'historique, triés par date (plus récents d'abord)
router.get('/', async (req, res) => {
  try {
    const historique = await Historique.find().sort({ date: -1 }); // Tri par date décroissante
    res.json(historique);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.post('/', authMiddleware, async (req, res) => {
  const { action, entityType, entityId, date, details } = req.body;
  const userId = req.user._id;

  // Validation simple
  if (!action || !entityType || !entityId || !details) {
    return res.status(400).json({ message: 'Tous les champs sont requis.' });
  }

  try {
    // Créer un nouvel historique
    const newHistorique = new Historique({
      action,
      entityType,
      entityId,
      user:userId,
      date: date || Date.now(),  // Utiliser la date actuelle si non fournie
      details
    });

    // Enregistrer dans la base de données
    const savedHistorique = await newHistorique.save();
    res.status(201).json(savedHistorique);
  } catch (error) {
    console.error('Erreur lors de l\'ajout de l\'historique', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Obtenir l'historique d'une entité spécifique (Facture, Machine, Produit, etc.)
router.get('/:entityType/:entityId', async (req, res) => {
  const { entityType, entityId } = req.params;
  try {
    const historique = await Historique.find({ entityType, entityId }).sort({ date: -1 });
    if (historique.length === 0) {
      return res.status(404).json({ message: 'Aucun historique trouvé pour cette entité.' });
    }
    res.json(historique);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// routes/historique.js
router.get('/', async (req, res) => {
  const { entityId } = req.query;

  try {
    if (!entityId) {
      return res.status(400).json({ message: 'L\'ID de l\'entité est requis.' });
    }

    const historique = await Historique.findOne({ entityId }).populate('user', 'name');
    if (!historique) {
      return res.status(404).json({ message: 'Historique non trouvé.' });
    }

    res.json(historique);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique :', error);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params;
  
    try {
      const historique = await Historique.findById(id);
      if (!historique) {
        return res.status(404).json({ error: 'Événement historique non trouvé.' });
      }
  
      await Historique.findByIdAndDelete(id);
  
      res.status(204).json({ message: 'Événement supprimé avec succès.' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  

module.exports = router;
