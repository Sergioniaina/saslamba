const mongoose = require('mongoose');

const priceSchema = new mongoose.Schema({
  priceType: { type: String, required: true },
  value: { type: Number, required: true }
});

const articleSchema = new mongoose.Schema({
  type: { type: String, required: true },
  prices: [priceSchema] // Tableau d'objets { priceType, value }
});
module.exports = mongoose.model('Article', articleSchema);
