const mongoose = require('mongoose');

const historiqueSchema = new mongoose.Schema({
  entityType: { type: String, required: true },  // Le type d'entité concernée (Facture, Machine, Produit, etc.)
  entityId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'entityType' },
  user: { type: mongoose.Schema.Types.ObjectId, required: true, ref :'User'}, // ID de l'entité concernée
  action: { type: String, required: true },  // Description de l'action effectuée
  details: { type: String },  // Détails supplémentaires sur l'action
  date: { type: Date, default: Date.now },  // Date de l'événement
  // Optionnel: utilisateur ayant effectué l'action
});

const Historique = mongoose.model('Historique', historiqueSchema);

module.exports = Historique;
