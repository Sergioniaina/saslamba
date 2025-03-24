const express = require("express");
const router = express.Router();
const Payment = require("../models/reabonnement");
const axios = require("axios");
const GlobalTime = require('../models/GlobalTime');
// Configuration de base pour les appels API
const apiConfig = {
    baseURL: "https://creiticpay.creitic.online/api/",
    headers: {
      "X-Security-Code": "122333",
      origin: "https://saslamba.creitic.online",
      "Content-Type": "application/json",
    },
    maxBodyLength: Infinity,
  };
  
  // Vérification des informations et du statut d'un paiement via l'API externe
  const checkPaymentStatus = async (paymentId) => {
    console.log(`Début de la vérification du statut pour ${paymentId} via l'API externe...`);
    try {
      const response = await axios.get(`paiement/?id=${paymentId}`, {
        ...apiConfig,
        timeout: 10000, // Timeout de 5 secondes
      });
      // console.log(`Informations complètes reçues pour ${paymentId}:`, JSON.stringify(response.data));
  
      // Vérifier si la réponse contient un statut (adaptez selon la structure réelle)
      const paymentData = response.data;
      const status = paymentData.status || paymentData.state || paymentData.payment_status;
      if (!status) {
        console.warn(`Aucun champ de statut identifiable trouvé dans la réponse pour ${paymentId}`);
      } else {
        console.log(`Statut extrait pour ${paymentId}: ${status}`);
      }
      return { status, paymentInfo: paymentData }; // Retourne le statut et les infos complètes
    } catch (error) {
      console.error(`Erreur lors de la vérification du statut pour ${paymentId}:`, {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      return { status: null, paymentInfo: null };
    }
  };
  const startGlobalStatusCheck = async () => {
    console.log("Démarrage de la vérification du dernier paiement ajouté...");
  
    // Stocker l'ID de l'intervalle pour pouvoir l'arrêter plus tard
    const intervalId = setInterval(async () => {
      try {
        console.log("Récupération du dernier paiement ajouté depuis la base de données...");
        // Récupérer uniquement le dernier paiement ajouté, trié par _id ou createdAt
        const lastPayment = await Payment.findOne({})
          .sort({ _id: -1 }) // Tri décroissant sur _id pour le dernier ajouté
          .exec();
  
        if (!lastPayment) {
          console.log("Aucun paiement trouvé dans la base.");
          return;
        }
  
        // Vérifier si le statut est "success"
        if (lastPayment.status === "success") {
          console.log(`Le dernier paiement (${lastPayment.paymentId}) est en statut "success". Arrêt de la vérification.`);
          const existingTime = await GlobalTime.findOne({});

        if (!existingTime) {
          // Si aucun document n'existe, créer avec time = 30 directement
          const newTime = await GlobalTime.create({
            time: 30,
            lastUpdated: new Date()
          });
          console.log(`Temps global initialisé à: ${newTime.time} jours`);
        } else {
          // Si un document existe, ajouter 30 jours
          const updatedTime = await GlobalTime.findOneAndUpdate(
            {},
            {
              $inc: { time: 30 },
              $set: { lastUpdated: new Date() }
            },
            { new: true }
          );
          console.log(`Temps global mis à jour: ${updatedTime.time} jours`);
        }
          clearInterval(intervalId); // Arrêter l'intervalle
          return;
        }
  
        // Vérifier si le statut est déjà définitif (autres cas que "success")
        if (["FAILED", "canceled"].includes(lastPayment.status)) {
          console.log(`Le dernier paiement (${lastPayment.paymentId}) a un statut définitif (${lastPayment.status}), aucune vérification nécessaire.`);
          return; // Ne pas arrêter l'intervalle, mais passer au tour suivant
        }
  
        const paymentId = lastPayment.paymentId;
        console.log(`Dernier paiement ajouté trouvé : ${paymentId}`);
  
        const { status, paymentInfo } = await checkPaymentStatus(paymentId);
  
        if (!status || !paymentInfo) {
          console.log(`Statut non récupéré pour ${paymentId}, nouvelle tentative au prochain intervalle.`);
          return;
        }
  
        if (lastPayment.status !== status) {
          console.log(`Le statut a changé pour ${paymentId} : ancien=${lastPayment.status}, nouveau=${status}`);
          const updatedPayment = await Payment.findOneAndUpdate(
            { paymentId },
            { status },
            { new: true }
          );
          console.log(`Mise à jour réussie dans la base pour ${paymentId}:`, updatedPayment);
  
          // Si le nouveau statut est "success", arrêter l'intervalle
          if (status === "success") {
            console.log(`Statut mis à "success" pour ${paymentId}. Arrêt de la vérification.`);
          
            const existingTime = await GlobalTime.findOne({});
          
            if (!existingTime) {
              // Si aucun document n'existe, créer avec time = 30 directement
              const newTime = await GlobalTime.create({
                time: 30,
                lastUpdated: new Date()
              });
              console.log(`Temps global initialisé à: ${newTime.time} jours`);
            } else {
              // Si un document existe, ajouter 30 jours
              const updatedTime = await GlobalTime.findOneAndUpdate(
                {},
                {
                  $inc: { time: 30 },
                  $set: { lastUpdated: new Date() }
                },
                { new: true }
              );
              console.log(`Temps global mis à jour: ${updatedTime.time} jours`);s
            }
          console.log(`Temps global mis à jour: ${updatedTime.time} jours`);
            clearInterval(intervalId);
          }
        } else {
          console.log(`Statut inchangé pour ${paymentId} : ${status}`);
        }
      } catch (error) {
        console.error("Erreur dans la vérification du dernier paiement:", {
          message: error.message,
          stack: error.stack,
        });
      }
    }, 10000); // Vérification toutes les 10 secondes
  
    // Retourner l'intervalId si besoin d'arrêter manuellement depuis l'extérieur
    return intervalId;
  };
  // const startGlobalTimeDecrement = async () => {
  //   console.log("Démarrage de la décrémentation automatique du temps global...");
  
  //   const decrementIntervalId = setInterval(async () => {
  //     try {
  //       const currentTime = await GlobalTime.findOne({});
  
  //       if (!currentTime) {
  //         console.log("Aucun temps global trouvé, pas de décrémentation.");
  //         return;
  //       }
  
  //       if (currentTime.time <= 0) {
  //         console.log("Temps global déjà à 0, pas de décrémentation supplémentaire.");
  //         return;
  //       }
  
  //       const updatedTime = await GlobalTime.findOneAndUpdate(
  //         {},
  //         {
  //           $inc: { time: -1 }, // Décrémente de 1 minute
  //           $set: { lastUpdated: new Date() }
  //         },
  //         { new: true }
  //       );
  
  //       console.log(`Temps global décrémenté: ${updatedTime.time} jours restantes`);
  
  //       if (updatedTime.time <= 0) {
  //         console.log("Temps global atteint 0, arrêt de la décrémentation.");
  //         clearInterval(decrementIntervalId);
  //       }
  //     } catch (error) {
  //       console.error("Erreur dans la décrémentation du temps global:", {
  //         message: error.message,
  //         stack: error.stack,
  //       });
  //     }
  //   }, 60000); // Toutes les 60 secondes
  
  //   return decrementIntervalId; // Pour pouvoir arrêter manuellement si besoin
  // };
  const startGlobalTimeDecrement = async () => {
    console.log("Démarrage de la décrémentation automatique du temps global basée sur la date...");
  
    const decrementIntervalId = setInterval(async () => {
      try {
        const currentTime = await GlobalTime.findOne({});
  
        if (!currentTime) {
          console.log("Aucun temps global trouvé, pas de décrémentation.");
          return;
        }
  
        if (currentTime.time <= 0) {
          console.log("Temps global déjà à 0, pas de décrémentation supplémentaire.");
          clearInterval(decrementIntervalId);
          return;
        }
  
        // Calculer la différence entre la date actuelle et lastUpdated en jours
        const now = new Date();
        const lastUpdated = new Date(currentTime.lastUpdated);
        const timeDifferenceMs = now - lastUpdated; // Différence en millisecondes
        const daysDifference = Math.floor(timeDifferenceMs / (1000 * 60 * 60 * 24)); // Convertir en jours entiers
  
        if (daysDifference > 0) {
          // Décrémenter time par le nombre de jours écoulés
          const newTimeValue = Math.max(0, currentTime.time - daysDifference); // Ne pas descendre en dessous de 0
  
          const updatedTime = await GlobalTime.findOneAndUpdate(
            {},
            {
              $set: {
                time: newTimeValue,
                lastUpdated: now // Mettre à jour lastUpdated à la date actuelle
              }
            },
            { new: true }
          );
  
          console.log(`Temps global mis à jour: ${updatedTime.time} jours restantes (décrementé de ${daysDifference} jours)`);
  
          if (updatedTime.time <= 0) {
            console.log("Temps global atteint 0, arrêt de la décrémentation.");
            clearInterval(decrementIntervalId);
          }
        } else {
          console.log(`Aucune décrémentation nécessaire, différence de jours: ${daysDifference}`);
        }
      } catch (error) {
        console.error("Erreur dans la décrémentation du temps global:", {
          message: error.message,
          stack: error.stack,
        });
      }
    }, 360000); // Vérification toutes les 60 secondes
  
    return decrementIntervalId; // Pour arrêter manuellement si besoin
  };
  // Lancer la vérification globale
  // startGlobalStatusCheck();
  startGlobalTimeDecrement();
// POST - Créer un paiement
router.post("/", async (req, res) => {
  try {
    const { client_name, client_email, client_telephone, amount } = req.body;

    if (!client_name || !client_email || !client_telephone || !amount) {
      return res
        .status(400)
        .json({
          error:
            "Tous les champs (client_name, client_email, client_telephone, amount) sont obligatoires",
        });
    }
    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res
        .status(400)
        .json({ error: "Le montant doit être un nombre positif" });
    }

    const timestamp = Date.now().toString();
    const reference = `REF-${timestamp}`;
    if (!reference || reference.length > 20) {
      return res
        .status(400)
        .json({
          error: "La référence générée est invalide ou dépasse 20 caractères",
        });
    }

    const config = {
      method: "post",
      url: "https://creiticpay.creitic.online/api/paiement/",
      headers: {
        "X-Security-Code": "122333",
        origin: "https://saslamba.creitic.online",
        "Content-Type": "application/json",
      },
      data: {
        appcode: "creitic",
        client_name,
        client_email,
        client_telephone,
        amount: parsedAmount,
        reference,
      },
    };

    console.log("Données envoyées à l'API:", config.data);
    const apiResponse = await axios.request(config);
    const responseData = apiResponse.data;
    console.log("Réponse de l'API:", responseData);

    const payment = new Payment({
      amount: responseData.amount || parsedAmount,
      status: responseData.status || "INITIATED",
      reference: responseData.reference || reference,
      paymentId: responseData.id,
      client_name,
      client_email,
      client_telephone,
    });

    const savedPayment = await payment.save();
    startGlobalStatusCheck();
    // Pas de startStatusCheck ici, la vérification globale s'en charge
    res.status(201).json(savedPayment);
  } catch (error) {
    console.error("Erreur lors de la création du paiement:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || error.message,
    });
  }
});

