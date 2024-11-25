const mongoose = require('mongoose');

// Fonction pour générer une référence unique
function generateReference() {
  return 'PAY-00' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

const factureSchema = new mongoose.Schema({
  reference: {
    type: String,
    default: generateReference,  // Génération automatique de la référence
    unique: true,                // S'assurer que chaque référence est unique
  },
  customerName: {
    type: String,
    required: true,
  },
  machines: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Machine',
    required: true,
  }],
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  }],
  articles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Article',
    required: true,
  }],
  totalWeight: {
    type: Number,
    required: true,
  },
  totalPrice: {
    type: Number,
    required: true,
  },
  reste:{
    type: Number,
    required: true,
  },
  serviceType: {
    type: String,
    enum: ['Lavage', 'Séchage', 'Lavage + Séchage'],
    required: true,
  },
  machineWeights: [{
    machineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Machine' },
    weight: Number
  }],
  quantities: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: Number
  }],
  articleDetails: [{
    articleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Article', required: true },
    type: { type: String, required: true },
    prices: [{
      priceType: { type: String, required: true },  // Chaîne de caractères
      value: { type: Number, required: true }        // Nombre
    }]
  }],
  estPaye: {
    type: Boolean,
    default: false,
  },
  etat: {
    type: String,
    enum: ['en attente', 'encaisser'],
    default: 'encaisser',
  },
  ticketNumber: { type: Number, required: true },
  historique: [{
    action: { type: String, required: true },
    date: {
      type: Date,
      default: Date.now,
    },
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },

});

const Facture = mongoose.model('Facture', factureSchema);

module.exports = Facture;
// nnnnnnnnnnnnnnn
const express = require('express');
const router = express.Router();
const Facture = require('../models/Factures');
const Machine = require('../models/machines');
const Product = require('../models/Products');
const Client = require('../models/client'); 
const Historique = require('../models/Historique');
const Article = require('../models/article');
const mongoose = require('mongoose');
const Compteur = require('../models/compteurMachine')
// Créer une nouvelle facture
// routes/factures.js

