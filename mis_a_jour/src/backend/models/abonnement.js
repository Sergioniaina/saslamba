// backend/models/Subscription.js
const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  type: { type: String, required: true },
  machines: { type: Number, required: true },
  weight: { type: Number, required: true },
  price: { type: Number, required: true },
  clientId : { type: String, required: true },
  features: { type: [String], required: true },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;
