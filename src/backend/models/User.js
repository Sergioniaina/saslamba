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
    enum: ['superAdmin', 'simpleAdmin', 'caissiere', 'magasinier', null], // Sous-rôles spécifiques
    default: null,
  },
  photo: {
    type: String, // Stocke le chemin de la photo
    required: false,
  },
});

// Hash the password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
UserSchema.methods.comparePassword = async function (password) {
  const match = await bcrypt.compare(password, this.password);
  console.log('Password match:', match); // Log pour vérifier si le mot de passe correspond
  return match;
};

module.exports = mongoose.model('User', UserSchema);
