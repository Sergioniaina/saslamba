const express = require('express');
const router = express.Router();
const Client = require('../models/client');

// Créer un nouveau client
router.post('/', async (req, res) => {
  try {
    const { name, contact } = req.body;
    const newClient = new Client({ name, contact });
    await newClient.save();
    res.status(201).json(newClient);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la création du client', error });
  }
});

// Récupérer tous les clients
router.get('/', async (req, res) => {
  try {
    const clients = await Client.find();
    res.json(clients);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des clients', error });
  }
});

// Récupérer un client par ID
router.get('/:id', async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ message: 'Client non trouvé' });
    res.json(client);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération du client', error });
  }
});

// Mettre à jour un client
router.put('/:id', async (req, res) => {
  try {
    const { name, contact } = req.body;
    const updatedClient = await Client.findByIdAndUpdate(req.params.id, { name, contact }, { new: true });
    if (!updatedClient) return res.status(404).json({ message: 'Client non trouvé' });
    res.json(updatedClient);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour du client', error });
  }
});

// Supprimer un client
router.delete('/:id', async (req, res) => {
  try {
    const deletedClient = await Client.findByIdAndDelete(req.params.id);
    if (!deletedClient) return res.status(404).json({ message: 'Client non trouvé' });
    res.json({ message: 'Client supprimé' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression du client', error });
  }
});

//get
// Obtenir un client par nom ou contact
// router.get('/search', async (req, res) => {
//     try {
//       const { name, contact } = req.query;
//       if (!name && !contact) {
//         return res.status(400).json({ message: 'Nom ou contact requis' });
//       }
  
//       const query = {};
//       if (name) query.name = name;
//       if (contact) query.contact = contact;
  
//       const client = await Client.findOne(query);
//       if (!client) return res.status(404).json({ message: 'Client non trouvé' });
//       res.json(client);
//     } catch (error) {
//       res.status(500).json({ message: 'Erreur lors de la récupération du client', error });
//     }
//   });
router.get('/search', async (req, res) => {
    try {
      const { search } = req.query;
      if (!search) {
        return res.status(400).json({ message: 'Paramètre de recherche requis' });
      }
  
      const query = {
        $or: [
          { name: new RegExp(search, 'i') }, // Recherche insensible à la casse pour le nom
          { contact: new RegExp(search, 'i') } // Recherche insensible à la casse pour le contact
        ]
      };
  
      const clients = await Client.find(query); // Trouver les clients qui correspondent à la requête
      res.json(clients);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  // Rechercher un client dont le nom ou le contact contient une chaîne donnée
router.get('/searchs', async (req, res) => {
    try {
      const { search } = req.query;
  
      if (!search) {
        return res.status(400).json({ message: 'Le paramètre "search" est requis pour la recherche' });
      }
  
      // Utiliser $or pour chercher dans le champ 'name' et 'contact' avec une recherche insensible à la casse
      const clients = await Client.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },  // Recherche par nom insensible à la casse
          { contact: { $regex: search, $options: 'i' } } // Recherche par contact insensible à la casse
        ]
      });
  
      if (clients.length === 0) {
        return res.status(404).json({ message: 'Aucun client trouvé avec ces critères' });
      }
  
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: 'Erreur lors de la récupération des clients', error });
    }
  });
  
  // Exemple d'API pour rechercher un client
  router.get('/search', async (req, res) => {
    try {
      const { name, contact } = req.query;
      if (!name && !contact) {
        return res.status(400).json({ message: 'Nom ou contact requis' });
      }
  
      const query = {};
      if (name) query.name = { $regex: name, $options: 'i' }; // Recherche insensible à la casse
      if (contact) query.contact = { $regex: contact, $options: 'i' }; // Recherche insensible à la casse
  
      const clients = await Client.find(query);
      if (clients.length === 0) return res.status(404).json({ message: 'Aucun client trouvé' });
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: 'Erreur lors de la récupération des clients', error });
    }
  });
  
  

module.exports = router;
