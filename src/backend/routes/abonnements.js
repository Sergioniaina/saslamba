// backend/routes/abonnements.js
const express = require('express');
const router = express.Router();
const Abonnement = require('../models/abonnements');
const Historique = require('../models/Historique'); 

// Récupérer toutes les offres
router.get('/', async (req, res) => {
  try {
    const abonnements = await Abonnement.find();
    res.json(abonnements);
  } catch (error) {
    res.status(500).json({ erreur: error.message });
  }
});

// Créer une nouvelle offre
router.post('/', async (req, res) => {
  const { nom, machines, poids, prix, features,sechage } = req.body;
  try {
    const nouvelAbonnement = new Abonnement({ nom, machines, poids, prix, features,sechage });
    await nouvelAbonnement.save();
    const nouvelHistorique = new Historique({
        action: 'Création',
        typeEntite: 'Offre d\'Abonnement',
        idEntite: nouvelAbonnement._id,
        date: new Date(),
        details: `Nouvelle offre ${nom} créée avec les caractéristiques: ${features.join(', ')}`,
      });
      await nouvelHistorique.save();
  
    res.status(201).json(nouvelAbonnement);
  } catch (error) {
    res.status(500).json({ erreur: error.message });
  }
});

// Mettre à jour une offre
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nom, machines, poids, prix, features,sechage } = req.body;
  try {
    const abonnementMisAJour = await Abonnement.findByIdAndUpdate(id, { nom, machines, poids, prix, features,sechage }, { new: true });
    const nouvelHistorique = new Historique({
        action: 'Mise à jour',
        typeEntite: 'Offre d\'Abonnement',
        idEntite: abonnementMisAJour._id,
        date: new Date(),
        details: ` offre ${nom} modifié avec les caractéristiques: ${features.join(', ')}`,
      });
      await nouvelHistorique.save();
    res.json(abonnementMisAJour);
  } catch (error) {
    res.status(500).json({ erreur: error.message });
  }
});

// Supprimer une offre
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const abonnement=Abonnement.findById(id);
    await Abonnement.findByIdAndDelete(id);
    const nouvelHistorique = new Historique({
        action: 'Suppression',
        typeEntite: 'Offre d\'Abonnement',
        idEntite: id,
        date: new Date(),
        details: `L'offre ${abonnement.nom} a été supprimée.`,
      });
      await nouvelHistorique.save();
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ erreur: error.message });
  }
});
// Exemple de route pour obtenir un abonnement par ID
router.get('/:id', async (req, res) => {
  try {
    const abonnement = await Abonnement.findById(req.params.id);
    if (!abonnement) {
      return res.status(404).json({ error: 'Abonnement non trouvé' });
    }
    res.json(abonnement);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'abonnement' });
  }
});

module.exports = router;
