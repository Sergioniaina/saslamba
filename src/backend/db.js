// backend/db.js
const mongoose = require('mongoose');

// Connexion à MongoDB en utilisant l'adresse IPv4
mongoose.connect('mongodb://127.0.0.1:27017/lamba');

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

module.exports = db;
