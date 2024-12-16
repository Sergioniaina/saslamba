// backend/index.js
const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Error connecting to MongoDB:', err));

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./db');
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
const path = require('path');
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/logo', express.static(path.join(__dirname, 'logo')));
app.use('/uploadUser', express.static(path.join(__dirname, 'uploadUser')));
app.use('/default_images', express.static(path.join(__dirname, 'default_images')));
app.use('/machine', express.static(path.join(__dirname, 'machine')));
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
