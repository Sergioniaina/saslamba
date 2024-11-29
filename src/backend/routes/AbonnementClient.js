// backend/routes/abonnementClient.js
const express = require('express');
const router = express.Router();
const Client = require('../models/client');
const AbonnementClient = require('../models/AbonnementClient');
const Subscription = require('../models/abonnements');

// Route pour associer un client à un abonnement avec les détails d'abonnement (weight, features)
// Route pour associer un client à un abonnement avec les détails d'abonnement (weight, features, sechage)
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
        weight: abonnement.poids, // Utiliser le poids de l'abonnement
        features: abonnement.features,
        lavage: {
          total: abonnement.machines, // Nombre total de séchages
          used: 0, // Initialisé à 0
          weeklyLimit :abonnement.machines,
          reste : abonnement.machines// Limite hebdomadaire
        } ,// Utiliser les fonctionnalités de l'abonnement
        sechage: {
          total: abonnement.sechage, // Nombre total de séchages
          used: 0, // Initialisé à 0
          weeklyLimit :abonnement.sechage,
          reste : abonnement.sechage// Limite hebdomadaire
        },
      },
    });

    await abonnementClient.save();

    res.status(201).json({ 
      message: 'Abonnement créé avec succès', 
      abonnementClient, 
      _id: abonnementClient._id 
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la création de l\'abonnement client' });
  }
});

router.put('/associer/:id', async (req, res) => {
  const { id } = req.params; // Get the AbonnementClient ID from the URL parameter
  const { idClient, idAbonnement } = req.body;

  try {
    // Rechercher le client
    let client = await Client.findById(idClient);  // Corrected this line

    if (!client) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }

    // Rechercher l'abonnement
    const abonnement = await Subscription.findById(idAbonnement);
    if (!abonnement) {
      return res.status(404).json({ error: 'Abonnement non trouvé' });
    }

    // Rechercher l'AbonnementClient à mettre à jour
    const abonnementClient = await AbonnementClient.findById(id);
    if (!abonnementClient) {
      return res.status(404).json({ error: 'AbonnementClient non trouvé' });
    }

    // Mettre à jour les détails de l'abonnement client
    abonnementClient.idClient = client._id;
    abonnementClient.idAbonnement = idAbonnement;
    abonnementClient.abonnementDetails = {
      weight: abonnement.poids, // Utiliser le poids de l'abonnement
      features: abonnement.features,
      lavage: {
        total: abonnement.machines, // Nombre total de séchages
        used: 0, // Utiliser l'usage actuel (ou 0 si non défini)
        weeklyLimit: abonnement.machines,
        reste: abonnement.machines, // Limite restante
      },
      sechage: {
        total: abonnement.sechage, // Nombre total de séchages
        used:  0, // Utiliser l'usage actuel (ou 0 si non défini)
        weeklyLimit: abonnement.sechage,
        reste: abonnement.sechage, // Limite restante
      },
    };

    // Sauvegarder les changements
    await abonnementClient.save();

    res.status(200).json({
      message: 'Abonnement client mis à jour avec succès',
      abonnementClient,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'abonnement client' });
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
          weight: abonnement.poids, // Utiliser le poids de l'abonnement
          features: abonnement.features,
          lavage: {
            total: abonnement.machines, // Nombre total de séchages
            used: 0, // Initialisé à 0
            weeklyLimit :abonnement.machines,
            reste : abonnement.machines// Limite hebdomadaire
          } ,// Utiliser les fonctionnalités de l'abonnement
          sechage: {
            total: abonnement.sechage, // Nombre total de séchages
            used: 0, // Initialisé à 0
            weeklyLimit :abonnement.sechage,
            reste : abonnement.sechage// Limite hebdomadaire
          },
        },
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
  const { abonnementDetails } = req.body;
  const { total, used, weeklyLimit } = abonnementDetails.sechage;
  const { totalLavage, usedLavage, weeklyLimitLavage } = abonnementDetails.lavage;


  try {
    const abonnement = await AbonnementClient.findById(req.params.id);

    if (!abonnement) {
      return res.status(404).json({ error: 'Abonnement non trouvé' });
    }

    // Mettre à jour les détails de séchage
    if (used > total) {
      return res.status(400).json({ error: 'Le nombre de séchages utilisés dépasse le total autorisé.' });
    }

    abonnement.abonnementDetails.sechage.total = total;
    abonnement.abonnementDetails.sechage.used = used;
    abonnement.abonnementDetails.sechage.weeklyLimit = weeklyLimit;
    abonnement.abonnementDetails.lavage.total = totalLavage;
    abonnement.abonnementDetails.lavage.used = usedLavage;
    abonnement.abonnementDetails.lavage.weeklyLimit = weeklyLimitLavage;

    await abonnement.save();

    res.json({
      message: 'Détails de l\'abonnement mis à jour avec succès',
      abonnement,
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'abonnement' });
  }
});

