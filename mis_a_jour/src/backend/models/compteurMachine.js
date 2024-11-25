const mongoose = require('mongoose');

const CompteurSchema = new mongoose.Schema({
  machineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Machine', required: true },
  startTime: { type: Date, required: true }, // Date où le compteur a démarré
  endTime: { type: Date }, // Date où le compteur s'arrête, si disponible
  kilowattHours: { type: Number, default: 0 }, // La consommation en kWh
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Compteur', CompteurSchema);
