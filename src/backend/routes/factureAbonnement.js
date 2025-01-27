const express = require('express');
const router = express.Router();
const FactureAbonnement = require('../models/factureAbonnement'); // Assurez-vous du chemin correct vers votre modèle
const Client = require('../models/client');
const AbonnementClient = require('../models/AbonnementClient');

// POST : Créer une nouvelle facture
router.post('/', async (req, res) => {
    try {
      const { idClient, idAbonnementClient, montant, montantDonnee } = req.body;
  
      if (!idClient || !idAbonnementClient || montant == null || montantDonnee == null) {
        return res.status(400).json({ error: "Tous les champs sont obligatoires." });
      }
  
      const reste = montant - montantDonnee;
  
      const factureAbonnement = new FactureAbonnement({
        idClient,
        idAbonnementClient,
        montant,
        montantDonnee,
        reste,
      });
  
      await factureAbonnement.save();
  
      // Retourner la facture créée
      res.status(201).json(factureAbonnement);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
  router.get("/last-ticket", async (req, res) => {
    try {
      // Trouver la facture avec le plus grand numéro de ticket
      const latestFacture = await FactureAbonnement.findOne().sort({ numeroFacture: -1 });
  
      if (!latestFacture) {
        // Si aucune facture n'est trouvée, retourner le numéro de ticket initial
        return res.status(200).json({ numeroFacture: 1 });
      }
  
      // Retourner le dernier numéro de ticket
      res.status(200).json({ numeroFacture: latestFacture.numeroFacture });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération du dernier ticket" });
    }
  });
  

// GET : Récupérer toutes les factures
router.get('/', async (req, res) => {
  try {
    const factures = await FactureAbonnement.find()
      .populate('idClient', 'name contact') // Récupère les détails du client
      .populate('idAbonnementClient'); // Récupère les détails de l'abonnement client

    res.status(200).json(factures);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET : Récupérer une facture par ID
router.get('/:id', async (req, res) => {
  try {
    const facture = await FactureAbonnement.findById(req.params.id)
      .populate('idClient', 'name contact')
      .populate('idAbonnementClient');

    if (!facture) {
      return res.status(404).json({ error: 'Facture non trouvée' });
    }

    res.status(200).json(facture);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT : Mettre à jour une facture
router.put('/:id', async (req, res) => {
  try {
    const { montant, montantDonnee } = req.body;

    const facture = await FactureAbonnement.findById(req.params.id);
    if (!facture) {
      return res.status(404).json({ error: 'Facture non trouvée' });
    }

    facture.montant = montant !== undefined ? montant : facture.montant;
    facture.montantDonnee = montantDonnee !== undefined ? montantDonnee : facture.montantDonnee;
    facture.reste = facture.montant - facture.montantDonnee;

    await facture.save();
    res.status(200).json(facture);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE : Supprimer une facture
router.delete('/:id', async (req, res) => {
  try {
    const facture = await FactureAbonnement.findByIdAndDelete(req.params.id);

    if (!facture) {
      return res.status(404).json({ error: 'Facture non trouvée' });
    }

    res.status(200).json({ message: 'Facture supprimée avec succès', facture });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
