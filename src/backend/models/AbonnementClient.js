// backend/models/AbonnementClient.js
const mongoose = require('mongoose');

const abonnementDetail = new mongoose.Schema({
  weight: {
    type: Number, // Quantité d'abonnement en termes de poids
    required: true,
  },
  features: {
    type: [String], // Liste des caractéristiques ou services offerts par l'abonnement (par exemple : séchage, repassage)
    required: true,
  },
  lavage:{
    total: {
      type: Number, // Nombre total de lavage inclus dans l'abonnement
      default : null
    },
    used: {
      type: Number, // Nombre de lavage déjà utilisés
      default: 0,
    },
    weeklyLimit: {
      type: Number, // Limite de lavage par semaine
      default : null
    },
    reste: {
      type: Number, // Limite de lavage par semaine
      default : null
    },
  },
 sechage: {
    total: {
      type: Number, // Nombre total de séchages inclus dans l'abonnement
      default : null
    },
    used: {
      type: Number, // Nombre de séchages déjà utilisés
      default: 0,
    },
    weeklyLimit: {
      type: Number, // Limite de séchages par semaine
      default : null
    },
    reste: {
      type: Number, // Limite de séchages par semaine
      default : null
    },
  },
});

const abonnementClientSchema = new mongoose.Schema({
  idClient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client', // Référence à l'ID du modèle Client
    required: true,
  },
  idAbonnement: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Abonnement', // Référence à l'ID du modèle Abonnement
    required: true,
  },
  dateAbonnement: {
    type: Date,
    default: Date.now, // Date de l'abonnement
  },
  abonnementDetails: {
    type: abonnementDetail, // Détails de l'abonnement
    required: true,
  }
});

const AbonnementClient = mongoose.model('AbonnementClient', abonnementClientSchema);

module.exports = AbonnementClient;
