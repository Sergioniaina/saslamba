const express = require('express');
const router = express.Router();
const ProductHistory = require('../models/ProductHistorique'); // Assurez-vous que le modèle est correct
// Route GET : Récupérer tous les historiques des produits
router.get('/', async (req, res) => {
  try {
    const history = await ProductHistory.find()
      .populate("product", "name stock") // Inclut `name` et `stock` des produits
      .sort({ date: -1 }); // Tri par date décroissante

    res.json(history);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'historique des produits : ", error);
    res.status(500).json({ error: "Erreur lors de la récupération de l'historique des produits." });
  }
});

module.exports = router;
