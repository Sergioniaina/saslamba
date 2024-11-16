const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  contact: {
    type: String,
    required: true,
  },
});

const Client = mongoose.model('Client', clientSchema);
module.exports = Client;