router.post('/', async (req, res) => {
  const { customerName, machines, products, articles, totalWeight, totalPrice,reste, serviceType, quantities, articleDetails, etat, machineWeights } = req.body;
  console.log('Request Body:', req.body);

  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0)); // Début de la journée
  const endOfDay = new Date(today.setHours(23, 59, 59, 999)); // Fin de la journée

  try {
    const selectedMachines = []
    const selectedProducts = []
    const selectedArticles = await Article.find({ _id: { $in: articles } });
    let totalWeightAssigned = 0;
    // Validation des détails des articles
    const isValidArticleDetails = Array.isArray(articleDetails) &&
      articleDetails.every(detail => 
        mongoose.Types.ObjectId.isValid(detail.articleId) &&
        typeof detail.type === 'string' &&
        Array.isArray(detail.prices) &&
        detail.prices.every(price => 
          typeof price.priceType === 'string' && 
          typeof price.value === 'number'
        )
      );

    if (!isValidArticleDetails) {
      return res.status(400).json({ error: 'Détails des articles invalide.' });
    }

    const ticketCountToday = await Facture.countDocuments({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });

    const ticketNumber = ticketCountToday + 1; // Incrémenter le numéro de ticket

    // Filtrer les prix pour chaque type d'article
    const filteredArticleDetails = articleDetails.map(detail => {
      const article = selectedArticles.find(a => a._id.toString() === detail.articleId);
      if (!article) return null;

      // Trouver les prix pour le type d'article correspondant
      const prices = detail.prices.filter(price => article.type === detail.type);
      return {
        articleId: article._id,
        type: article.type,
        prices: prices // Conserver les prix associés
      };
    }).filter(detail => detail && detail.prices.length > 0); // S'assurer qu'il y a des prix associés

    // Vérifier les machines disponibles et la capacité
    for (let machineId of machines) {
      const machine = await Machine.findById(machineId);
      if (!machine || machine.etat !== 'Disponible') {
        return res.status(400).json({ error: `Machine ${machineId} non disponible ou non trouvée.` });
      }
      
      const weightForMachine = parseFloat(machineWeights[machineId]) || 0;
      if (weightForMachine > machine.weightCapacity) {
        return res.status(400).json({ error: `Poids pour la machine ${machineId} dépasse sa capacité.` });
      }
      
      totalWeightAssigned += weightForMachine;
      selectedMachines.push(machine);
    }
    // Vérifier les machines requises selon le service
    const hasLavageMachine = selectedMachines.some(machine => machine.type === 'Machine à laver');
    const hasSéchageMachine = selectedMachines.some(machine => machine.type === 'Sèche-linge');

    if (serviceType === 'Lavage' && !hasLavageMachine) {
      return res.status(400).json({ error: 'Une machine de lavage est requise pour le service de Lavage.' });
    }

    if (serviceType === 'Séchage' && !hasSéchageMachine) {
      return res.status(400).json({ error: 'Une machine de séchage est requise pour le service de Séchage.' });
    }

    if (serviceType === 'Lavage + Séchage' && (!hasLavageMachine || !hasSéchageMachine)) {
      return res.status(400).json({ error: 'Une machine de lavage et une machine de séchage sont requises pour le service Lavage + Séchage.' });
    }

    // Vérifier la disponibilité des produits et calculer le prix
    for (let productId of products) {
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(400).json({ error: `Produit ${productId} non trouvé.` });
      }

      const requestedQuantity = quantities[productId];
      if (requestedQuantity > product.stock) {
        return res.status(400).json({ error: `Quantité demandée pour le produit ${productId} dépasse le stock disponible.` });
      }

      selectedProducts.push(product);
    }

    // Créer la facture
    const newFacture = new Facture({
      customerName,
      machines: selectedMachines.map(m => m._id),
      products: selectedProducts.map(p => p._id),
      articles: selectedArticles.map(a => a._id),
      totalWeight,
      totalPrice,
      reste,
      serviceType,
      historique: [
        { action: 'Facture créée' },
        { action: `Machines sélectionnées: ${selectedMachines.map(m => m.modelNumber).join(', ')}` },
        { action: `Produits sélectionnés: ${selectedProducts.map(p => p.name).join(', ')}` },
        { action: `Articles sélectionnés: ${selectedArticles.map(a => a.type).join(', ')}` }
      ],
      machineWeights: selectedMachines.map(machine => ({
        machineId: machine._id,
        weight: machineWeights[machine._id] || 0
      })),
      quantities: selectedProducts.map(product => ({
        productId: product._id,
        quantity: quantities[product._id] || 0
      })),
      articleDetails: filteredArticleDetails, // Utiliser les détails d'articles filtrés
      etat,
      ticketNumber
    });

    await newFacture.save();
    await Historique.create({
      entityType: 'Facture',
      entityId: newFacture._id,
      action: 'Facture créée',
      details: `Machines: ${selectedMachines.map(m => m.modelNumber).join(', ')}, Produits: ${selectedProducts.map(p => p.name).join(', ')},
       Poids par machine: ${JSON.stringify(machineWeights)},
       quantités pas produits : ${JSON.stringify(quantities)},Détails des articles: ${JSON.stringify(filteredArticleDetails)}`,
    });

     if (etat !== 'en attente') {
      for (let machine of selectedMachines) {
        // Trouver le compteur actif pour la machine
        const compteur = await Compteur.findOne({ machineId: machine._id, endTime: null });
        if (compteur) {
          // Mettre à jour le compteur existant
          const endTime = new Date();
          const durationHours = (endTime - compteur.startTime) / (1000 * 60 * 60); // Durée en heures
          compteur.endTime = endTime;
          compteur.kilowattHours += durationHours * machine.powerConsumption; // Ajouter la consommation
          await compteur.save();
        } else {
          // Créer un nouveau compteur si aucun compteur actif n'existe
          await Compteur.create({
            machineId: machine._id,
            startTime: new Date(),
            kilowattHours: 0, // Initialiser à 0, calculé à la libération de la machine
            endTime: null // Fin sera définie lors de la libération
          });
        }

        // Mettre à jour l'état de la machine à 'Indisponible'
        machine.etat = 'Indisponible';
        await machine.save();
      }
    }

    // Mettre à jour le stock des produits
    for (let productId of products) {
      const requestedQuantity = quantities[productId];
      await Product.findByIdAndUpdate(productId, { $inc: { stock: -requestedQuantity } });
    }
    res.status(201).json(newFacture);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  const factureId = req.params.id;
  const { customerName, machines, products,articles, totalWeight, totalPrice,reste, serviceType, quantities,articleDetails, etat, machineWeights } = req.body;

  console.log('Update Request:', req.body);

  try {
    const existingFacture = await Facture.findById(factureId);
    if (!existingFacture) {
      return res.status(404).json({ error: 'Facture non trouvée.' });
    }

    const selectedMachines = [];
    const selectedProducts = [];
    const selectedArticles = await Article.find({ _id: { $in: articles } });
    let totalWeightAssigned = 0;

    const isValidArticleDetails = Array.isArray(articleDetails) &&
      articleDetails.every(detail => 
        mongoose.Types.ObjectId.isValid(detail.articleId) &&
        typeof detail.type === 'string' &&
        Array.isArray(detail.prices) &&
        detail.prices.every(price => 
          typeof price.priceType === 'string' && 
          typeof price.value === 'number'
        )
      );

    if (!isValidArticleDetails) {
      return res.status(400).json({ error: 'Détails des articles invalide.' });
    }

    // Filtrer les prix pour chaque type d'article
    const filteredArticleDetails = articleDetails.map(detail => {
      const article = selectedArticles.find(a => a._id.toString() === detail.articleId);
      if (!article) return null;

      // Trouver les prix pour le type d'article correspondant
      const prices = detail.prices.filter(price => article.type === detail.type);
      return {
        articleId: article._id,
        type: article.type,
        prices: prices // Conserver les prix associés
      };
    }).filter(detail => detail && detail.prices.length > 0);
    // Vérifier les machines disponibles et la capacité
    for (let machineId of machines) {
      const machine = await Machine.findById(machineId);
      if (!machine || machine.etat !== 'Disponible') {
        return res.status(400).json({ error: `Machine ${machineId} non disponible ou non trouvée.` });
      }
      
      const weightForMachine = parseFloat(machineWeights[machineId]) || 0;
      if (weightForMachine > machine.weightCapacity) {
        return res.status(400).json({ error: `Poids pour la machine ${machineId} dépasse sa capacité.` });
      }
      
      totalWeightAssigned += weightForMachine;
      selectedMachines.push(machine);
    }

    // // Vérifier si la somme des poids est correcte
    // if (totalWeightAssigned !== parseFloat(totalWeight)) {
    //   return res.status(400).json({ error: 'Le poids total ne correspond pas à la somme des poids des machines.' });
    // }
    // Vérifier les machines requises selon le service
    const hasLavageMachine = selectedMachines.some(machine => machine.type === 'Machine à laver');
    const hasSéchageMachine = selectedMachines.some(machine => machine.type === 'Sèche-linge');

    if (serviceType === 'Lavage' && !hasLavageMachine) {
      return res.status(400).json({ error: 'Une machine de lavage est requise pour le service de Lavage.' });
    }

    if (serviceType === 'Séchage' && !hasSéchageMachine) {
      return res.status(400).json({ error: 'Une machine de séchage est requise pour le service de Séchage.' });
    }

    if (serviceType === 'Lavage + Séchage' && (!hasLavageMachine || !hasSéchageMachine)) {
      return res.status(400).json({ error: 'Une machine de lavage et une machine de séchage sont requises pour le service Lavage + Séchage.' });
    }

    // Vérifier la disponibilité des produits et calculer le prix
    for (let productId of products) {
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(400).json({ error: `Produit ${productId} non trouvé.` });
      }

      const requestedQuantity = quantities[productId] || 0;
      if (requestedQuantity > product.stock) {
        return res.status(400).json({ error: `Quantité demandée pour le produit ${productId} dépasse le stock disponible.` });
      }

      // totalPrice += product.price * requestedQuantity;
      selectedProducts.push(product);
    }

    // totalPrice += totalWeight * 2; // Exemple de calcul

    // Calculer les ajustements de stock
    const adjustments = {};
    for (const productId of existingFacture.products) {
      const oldQuantity = existingFacture.quantities.find(q => q.productId.equals(productId))?.quantity || 0;
      const newQuantity = quantities[productId] || 0;

      if (oldQuantity !== newQuantity) {
        const product = await Product.findById(productId);
        if (!product) {
          return res.status(400).json({ error: `Produit ${productId} non trouvé.` });
        }

        if (newQuantity > oldQuantity) {
          // Augmentation
          const stockNeeded = newQuantity - oldQuantity;
          if (product.stock < stockNeeded) {
            return res.status(400).json({ error: `Stock insuffisant pour le produit ${productId}.` });
          }
          adjustments[productId] = -stockNeeded;
        } else {
          // Réduction
          const stockToAdd = oldQuantity - newQuantity;
          adjustments[productId] = stockToAdd;
        }
      }
    }

    // Appliquer les ajustements de stock
    for (const [productId, adjustment] of Object.entries(adjustments)) {
      await Product.findByIdAndUpdate(productId, { $inc: { stock: adjustment } });
    }

    // Mettre à jour la facture
    existingFacture.customerName = customerName;
    existingFacture.machines = selectedMachines.map(m => m._id);
    existingFacture.products = selectedProducts.map(p => p._id);
    existingFacture.articles = selectedArticles.map(a => a._id);
    existingFacture.totalWeight = totalWeight;
    existingFacture.totalPrice = totalPrice;
    existingFacture.reste = reste,
    existingFacture.serviceType = serviceType;
    existingFacture.etat = etat;
    existingFacture.machineWeights = selectedMachines.map(machine => ({
      machineId: machine._id,
      weight: machineWeights[machine._id] || 0
    }));
    existingFacture.quantities = selectedProducts.map(product => ({
      productId: product._id,
      quantity: quantities[product._id] || 0
    }));
    existingFacture.articleDetails = filteredArticleDetails;
    existingFacture.historique.push({ action: 'Facture mise à jour', 
      details: `Poids réparti: ${JSON.stringify(machineWeights)}, quantités par produit : ${JSON.stringify(quantities)}`});
      if (existingFacture.etat === 'en attente' && etat === 'en attente') {
        // Pas de mise à jour du compteur
        console.log('Aucune mise à jour du compteur, état reste en attente.');
      } else if ((existingFacture.etat === 'en attente' && etat === 'encaisser') || (existingFacture.etat === 'encaisser' && etat === 'encaisser')) {
        for (let machine of selectedMachines) {
          console.log(' compteur debité, état change en encaisse.');
          // Trouver le compteur actif pour la machine
          const compteur = await Compteur.findOne({ machineId: machine._id, endTime: null });
          if (compteur) {
            // Mettre à jour le compteur existant
            const endTime = new Date();
            const durationHours = (endTime - compteur.startTime) / (1000 * 60 * 60); // Durée en heures
            compteur.endTime = endTime;
            compteur.kilowattHours += durationHours * machine.powerConsumption; // Ajouter la consommation
            await compteur.save();
          } else {
            // Créer un nouveau compteur si aucun compteur actif n'existe
            await Compteur.create({
              machineId: machine._id,
              startTime: new Date(),
              kilowattHours: 0, // Initialiser à 0, calculé à la libération de la machine
              endTime: null // Fin sera définie lors de la libération
            });
          }
          // Mettre à jour l'état de la machine à 'Indisponible'
          machine.etat = 'Indisponible';
          await machine.save();
        }
      }

    await existingFacture.save();
    await Historique.create({
      entityType: 'Facture',
      entityId: existingFacture._id,
      action: 'Facture mise à jour',
      details: `Machines: ${selectedMachines.map(m => m.modelNumber).join(', ')}, Produits: ${selectedProducts.map(p => p.name).join(', ')}, Poids par machine: ${JSON.stringify(machineWeights)}, Quantités par produit : ${JSON.stringify(quantities)}, Détails des articles : ${JSON.stringify(filteredArticleDetails)}`,
    });

    // Mettre à jour les machines comme "Indisponible"
    //await Machine.updateMany({ _id: { $in: selectedMachines.map(m => m._id) } }, { $set: { etat: 'Indisponible' } });

    res.status(200).json(existingFacture);
  } catch (error) {
    console.error('Erreur de mise à jour:', error);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
});
// Route pour mettre à jour uniquement le champ `reste`
router.patch('/:id/reste', async (req, res) => {
  const factureId = req.params.id;
  const { reste } = req.body; // Récupérer uniquement `reste` du corps de la requête

  console.log('Update Reste Request:', req.body);

  try {
    const existingFacture = await Facture.findById(factureId);
    if (!existingFacture) {
      return res.status(404).json({ error: 'Facture non trouvée.' });
    }

    // Mettre à jour uniquement le champ `reste`
    existingFacture.reste = reste;
    await existingFacture.save();

    res.status(200).json(existingFacture);
  } catch (error) {
    console.error('Erreur de mise à jour du reste:', error);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
});



// Supprimer une facture
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Trouver la facture à supprimer
    const facture = await Facture.findById(id);
    if (!facture) {
      return res.status(404).json({ error: 'Facture non trouvée.' });
    }

    // Remettre les machines en état "Disponible"
    await Machine.updateMany({ _id: { $in: facture.machines } }, { $set: { etat: 'Disponible' } });

    // Supprimer la facture
    await Facture.findByIdAndDelete(id);
     // Ajouter l'entrée dans l'historique
     await Historique.create({
      entityType: 'Facture',
      entityId: id,
      action: 'Facture supprimée',
      details: `Facture avec ID ${id} supprimée.`,
    });

    res.status(204).json({ message: 'Facture supprimée avec succès.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mettre à jour l'état de la facture (payée ou non)
router.put('/:id/etat', async (req, res) => {
  const { id } = req.params;
  const { estPaye } = req.body; // Ex: { estPaye: true }

  try {
    const facture = await Facture.findByIdAndUpdate(id, { estPaye }, { new: true });
    if (!facture) {
      return res.status(404).json({ error: 'Facture non trouvée.' });
    }
    
    facture.historique.push({ action: estPaye ? 'Facture payée' : 'Facture non payée' });
    await facture.save();
     // Ajouter l'entrée dans l'historique
     const factures = Facture.findById(id);
     await Historique.create({
      entityType: 'Facture',
      entityId: id,
      action: 'Facture payé',
      details: `Facture avec avec somme de ${factures.totalPrice} payé`,
    });
    res.json(facture);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtenir toutes les factures
router.get('/', async (req, res) => {
  try {
    const factures = await Facture.find();
    res.json(factures);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Exemple d'implémentation dans le backend Express
router.get("/last-ticket", async (req, res) => {
  try {
    const latestFacture = await Facture.findOne().sort({ createdAt: -1 });

    if (!latestFacture) {
      // Si aucune facture n'est trouvée, renvoyer un ticket par défaut 1
      return res.status(200).json({ ticketNumber: 1 });
    }

    res.status(200).json(latestFacture);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération du dernier ticket" });
  }
});


// Obtenir les détails d'une facture
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const facture = await Facture.findById(id).populate('machines').populate('products');
    if (!facture) {
      return res.status(404).json({ error: 'Facture non trouvée.' });
    }
    res.json(facture);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.get('get/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const facture = await Facture.findById(id)
    if (!facture) {
      return res.status(404).json({ error: 'Facture non trouvée.' });
    }
    res.json(facture);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Rechercher des factures par nom et état
router.get('/search', async (req, res) => {
  const { customerName, estPaye } = req.query; // Ex: ?customerName=John&estPaye=true

  try {
    // Construire la requête de recherche
    const query = {};
    if (customerName) {
      query.customerName = new RegExp(customerName, 'i'); // Recherche insensible à la casse
    }
    if (estPaye !== undefined) {
      query.estPaye = estPaye === 'true'; // Convertir en booléen
    }

    const factures = await Facture.find(query);
    res.json(factures);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// routes/factures.js

router.get('/searchNom', async (req, res) => {
  const { customerName } = req.query;
  try {
    // Utilisation de RegExp pour permettre la recherche insensible à la casse
    const factures = await Facture.find({ customerName: new RegExp(customerName, 'i') })
      .populate('machines')
      .populate('products');
    res.json(factures);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.get('/searchNoms', async (req, res) => {
  const { customerName } = req.query;

  console.log('Recherche par nom:', customerName);
  
  if (!customerName) {
    return res.status(400).json({ error: 'Le nom du client est requis.' });
  }

  try {
    const factures = await Facture.find({ customerName: new RegExp(customerName, 'i') })
      .populate({
        path: 'machines',
        select: 'name'
      })
      .populate({
        path: 'products',
        select: 'name'
      });

    console.log('Factures trouvées:', factures);

    if (factures.length === 0) {
      return res.status(404).json({ message: 'Aucune facture trouvée pour ce nom.' });
    }

    res.json(factures);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: error.message });
  }
});

// Récupérer la dernière facture triée par `createdAt`





module.exports = router;
// nnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn
// mmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm
import React, { useState, useEffect, useRef, useCallback } from "react";

import axios from "axios";
import "./App.css";
import "../css/factureForm.css";
import "../css/billetage.css";
import FactureList from "./FacturesList";
import {
  FaBoxOpen,
  FaFileInvoice,
  FaGift,
  FaHourglassHalf,
  FaPlus,
  FaSearch,
  FaTools,
} from "react-icons/fa";
import ModalInfo from "../modal/ModalInfo";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const FactureForm = () => {
  const [billet, setBillet] = useState(false);
  const [userRole, setUserRole] = useState("user");
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user")); // Fetch user from local storage
    if (user) {
      setUserRole(user.role); // Set the role to the user's role
    } else {
      alert("No user found in local storage");
    }
  }, []);
  const [isChoix, setIsChoix] = useState(false);
  const [article, setArticle] = useState([]);
  const [machines, setMachines] = useState([]);
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedMachines, setSelectedMachines] = useState([]);
  const [machineWeights, setMachineWeights] = useState({});
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [searchM, setSearchT] = useState("");
  const [currentView, setCurrentView] = useState("machines");
  const [current, setCurrent] = useState("client");
  const inputRefs = useRef({});
  const inputRefss = useRef({});
  const [showClientList, setShowClientList] = useState(false);
  const [facture, setFacture] = useState(null);
  const [modalInfo, setModalInfo] = useState(false);
  const [message, setMessage] = useState("");
  //   totalPrice += totalWeight * 2; // Exemple de calcul
  //totalPrice += Object.values(machineWeights).reduce((sum, weight) => sum + weight * 2, 0); // Exemple de calcul
  const [formData, setFormData] = useState({
    customerName: "",
    contact: "",
    etat: "encaisser",
    articles: [], // Ajout de la gestion des articles
    articleDetails: [],
    totalWeight: "",
    totalPrice: "",
    reste: "",
    serviceType: "Lavage",
  });
  const [manualInput, setManualInput] = useState(0);
  const [billBreakdown, setBillBreakdown] = useState({
    20000: 0,
    10000: 0,
    5000: 0,
    2000: 0,
    1000: 0,
    500: 0,
    200: 0,
    100: 0,
  });
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [selectedPaymentType, setSelectedPaymentType] = useState("Espèce");
  const [newPaymentType, setNewPaymentType] = useState("");
  const [caisses, setCaisses] = useState([]);
  const [selectedCaisse, setSelectedCaisse] = useState(null);
  const [error, setError] = useState(null);
  const fetchPaymentTypes = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/payement");

      // Ajouter "Espèce" comme option par défaut s'il n'est pas déjà dans la liste
      const uniquePaymentTypes = Array.from(
        new Set(["Espèce", ...response.data.map((type) => type.type)])
      ).map((type) => ({
        type,
        _id: response.data.find((t) => t.type === type)?._id || null, // Gérer l'ID de "Espèce"
      }));

      setPaymentTypes(uniquePaymentTypes);
    } catch (error) {
      console.error("Erreur lors du chargement des types de paiement:", error);
    }
  };

  const fetchCaisses = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/caisses");
      setCaisses(response.data);
      if (response.data.length > 0) {
        setSelectedCaisse(response.data[0]._id);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des caisses:", error);
    }
  };

  useEffect(() => {
    fetchPaymentTypes();
    fetchCaisses();
  }, []);

  const [latestFacture, setLatestFacture] = useState(null);
  useEffect(() => {
    const fetchLatestFacture = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/factures/last-ticket"
        );
        setLatestFacture(response.data);
        console.log("ticket:", response.data.ticketNumber);
      } catch (error) {
        console.error(
          "Erreur lors de la récupération du dernier ticket",
          error
        );
      }
    };

    fetchLatestFacture();
  }, []);
  const remainingAmount = formData.totalPrice - manualInput;
  const changeToGive =
    manualInput - formData.totalPrice > 0
      ? manualInput - formData.totalPrice
      : 0;

  const handleBillClick = (billValue) => {
    setBillBreakdown((prevBreakdown) => ({
      ...prevBreakdown,
      [billValue]: prevBreakdown[billValue] + 1,
    }));
    setManualInput((prevCash) => prevCash + parseInt(billValue));
  };

  const handleManualInputChange = (e) => {
    const value = parseInt(e.target.value, 10) || 0;
    setManualInput(value);
  };

  const handlePaymentTypeChange = (e) => {
    const value = e.target.value;
    setSelectedPaymentType(value);
    if (value !== "autre") {
      setNewPaymentType("");
    }
  };
  // eslint-disable-next-line
  const [preview, setPreview] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const handleSearch = () => {
    let filteredProduits = products;
    if (searchTerm) {
      filteredProduits = filteredProduits.filter((produit) =>
        produit.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return filteredProduits;
  };

  const handleSearchM = () => {
    let filteredMachine = machines;
    if (searchM) {
      filteredMachine = filteredMachine.filter((machine) =>
        machine.modelNumber.toLowerCase().includes(searchM.toLowerCase())
      );
    }
    return filteredMachine;
  };

  const fetchAllProducts = async () => {
    try {
      const productsRes = await axios.get("http://localhost:5000/api/products");
      setProducts(productsRes.data);
    } catch (error) {
      console.error("Erreur lors du chargement des produits:", error);
    }
  };
  const [abonnementClients, setAbonnementClients] = useState([]); // Déclarez un état pour les abonnements

  // Fonction pour charger les abonnements clients
  const fetchAbonnementClients = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/abonnementClient"
      ); // Mettez à jour l'URL selon votre API
      setAbonnementClients(response.data);
    } catch (error) {
      console.error(
        "Erreur lors du chargement des abonnements clients:",
        error
      );
    }
  };

  // Appelez cette fonction dans useEffect pour charger les abonnements au démarrage
  useEffect(() => {
    fetchAbonnementClients();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsRes = await axios.get(
          "http://localhost:5000/api/products"
        );
        setProducts(productsRes.data);
      } catch (error) {
        console.error("Erreur lors du chargement des produits:", error);
      }
    };

    // useEffect(() => {
    //   // Update totalWeight whenever machineWeights changes
    //   const totalWeight = Object.values(machineWeights).reduce((sum, weight) => sum + parseFloat(weight), 0);
    //   setFormData((prev) => ({ ...prev, totalWeight: totalWeight.toFixed(2) }));
    // }, [machineWeights]);

    const fetchClients = async () => {
      try {
        // Récupérer tous les clients
        const clientsRes = await axios.get("http://localhost:5000/api/clients");
        const allClients = clientsRes.data;

        if (isChoix) {
          // Récupérer les abonnements clients pour filtrer
          const abonnementClientsRes = await axios.get(
            "http://localhost:5000/api/abonnementClient"
          );
          const abonnementClients = abonnementClientsRes.data;

          // Filtrer les clients pour ne garder que ceux qui ont un abonnement
          const filteredClients = allClients.filter((client) =>
            abonnementClients.some(
              (abonnement) => abonnement.idClient.toString() === client._id
            )
          );

          setClients(filteredClients);
        } else {
          // Si isChoix est faux, définir tous les clients
          setClients(allClients);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des clients:", error);
      }
    };

    fetchProducts();
    fetchClients();
  }, [isChoix]);
  useEffect(() => {
    // Fetch price types from the server using Axios
    const fetchPriceTypes = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/articles"); // Adjust the URL if needed
        setArticle(response.data);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchPriceTypes();
    fetchAllProducts();
  }, []);

  useEffect(() => {
    const fetchMachines = async () => {
      try {
        const machinesRes = await axios.get(
          "http://localhost:5000/api/machines/available"
        );
        setMachines(machinesRes.data);
      } catch (error) {
        console.error("Erreur lors du chargement des machines:", error);
      }
    };

    fetchMachines();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "totalWeight") {
      // Si l'utilisateur modifie directement le poids total
      setFormData((prev) => ({ ...prev, totalWeight: parseFloat(value) }));

      // Ne pas ajuster machineWeights automatiquement ici.
    } else if (name.startsWith("machineWeight_")) {
      // Extraction de l'ID de la machine du nom de l'input
      const machineId = name.split("machineWeight_")[1];

      // Mise à jour du poids de la machine spécifique
      setMachineWeights((prev) => {
        const updatedWeights = { ...prev, [machineId]: parseFloat(value) };

        // Calcul du nouveau poids total basé sur les poids des machines
        const newTotalWeight = Object.values(updatedWeights).reduce(
          (acc, weight) => acc + weight,
          0
        );
        setFormData((prevFormData) => ({
          ...prevFormData,
          totalWeight: newTotalWeight.toFixed(2),
        }));

        return updatedWeights;
      });
    }
  };

  const handleMachineClick = (machineId) => {
    setSelectedMachines((prev) => {
      const isAlreadySelected = prev.includes(machineId);
      const newSelectedMachines = isAlreadySelected
        ? prev.filter((id) => id !== machineId) // Deselect machine
        : [...prev, machineId]; // Select machine

      // Update machine weights if needed
      setMachineWeights((prevWeights) => {
        const updatedWeights = { ...prevWeights };

        if (isAlreadySelected) {
          // Remove weight if deselected
          delete updatedWeights[machineId];
        } else {
          // Initialize weight if selected
          const machine = machines.find((m) => m._id === machineId);
          if (machine) {
            updatedWeights[machineId] = "1"; // Default weight when selecting a machine
          }
        }

        // Check if any "Machine à laver" is selected
        const hasWashingMachineSelected = newSelectedMachines.some((id) => {
          const machine = machines.find((m) => m._id === id);
          return machine && machine.type === "Machine à laver";
        });

        // Recalculate totalWeight: either for "Machine à laver" or all machines
        const totalWeight = newSelectedMachines.reduce((acc, id) => {
          const machine = machines.find((m) => m._id === id);
          // If a "Machine à laver" is selected, only include those in totalWeight calculation
          if (
            machine &&
            (hasWashingMachineSelected
              ? machine.type === "Machine à laver"
              : true)
          ) {
            acc += parseFloat(updatedWeights[id] || 1); // Use default value of 1 if weight is not set
          }
          return acc;
        }, 0);

        // Update totalWeight in formData
        setFormData((prevFormData) => ({
          ...prevFormData,
          totalWeight: totalWeight.toFixed(2),
        }));

        return updatedWeights;
      });

      // Focus on the input for the newly selected machine
      setTimeout(() => {
        if (inputRefs.current[machineId]) {
          inputRefs.current[machineId].focus();
        }
      }, 0);

      return newSelectedMachines;
    });
  };

  const handleWeightChange = (machineId, value, weightCapacity) => {
    let numericValue = parseFloat(value);

    // Assurez-vous que la valeur est au moins 1, et pas plus que la capacité de la machine
    numericValue = isNaN(numericValue) ? 1 : numericValue; // Si la valeur est NaN, utiliser 1
    const clampedValue = Math.max(1, Math.min(numericValue, weightCapacity));

    setMachineWeights((prev) => {
      const updatedWeights = {
        ...prev,
        [machineId]: clampedValue.toString(), // Stocker comme chaîne pour la gestion de l'input
      };

      // Vérifier si au moins une "Machine à laver" est sélectionnée
      const hasWashingMachineSelected = selectedMachines.some((machineId) => {
        const machine = machines.find((m) => m._id === machineId);
        return machine && machine.type === "Machine à laver";
      });

      // Si une machine à laver est sélectionnée, calculer totalWeight uniquement pour celles-ci
      const totalWeight = selectedMachines.reduce((acc, machineId) => {
        const machine = machines.find((m) => m._id === machineId);
        if (
          machine &&
          (hasWashingMachineSelected
            ? machine.type === "Machine à laver"
            : true)
        ) {
          acc += parseFloat(updatedWeights[machineId] || 1); // Utiliser 1 si la valeur est vide
        }
        return acc;
      }, 0);

      // Mettre à jour totalWeight dans formData
      setFormData((prev) => ({ ...prev, totalWeight: totalWeight.toFixed(2) }));

      return updatedWeights;
    });
  };

  // Handle product selection/deselection
  const handleProductClick = (productId) => {
    setSelectedProducts((prev) => {
      const isSelected = prev.includes(productId);
      const newSelectedProducts = isSelected
        ? prev.filter((id) => id !== productId) // Retirer si désélectionné
        : [...prev, productId]; // Ajouter si sélectionné

      // Si le produit est sélectionné normalement, initialiser la quantité à 1
      if (!isSelected) {
        setQuantities((prevQuantities) => ({
          ...prevQuantities,
          [productId]: quantities[productId] || 1,
        }));

        // Focaliser l'input de quantité après sélection
        setTimeout(() => {
          if (inputRefs.current[productId]) {
            inputRefs.current[productId].focus();
          }
        }, 0);
      } else {
        // Si le produit est désélectionné, ne pas retirer l'offert
        setQuantities((prevQuantities) => ({
          ...prevQuantities,
          [productId]: 0,
        }));
      }
      setOfferedQuantities((prev) => {
        const updated = { ...prev };
        delete updated[productId];
        return updated;
      });

      setError("");
      return newSelectedProducts;
    });
  };

  // Handle quantity change
  const handleQuantityChange = (productId, value, stock) => {
    const parsedValue = parseInt(value, 10);

    // Clamp the value between 0 and the product's stock
    const clampedValue = Math.max(0, Math.min(parsedValue, stock));

    setQuantities((prev) => ({
      ...prev,
      [productId]: !isNaN(clampedValue) && clampedValue >= 0 ? clampedValue : 0,
    }));

    setError(""); // Clear any existing errors
  };

  const handleClientSelect = (client) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      customerName: client.name,
      contact: client.contact,
      // Conservez les autres valeurs existantes
    }));
  };
  // validation des machines selectionnés
  const validateMachines = () => {
    const hasLavageMachine = selectedMachines.some(
      (machineId) =>
        machines.find((m) => m._id === machineId)?.type === "Machine à laver"
    );
    const hasSéchageMachine = selectedMachines.some(
      (machineId) =>
        machines.find((m) => m._id === machineId)?.type === "Sèche-linge"
    );
    const { serviceType } = formData;

    if (serviceType === "Lavage" && !hasLavageMachine) {
      setMessage("une machine lavage requis pour lavage");
      setModalInfo(true);
      return false;
    }

    if (serviceType === "Lavage" && hasLavageMachine && hasSéchageMachine) {
      setMessage("seulement une machine lavage requis pour service de lavage");
      setModalInfo(true);
      return false;
    }

    if (serviceType === "Séchage" && !hasSéchageMachine) {
      setMessage(
        "Une machine de séchage est requise pour le service de Séchage."
      );
      setModalInfo(true);
      return false;
    }

    if (serviceType === "Séchage" && hasSéchageMachine && hasLavageMachine) {
      setMessage(
        "Une machine de séchage est requise pour faire juste Séchage."
      );
      return false;
    }

    if (
      serviceType === "Lavage + Séchage" &&
      (!hasLavageMachine || !hasSéchageMachine)
    ) {
      setMessage(
        "Une machine de lavage et une machine de séchage sont requises pour le service Lavage + Séchage."
      );
      return false;
    }

    setError("");
    return true;
  };
  //pour la validation de capacité des machine selectionnés
  const validateMachineCapacity = () => {
    const totalWeight = parseFloat(formData.totalWeight);

    // Calculer le poids total des machines de type "Sèche-linge"
    const totalDryerWeight = Object.entries(machineWeights).reduce(
      (total, [machineId, weight]) => {
        const machine = machines.find((m) => m._id === machineId);
        if (machine && machine.type === "Sèche-linge") {
          return total + parseFloat(weight);
        }
        return total;
      },
      0
    );

    // Vérifier si le totalWeight est inférieur au poids total des machines de séchage
    if (totalWeight < totalDryerWeight) {
      setMessage(
        `Le poids total (${totalWeight} kg) est inférieur au poids total des machines de séchage (${totalDryerWeight} kg).`
      );
      return false;
    }

    // Vérifier la capacité de chaque machine
    for (const [machineId, weight] of Object.entries(machineWeights)) {
      const machine = machines.find((m) => m._id === machineId);
      if (machine && weight > machine.weightCapacity) {
        setError(
          `Le poids attribué à la machine ${machine.modelNumber} dépasse sa capacité. Capacité: ${machine.weightCapacity} kg.`
        );
        return false;
      }
    }

    setError("");
    return true;
  };
  //pour le validation de stock
  const validateStock = async () => {
    try {
      const productQuantitiesToCheck = Object.keys(quantities).reduce(
        (acc, productId) => {
          if (selectedProducts.includes(productId)) {
            // Additionne la quantité normale et la quantité offerte
            const totalQuantity =
              (quantities[productId] || 0) +
              (offeredQuantities[productId] || 0);

            // Vérifie si la quantité totale est supérieure à 0
            if (totalQuantity > 0) {
              acc[productId] = totalQuantity;
            }
          }
          return acc;
        },
        {}
      );

      const stocks = await Promise.all(
        Object.keys(productQuantitiesToCheck).map((productId) =>
          axios.get(`http://localhost:5000/api/products/${productId}`)
        )
      );

      for (const { data: product } of stocks) {
        if (!product || !product._id || typeof product.stock === "undefined") {
          console.error("Produit non trouvé ou données incorrectes:", product);
          setError("Données de produit incorrectes.");
          return false;
        }

        const quantityRequested = productQuantitiesToCheck[product._id];
        if (product.stock < quantityRequested) {
          setError(`Le stock pour le produit ${product.name} est insuffisant.`);
          return false;
        }
      }

      setError("");
      return true;
    } catch (err) {
      console.error("Erreur lors de la vérification des stocks:", err);
      setError("Erreur lors de la vérification des stocks.");
      return false;
    }
  };

  // const handlePreview = () => {
  //   setPreview(true);
  // };

  const generatePDF = (factureData) => {
    // Créer un conteneur div avec les styles nécessaires
    const element = document.createElement("div");
    element.style.display = "block"; // Assurez-vous que l'élément est visible pour le rendu
    element.style.width = "8.5in"; // Largeur en pouces pour une page au format lettre
    element.style.padding = "20px";
    element.style.color = "#333"; // Couleur du texte
    element.style.fontFamily = "Arial, sans-serif";
    element.style.backgroundColor = "#f2f2f2"; // Couleur de fond

    // Remplir le conteneur avec le contenu de la facture
    element.innerHTML = `
      <h1 style="text-align: center;">Facture</h1>
      <p><strong>Nom :</strong> ${factureData.customerName}</p>
      <p><strong>Contact :</strong> ${factureData.contact}</p>
      <p><strong>Poids Total :</strong> ${factureData.totalWeight} kg</p>
      <p><strong>Prix Total :</strong> ${factureData.totalPrice} Ar</p>
       <h2>Articles Sélectionnés :</h2>
    <ul>
      ${
        factureData.articleDetails
          ?.map((article) => {
            const filteredPrices =
              article.prices
                ?.filter((price) => {
                  const isWeekend =
                    new Date().getDay() === 6 || new Date().getDay() === 0; // Ex: weekend logic
                  return (
                    (isWeekend && price.priceType === "weekend") ||
                    (!isWeekend && price.priceType === "normale")
                  );
                })
                .map(
                  (price) =>
                    `<li>${article.type} - ${price.priceType} - Prix: ${price.value} Ar</li>`
                )
                .join("") || "<li>Prix non disponibles pour cet article</li>";

            return `
              <li><strong>${article.type}</strong>
                <ul>${filteredPrices}</ul>
              </li>`;
          })
          .join("") || "<li>Aucun article sélectionné</li>"
      }
    </ul>
      <h2>Machines Sélectionnées :</h2>
      <ul>
        ${
          factureData.machines
            ?.map((machineId) => {
              const machine = machines.find((m) => m._id === machineId);
              const machinePoid = factureData.machineWeights[machineId] || 0;
              return `
                <li>${machine.type}-Numero:${
                machine ? machine.modelNumber : "Machine inconnue"
              } -Poids : ${machinePoid} kg</li>
              `;
            })
            .join("") || "<li>Aucune machine sélectionnée</li>"
        }
      </ul>
      <h2>Produits Sélectionnés :</h2>
      <ul>
        ${
          factureData.products
            ?.map((productId) => {
              const product = products.find((p) => p._id === productId);
              const quantity = factureData.quantities[productId] || 0;
              return `
                <li>${
                  product ? product.name : "Produit inconnu"
                } - ${quantity} unités</li>
              `;
            })
            .join("") || "<li>Aucun produit sélectionné</li>"
        }
      </ul>
    `;

    // Ajouter l'élément au corps (caché)
    element.style.position = "absolute";
    element.style.left = "-9999px"; // Masquer l'élément hors écran
    document.body.appendChild(element);

    // Générer le canvas à partir de l'élément
    html2canvas(element, { scale: 2 })
      .then((canvas) => {
        const imgData = canvas.toDataURL("image/png");

        // Initialiser jsPDF
        const pdf = new jsPDF({
          unit: "in",
          format: "letter",
          orientation: "portrait",
        });

        // Calculer les dimensions pour le PDF (page de taille lettre : 8.5 x 11 pouces)
        const imgWidth = 8.5;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // Ajouter l'image au PDF
        pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);

        // Enregistrer le PDF
        pdf.save(
          `Facture_${
            factureData.customerName
          }_${new Date().toLocaleDateString()}.pdf`
        );
      })
      .finally(() => {
        // Nettoyer : supprimer l'élément du DOM
        document.body.removeChild(element);
      });
  };

  const handleSubmit = async (isPending) => {
    setPreview(false);
    if (!validateMachines()) return;
    if (!validateMachineCapacity()) return;
    if (!(await validateStock())) return;
    if (!formData.totalPrice || formData.totalPrice === undefined) {
      setError("Le prix total est manquant.");
      return;
    }
    // Code pour soumettre le formulaire ici
    console.log("Formulaire soumis avec succès!");

    // Vérifier si le client existe
    let selectedClient = clients.find(
      (client) => client.name === formData.customerName
    );

    // Si le client n'existe pas, le créer
    if (!selectedClient) {
      try {
        const newClient = await axios.post(
          "http://localhost:5000/api/clients",
          {
            name: formData.customerName,
            contact: formData.contact,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        selectedClient = newClient.data; // Mettre à jour le client sélectionné
      } catch (error) {
        setError("Erreur lors de la création du client");
        return;
      }
    }
    // const factureEtat = isEditMode && formData.etat === "encaisser"
    // ? "encaisser"
    // : isPending
    // ? "en attente"
    // : "encaisser";

    const selectedArticles = formData.articles
      .map((articleId) => {
        // Trouver les détails de l'article correspondant à articleId
        const articleDetail = formData.articleDetails.find(
          (detail) => detail.articleId === articleId
        );

        if (!articleDetail) {
          console.warn(`Détails manquants pour l'article: ${articleId}`);
          return null; // Ignorer si pas de détails trouvés
        }

        return {
          articleId: articleId,
          type: articleDetail.type, // Utiliser le type depuis articleDetails
          prices: articleDetail.prices, // Détails des prix pour cet article
        };
      })
      .filter((article) => article !== null); // Filtrer les articles invalides (sans détails)
    // Filtrer les articles invalides (sans détails)
    console.log(
      "Détails des articles avant soumission :",
      formData.articleDetails
    );
    console.log("Articles sélectionnés avant soumission :", selectedArticles);

    if (isChoix) {
      try {
        const abonnementClient = await axios.get(
          `http://localhost:5000/api/abonnementClient/client/${selectedClient._id}`
        );
        console.log(abonnementClient.data);
        if (!abonnementClient.data || !abonnementClient.data.length) {
          setMessage("Le client n'est pas inscrit à un abonnement.");
          return;
        }

        // Si le client a un abonnement, déduire le poids de l'abonnement
        const currentAbonnement = abonnementClient.data[0]; // Assumer le premier abonnement récupéré
        const remainingWeight =
          currentAbonnement.abonnementDetails.weight - formData.totalWeight;

        if (remainingWeight < 0) {
          alert("Le poids dépasse le quota d'abonnement.");
          return;
        }

        // Mise à jour des détails de l'abonnement
        await axios.put(
          `http://localhost:5000/api/abonnementClient/abonnement/${currentAbonnement._id}`,
          {
            abonnementDetails: {
              weight: remainingWeight,
              features: currentAbonnement.abonnementDetails.features,
            },
          }
        );
      } catch (error) {
        setError("Erreur lors de la vérification de l'abonnement du client");
        return;
      }
    }
    // Enregistrement de la facture
    // if (remainingAmount > 0){
    //   setFormData((prevFormData) => ({
    //     ...prevFormData,
    //     reste: remainingAmount,
    //   }));
    // }
    // else{
    //   setFormData((prevFormData) => ({
    //     ...prevFormData,
    //     reste: 0,
    //   }));
    // }
    const factureData = {
      customerName: selectedClient.name,
      totalWeight: formData.totalWeight,
      totalPrice: formData.totalPrice,
      contact: formData.contact,
      //reste: formData.reste,
      reste: remainingAmount > 0 ? remainingAmount : 0,
      serviceType: formData.serviceType,
      machines: selectedMachines,
      machineWeights: machineWeights,
      products: selectedProducts, // Fusionne les quantités normales et offertes
      quantities: Object.keys(quantities).reduce((acc, productId) => {
        acc[productId] =
          (quantities[productId] || 0) + (offeredQuantities[productId] || 0);
        return acc;
      }, {}),
      articles: formData.articles, // Ajouter les articles
      articleDetails: selectedArticles, // Ajouter les détails des articles
      etat: isPending ? "en attente" : "encaisser",
    };

    console.log("Données de la facture envoyées :", factureData);

    let response;
    try {
      if (isEditMode) {
        if (!facture || !facture._id) {
          setError("La facture n'est pas disponible pour la modification.");
          return;
        }
        response = await axios.put(
          `http://localhost:5000/api/factures/${facture._id}`,
          factureData,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        alert("Facture modifiée avec succès");
      } else {
        response = await axios.post(
          "http://localhost:5000/api/factures",
          factureData,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        alert("Facture créée avec succès");
      }

      console.log("Données de la facture envoyées :", response.data._id);
      generatePDF(factureData);
      const paymentTypeToSubmit =
        selectedPaymentType === "autre"
          ? newPaymentType
          : selectedPaymentType || "Espèce";
      console.log("payementType :", newPaymentType);

      await axios.post("http://localhost:5000/api/payement", {
        type: paymentTypeToSubmit,
        facture: response.data._id, // Uncomment if needed to associate payment with invoice
      });

      if (formData.totalPrice === manualInput) {
        await axios.put(
          `http://localhost:5000/api/factures/${response.data._id}/etat`,
          { estPaye: true }
        );
      } else {
        await axios.put(
          `http://localhost:5000/api/factures/${response.data._id}/etat`,
          { estPaye: false }
        );
      }

      const caisse = caisses.find((caisse) => caisse._id === selectedCaisse);

      if (caisse) {
        if (!caisse.ouvert) {
          setError(
            "La caisse est fermée. Vous devez d'abord ouvrir cette caisse."
          );
          return;
        }

        const totalPrice = Number(formData.totalPrice);
        const inputAmount = Number(manualInput);
        const currentSolde = Number(caisse.solde);

        let soldeToAdd;

        if (isEditMode && facture) {
          // Mode édition : calculer la différence entre manualInput et le prix total de la facture existante
          const difference =
            inputAmount - Number(facture.totalPrice - facture.reste);

          // Si la différence est positive, c'est le solde à ajouter ; sinon, ajouter 0
          soldeToAdd = difference;
        } else {
          // Mode normal : comparer totalPrice et manualInput
          soldeToAdd = totalPrice <= inputAmount ? totalPrice : inputAmount;
        }

        // Mise à jour du solde de la caisse
        await axios.put(
          `http://localhost:5000/api/caisses/${selectedCaisse}/add-solde`,
          {
            solde: soldeToAdd, // Utiliser le montant calculé comme solde à ajouter
          }
        );

        console.log(
          `Solde ajouté avec succès : ${currentSolde} + ${soldeToAdd}`
        );
      }

      setPreview(false); // Masquer la prévisualisation après la soumission
    } catch (error) {
      setError(
        `Erreur lors de l'enregistrement de la facture: ${error.message}`
      );
    }
  };
  const billetConfirm = async () => {
    try {
      // Appel de la soumission (vérifiez bien que false signifie l'enregistrement ou la modification selon le contexte)
      await handleSubmit(false);

      // Fermer le modal seulement si la soumission est réussie
      setBillet(false);
    } catch (error) {
      // Afficher un message d'erreur en cas de problème lors de la soumission
      console.error("Erreur lors de la soumission :", error);
      setError("Échec lors de la confirmation du billet. Veuillez réessayer.");
    }
  };
  const billetConfirmEnattente = async () => {
    try {
      // Appel de la soumission (vérifiez bien que false signifie l'enregistrement ou la modification selon le contexte)
      await handleSubmit(true);

      // Fermer le modal seulement si la soumission est réussie
      setBillet(false);
    } catch (error) {
      // Afficher un message d'erreur en cas de problème lors de la soumission
      console.error("Erreur lors de la soumission :", error);
      setError("Échec lors de la confirmation du billet. Veuillez réessayer.");
    }
  };
  const handleConfirmClick = () => {
    // Vérifier l'état de la facture
    if (formData.etat === "en attente") {
      // Appeler la fonction appropriée pour "en attente"
      billetConfirmEnattente();
    } else {
      // Appeler la fonction pour les autres états
      billetConfirm();
    }
  };

  const handleEdit = (facture) => {
    if (!facture || typeof facture !== "object") {
      setError("Facture non disponible ou mal formatée pour l'édition.");
      return;
    }

    // Initialisation des options de sélection
    const initialOptions = article.flatMap((article) =>
      article.prices
        .filter(
          (price) =>
            (isWeekend && price.priceType === "weekend") ||
            (!isWeekend && price.priceType === "normale")
        )
        .map((price) => ({
          label: `${article.type} - ${price.priceType}: $${price.value}`,
          value: `${article._id}-${article.type}-${price.priceType}-${price.value}`,
        }))
    );
    setFacture(facture);
    // Mettre à jour le formulaire et la sélection
    setFormData({
      customerName: facture.customerName || "",
      contact: facture.contact || "",
      totalWeight: facture.totalWeight || 0,
      totalPrice: facture.totalPrice || 0,
      reste: facture.reste || 0,
      serviceType: facture.serviceType || "",
      articles: facture.articles || [],
      articleDetails: facture.articleDetails || [],
    });

    // Trouver l'option correspondante à l'édition
    const selectedOption =
      initialOptions.find((option) =>
        facture.articleDetails.some(
          (detail) =>
            `${detail.articleId}-${detail.type}-${detail.prices[0]?.priceType}-${detail.prices[0]?.value}` ===
            option.value
        )
      )?.value || "";

    setSelectedOption(selectedOption);
    setSelectedMachines(facture.machines || []);
    setSelectedProducts(facture.products || []);

    const machineWeightsObj = facture.machineWeights.reduce((acc, item) => {
      if (item.machineId) {
        acc[item.machineId] = item.weight || 0;
      }
      return acc;
    }, {});
    setMachineWeights(machineWeightsObj);

    const productQuantitiesObj = facture.quantities.reduce((acc, item) => {
      if (item.productId) {
        acc[item.productId] = item.quantity || 0;
      }
      return acc;
    }, {});
    setQuantities(productQuantitiesObj);

    setIsEditMode(true);
  };

  const handleCancel = () => {
    // Réinitialiser le formulaire ou rediriger l'utilisateur
    setFormData({
      customerName: "",
      contact: "",
      totalPrice: "",
      totalWeight: "",
      serviceType: "Lavage",
    });
    setSelectedMachines([]);
    setSelectedProducts([]);
    setQuantities({});
    setMachineWeights({});
    setIsEditMode(false);
  };

  const [offeredQuantities, setOfferedQuantities] = useState({}); // To track quantities for "offert"

  const handleOffertQuantityChange = (productId, value) => {
    setOfferedQuantities((prev) => ({
      ...prev,
      [productId]: Number(value),
    }));
  };
  const handleOffertClick = (productId) => {
    setOfferedQuantities((prev) => ({
      ...prev,
      [productId]: offeredQuantities[productId] || 1,
      // Initialiser la quantité offerte à 1
    }));
    setTimeout(() => {
      if (inputRefss.current[productId]) {
        inputRefss.current[productId].focus();
      }
    }, 0);

    // Ajouter le produit offert dans la liste des produits sélectionnés s'il n'est pas déjà présent
    if (!selectedProducts.includes(productId)) {
      setSelectedProducts((prev) => [...prev, productId]);
    }
  };
  const handleRemoveOfferedProduct = (productId) => {
    setOfferedQuantities((prev) => {
      const updated = { ...prev };
      delete updated[productId];
      return updated;
    });

    // Si le produit normal n'est pas sélectionné, le retirer de la liste des produits
    if (!quantities[productId]) {
      setSelectedProducts((prev) => prev.filter((id) => id !== productId));
    }
  };

  const [selectedOption, setSelectedOption] = useState("");

  const calculateTotalPrice = useCallback(() => {
    let total = selectedProducts.reduce((acc, productId) => {
      const product = products.find((p) => p._id === productId);

      // Vérifie si le produit est offert
      // Ajoute le prix du produit normal s'il est sélectionné
      if (product && quantities[productId] > 0) {
        const productPrice = product.price * (quantities[productId] || 0);
        acc += productPrice;
      }
      // Le produit offert n'ajoute pas de coût mais reste dans la facture à 0
      return acc;
    }, 0);

    const filteredMachineCount = selectedMachines.filter((machineId) => {
      const machine = machines.find((m) => m._id === machineId);
      return machine?.type === "Machine à laver";
    }).length;

    if (selectedOption) {
      let priceValue = getPriceFromOption(selectedOption);

      // If isChoix is true, set the price to 0 regardless of the machine type
      if (isChoix) {
        priceValue = 0;
      }

      // Multiply the price by the number of selected machines (both types)
      total += filteredMachineCount * priceValue;
    }
    // Calcul du total pour les autres types de machines
    total += selectedMachines.reduce((acc, machineId) => {
      const machine = machines.find((m) => m._id === machineId);

      // Calcul pour les machines qui ne sont pas des machines à laver
      if (!isChoix && machine && machine.type !== "Machine à laver") {
        const weight = machineWeights[machineId] || 1;

        // Trouver la plage de prix correspondant au poids
        const priceRange = machine.priceRanges.find(
          (range) => weight >= range.minWeight && weight <= range.maxWeight
        );

        if (priceRange) {
          acc += priceRange.price;
        } else {
          // Si aucune plage ne correspond, ajouter un tarif par défaut ou rien
          acc += 0; // ou un tarif par défaut si nécessaire
        } // Multiplier par le tarif de 300
      }

      return acc;
    }, 0);

    return total.toFixed(2); // Retourner le total avec 2 décimales
  }, [
    isChoix,
    selectedProducts,
    quantities,
    // Ajout pour prendre en compte les produits offerts
    selectedMachines,
    machineWeights,
    products,
    machines,
    selectedOption,
  ]);

  useEffect(() => {
    const totalPrice = calculateTotalPrice();
    setFormData((prev) => ({ ...prev, totalPrice }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // eslint-disable-next-line
  }, [calculateTotalPrice]);

  const getPriceFromOption = (option) => {
    if (!option) return 0;

    const parts = option.split("-");
    const priceValue = parts[parts.length - 1];
    return parseFloat(priceValue);
  };

  // const handleRemoveMachine = (machineId) => {
  //   // Supprimer la machine de la liste des machines sélectionnées
  //   const updatedMachines = selectedMachines.filter((id) => id !== machineId);
  //   setSelectedMachines(updatedMachines);
  // };
  const handleRemoveMachine = (machineId) => {
    // Remove the machine from the selected machines
    const updatedMachines = selectedMachines.filter((id) => id !== machineId);
    setSelectedMachines(updatedMachines);

    // Remove the machine's weight
    const updatedMachineWeights = { ...machineWeights };
    delete updatedMachineWeights[machineId];
    setMachineWeights(updatedMachineWeights);

    // Check if any "Machine à laver" is selected
    const hasWashingMachineSelected = updatedMachines.some((id) => {
      const machine = machines.find((m) => m._id === id);
      return machine && machine.type === "Machine à laver";
    });

    // Recalculate totalWeight: either for "Machine à laver" or all machines
    const totalWeight = updatedMachines.reduce((acc, id) => {
      const machine = machines.find((m) => m._id === id);
      // If a "Machine à laver" is selected, only include those in totalWeight calculation
      if (
        machine &&
        (hasWashingMachineSelected ? machine.type === "Machine à laver" : true)
      ) {
        acc += parseFloat(updatedMachineWeights[id] || 1); // Use 1 as the default if weight is not set
      }
      return acc;
    }, 0);

    // Update totalWeight in formData
    setFormData((prevFormData) => ({
      ...prevFormData,
      totalWeight: totalWeight.toFixed(2),
    }));
  };

  const handleRemoveProduct = (productId) => {
    setQuantities((prev) => {
      const updated = { ...prev };
      delete updated[productId]; // Supprimer la quantité normale
      return updated;
    });

    // Si le produit offert n'existe pas, retirer complètement de la liste
    if (!offeredQuantities[productId]) {
      setSelectedProducts((prev) => prev.filter((id) => id !== productId));
    }
  };

  const onChanges = (e) => {
    const { name, value } = e.target;

    // Mettre à jour à la fois le nom du client et le contact dans formData
    setFormData((prev) => ({
      ...prev,
      [name]: value, // Utilise le nom de l'input pour mettre à jour le champ correspondant
    }));
  };

  const currentDay = new Date().getDay();
  const isWeekend = currentDay === 0 || currentDay === 6;

  // Filter options based on the day
  const filteredOptions = article.flatMap((article) =>
    article.prices
      .filter(
        (price) =>
          (isWeekend && price.priceType === "weekend") ||
          (!isWeekend && price.priceType === "normale")
      )
      .map((price) => ({
        label: `${article.type} - ${price.priceType}- ${price.value}`,
        value: `${article._id}-${article.type}-${price.priceType}-${price.value}`,
      }))
  );

  // Set the default selected option when the component mounts
  useEffect(() => {
    if (filteredOptions.length > 0 && !selectedOption) {
      const defaultOptionValue = filteredOptions[0].value; // First available option
      setSelectedOption(defaultOptionValue); // Set the default option

      // Decompose the value and update the formData with default values
      const [articleId, articleType, priceType, value] =
        defaultOptionValue.split("-");
      setFormData((prevData) => ({
        ...prevData,
        articles: [articleId],
        articleDetails: [
          {
            articleId: articleId,
            type: articleType,
            prices: [{ priceType, value: parseFloat(value) }],
          },
        ],
      }));
    }
  }, [filteredOptions, selectedOption]); // Only runs if the filtered options or selected option change

  // Handle user changing the option
  const handleOptionChange = (event) => {
    const selectedOptionValue = event.target.value;
    setSelectedOption(selectedOptionValue); // Update the selected option

    // Decompose the value and update formData with the new selection
    const [articleId, articleType, priceType, value] =
      selectedOptionValue.split("-");
    setFormData((prevData) => ({
      ...prevData,
      articles: [articleId],
      articleDetails: [
        {
          articleId: articleId,
          type: articleType,
          prices: [{ priceType, value: parseFloat(value) }],
        },
      ],
    }));
  };

  /*Modal Information */
  const onOk = () => {
    setModalInfo(false);
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState("");

  // Fonction pour ouvrir le modal
  const inputRef = useRef(null);
  const handleAddStock = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus(); // Met le curseur dans l'input
      }
    }, 0);
  };

  // Fonction pour fermer le modal
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
    setQuantity(""); // Réinitialiser la quantité
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    const stockToAdd = parseInt(quantity, 10);
    if (!isNaN(stockToAdd) && stockToAdd > 0) {
      try {
        const updatedProduct = {
          ...selectedProduct,
          stock: selectedProduct.stock + stockToAdd,
        };
        await axios.put(
          `http://localhost:5000/api/products/${selectedProduct._id}`,
          updatedProduct
        );
        await fetchAllProducts();
        alert("Stock added successfully");
        handleModalClose(); // Fermer le modal après succès
      } catch (error) {
        console.error("Error adding stock:", error);
        alert("Error adding stock");
      }
    } else {
      alert("Invalid stock quantity");
    }
  };

  return (
    <div className="facture-form1">
      {isModalOpen && (
          <div className="modal-overlay">
            <form className="modal-stock" onSubmit={handleModalSubmit} >
              <h2>Add Stock</h2>
              <input
                type="number"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Enter quantity"
                min="1"
                ref={inputRef}
              />
              <div className="modal-buttons">
                <button type="submit">Submit</button>
                <button type="button" onClick={handleModalClose}>
                  Close
                </button>
              </div>
            </form>
          </div>
        )}
    <form
      className="facture-form"
      onSubmit={(e) => {
        e.preventDefault(); // Empêche le comportement par défaut du formulaire
        const form = e.target; // Récupérer l'élément du formulaire
        if (form.checkValidity()) {
          // Vérifier si tous les champs "required" sont remplis
          if (
            formData.etat === "encaisser" || 
            formData.etat === "en attente"
          ) {
            setBillet(true); // Ouvrir le modal si les champs sont valides
          }
        } else {
          // Si le formulaire n'est pas valide, déclencher la validation HTML native
          form.reportValidity();
        }
      }}
    >
      <div className="facture-gauche">
        {error && <p className="error">{error}</p>}
        <div className="navigation-buttons">
          <div className="div-bt-gauche">
            <button
            type="button"
              className={currentView === "machines" ? "active" : ""}
              onClick={() => {
                setCurrentView("machines");
                setCurrent("client");
              }}
            >
              <FaTools className="icon" />
              <span>Machines</span>
            </button>
            <button
             type="button"
              className={currentView === "produits" ? "active" : ""}
              onClick={() => {
                setCurrentView("produits");
                setCurrent("client");
              }}
            >
              <FaBoxOpen className="icon" /> <span>Produits</span>
            </button>
            <button
             type="button"
              className={currentView === "en-attente" ? "active" : ""}
              onClick={() => {
                setCurrentView("en-attente");
                setCurrent("factures");
              }}
            >
              <FaHourglassHalf className="icon" />
              <span>En Attente</span>
            </button>
            <button
             type="button"
              className={currentView === "factures" ? "active" : ""}
              onClick={() => {
                setCurrentView("factures");
                setCurrent("factures");
              }}
            >
              <FaFileInvoice className="icon" />
              <span>Factures</span>
            </button>

            {currentView === "machines" && (
              <div className="recherche">
                <input
                  className="input"
                  type="text"
                  placeholder="numero"
                  value={searchM}
                  onChange={(e) => setSearchT(e.target.value)}
                />
                <FaSearch className="icon" />
              </div>
            )}

            {currentView === "produits" && (
              <div className="recherche">
                <input
                  className="input"
                  type="text"
                  placeholder="Chercher Produits"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <FaSearch className="icon" />
              </div>
            )}
          </div>
          {/* <div className="div-bt-droite"></div> */}
        </div>
        {current === "client" && (
          <div className="client">
            <div className="client-input">
              <div className="client-choix">
                <input
                  className="custom-checkbox"
                  type="checkbox"
                  id="cheqChoix"
                  checked={isChoix} // `isChoix` est la variable d'état qui gère l'état coché
                  onChange={(e) => setIsChoix(e.target.checked)}
                />
                <span htmlFor="cheqChoix">Abonnement</span>
              </div>

              <div className="nom-input">
                <input
                  type="text"
                  name="customerName"
                  required
                  placeholder="client nom"
                  value={formData.customerName}
                  onFocus={() => setShowClientList(true)} // Afficher la liste au focus
                  onBlur={() => setTimeout(() => setShowClientList(false), 200)}
                  onChange={onChanges}
                />
                {showClientList && (
                  <div
                    className={`client-list ${
                      clients.filter((client) =>
                        client.name
                          .toLowerCase()
                          .includes(formData.customerName.toLowerCase())
                      ).length === 0
                        ? "no-border"
                        : ""
                    }`}
                  >
                    {clients
                      .filter((client) => {
                        const matchesName = client.name
                          .toLowerCase()
                          .includes(formData.customerName.toLowerCase());

                        // Filtrer également en fonction de isChoix
                        const matchesAbonnement =
                          !isChoix ||
                          abonnementClients.some(
                            (abonnement) =>
                              abonnement.idClient.toString() === client._id
                          );

                        return matchesName && matchesAbonnement; // Retourne true si le client correspond au nom et à la condition d'abonnement
                      })
                      .map((client) => (
                        <div
                          key={client._id}
                          className="client-item"
                          onClick={() => handleClientSelect(client)}
                        >
                          <div className="client-span">
                            <span>{client.name}</span>
                            <span>{client.contact}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
              <input
                required
                type="text"
                name="contact"
                placeholder="client contact"
                value={formData.contact}
                onChange={onChanges}
              />
            </div>

            <div>
              <input
                style={{ visibility: "hidden", position: "absolute" }}
                type="text"
                placeholder="Rechercher un client"
                value={formData.customerName}
                onChange={(e) =>
                  setFormData({ ...formData, customerName: e.target.value })
                }
              />
            </div>
          </div>
        )}
        {/* Formulaire */}
        <div className="view-ticket">
          {currentView === "factures" && current === "factures" && (
            <FactureList className="factures" onEdit={handleEdit} />
          )}
          {currentView === "en-attente" && current === "factures" && (
            <FactureList
              className="factures"
              onEdit={handleEdit}
              etatFilter="en attente" // Filtrer les factures "en attente"
            />
          )}
          {/* listes des machine */}
          {currentView === "machines" && (
            <div className="machines">
              <div className="machine-input">
                <select onChange={handleOptionChange} value={selectedOption}>
                  {filteredOptions.length > 0 ? (
                    filteredOptions.map((option, index) => (
                      <option key={index} value={option.value}>
                        {option.label}
                      </option>
                    ))
                  ) : (
                    <option value="">Aucune option disponible</option>
                  )}
                </select>

                <input
                  placeholder="poids total"
                  type="number"
                  name="totalWeight"
                  value={formData.totalWeight}
                  onChange={handleChange}
                  readOnly
                />
                <select
                  name="serviceType"
                  value={formData.serviceType}
                  onChange={onChanges}
                >
                  <option value="Lavage">Lavage</option>
                  <option value="Séchage">Séchage</option>
                  <option value="Lavage + Séchage">Lavage + Séchage</option>
                </select>
              </div>
              <div className="machine-ul">
                {handleSearchM().map((machine) => (
                  <div
                    key={machine._id}
                    className={`machine-list ${
                      selectedMachines.includes(machine._id) ? "selected" : ""
                    }`}
                    onClick={() => handleMachineClick(machine._id)}
                  >
                    {machine.photo && (
                      <img
                        src={`http://localhost:5000/${machine.photo}`}
                        alt={machine.name}
                        style={{
                          width: "150px",
                          height: "150px",
                          borderRadius: "50%",
                          maxWidth: "150PX",
                        }}
                      />
                    )}
                    <label>
                      {machine.name} ({machine.type}) - {machine.modelNumber} -{" "}
                      {machine.weightCapacity} kg
                    </label>
                    {selectedMachines.includes(machine._id) && (
                      <input
                        type="number"
                        placeholder="Poids attribué"
                        ref={(el) => (inputRefs.current[machine._id] = el)}
                        value={machineWeights[machine._id] || 1}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) =>
                          handleWeightChange(
                            machine._id,
                            e.target.value,
                            machine.weightCapacity
                          )
                        }
                        min="1"
                        max={machine.weightCapacity}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* list des produits*/}
          {currentView === "produits" && (
            <div className="produit">
              <div className="produit-ul">
                {handleSearch().map((product) => (
                  <div
                    style={{ cursor: "pointer", position: "relative" }}
                    key={product._id}
                    className={`produit-list ${
                      selectedProducts.includes(product._id) ? "selected" : ""
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      handleProductClick(product._id);
                    }} // Gestion de la sélection normale du produit
                  >
                    {isChoix && (
                      <FaGift
                        className="offert-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOffertClick(product._id); // Gestion du clic "Offert"
                        }}
                      />
                    )}

                    {/* L'input de quantité offerte est toujours visible si une quantité offerte est définie */}
                    {offeredQuantities[product._id] > 0 && (
                      <input
                        className="input-offert"
                        type="number"
                        placeholder="Quantité Offerte"
                        value={offeredQuantities[product._id] || 0}
                        ref={(el) => (inputRefss.current[product._id] = el)}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) =>
                          handleOffertQuantityChange(
                            product._id,
                            e.target.value
                          )
                        }
                        min="0"
                        max={product.stock}
                      />
                    )}

                    {product.photo && (
                      <img
                        src={`http://localhost:5000/${product.photo}`}
                        alt={product.name}
                        style={{
                          width: "100px",
                          height: "100px",
                          borderRadius: "50%",
                          maxWidth: "140PX",
                        }}
                      />
                    )}
                    <label
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                      }}
                    >
                      <div>
                        {product.name} - stock(s) : {product.stock}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-evenly",
                          letterSpacing: "3px",
                        }}
                      >
                        <span>Prix :</span>
                        <span style={{ color: "rgb(27, 168, 117)" }}>
                          {product.price} Ar
                        </span>
                        {userRole === "admin" && (
                          <span
                            className="machine-but"
                            style={{
                              position: "absolute",
                              top: "10px",
                              right: "10px",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddStock(product);
                            }}
                          >
                            <FaPlus />
                          </span>
                        )}
                      </div>
                    </label>

                    {/* Si le produit normal est sélectionné, afficher l'input de quantité normale */}
                    {selectedProducts.includes(product._id) && (
                      <input
                        style={{
                          background: "transparent",
                          border: "2px solid gray",
                          color: "white",
                          borderRadius: "5px",
                          outline: "none",
                          textAlign: "center",
                        }}
                        type="number"
                        placeholder="Quantité"
                        ref={(el) => (inputRefs.current[product._id] = el)}
                        value={quantities[product._id] || 0}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) =>
                          handleQuantityChange(
                            product._id,
                            e.target.value,
                            product.stock
                          )
                        }
                        min="0"
                        max={product.stock}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      {/*facture*/}
      {/* <button onClick={handlePreview}>Prévisualiser</button> */}
      <div className="tick">
        <div className="ticket">
          <div className="prev-relative">
            {latestFacture ? (
              <div>
                <h2>
                  Ticket N° {latestFacture.ticketNumber + 1 || 1} /{" "}
                  {new Date(Date.now()).toISOString().split("T")[0]}
                </h2>{" "}
              </div>
            ) : (
              <p>Aucune facture trouvée</p> // Message si aucune facture n'est trouvée
            )}

            <div className="d">
              <table>
                <thead className="thead">
                  <tr>
                    <th>QTÉ</th>
                    <th>DÉSIGNATION</th>
                    <th>MONTANT</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedMachines.map((machineId) => {
                    const machine = machines.find((m) => m._id === machineId);

                    if (!machine) return null; // Vérifie que la machine existe

                    // Détermine si la machine est une machine à laver
                    // Determine if the machine is a washing machine
                    const isWashingMachine = machine.type === "Machine à laver";

                    // Calculate price based on the type of machine
                    let price;

                    if (isWashingMachine) {
                      // Get the price for washing machines
                      price = getPriceFromOption(selectedOption);
                    } else {
                      // Calculate the price for other types of machines (e.g., Sèche-linge)
                      const weight = machineWeights[machineId] || 1;

                      // Check if the machine has defined price ranges
                      const priceRange = machine.priceRanges?.find(
                        (range) =>
                          weight >= range.minWeight && weight <= range.maxWeight
                      );

                      if (priceRange) {
                        price = priceRange.price; // Use the price that matches the weight range
                      } else {
                        // If no price range matches, apply a default price or 0
                        price = 0;
                      }
                    }

                    // Apply the `isChoix` logic for both types of machines
                    if (isChoix) {
                      price = 0; // If 'choix' is enabled, the price is 0 for any type of machine
                    }

                    return (
                      <tr key={machineId}>
                        <td>1</td>
                        <td>
                          {machine?.name} ({machine?.type})
                        </td>
                        <td>{price.toFixed(2)}</td>
                        <td>
                          <button
                            onClick={() => handleRemoveMachine(machineId)}
                          >
                            ❌
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {selectedProducts.map((productId) => {
                    const product = products.find((p) => p._id === productId);

                    return (
                      <React.Fragment key={productId}>
                        {/* Produit normal */}
                        {quantities[productId] > 0 && (
                          <tr>
                            <td>{quantities[productId]}</td>
                            <td>{product?.name}</td>
                            <td>
                              {(quantities[productId] || 0) * product.price} Ar
                            </td>
                            <td>
                              <button
                                onClick={() => handleRemoveProduct(productId)}
                              >
                                ❌
                              </button>
                            </td>
                          </tr>
                        )}

                        {/* Produit offert */}
                        {offeredQuantities[productId] > 0 && (
                          <tr>
                            <td>{offeredQuantities[productId]}</td>
                            <td>{product?.name} (Offert)</td>
                            <td>0 Ar</td>
                            <td>
                              <button
                                onClick={() =>
                                  handleRemoveOfferedProduct(productId)
                                }
                              >
                                ❌
                              </button>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="ambany">
              <div className="btn-facture" style={{ display: "flex" }}>
                <button
                  type="submit"
                  className="btn-facture-green"
                  onClick={() => {
                    // Met à jour formData.etat à "encaisser" ou effectue une modification
                    setFormData((prevFormData) => ({
                      ...prevFormData,
                      etat: "encaisser", // Définir l'état sur "encaisser"
                    }));

                   // setBillet(true); // Ouvrir le modal
                  }}
                >
                  {isEditMode
                    ? facture.etat === "en attente"
                      ? "Encaisser"
                      : "Modifier"
                    : "Encaisser"}
                </button>

                {isEditMode && (
                  <button
                    type="button"
                    className="btn-facture-cancel"
                    onClick={handleCancel}
                  >
                    Annuler
                  </button>
                )}

                <button
                  type="submit"
                  className="btn-facture-red"
                  onClick={() => {
                    // Met à jour formData.etat à "en attente"
                    setFormData((prevFormData) => ({
                      ...prevFormData,
                      etat: "en attente", // Définir l'état sur "en attente"
                    }));

                   // setBillet(true); // Ouvrir le modal
                  }}
                >
                  En attente
                </button>
              </div>
              <span className="traces"></span>
              <span style={{ marginBottom: "10px", marginTop: "10px" }}>
                Prix Total:
                <span style={{ color: "rgb(13, 127, 61)", fontWeight: "600" }}>
                  {" "}
                  {calculateTotalPrice()} Ar
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {modalInfo && <ModalInfo message={message} onOk={onOk} />}
      {billet && (
        <div className="billetage" onClick={() => setBillet(false)}>
          <div
            className="billetage-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="close">
              <button onClick={() => setBillet(false)}>❌</button>
            </div>

            <h2 className="billetage-title">Billetage</h2>

            <div className="input-container">
              <label>Total à payer :</label>
              <input
                type="number"
                value={formData.totalPrice}
                readOnly
                className="input-totalPrice"
              />
            </div>

            <div>
              <label>Caisse :</label>
              <select
                className="caisse-select"
                value={selectedCaisse || ""}
                onChange={(e) => setSelectedCaisse(e.target.value)}
              >
                <option value="">selectionner caisse</option>
                {caisses.map((caisse) => (
                  <option key={caisse._id} value={caisse._id}>
                    {caisse.nom}(solde : {caisse.solde})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>Type de paiement :</label>
              <select
                value={selectedPaymentType || ""}
                onChange={handlePaymentTypeChange}
              >
                <option value="">Sélectionnez un type de paiement</option>
                {paymentTypes.map((type) => (
                  <option key={type._id} value={type.type}>
                    {type.type}
                  </option>
                ))}
                <option value="autre">Autre</option>
              </select>
              {selectedPaymentType === "autre" && (
                <input
                  type="text"
                  placeholder="Entrez un nouveau type de paiement"
                  onChange={(e) => setNewPaymentType(e.target.value)}
                  value={newPaymentType}
                />
              )}
            </div>

            {selectedCaisse && (
              <div className="billets-container">
                <h4>Saisir les billets :</h4>
                <div className="bill-buttons-container">
                  {Object.keys(billBreakdown).map((billValue) => (
                    <button
                      key={billValue}
                      className="bill-button"
                      onClick={() => handleBillClick(billValue)}
                    >
                      {billValue} Ar
                    </button>
                  ))}
                </div>

                <h4>Saisir le montant total reçu :</h4>
                <input
                  type="number"
                  value={manualInput}
                  onChange={handleManualInputChange}
                  className="input-manual"
                  placeholder="Entrez le montant"
                />

                <div className="summary-container">
                  <h4>Total espèces reçues : {manualInput} Ar</h4>
                  <h4>
                    Reste à payer : {remainingAmount > 0 ? remainingAmount : 0}{" "}
                    Ar
                  </h4>
                  <h4>À rendre : {changeToGive} Ar</h4>
                </div>
              </div>
            )}

            <div className="billetage-confirm">
              <button onClick={handleConfirmClick}>Confirmer</button>
            </div>

            {error && <div className="error-message">{error}</div>}
          </div>
        </div>
      )}
    </form>
  </div>
  );
};

export default FactureForm;
// const style={
//   label :{
//     outline:'none',
//     border: 'none',
//     background:'transparent',
//     border: '2px solid gray',
//     color:'white'
//   }
// }
