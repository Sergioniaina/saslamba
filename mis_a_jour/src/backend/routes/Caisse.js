const express = require("express");
const router = express.Router();
const Caisse = require("../models/caisse");
const MouvementCaisse = require("../models/mouvementCaisse");

// Créer une nouvelle caisse
router.post("/", async (req, res) => {
  try {
    const { nom, type, solde } = req.body;
    const now = new Date();
    const newCaisse = new Caisse({ nom, type, solde, dateOuverture: now });
    await newCaisse.save();
    res.status(201).json(newCaisse);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erreur lors de la création de la caisse", error });
  }
});

// Récupérer toutes les caisses
router.get("/", async (req, res) => {
  try {
    const caisses = await Caisse.find();
    res.json(caisses);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération des caisses", error });
  }
});

// Récupérer une caisse par ID
router.get("/:id", async (req, res) => {
  try {
    const caisse = await Caisse.findById(req.params.id);
    if (!caisse) return res.status(404).json({ message: "Caisse non trouvée" });
    res.json(caisse);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération de la caisse", error });
  }
});

// Mettre à jour une caisse par ID
router.put("/:id", async (req, res) => {
  try {
    const { nom, type, solde } = req.body;
    const updatedCaisse = await Caisse.findByIdAndUpdate(
      req.params.id,
      { nom, type, solde },
      { new: true }
    );
    if (!updatedCaisse)
      return res.status(404).json({ message: "Caisse non trouvée" });
    res.json(updatedCaisse);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erreur lors de la mise à jour de la caisse", error });
  }
});
// Route pour fermer une caisse
// Route pour fermer une caisse
router.post("/:id/close", async (req, res) => {
  try {
    const caisse = await Caisse.findById(req.params.id);
    if (!caisse) return res.status(404).json({ message: "Caisse non trouvée" });

    if (!caisse.ouvert) {
      return res.status(400).json({ message: "La caisse est déjà fermée." });
    }

    const now = new Date();

    // Filter movements that occurred after the caisse opened
    const filteredMouvements = caisse.historique.filter(
      (mouvement) => mouvement.date >= caisse.dateOuverture
    );

    // Calculate totals only from filtered movements
    const totalRecette = filteredMouvements
      .filter((mouvement) => mouvement.type === "Ajout")
      .reduce((total, mouvement) => total + (mouvement.montant || 0), 0);

    const totalDepense = filteredMouvements
      .filter((mouvement) => mouvement.type === "Retrait")
      .reduce((total, mouvement) => total + (mouvement.montant || 0), 0);

    // Mark caisse as closed, add the closing date to history
    caisse.dateFermeture = now;
    caisse.fermetures.push(now); // Add closure date to history
    caisse.ouvert = false; // Mark the caisse as closed

    // Save the mouvement with the calculated totals
    const mouvement = new MouvementCaisse({
      idCaisse: caisse._id,
      recette: totalRecette,
      depense: totalDepense,
      date: now,
      dateOuverture: caisse.dateOuverture,  // Log the opening date
      dateFermeture: now  // Log the closing date
    });
    await mouvement.save();

    // Do NOT reset the historique. Keep all records intact.
    
    await caisse.save();
    res.status(200).json(caisse);
  } catch (error) {
    console.error("Erreur lors de la fermeture de la caisse:", error);
    res
      .status(500)
      .json({ message: "Erreur lors de la fermeture de la caisse", error });
  }
});
// Route pour récupérer les mouvements des caisses avant leur fermeture
router.get("/toutes/mouvements/avant-fermeture", async (req, res) => {
  try {
    const caisses = await Caisse.find(); // Récupérer toutes les caisses

    const mouvementsAvantFermeture = [];

    // Parcourir toutes les caisses
    for (const caisse of caisses) {
      // Vérifier si la caisse est ouverte
      if (caisse.ouvert) {
        const filteredMouvements = caisse.historique.filter(
          (mouvement) => new Date(mouvement.date) >= caisse.dateOuverture
        );

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
    console.error("Erreur lors de la récupération des mouvements avant fermeture:", error);
    res.status(500).json({
      message: "Erreur lors de la récupération des mouvements avant fermeture",
      error,
    });
  }
});
// Route pour récupérer les informations d'une caisse avant de la fermer


router.post("/:id/jour", async (req, res) => {
  try {
    const caisse = await Caisse.findById(req.params.id);
    if (!caisse) return res.status(404).json({ message: "Caisse non trouvée" });

    // if (!caisse.ouvert) {
    //   return res.status(400).json({ message: "La caisse est déjà fermée." });
    // }

    const now = new Date();

    // Filter movements that occurred after the caisse opened
    const filteredMouvements = caisse.historique.filter(
      (mouvement) => mouvement.date >= caisse.dateOuverture
    );

    // Calculate totals only from filtered movements
    const totalRecette = filteredMouvements
      .filter((mouvement) => mouvement.type === "Ajout")
      .reduce((total, mouvement) => total + (mouvement.montant || 0), 0);

    const totalDepense = filteredMouvements
      .filter((mouvement) => mouvement.type === "Retrait")
      .reduce((total, mouvement) => total + (mouvement.montant || 0), 0);

    // Mark caisse as closed, add the closing date to history
    caisse.dateFermeture = now;
    caisse.fermetures.push(now); // Add closure date to history
    caisse.ouvert = false; // Mark the caisse as closed

    // Save the mouvement with the calculated totals
    const mouvement = new MouvementCaisse({
      idCaisse: caisse._id,
      recette: totalRecette,
      depense: totalDepense,
      date: now,
      dateOuverture: caisse.dateOuverture,  // Log the opening date
      dateFermeture: now  // Log the closing date
    });
    await mouvement.save();

    // Do NOT reset the historique. Keep all records intact.
    
    await caisse.save();
    res.status(200).json(caisse);
  } catch (error) {
    console.error("Erreur lors de la fermeture de la caisse:", error);
    res
      .status(500)
      .json({ message: "Erreur lors de la fermeture de la caisse", error });
  }
});


// Route pour ouvrir une caisse
router.post("/:id/open", async (req, res) => {
  try {
    const caisse = await Caisse.findById(req.params.id);
    if (!caisse) return res.status(404).json({ message: "Caisse non trouvée" });

    if (caisse.ouvert) {
      return res.status(400).json({ message: "La caisse est déjà ouverte." });
    }

    caisse.ouvert = true;
    caisse.dateFermeture = null; // Réinitialiser la date de fermeture
    caisse.dateOuverture = new Date(); // Nouvelle date d'ouverture

    caisse.historique.push({
      action: "Ouverture de la caisse",
      date: caisse.dateOuverture,
    });

    await caisse.save();
    res.status(200).json(caisse);
  } catch (error) {
    console.error("Erreur lors de l'ouverture de la caisse:", error);
    res
      .status(500)
      .json({ message: "Erreur lors de l'ouverture de la caisse", error });
  }
});

// Route pour récupérer les caisses fermées
router.get("/closed", async (req, res) => {
  try {
    const caissesFermées = await Caisse.find({ ouvert: false });
    res.json(caissesFermées);
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la récupération des caisses fermées",
      error,
    });
  }
});

