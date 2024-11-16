// backend/models/Abonnement.js
const mongoose = require('mongoose');

const abonnementSchema = new mongoose.Schema({
  nom: { type: String, required: true }, // Nom de l'offre (Gold, Silver, etc.)
  machines: { type: Number, required: true }, // Nombre de machines
  poids: { type: Number, required: true }, // Poids en kg
  prix: { type: Number, required: true }, // Prix en Ar
  features: { type: [String], required: true }, // Caractéristiques (lavages, séchages, etc.)
  creeLe: { type: Date, default: Date.now }, // Date de création
});

const Abonnement = mongoose.model('Abonnement', abonnementSchema);

module.exports = Abonnement;
