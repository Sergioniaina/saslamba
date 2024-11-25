const mongoose = require('mongoose');

const caisseSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  type: { type: String, required: true },
  solde: { type: Number, default: 0 },
  dateAjout: { type: Date, default: Date.now },
  dateOuverture: { type: Date, default: null }, // Nouvelle date d'ouverture
  dateFermeture: { type: Date, default: null },
  ouvert: { type: Boolean, default: true },
  fermetures: [{ type: Date }], // Historique des fermetures
  historique: [
    {
      type: { type: String },
      action: { type: String},
      montant: Number,
      date: { type: Date, default: Date.now }
    }
  ],
});

module.exports = mongoose.model('Caisse', caisseSchema);
