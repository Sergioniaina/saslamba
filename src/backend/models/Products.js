const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  description: String,
  date: { type: Date, default: Date.now },
  stock: {
    type: Number,
    required: true,
    min: 0,
  },
  photo: {
    type: String, // Stocke le chemin de la photo
    required: false,
  },
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
