const mongoose = require('mongoose');

const productHistorySchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product', // Référence au modèle Product
    required: true,
  },
  date: {
    type: Date,
    default: Date.now, // Date de l'événement
  },
  stockChange: {
    type: Number, // Quantité de stock dépensée ou ajoutée
    required: true,
  },
  remainingStock: {
    type: Number, // Stock restant après la mise à jour
    required: true,
  },
  totalSpent: {
    type: Number, // Montant total dépensé à ce jour
    required: false,
  },
  type: {
    type: String,
    enum: ['deduction', 'addition'], // Type d'opération : 'deduction' ou 'addition'
    required: true,
  },
});

const ProductHistory = mongoose.model('ProductHistory', productHistorySchema);
module.exports = ProductHistory;
