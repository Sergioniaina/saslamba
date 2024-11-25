const express = require('express');
const router = express.Router();
const MouvementCaisse = require('../models/mouvementCaisse');

// Route pour créer un mouvement de caisse (ceci est généralement géré automatiquement, mais pour des raisons de flexibilité, vous pouvez l'ajouter)
router.post('/', async (req, res) => {
  try {
    const { idCaisse, recette, depense, date } = req.body;
    const nouveauMouvement = new MouvementCaisse({ idCaisse, recette, depense, date });
    await nouveauMouvement.save();
    res.status(201).json(nouveauMouvement);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la création du mouvement de caisse', error });
  }
});

// Route pour récupérer tous les mouvements de caisse
router.get('/', async (req, res) => {
  try {
    const mouvements = await MouvementCaisse.find().populate('idCaisse');
    res.json(mouvements);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des mouvements de caisse', error });
  }
});

// Route pour récupérer un mouvement de caisse par ID
router.get('/:id', async (req, res) => {
  try {
    const mouvement = await MouvementCaisse.findById(req.params.id).populate('idCaisse');
    if (!mouvement) return res.status(404).json({ message: 'Mouvement de caisse non trouvé' });
    res.json(mouvement);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération du mouvement de caisse', error });
  }
});

module.exports = router;
