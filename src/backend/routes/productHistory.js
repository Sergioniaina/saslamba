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
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const deletedHistory = await ProductHistory.findByIdAndDelete(id);

    if (!deletedHistory) {
      return res.status(404).json({ message: "Historique non trouvé." });
    }

    res.json({ message: "Historique supprimé avec succès." });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'historique : ", error);
    res.status(500).json({ error: "Erreur lors de la suppression de l'historique." });
  }
});
router.put('/delete-flag/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Mettre à jour l'attribut `deleted` à true
    const updatedHistory = await ProductHistory.findByIdAndUpdate(
      id,
      { deleted: true },
      { new: true }
    );

    if (!updatedHistory) {
      return res.status(404).json({ message: "Historique non trouvé." });
    }

    res.json({
      message: "L'attribut 'deleted' a été mis à jour.",
      updatedHistory,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'attribut 'deleted' : ", error);
    res.status(500).json({ error: "Erreur lors de la mise à jour de l'attribut 'deleted'." });
  }
});



module.exports = router;
