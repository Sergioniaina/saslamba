const mongoose = require('mongoose');

// Vérifiez si l'URI est bien définie
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("MONGO_URI is not defined in the environment variables!");
  process.exit(1); // Arrêtez le processus si l'URI est manquante
}

let isConnected = false; // Cette variable évite la reconnexion inutile

async function connectDb() {
  if (isConnected) {
    console.log('MongoDB is already connected');
    return;
  }

  try {
    await mongoose.connect(MONGO_URI);  // Plus besoin de passer des options dépréciées
    isConnected = true;
    console.log('MongoDB connected');
  } catch (err) {
    console.log('MongoDB connection error:', err);
  }
}

module.exports = connectDb;
