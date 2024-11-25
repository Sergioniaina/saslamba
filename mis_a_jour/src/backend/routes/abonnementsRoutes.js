// backend/routes/subscriptions.js
const express = require('express');
const router = express.Router();
const Subscription = require('../models/abonnement');
const Historique = require('../models/Historique'); 

// Get all subscriptions
router.get('/', async (req, res) => {
  try {
    const subscriptions = await Subscription.find();
    res.json(subscriptions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new subscription
// backend/routes/subscriptions.js

router.post('/', async (req, res) => {
  const { type, machines, weight, price, features, clientId } = req.body;
  console.log('Received POST request with data:', req.body); // Ajouté pour débogage
  try {
    const newSubscription = new Subscription({ type, machines, weight, price, features, clientId });
    await newSubscription.save();
    
    // Enregistrer l'action dans l'historique
    const newHistorique = new Historique({
      action: 'Création',
      entityType: 'Abonnement',
      entityId: newSubscription._id,
      date: new Date(),
      details: `Nouvel abonnement créé pour le client ${clientId}.`,
    });
    await newHistorique.save();

    console.log('Subscription created:', newSubscription); // Ajouté pour débogage
    res.status(201).json(newSubscription);
  } catch (error) {
    console.error('Error creating subscription:', error); // Ajouté pour débogage
    res.status(500).json({ error: error.message });
  }
});


// Update a subscription
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { type, machines, weight, price, features, clientId } = req.body;
  try {
    const updatedSubscription = await Subscription.findByIdAndUpdate(id, { type, machines, weight, price, features, clientId }, { new: true });
      // Enregistrer l'action dans l'historique
      const newHistorique = new Historique({
        action: 'Mise à jour',
        entityType: 'Abonnement',
        entityId: updatedSubscription._id,
        date: new Date(),
        details: `L'abonnement du client ${clientId} a été mis à jour.`,
      });
      await newHistorique.save();
  
    res.json(updatedSubscription);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a subscription
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const subscription = await Subscription.findById(id).exec();
    await Subscription.findByIdAndDelete(id);
     // Enregistrer l'action dans l'historique
     const newHistorique = new Historique({
      action: 'Suppression',
      entityType: 'Abonnement',
      entityId: id,
      date: new Date(),
      details: `L'abonnement du client ${subscription.clientId} a été supprimé.`,
    });
    await newHistorique.save();
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
