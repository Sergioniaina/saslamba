// models/CompanyInfo.js
const mongoose = require('mongoose');

const companyInfoSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  photo: {
    type: String, // URL de la photo ou chemin local
  },
}, { timestamps: true });

module.exports = mongoose.model('CompanyInfo', companyInfoSchema);
