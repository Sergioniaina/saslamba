const express = require('express');
const router = express.Router();
const Payment = require('../models/Payement');
const Facture = require('../models/Factures'); 
const Caisse = require('../models/caisse')// Assurez-vous que le modèle Facture est importé
const authMiddleware = require("../middleware/authMiddleware");
// Créer un nouveau paiement avec une facture et historique auto-généré
router.post('/',authMiddleware, async (req, res) => {
  const userId = req.user._id;
  try {
    const { type, facture, montant, caisse} = req.body;

    // Vérifier si la facture existe
    const foundFacture = await Facture.findById(facture);
    const caisseFound = await Caisse.findById(caisse);
    if (!foundFacture) {
      return res.status(404).json({ message: 'Facture non trouvée' });
    }
   // const montant = foundFacture.totalPrice-foundFacture.reste;
    const historique = [{
      action: `Facture de ref ${foundFacture.reference} payé`,
      montant: montant,
      user:userId,
      caisse : caisseFound._id
    }];

    // Créer un nouveau paiement avec l'historique généré
    const newPayment = new Payment({
      type,
      historique,
      facture
    });

    // Enregistrer le paiement dans la base de données
    await newPayment.save();
    
    res.status(201).json(newPayment);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la création du paiement', error });
  }
});
// Récupérer tous les types de paiement
router.get("/", async (req, res) => {
  try {
    const payement = await Payment.find();
    res.json(payement);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération des caisses", error });
  }
});
router.get('/pay', async (req, res) => {
  try {
    const paymentTypes = await Payment.find(); // Récupère tous les types de paiement
    res.status(200).json(paymentTypes);
  } catch (error) {
    console.error('Erreur lors de la récupération des types de paiement:', error);
    res.status(500).json({ message: 'Erreur du serveur' });
  }
});
// Supprimer un paiement par son ID
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deletedPayment = await Payment.findByIdAndDelete(id);

    if (!deletedPayment) {
      return res.status(404).json({ message: 'Paiement non trouvé' });
    }

    res.status(200).json({ message: 'Paiement supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression du paiement', error });
  }
});

module.exports = router;
