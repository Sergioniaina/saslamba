const express = require("express");
const router = express.Router();
const MouvementCaisse = require("../models/mouvementCaisse");
const HistoriqueCaisse = require('../models/HistoriqueCaisse'); 
const Caisse = require("../models/caisse");
// Route pour créer un mouvement de caisse
router.post("/", async (req, res) => {
  try {
    const { idCaisse, recette, depense, dateOuverture, dateFermeture } =
      req.body;
    const nouveauMouvement = new MouvementCaisse({
      idCaisse,
      recette,
      depense,
      dateOuverture,
      dateFermeture,
    });
    await nouveauMouvement.save();
    res.status(201).json(nouveauMouvement);
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Erreur lors de la création du mouvement de caisse",
        error,
      });
  }
});

// Route pour récupérer tous les mouvements de caisse
router.get("/", async (req, res) => {
  try {
    const mouvements = await MouvementCaisse.find().populate("idCaisse", "nom");
    res.json(mouvements);
  } catch (error) {
    console.error("Erreur lors de la récupération des mouvements:", error);
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
});

// Route pour récupérer les mouvements du jour
router.get("/jour", async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const mouvementsJour = await MouvementCaisse.find({
      dateOuverture: { $gte: startOfDay, $lte: endOfDay },
    }).populate("idCaisse", "nom");

    res.json(mouvementsJour);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des mouvements du jour:",
      error
    );
    res
      .status(500)
      .json({
        message: "Erreur lors de la récupération des mouvements du jour",
        error,
      });
  }
});
router.get("/toutes/mouvements/avant-fermeture", async (req, res) => {
  try {
    const caisses = await Caisse.find(); // Récupérer toutes les caisses

    const mouvementsAvantFermeture = [];

    // Parcourir toutes les caisses
    for (const caisse of caisses) {
      // Vérifier si la caisse est ouverte
      if (caisse.ouvert) {
        const filteredMouvements = caisse.historique.filter((mouvement) => {
          // Si une date de fermeture est définie, on filtre par date d'ouverture et date de fermeture
          const dateFermetureValide = caisse.dateFermeture
            ? new Date(mouvement.date) <= new Date(caisse.dateFermeture)
            : true;

          return (
            new Date(mouvement.date) >= new Date(caisse.dateOuverture) &&
            dateFermetureValide
          );
        });

        // Calculer les totaux des recettes et des dépenses pour cette caisse
        const totalRecette = filteredMouvements
          .filter((mouvement) => mouvement.type === "Ajout")
          .reduce((total, mouvement) => total + (mouvement.montant || 0), 0);

        const totalDepense = filteredMouvements
          .filter((mouvement) => mouvement.type === "Retrait")
          .reduce((total, mouvement) => total + (mouvement.montant || 0), 0);

        mouvementsAvantFermeture.push({
          idCaisse: caisse._id,
          nomCaisse: caisse.nom,
          recette: totalRecette,
          depense: totalDepense,
          dateOuverture: caisse.dateOuverture,
        });
      }
    }

    res.status(200).json(mouvementsAvantFermeture);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des mouvements avant fermeture:",
      error
    );
    res.status(500).json({
      message: "Erreur lors de la récupération des mouvements avant fermeture",
      error,
    });
  }
});

// Route pour récupérer les mouvements avant fermeture (avant la date de fermeture)
router.get("/avant-fermeture", async (req, res) => {
  try {
    const today = new Date();

    // Cherche les mouvements dont la date de fermeture est après aujourd'hui
    const mouvementsAvantFermeture = await MouvementCaisse.find({
      dateFermeture: { $gt: today },
    }).populate("idCaisse", "nom");

    res.json(mouvementsAvantFermeture);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des mouvements avant fermeture:",
      error
    );
    res
      .status(500)
      .json({
        message:
          "Erreur lors de la récupération des mouvements avant fermeture",
        error,
      });
  }
});

