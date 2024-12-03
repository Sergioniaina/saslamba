// backend/routes/machines.js
const express = require("express");
const multer = require("multer");
const router = express.Router();
const Machine = require("../models/machines");
const Historique = require("../models/Historique");
const path = require("path");
const Compteur = require("../models/compteurMachine");
const Facture = require("../models/Factures");
const authMiddleware = require("../middleware/authMiddleware");
//const checkPermission = require('../middleware/checkPermission');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "machine/"); // Dossier où les fichiers seront stockés
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Nom unique pour chaque fichier
  },
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 5 }, // Limite de 5 Mo
  fileFilter: function (req, file, cb) {
    const fileTypes = /jpeg|jpg|png/;
    const extname = fileTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = fileTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error("Seules les images (jpeg, jpg, png) sont acceptées."));
    }
  },
});
// Get all machines
router.get("/", async (req, res) => {
  try {
    const machines = await Machine.find();
    res.json(machines);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search machines by model number
router.get("/search", async (req, res) => {
  const { modelNumber } = req.query;
  try {
    const machines = await Machine.find({
      modelNumber: new RegExp(modelNumber, "i"),
    });
    res.json(machines);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new machine
router.post("/",authMiddleware, upload.single("photo"), async (req, res) => {
  const {
    type,
    modelNumber,
    powerConsumption,
    weightCapacity,
    etat,
    priceRanges,
  } = req.body;
  const photo = req.file ? req.file.path : null;
  const userId = req.user._id;

  try {
    
    const newMachine = new Machine({
      type,
      modelNumber,
      powerConsumption,
      weightCapacity,
      etat,
      photo,
      priceRanges,
    });
    await newMachine.save();

    // Enregistrer l'action dans l'historique
    const newHistorique = new Historique({
      action: "Création",
      entityType: "Machine",
      entityId: newMachine._id,
      user: userId,
      date: new Date(),
      details: `La machine modèle ${modelNumber} a été ajoutée.`,
    });
    await newHistorique.save();
    res.status(201).json(newMachine);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/available", async (req, res) => {
  try {
    const machines = await Machine.find({ etat: "Disponible" });
    res.json(machines);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Update a machine
router.put("/:id",authMiddleware, upload.single("photo"), async (req, res) => {
  const { id } = req.params;
  const {
    type,
    modelNumber,
    powerConsumption,
    weightCapacity,
    etat,
    priceRanges,
  } = req.body;
  const photo = req.file ? req.file.path : null;
  const userId = req.user._id;

  try {
    const currentMachine = await Machine.findById(id);
    const updatedMachine = await Machine.findByIdAndUpdate(
      id,
      {
        type,
        modelNumber,
        powerConsumption,
        weightCapacity,
        etat,
        photo: photo || currentMachine.photo,
        priceRanges,
      },
      { new: true }
    );

    // Enregistrer l'action dans l'historique
    const newHistorique = new Historique({
      action: "Mise à jour",
      entityType: "Machine",
      entityId: updatedMachine._id,
      user:userId,
      date: new Date(),
      details: `La machine modèle ${modelNumber} a été mise à jour.`,
    });
    await newHistorique.save();

    res.json(updatedMachine);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/:id/etats", async (req, res) => {
  try {
    const machine = await Machine.findByIdAndUpdate(
      req.params.id,
      { etat: req.body.etat },
      { new: true }
    );
    res.json(machine);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//patch
router.patch("/:id/etat", async (req, res) => {
  const { id } = req.params;
  const { etat } = req.body;

  try {
    if (!["Disponible", "Indisponible"].includes(etat)) {
      return res.status(400).json({ error: "État invalide." });
    }
    const machine = await Machine.findByIdAndUpdate(
      id,
      { etat },
      { new: true }
    );
    if (!machine)
      return res.status(404).json({ error: "Machine non trouvée." });

    if (etat === "Indisponible") {
      // Démarrer le compteur
      const compteur = new Compteur({
        machineId: machine._id,
        startTime: new Date(), // Démarrage du compteur
      });
      await compteur.save();
    }

    const historique = new Historique({
      action: "Changement d'état",
      entityType: "Machine",
      entityId: machine._id,
      date: new Date(),
      details: `La machine modèle ${machine.modelNumber} a changé d'état à ${etat}.`,
    });
    await historique.save();

    res.json(machine);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.patch('/:id/indisponible', async (req, res) => {
  const machineId = req.params.id;

  try {
    // Recherche la machine par son ID
    const machine = await Machine.findById(machineId);

    if (!machine) {
      return res.status(404).json({ message: 'Machine non trouvée' });
    }

    // Mettre à jour l'état de la machine
    machine.etat = 'Indisponible'; // Mise à jour de l'état

    // Sauvegarder la machine avec le nouvel état
    await machine.save();
    const compteur = new Compteur({
      machineId: machine._id,
      startTime: new Date(), // Démarrage du compteur
    });
    await compteur.save();

    return res.status(200).json({ message: 'Machine mise à l\'état Indisponible', machine });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'état:', error);
    return res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// const KILOWATT_CONSUMPTION_PER_HOUR = 2; // Par exemple, 2 kWh par heure

router.patch("/:id/liberer", async (req, res) => {
    const { id } = req.params;

    try {
      // Trouver la machine par ID
      const machine = await Machine.findById(id);
      if (!machine || machine.etat !== "Indisponible") {
        return res
          .status(404)
          .json({ error: 'Machine non trouvée ou non en état "Indisponible".' });
      }

      const KILOWATT_CONSUMPTION_PER_HOUR = machine.powerConsumption;

      // Récupérer tous les compteurs associés à cette machine
      const compteurs = await Compteur.find({ machineId: id });

      let totalKilowattHours = 0;

      // Calculer la consommation totale de tous les compteurs existants
      for (const compteur of compteurs) {
        if (!compteur.endTime) {
          // Si le compteur est encore actif (endTime est null), calculer la durée écoulée
          const endTime = new Date();
          const durationHours = (endTime - compteur.startTime) / (1000 * 60 * 60); // Durée en heures
          totalKilowattHours += durationHours * KILOWATT_CONSUMPTION_PER_HOUR;
        } else {
          // Si le compteur est déjà terminé, ajouter simplement les kilowattheures accumulés
          totalKilowattHours += compteur.kilowattHours;
        }
      }

      // Supprimer tous les compteurs précédents pour cette machine
      await Compteur.deleteMany({ machineId: id });

      // Créer un nouveau compteur avec la consommation totale
      const newCompteur = new Compteur({
        machineId: id,
        startTime: new Date(),
        endTime: new Date(), // La machine est libérée donc endTime est défini à maintenant
        kilowattHours: totalKilowattHours, // Ajouter seulement la consommation totale
      });
      await newCompteur.save();

      // Mettre à jour l'état de la machine
      machine.etat = "Disponible";
      await machine.save();


      res.json(machine);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

router.get("/:id/consumption", async (req, res) => {
  try {
    const consumptionData = await Compteur.find({ machineId: req.params.id });
    res.json(consumptionData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.delete("/consumption/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Rechercher et supprimer l'enregistrement de consommation correspondant à l'ID
    const deletedConsumption = await Compteur.findByIdAndDelete(id);

    // Si l'enregistrement n'existe pas, renvoyer une erreur 404
    if (!deletedConsumption) {
      return res.status(404).json({ error: "Enregistrement de consommation introuvable." });
    }

    // Retourner une réponse de succès
    res.status(200).json({ message: "Enregistrement de consommation supprimé avec succès." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route pour récupérer les machines par ID
router.get('/', async (req, res) => {
  const { ids } = req.query;
  const machineIds = ids.split(','); // Les IDs sont passés sous forme de chaîne, donc on les découpe
  try {
    const machines = await Machine.find({ '_id': { $in: machineIds } });
    res.json(machines);
  } catch (err) {
    res.status(500).send('Erreur lors de la récupération des machines');
  }
});
// Supposons que vous ayez une route pour récupérer les factures en attente et leurs machines associées

router.get('/factures-machines', async (req, res) => {
  const { factureId } = req.query; // ID de la facture à filtrer
  
  try {
    // Récupérer la facture avec l'ID fourni
    const facture = await Facture.findById(factureId);
    
    if (!facture) {
      return res.status(404).send('Facture non trouvée');
    }

    if (facture.etat !== "en attente") {
      return res.status(400).send('La facture n\'est pas en attente');
    }

    // Récupérer les machines associées à cette facture
    const machineIds = facture.machines; // L'ID des machines associées à la facture
    const machines = await Machine.find({ '_id': { $in: machineIds } });
    
    res.json(machines); // Renvoyer les machines associées à la facture
  } catch (err) {
    res.status(500).send('Erreur lors de la récupération des machines');
  }
});


// Exemple de route pour obtenir l'historique de consommation de toutes les machines
router.get("/consumption", async (req, res) => {
  try {
    const consumptionHistory = await Compteur.find().populate("machineId"); // Si vous avez une relation avec la machine
    const consumptionData = consumptionHistory.map((entry) => ({
      _id: entry._id,
      machineId: entry.machineId ? entry.machineId._id : null,  // Si vous avez un champ modèle
      startTime: entry.startTime,
      endTime: entry.endTime,
      kilowattHours: entry.kilowattHours,
    }));
    res.json(consumptionData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a machine
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
   // const machine = Machine.findById(id);
    await Machine.findByIdAndDelete(id);
    // // const newHistorique = new Historique({
    // //   action: "Suppression",
    // //   entityType: "Machine",
    // //   entityId: id,
    // //   date: new Date(),
    // //   details: `La machine modèle ${machine.modelNumber} a été supprimée.`,
    // // });
    // await newHistorique.save();
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const machine = await Machine.findById(id);
    if (!machine) {
      return res.status(404).json({ error: "Machine non trouvée." });
    }
    res.json(machine);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
