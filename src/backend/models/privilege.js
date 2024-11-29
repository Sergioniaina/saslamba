const mongoose = require('mongoose');

const PrivilegeSchema = new mongoose.Schema({
  role: { type: String, required: true },
  subRole: { type: String, required: true },
  permissions: {
    type: Map,
    of: [String],  // Un tableau de chaînes représentant les actions disponibles pour chaque ressource
    required: true
  }
});

module.exports = mongoose.model('Privilege', PrivilegeSchema);
