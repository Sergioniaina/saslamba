const mongoose = require('mongoose');

const mouvementCaisseSchema = new mongoose.Schema({
  idCaisse: { type: mongoose.Schema.Types.ObjectId, ref: 'Caisse', required: true },
  recette: { type: Number, default: 0 },
  depense: { type: Number, default: 0 },
  dateOuverture: { type: Date, required: true }, // Date d'ouverture
  dateFermeture: { type: Date, required: true }, // Date de fermeture
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MouvementCaisse', mouvementCaisseSchema);