router.get("/stats/caisse/:idCaisse/:periode", async (req, res) => {
  try {
    const { idCaisse, periode } = req.params;
    const today = new Date();
    let startDate;

    switch (periode) {
      case "jour":
        startDate = new Date(today.setHours(0, 0, 0, 0));
        break;
      case "semaine":
        startDate = new Date(today.setDate(today.getDate() - today.getDay()));
        startDate.setHours(0, 0, 0, 0);
        break;
      case "mois":
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case "annee":
        startDate = new Date(today.getFullYear(), 0, 1);
        break;
      default:
        return res.status(400).json({ message: "Période invalide" });
    }

    const mouvements = await MouvementCaisse.find({
      idCaisse,
      dateOuverture: { $gte: startDate },
    });

    const totalRecette = mouvements
      .filter((m) => m.recette)
      .reduce((total, m) => total + m.recette, 0);

    const totalDepense = mouvements
      .filter((m) => m.depense)
      .reduce((total, m) => total + m.depense, 0);

    res.json({ recette: totalRecette, depense: totalDepense });
  } catch (error) {
    console.error("Erreur lors de la récupération des stats:", error);
    res.status(500).json({ message: "Erreur interne du serveur", error });
  }
});
router.get("/stats/global/:periode", async (req, res) => {
  try {
    const { periode } = req.params;
    const today = new Date();
    let startDate;

    switch (periode) {
      case "jour":
        startDate = new Date(today.setHours(0, 0, 0, 0));
        break;
      case "semaine":
        startDate = new Date(today.setDate(today.getDate() - today.getDay()));
        startDate.setHours(0, 0, 0, 0);
        break;
      case "mois":
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case "annee":
        startDate = new Date(today.getFullYear(), 0, 1);
        break;
      default:
        return res.status(400).json({ message: "Période invalide" });
    }

    const mouvements = await MouvementCaisse.find({
      dateOuverture: { $gte: startDate },
    });

    const totalRecette = mouvements
      .filter((m) => m.recette)
      .reduce((total, m) => total + m.recette, 0);

    const totalDepense = mouvements
      .filter((m) => m.depense)
      .reduce((total, m) => total + m.depense, 0);

    res.json({ recette: totalRecette, depense: totalDepense });
  } catch (error) {
    console.error("Erreur lors de la récupération des stats globales:", error);
    res.status(500).json({ message: "Erreur interne du serveur", error });
  }
});

router.get('/stats/liste/:periode', async (req, res) => {
  try {
    const { periode } = req.params;
    const today = new Date();
    let startDate;

    switch (periode) {
      case 'jour':
        startDate = new Date(today.setHours(0, 0, 0, 0));
        console.log("Date de début pour jour:", startDate);
        break;
      case 'semaine':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - today.getDay()); // Début de la semaine (dimanche)
        startDate.setHours(0, 0, 0, 0);
        console.log("Date de début pour semaine:", startDate);
        break;
      case 'mois':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1); // 1er jour du mois
        console.log("Date de début pour mois:", startDate);
        break;
      case 'annee':
        startDate = new Date(today.getFullYear(), 0, 1); // 1er janvier de l'année
        console.log("Date de début pour annee:", startDate);
        break;
      default:
        return res.status(400).json({ message: 'Période invalide' });
    }

    const mouvements = await MouvementCaisse.aggregate([
      {
        $match: {
          dateOuverture: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$idCaisse',
          recette: { $sum: '$recette' },
          depense: { $sum: '$depense' }
        }
      },
      {
        $lookup: {
          from: 'caisses', // Assurez-vous que le nom de la collection est correct
          localField: '_id',
          foreignField: '_id',
          as: 'caisse'
        }
      },
      {
        $unwind: '$caisse'
      },
      {
        $project: {
          idCaisse: '$_id',
          nomCaisse: '$caisse.nom',
          recette: 1,
          depense: 1
        }
      }
    ]);

  //  console.log(`Données pour la période ${periode}:`, mouvements); // Affiche les résultats dans la console
    res.json(mouvements);
  } catch (error) {
    console.error('Erreur lors de la récupération des données de la liste des caisses:', error);
    res.status(500).json({ message: 'Erreur interne du serveur', error });
  }
});


// Route pour supprimer un mouvement de caisse
router.delete("/:id", async (req, res) => {
  try {
    const mouvement = await MouvementCaisse.findByIdAndDelete(req.params.id);
    if (!mouvement)
      return res
        .status(404)
        .json({ message: "Mouvement de caisse non trouvé" });
    res.json({ message: "Mouvement de caisse supprimé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression du mouvement:", error);
    res
      .status(500)
      .json({
        message: "Erreur lors de la suppression du mouvement de caisse",
        error,
      });
  }
});

module.exports = router;
