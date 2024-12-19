    const mongoose = require('mongoose');
    const Counter = require('./Counter'); // Importez le modèle Counter

    const factureSchema = new mongoose.Schema({
    numeroFacture: {
        type: Number,
        unique: true, // Chaque numéro de facture doit être unique
    },
    idClient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true,
    },
    idAbonnementClient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AbonnementClient',
        required: true,
    },
    montant: {
        type: Number,
        required: true,
    },
    montantDonnee: {
        type: Number,
        required: true,
    },
    reste: {
        type: Number,
        required: true,
    },
    dateFacture: {
        type: Date,
        default: Date.now,
    },
    });

    // Middleware pour incrémenter automatiquement le numeroFacture
    factureSchema.pre('save', async function (next) {
    if (!this.isNew) return next(); // Si ce n'est pas une nouvelle facture, ne pas incrémenter

    try {
        const counter = await Counter.findOneAndUpdate(
        { name: 'factureAbonnement' },
        { $inc: { value: 1 } },
        { new: true, upsert: true } // Crée le compteur s'il n'existe pas
        );
        this.numeroFacture = counter.value;
        next();
    } catch (err) {
        next(err);
    }
    });

    const FactureAbonnement = mongoose.model('FactureAbonnement', factureSchema);

    module.exports = FactureAbonnement;
