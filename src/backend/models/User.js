const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  subRole: {
    type: String,
    enum: ['superAdmin', 'simpleAdmin', 'caissiere', 'magasinier'], // Sous-rôles spécifiques
    default: null,
  },
  photo: {
    type: String, // Stocke le chemin de la photo
    required: false,
  },
});

// Hash the password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next(); // Si le mot de passe n'est pas modifié, pas besoin de le hacher à nouveau
  try {
    const salt = await bcrypt.genSalt(10);  // Générer le "salt"
    this.password = await bcrypt.hash(this.password, salt);  // Hacher le mot de passe
    next();
  } catch (err) {
    return next(err);  // Si erreur, passer l'erreur au middleware suivant
  }
});

// Méthode pour comparer le mot de passe
UserSchema.methods.comparePassword = async function (password) {
  try {
    return await bcrypt.compare(password, this.password);  // Comparer le mot de passe haché
  } catch (err) {
    throw new Error('Error comparing passwords');
  }
};

module.exports = mongoose.model('User', UserSchema);
