const express = require('express');
const Privilege = require('../models/privilege');
const router = express.Router();

// Récupérer tous les privilèges
router.get('/', async (req, res) => {
  try {
    const privileges = await Privilege.find();
    res.status(200).json(privileges);
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la récupération des privilèges.' });
  }
});
router.get('/list', async (req, res) => {
    try {
      // Supposons que le token d'authentification contient les informations de l'utilisateur
      const user = req.user; // Vous avez déjà un middleware pour vérifier le token et l'ajouter à req.user
      if (!user) {
        return res.status(401).json({ message: 'Utilisateur non authentifié.' });
      }
  
      const { role, subRole } = user;
  
      // Recherchez les privilèges en fonction du rôle et du sous-rôle de l'utilisateur
      const privileges = await Privilege.findOne({ role, subRole });
  
      if (!privileges) {
        return res.status(404).json({ message: 'Privilèges non trouvés pour cet utilisateur.' });
      }
  
      // Retourner les privilèges
      res.status(200).json(privileges);
    } catch (err) {
      console.error("Erreur lors de la récupération des privilèges :", err);
      res.status(500).json({ message: 'Erreur lors de la récupération des privilèges.' });
    }
  });


// Mettre à jour ou créer des privilèges pour un rôle
router.put("/", async (req, res) => {
    try {
      const { updates } = req.body;
  
      for (const update of updates) {
        const { role, subRole, permissions } = update;
        await Privilege.findOneAndUpdate(
          { role, subRole },
          { permissions },
          { upsert: true, new: true }
        );
      }
  
      res.json({ message: "Privilèges mis à jour avec succès." });
    } catch (err) {
      console.error("Erreur lors de la mise à jour des privilèges :", err);
      res.status(500).json({ message: "Erreur serveur." });
    }
  });

module.exports = router;