// GET - Récupérer tous les paiements
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = status ? { status } : {};
    const payments = await Payment.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    const total = await Payment.countDocuments(query);

    res.json({
      payments,
      total,
      currentPage: page * 1,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des paiements:",
      error.message
    );
    res.status(500).json({ error: error.message });
  }
});
// server.js (exemple)
router.get('/last-payment-status', async (req, res) => {
  try {
    const lastPayment = await Payment.findOne({})
      .sort({ _id: -1 }) // Dernier paiement basé sur _id
      .exec();
    
    if (!lastPayment) {
      return res.status(404).json({ message: 'Aucun paiement trouvé' });
    }
    
    res.json({ 
      status: lastPayment.status,
      createdAt: lastPayment.createdAt 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});


// GET - Récupérer un paiement par ID
// router.get('/:id', async (req, res) => {
//     try {
//         const payment = await Payment.findOne({ paymentId: req.params.id });
//         if (!payment) {
//             return res.status(404).json({ error: 'Paiement non trouvé' });
//         }
//         res.json(payment);
//     } catch (error) {
//         console.error('Erreur lors de la récupération du paiement:', error.message);
//         res.status(500).json({ error: error.message });
//     }
// });

router.get("/:id", async (req, res) => {
  try {
    const paymentId = req.params.id;
    const config = {
      method: "get",
      maxBodyLength: Infinity,
      url: `https://creiticpay.creitic.online/api/paiement/?id=${paymentId}`, // Ajout de l'ID dans la query string
      headers: {
        "X-Security-Code": "122333",
        origin: "https://saslamba.creitic.online",
      },
    };

    const response = await axios.request(config);
    // console.log(`Données reçues de l'API pour ${paymentId}:`, JSON.stringify(response.data));

    // Vérifie si une réponse valide est renvoyée
    if (!response.data) {
      return res
        .status(404)
        .json({ error: "Paiement non trouvé via l'API externe" });
    }

    res.json(response.data); // Renvoie directement les données de l'API externe
  } catch (error) {
    console.error(
      `Erreur lors de la récupération du paiement ${req.params.id}:`,
      {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      }
    );
    res.status(error.response?.status || 500).json({
      error:
        error.response?.data?.error ||
        "Erreur lors de la récupération du paiement via l'API externe",
    });
  }
});
// PATCH - Mettre à jour un paiement
router.patch("/:id", async (req, res) => {
  try {
    const allowedUpdates = [
      "status",
      "amount",
      "client_name",
      "client_email",
      "client_telephone",
    ];
    const updates = Object.keys(req.body);
    const isValidUpdate = updates.every((update) =>
      allowedUpdates.includes(update)
    );

    if (!isValidUpdate) {
      return res
        .status(400)
        .json({
          error:
            "Mise à jour invalide: seuls status, amount, client_name, client_email et client_telephone sont modifiables",
        });
    }

    const payment = await Payment.findOneAndUpdate(
      { paymentId: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!payment) {
      return res.status(404).json({ error: "Paiement non trouvé" });
    }
    res.json(payment);
  } catch (error) {
    console.error("Erreur lors de la mise à jour du paiement:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// DELETE - Supprimer un paiement
router.delete("/:id", async (req, res) => {
  try {
    const payment = await Payment.findOneAndDelete({
      paymentId: req.params.id,
    });
    if (!payment) {
      return res.status(404).json({ error: "Paiement non trouvé" });
    }
    res.json({
      message: "Paiement supprimé avec succès",
      deletedPayment: payment,
    });
  } catch (error) {
    console.error("Erreur lors de la suppression du paiement:", error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
