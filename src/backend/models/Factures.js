const mongoose = require('mongoose');

// Fonction pour générer une référence unique
async function generateUniqueReference() {
  let reference;
  do {
    reference = 'PAY-00' + Math.random().toString(36).substr(2, 9).toUpperCase();
  } while (await Facture.findOne({ reference })); // Vérifie si la référence existe déjà
  return reference;
}

const factureSchema = new mongoose.Schema({
  reference: {
    type: String,
    unique: true,  // S'assurer que chaque référence est unique
  },
  customerName: {
    type: String,
    required: true,
  },
  contact : {
    type: String,
    required: true,
  },
  machines: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Machine',
    required: true,
  }],
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  }],
  articles: [{
    articleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Article', required: true },
    machineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Machine', required: true }
  }],
  totalWeight: {
    type: Number,
    required: true,
  },
  totalPrice: {
    type: Number,
    required: true,
  },
  reste: {
    type: Number,
    required: true,
  },
  serviceType: {
    type: String,
    enum: ['Lavage', 'Séchage', 'Lavage + Séchage','produit'],
    required: true,
  },
  machineWeights: [{
    machineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Machine' },
    weight: Number
  }],
  quantities: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: Number
  }],
  articleDetails: [{
    articleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Article', required: true },
    machineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Machine', required: true },
    type: { type: String, required: true },
    prices: [{
      priceType: { type: String, required: true },
      value: { type: Number, required: true }
    }]
  }],
  estPaye: {
    type: Boolean,
    default: false,
  },
  etat: {
    type: String,
    enum: ['en attente', 'encaisser','annulée'],
    default: 'encaisser',
  },
  ticketNumber: { type: Number, required: true },
  historique: [{
    action: { type: String, required: true },
    date: {
      type: Date,
      default: Date.now,
    },
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Middleware pour générer une référence unique avant la création
factureSchema.pre('save', async function(next) {
  if (!this.reference) {
    this.reference = await generateUniqueReference();
  }
  next();
});

const Facture = mongoose.model('Facture', factureSchema);

module.exports = Facture;