// Supprimer une caisse par ID
router.delete("/:id", async (req, res) => {
  try {
    const deletedCaisse = await Caisse.findByIdAndDelete(req.params.id);
    if (!deletedCaisse)
      return res.status(404).json({ message: "Caisse non trouvée" });
    res.json({ message: "Caisse supprimée avec succès" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erreur lors de la suppression de la caisse", error });
  }
});

// Route pour mettre à jour le solde d'une caisse
router.put("/:id/update-solde", async (req, res) => {
  const { id } = req.params;
  const { solde } = req.body;

  try {
    const caisse = await Caisse.findById(id);
    if (!caisse) {
      return res.status(404).json({ message: "Caisse non trouvée" });
    }

    caisse.historique.push({
      action: `Mise à jour du solde à ${solde}`,
      date: new Date(),
    });

    caisse.solde = solde;
    await caisse.save();

    res.status(200).json(caisse);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la mise à jour du solde" });
  }
});

// Route pour ajouter du solde
router.put("/:id/add-solde", async (req, res) => {
  const { id } = req.params;
  const { solde } = req.body;

  try {
    const caisse = await Caisse.findById(id);
    if (!caisse) {
      return res.status(404).json({ message: "Caisse non trouvée" });
    }

    caisse.solde += solde;

    caisse.historique.push({
      action: `Ajout de ${solde} du solde`,
      type: "Ajout",
      montant: Math.abs(solde),
      date: new Date(),
    });

    await caisse.save();
    res.json(caisse);
  } catch (error) {
    console.error("Erreur lors de l'ajout du solde:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Route pour retirer du solde
router.put("/:id/remove-solde", async (req, res) => {
  const { id } = req.params;
  const { solde } = req.body;

  try {
    const caisse = await Caisse.findById(id);
    if (!caisse) {
      return res.status(404).json({ message: "Caisse non trouvée" });
    }

    caisse.solde -= solde;

    caisse.historique.push({
      action: `Retrait de ${solde} du solde`,
      type: "Retrait",
      montant: Math.abs(solde),
      date: new Date(),
    });
    await caisse.save();
    res.json(caisse);
  } catch (error) {
    console.error("Erreur lors du retrait du solde:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Route pour fermer une caisse
router.post("/:id/close", async (req, res) => {
  try {
    const caisse = await Caisse.findById(req.params.id);
    if (!caisse) return res.status(404).json({ message: "Caisse non trouvée" });

    caisse.dateFermeture = new Date();
    await caisse.save();

    res.status(200).json(caisse);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erreur lors de la fermeture de la caisse", error });
  }
});

// Route pour récupérer les caisses fermées
router.get("/closed", async (req, res) => {
  try {
    const caissesFermées = await Caisse.find({ dateFermeture: { $ne: null } });
    res.json(caissesFermées);
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la récupération des caisses fermées",
      error,
    });
  }
});
// Ajouter ces routes au fichier routes

// Route pour les mouvements de la semaine
router.get("/toutes/semaine", async (req, res) => {
  try {
    const caisses = await Caisse.find(); // Toutes les caisses
    const mouvementsDeSemaine = [];
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    for (const caisse of caisses) {
      if (!caisse.ouvert) continue; // Ignorer les caisses fermées

      const filteredMouvements = caisse.historique.filter(
        (mouvement) => new Date(mouvement.date) >= startOfWeek
      );

      const totalRecette = filteredMouvements
        .filter((mouvement) => mouvement.type === "Ajout")
        .reduce((total, mouvement) => total + (mouvement.montant || 0), 0);

      const totalDepense = filteredMouvements
        .filter((mouvement) => mouvement.type === "Retrait")
        .reduce((total, mouvement) => total + (mouvement.montant || 0), 0);

      mouvementsDeSemaine.push({
        idCaisse: caisse._id,
        nomCaisse: caisse.nom,
        recette: totalRecette,
        depense: totalDepense,
      });
    }
    res.status(200).json(mouvementsDeSemaine);
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la récupération des mouvements de la semaine",
      error,
    });
  }
});
router.get("/all", async (req, res) => {
  try {
    const caisses = await Caisse.find(); // Récupérer toutes les caisses
    res.status(200).json(caisses);
  } catch (error) {
    console.error("Erreur lors de la récupération des caisses :", error);
    res.status(500).json({ message: "Erreur lors de la récupération des caisses", error });
  }
});

// Route pour supprimer une entrée spécifique de l'historique d'une caisse
router.delete("/:caisseId/historique/:historiqueId", async (req, res) => {
  try {
    const { caisseId, historiqueId } = req.params;
    
    // Trouver la caisse par ID
    const caisse = await Caisse.findById(caisseId);
    if (!caisse) return res.status(404).json({ message: "Caisse non trouvée" });

    // Filtrer l'historique pour retirer l'entrée avec l'ID spécifique
    caisse.historique = caisse.historique.filter(
      (mouvement) => mouvement._id.toString() !== historiqueId
    );

    await caisse.save(); // Enregistrer les changements dans la caisse
    res.status(200).json({ message: "Entrée de l'historique supprimée avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'entrée de l'historique :", error);
    res.status(500).json({ message: "Erreur lors de la suppression de l'entrée de l'historique", error });
  }
});

// Routes similaires pour les mouvements du mois et de l’année

module.exports = router;