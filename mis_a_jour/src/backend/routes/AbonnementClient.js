// backend/routes/abonnementClient.js
const express = require('express');
const router = express.Router();
const Client = require('../models/client');
const AbonnementClient = require('../models/AbonnementClient');
const Subscription = require('../models/abonnements');

// Route pour associer un client à un abonnement avec les détails d'abonnement (weight, features)
router.post('/associer', async (req, res) => {
  const { name, contact, idAbonnement } = req.body;
  try {
    // Rechercher ou créer le client
    let client = await Client.findOne({ name });
    if (!client) {
      client = new Client({ name, contact });
      await client.save();
    }
    // Récupérer les détails de l'abonnement
    const abonnement = await Subscription.findById(idAbonnement);
    if (!abonnement) {
      return res.status(404).json({ error: 'Abonnement non trouvé' });
    }

    // Créer l'abonnement client avec les détails récupérés
    const abonnementClient = new AbonnementClient({
      idClient: client._id,
      idAbonnement,
      abonnementDetails: {
        weight: abonnement.poids,        // Utiliser le poids de l'abonnement
        features: abonnement.features,    // Utiliser les fonctionnalités de l'abonnement
      }
    });

    await abonnementClient.save();

    res.status(201).json({ message: 'Abonnement créé avec succès', abonnementClient,_id: abonnementClient._id });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la création de l\'abonnement client' });
  }
});

// Mettre à jour un abonnement client et ses détails d'abonnement (weight, features)
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { idClient, idAbonnement } = req.body;

  try {
    // Récupérer les détails de l'abonnement
    const abonnement = await Subscription.findById(idAbonnement);
    if (!abonnement) {
      return res.status(404).json({ error: 'Abonnement non trouvé' });
    }

    // Mettre à jour l'abonnement client
    const abonnementClient = await AbonnementClient.findByIdAndUpdate(
      id,
      {
        idClient,
        idAbonnement,
        abonnementDetails: {
          weight: abonnement.poids,       // Mettre à jour avec le poids de l'abonnement
          features: abonnement.features,   // Mettre à jour avec les fonctionnalités de l'abonnement
        }
      },
      { new: true }
    );

    if (!abonnementClient) {
      return res.status(404).json({ error: 'Abonnement client non trouvé' });
    }

    res.json(abonnementClient);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'abonnement client' });
  }
});
router.put('/abonnement/:id', async (req, res) => {
  const abonnementId = req.params.id; // Récupérer l'ID de l'abonnement depuis l'URL
  const { abonnementDetails } = req.body; // Extraire les détails de l'abonnement depuis le body

  try {
    // Chercher l'abonnement correspondant par son ID
    const abonnement = await AbonnementClient.findById(abonnementId);

    if (!abonnement) {
      return res.status(404).json({ error: 'Abonnement non trouvé' });
    }

    // Mettre à jour les détails de l'abonnement avec les données fournies
    abonnement.abonnementDetails.weight = abonnementDetails.weight;
    abonnement.abonnementDetails.features = abonnementDetails.features;

    // Sauvegarder les modifications
    await abonnement.save();

    // Retourner une réponse avec les détails mis à jour
    res.json({
      message: 'Détails de l\'abonnement mis à jour avec succès',
      abonnement: abonnement,
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'abonnement:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'abonnement' });
  }
});

// Supprimer un abonnement client
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await AbonnementClient.findByIdAndDelete(id);
    res.json({ message: 'Abonnement client supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'abonnement client' });
  }
});

// Récupérer toutes les offres d'abonnement client
router.get('/', async (req, res) => {
  try {
    const abonnementClients = await AbonnementClient.find();
    res.json(abonnementClients);
  } catch (error) {
    res.status(500).json({ erreur: error.message });
  }
});
// Obtenir les abonnements d'un client par ID
// Obtenir tous les abonnements d'un client par son ID
router.get('/client/:idClient', async (req, res) => {
  try {
    const abonnementClients = await AbonnementClient.find({ idClient: req.params.idClient })
      .populate('idAbonnement'); // Peupler les détails d'abonnement

    if (!abonnementClients.length) {
      return res.status(404).json({ error: 'Aucun abonnement trouvé pour ce client' });
    }

    res.json(abonnementClients);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des abonnements du client' });
  }
});

router.get('/clientAb/:idClient', async (req, res) => {
  try {
    // Requête sans `populate`
    const abonnementClients = await AbonnementClient.find({ idClient: req.params.idClient });

    if (!abonnementClients.length) {
      return res.status(404).json({ error: 'Aucun abonnement trouvé pour ce client' });
    }

    res.json(abonnementClients);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des abonnements du client' });
  }
});


// Obtenir un abonnement client par ID
router.get('/:id', async (req, res) => {
  try {
    const abonnementClient = await AbonnementClient.findById(req.params.id);
    if (!abonnementClient) {
      return res.status(404).json({ error: 'Abonnement non trouvé' });
    }
    res.json(abonnementClient);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'abonnement client' });
  }
});

module.exports = router;
