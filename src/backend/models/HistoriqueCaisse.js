const mongoose = require('mongoose');
const historiqueSchema = new mongoose.Schema({
    caisse: { type: mongoose.Schema.Types.ObjectId, ref: 'Caisse', required: true },
    type: { type: String },
    action: { type: String },
    montant: { type: Number },
    motif :{type:String},
    date: { type: Date, default: Date.now }
  });
  
  module.exports = mongoose.model('HistoriqueCaisse', historiqueSchema);
  