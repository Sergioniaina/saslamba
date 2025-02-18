const mongoose = require('mongoose');
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const User = require('./models/User'); // Import du modèle User

const app = express();

app.use(cors());
app.use(bodyParser.json());

// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    await createDefaultUser(); // Créer l'utilisateur admin si nécessaire
  })
  .catch(err => console.error('Error connecting to MongoDB:', err));

// 📌 Fonction pour créer un utilisateur admin par défaut
async function createDefaultUser() {
  try {
    const existingUser = await User.findOne({ name: 'creitic' });

    if (existingUser) {
      console.log('Utilisateur creitic existe déjà.');
      return;
    }

    const defaultUser = new User({
      name: 'creitic',
      password: 'creitic123', // ⚠️ Change ce mot de passe après installation !
      role: 'admin',
      subRole: 'superAdmin',
      photo: '',
    });

    await defaultUser.save();
    console.log('Utilisateur admin créé avec succès.');
  } catch (error) {
    console.error('Erreur lors de la création de l’utilisateur admin:', error);
  }
}

// 📌 Routes & fichiers statiques
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/logo', express.static(path.join(__dirname, 'logo')));
app.use('/uploadUser', express.static(path.join(__dirname, 'uploadUser')));
app.use('/default_images', express.static(path.join(__dirname, 'default_images')));
app.use('/machine', express.static(path.join(__dirname, 'machine')));

const productsRoutes = require('./routes/machineRoutes');
const machinesRoutes = require('./routes/machinesRouter');
const abonnement = require('./routes/abonnementsRoutes');
const factures = require('./routes/Factures');
const client = require('./routes/Client');
const historique = require('./routes/Historique');
const abonnementRoutes = require('./routes/abonnements');
const abonnementClient = require('./routes/AbonnementClient');
const payement = require('./routes/Payement');
const caisse = require('./routes/Caisse');
const mouvementCaisseRoutes = require('./routes/mouvementCaisse');
const authRoutes = require('./routes/authRoutes');
const articleRoutes = require('./routes/article');
const logoRoutes = require('./routes/companyInfo');
const privilege = require('./routes/privilegeRoute');
const historiqueCaisse = require('./routes/HistoriqueCaisse');
const historiqueProduct = require('./routes/productHistory');
const factureAbonnement = require('./routes/factureAbonnement');

app.use('/api/products', productsRoutes);
app.use('/api/machines', machinesRoutes);
app.use('/api/subscriptions', abonnement);
app.use('/api/factures', factures);
app.use('/api/clients', client);
app.use('/api/historique', historique);
app.use('/api/company-info', logoRoutes);
app.use('/api/abonnements', abonnementRoutes);
app.use('/api/abonnementClient', abonnementClient);
app.use('/api/payement', payement);
app.use('/api/caisses', caisse);
app.use('/api/mouvements', mouvementCaisseRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/historiques', historiqueCaisse);
app.use('/api/privileges', privilege);
app.use('/api/product-history', historiqueProduct);
app.use('/api/factureAbonnement', factureAbonnement);

// 📌 Lancer le serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
