// routes/globalTime.js
const express = require('express');
const router = express.Router();
const GlobalTime = require('../models/GlobalTime');

// Route GET pour récupérer le temps global
router.get('/', async (req, res) => {
  try {
    const globalTime = await GlobalTime.findOne({});
    if (!globalTime) {
      return res.status(200).json({ time: 0 }); // Si aucun document, retourner 0
    }
    res.status(200).json({ time: globalTime.time });
  } catch (error) {
    console.error("Erreur lors de la récupération du temps global:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;