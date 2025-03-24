// models/GlobalTime.js
const mongoose = require('mongoose');

const globalTimeSchema = new mongoose.Schema({
  time: {
    type: Number, // Temps en minutes
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});
module.exports = mongoose.model('GlobalTime', globalTimeSchema);