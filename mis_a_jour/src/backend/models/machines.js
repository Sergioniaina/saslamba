const mongoose = require('mongoose');

const priceRangeSchema = new mongoose.Schema({
  minWeight: {
    type: Number,
    required: true, // Poids minimum de la plage
  },
  maxWeight: {
    type: Number,
    required: true, // Poids maximum de la plage
  },
  price: {
    type: Number,
    required: true, // Prix pour la plage de poids
  },
});


const machineSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Machine à laver', 'Sèche-linge'],
    required: true,
  },
  modelNumber: {
    type: String,
    required: true,
    unique: true,
  },
  powerConsumption: {  // Kilowatt usage
    type: Number,
    required: true,
  },
  weightCapacity: {  // Maximum weight in kilograms that can be handled
    type: Number,
    required: true,
  },
  dateAdded: {
    type: Date,
    default: Date.now,
  },
  etat: {
    type: String,
    enum: ['Disponible', 'Indisponible'],
    default: 'Disponible',
  },
  photo: {
    type: String, // Stocke le chemin de la photo
    required: false,
  },
  priceRanges: {
    type: [priceRangeSchema], // Tableau de plages de prix pour les sèche-linge
    required: function() { return this.type === 'Sèche-linge'; }, // Requis uniquement pour les sèche-linge
  },
});

const Machine = mongoose.model('Machine', machineSchema);

module.exports = Machine;