async function validateAbonnement(abonnementId, totalWeight, machinesLavage, machinesSechage) {
  const abonnement = await AbonnementClient.findById(abonnementId);

  if (!abonnement) {
    throw new Error('Abonnement non trouvé.');
  }

  const { weight, lavage, sechage } = abonnement.abonnementDetails;

  if (weight < totalWeight) {
    throw new Error(`Le poids dépasse le quota d\'abonnement. reste ${weight} kg `);
  }

  if (lavage.used + machinesLavage > lavage.total) {
    throw new Error(`Quota de lavage dépassé. reste ${lavage.reste} lavage`);
  }

  if (sechage.used + machinesSechage > sechage.total) {
    throw new Error(`Quota de séchage dépassé. reste ${sechage.reste} sechage`);
  }

  return abonnement;
}

// Route PUT : Consommer des machines
router.put("/abonnement/utiliser/:id", async (req, res) => {
  const { totalWeight, machinesLavage, machinesSechage } = req.body;

  // Vérification des données d'entrée
  if (!totalWeight || machinesLavage == null || machinesSechage == null) {
    return res.status(400).json({
      error: "Les données fournies sont incomplètes.",
    });
  }

  try {
    // Validation de l'abonnement
    const abonnement = await validateAbonnement(
      req.params.id,
      totalWeight,
      machinesLavage,
      machinesSechage
    );

    // Mise à jour des quotas
    abonnement.abonnementDetails.weight -= totalWeight;
    abonnement.abonnementDetails.lavage.used += machinesLavage;
    abonnement.abonnementDetails.sechage.used += machinesSechage;

    // Recalcul des quotas restants
    abonnement.abonnementDetails.lavage.reste =
      abonnement.abonnementDetails.lavage.total -
      abonnement.abonnementDetails.lavage.used;

    abonnement.abonnementDetails.sechage.reste =
      abonnement.abonnementDetails.sechage.total -
      abonnement.abonnementDetails.sechage.used;

    // Sauvegarde dans la base de données
    await abonnement.save();

    res.status(200).json({
      message: "Consommation enregistrée avec succès.",
      abonnement,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/lavage/utiliser/:id', async (req, res) => {
  try {
    const abonnement = await AbonnementClient.findById(req.params.id);

    if (!abonnement) {
      return res.status(404).json({ error: 'Abonnement non trouvé' });
    }

    const { total, used, weeklyLimit } = abonnement.abonnementDetails.lavage;

    if (used >= total) {
      return res.status(400).json({ error: 'Limite totale de lavage atteinte.' });
    }

    // Exemple simplifié pour vérification hebdomadaire (à ajuster avec une logique calendrier)
    const weeklyUsed = used % weeklyLimit;
    if (weeklyUsed >= weeklyLimit) {
      return res.status(400).json({ error: 'Limite hebdomadaire atteinte.' });
    }

    // Incrémenter le nombre de séchages utilisés
    abonnement.abonnementDetails.lavage.used += 1;
    await abonnement.save();

    res.json({
      message: 'Un lavage a été consommé avec succès.',
      abonnement,
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la consommation de lavage' });
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
router.get('/abonnement-client/:idAbonnement', async (req, res) => {
  try {
    const { idAbonnement } = req.params;
    const abonnementClient = await AbonnementClient.findOne({ idAbonnement })
      .populate('idClient', 'name contact') // Inclut les informations du client
      .populate('idAbonnement', 'nom prix features'); // Inclut les détails de l'abonnement

    if (!abonnementClient) {
      return res.status(404).json({ message: 'Abonnement client non trouvé.' });
    }

    res.json(abonnementClient);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error });
  }
});


module.exports = router;
