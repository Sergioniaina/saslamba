const mongoose = require("mongoose");

// Fonction pour générer une référence unique
function generateReference() {
  return "PAY-00" + Math.random().toString(36).substr(2, 9).toUpperCase();
}

// Définition du schéma Payment avec historique et référence à une facture
const paymentSchema = new mongoose.Schema({
  reference: {
    type: String,
    default: generateReference, // Génération automatique de la référence
    unique: true, // S'assurer que chaque référence est unique
  },
  type: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now, // Par défaut, la date actuelle
  },
  historique: [
    {
      action: {
        type: String,
        required: true, // L'action est obligatoire dans l'historique
      },
      montant: {
        type: Number,
        required: true,
      },
      user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User",
      },
      caisse: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "Caisse",
      },
      date: {
        type: Date,
        default: Date.now, // La date de l'action par défaut est la date actuelle
      },
    },
  ],
  facture: {
    type: mongoose.Schema.Types.ObjectId, // Référence à une autre collection
    ref: "Facture", // Le modèle de la collection 'Facture'
    required: true, // Le champ facture est obligatoire
  },
});

// Créer le modèle Payment
const Payment = mongoose.model("Payment", paymentSchema);

module.exports = Payment;
