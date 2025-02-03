const express = require('express');
const router = express.Router();
const Facture = require('../models/Factures');
const Machine = require('../models/machines');
const Product = require('../models/Products');
const Client = require('../models/client'); 
const Historique = require('../models/Historique');
const Article = require('../models/article');
const mongoose = require('mongoose');
const Caisse = require('../models/caisse');
const Payment = require('../models/Payement');
const Compteur = require('../models/compteurMachine');
const ProductHistory = require('../models/ProductHistorique');
const HistoriqueCaisse = require('../models/HistoriqueCaisse'); 

const authMiddleware = require('../middleware/authMiddleware');
// Créer une nouvelle facture
// routes/factures.js


router.post('/',authMiddleware, async (req, res) => {
  const { customerName,contact, machines, products, articles, totalWeight, totalPrice,reste, serviceType, quantities, articleDetails, etat, machineWeights } = req.body;
  console.log('Request Body:', req.body);

  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0)); // Début de la journée
  const endOfDay = new Date(today.setHours(23, 59, 59, 999)); // Fin de la journée

  try {
   // const machineIds = machines.map(machine => machine.machineId);

    // Récupérez les machines depuis la base de données
    const selectedMachines = []
    
    const selectedProducts = []
    
   const articleIds = articles.map(article => article.articleId);
    const selectedArticles = await Article.find({ _id: { $in: articleIds } });
    let totalWeightAssigned = 0;
    // Validation des détails des articles
  //   if (!selectedMachines || selectedMachines.length === 0) {
  //     console.log('Aucune machine trouvée avec les IDs fournis:', machineIds);
  // } else {
  //     console.log('Machines sélectionnées:', selectedMachines);
  // }
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

    const latestFacture = await Facture.findOne().sort({ ticketNumber: -1 });

    // Déterminer le prochain numéro de ticket
    const ticketNumber = latestFacture ? latestFacture.ticketNumber + 1 : 1;


    // Filtrer les prix pour chaque type d'article
     
    
    // Vérifier les machines disponibles et la capacité
    for (let machineId of machines) {
      const machine = await Machine.findById(machineId);
      // if (!machine || machine.etat !== 'Disponible') {
      //   return res.status(400).json({ error: `Machine ${machineId} non disponible ou non trouvée.` });
      // }
      
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
    const filteredArticles = articleDetails.map(detail => {
      const machine = selectedMachines.find(m => m._id.toString() === detail.machineId);
      const article = selectedArticles.find(a => a._id.toString() === detail.articleId);
  
      if (!article || !machine) return null;
      if (machine.type === 'Sèche-linge') {
      //  console.log('Machine non valide, uniquement les lave-linges sont acceptés:', machine);
        return null; // Ignore les sèche-linges
      }
  
      return {
          articleId: article._id,  // Doit être un ObjectId
          machineId: machine._id    // Doit être un ObjectId
      };
  }).filter(detail => detail !== null); // Supprime les valeurs nulles

// Filtrez les détails des articles
// Supposons que vous ayez récupéré selectedArticles et selectedMachines comme auparavant

const filteredArticleDetails = articleDetails.map(detail => {
  // Vérifiez les machines et les articles correspondants
  const machine = selectedMachines.find(m => m._id.toString() === detail.machineId.toString());
  const article = selectedArticles.find(a => a._id.toString() === detail.articleId.toString());

  // Vérifiez que l'article et la machine existent
  if (!article || !machine) {
     // console.log('Article ou machine non trouvés pour', detail);
      return null; // Retournez null si l'un des deux n'est pas trouvé
  }
  if (machine.type === 'Sèche-linge') {
   // console.log('Machine non valide, uniquement les lave-linges sont acceptés:', machine);
    return null; // Ignore les sèche-linges
  }

  // Filtrer les prix basés sur le type
  // const prices = detail.prices.filter(price => price.priceType === article.type);
    const prices = detail.prices.filter(price => article.type === detail.type);
   // const prices = detail.prices.filter(price => price.priceType === article.type);


  // Vérifiez que des prix sont disponibles
  if (prices.length === 0) {
      console.log('Aucun prix trouvé pour l\'article:', article._id, 'et la machine:', machine._id);
      return null; // Si aucun prix n'est trouvé, retournez null
  }

  return {
      articleId: article._id,
      machineId: machine._id,
      type: article.type,
      prices: prices // Renvoie uniquement les prix valides
  };
}).filter(detail => detail !== null); // Filtrer les nulls

// Log du résultat final avant enregistrement
console.log('Filtered Article Details avant enregistrement:', filteredArticleDetails);
const userId = req.user._id;

    
    // Créer la facture
    const newFacture = new Facture({
      customerName,
      contact,
      machines: selectedMachines.map(m => m._id),
      products: selectedProducts.map(p => p._id),
     // articles: selectedArticles.map(a => a._id),
      articles: filteredArticles,
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
      user:userId,
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
   // Mettre à jour le stock des produits et enregistrer dans ProductHistory
for (let productId of products) {
  const requestedQuantity = quantities[productId];

  // Récupérer le produit actuel pour ses détails
  const product = await Product.findById(productId);
  if (!product) {
    throw new Error(`Produit avec ID ${productId} introuvable.`);
  }

  // Calculer le stock restant
  const newStock = product.stock - requestedQuantity;

  // Vérifier que le stock ne devient pas négatif
  if (newStock < 0) {
    throw new Error(`Le stock pour le produit "${product.name}" est insuffisant.`);
  }

  // Mettre à jour le stock dans la collection Product
  await Product.findByIdAndUpdate(productId, { $inc: { stock: -requestedQuantity } });

  // Ajouter une entrée dans ProductHistory
  const productHistory = new ProductHistory({
    product: productId,
    date: new Date(),
    stockChange: -requestedQuantity, // Quantité déduite
    remainingStock: newStock,       // Stock restant après modification
    totalSpent: requestedQuantity * product.price, // Montant total dépensé pour cette réduction
    type: 'deduction', 
    source : "Facture",            // Type de modification (déduction)
  });

  await productHistory.save();
}

    
    res.status(201).json(newFacture);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id',authMiddleware, async (req, res) => {
  const factureId = req.params.id;
  const { customerName,contact, machines, products,articles, totalWeight, totalPrice,reste, serviceType, quantities,articleDetails, etat, machineWeights } = req.body;

  console.log('Update Request:', req.body);

  try {
    const existingFacture = await Facture.findById(factureId);
    if (!existingFacture) {
      return res.status(404).json({ error: 'Facture non trouvée.' });
    }

    const selectedMachines = [];
    const selectedProducts = [];
    const articleIds = articles.map(article => article.articleId);
     const selectedArticles = await Article.find({ _id: { $in: articleIds } });
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

    const filteredArticles = articleDetails.map(detail => {
      const machine = machines.find(m => m.toString() === detail.machineId);
      const article = selectedArticles.find(a => a._id.toString() === detail.articleId);
    
      if (!article || !machine) return null;
      if (machine.type === 'Sèche-linge') {
       // console.log('Machine non valide, uniquement les lave-linges sont acceptés:', machine);
        return null; // Ignore les sèche-linges
      }
    
      return {
        articleId: new mongoose.Types.ObjectId(article),// Ensure ObjectId type
        machineId: new mongoose.Types.ObjectId(machine) // Use 'new' keyword here
      };
    }).filter(detail => detail !== null);
    
    const filteredArticleDetails = articleDetails.map(detail => {
      const machine = machines.find(m => m.toString() === detail.machineId);
      const article = selectedArticles.find(a => a._id.toString() === detail.articleId);
    
      if (!article || !machine) return null;
      if (machine.type === 'Sèche-linge') {
       // console.log('Machine non valide, uniquement les lave-linges sont acceptés:', machine);
        return null; // Ignore les sèche-linges
      }
    
      const prices = detail.prices.filter(price => article.type === detail.type);
      if (prices.length === 0) {
        console.log('Aucun prix trouvé pour l\'article:', article._id, 'et la machine:', machine);
        return null;
      }
    
      return {
        articleId: new mongoose.Types.ObjectId(article), // Ensure ObjectId type
        machineId: new mongoose.Types.ObjectId(machine), // Use 'new' keyword here
        type: article.type,
        prices: prices
      };
    }).filter(detail => detail !== null);
    
    // Vérifier les machines disponibles et la capacité
    if (serviceType !== 'produit') {
      for (let machineId of machines) {
        const machine = await Machine.findById(machineId);
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
      // Récupérer le produit pour obtenir les détails actuels
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error(`Produit ${productId} introuvable.`);
      }
    
      const newStock = product.stock + adjustment;
    
      // Mettre à jour le stock dans la collection Product
      await Product.findByIdAndUpdate(productId, { $inc: { stock: adjustment } });
    
      // Enregistrer l'ajustement dans ProductHistory
      const productHistory = new ProductHistory({
        product: productId,
        date: new Date(),
        stockChange: adjustment, // Quantité ajustée (positive ou négative)
        remainingStock: newStock, // Stock restant après ajustement
        totalSpent: adjustment < 0 ? Math.abs(adjustment) * product.price : undefined, // Calculer les dépenses pour les réductions
        type: adjustment > 0 ? "addition" : "deduction", // Déterminer le type d'ajustement
        source : "Facture",
      });
    
      await productHistory.save();
    }

    
    const userId = req.user._id;
    // Mettre à jour la facture
    existingFacture.customerName = customerName;
    existingFacture.contact = contact;
    existingFacture.machines = selectedMachines.map(m => m._id);
    existingFacture.products = selectedProducts.map(p => p._id);
    existingFacture.articles = filteredArticles;
    existingFacture.totalWeight = totalWeight;
    existingFacture.totalPrice = totalPrice;
    existingFacture.reste = reste;
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
      user:userId,
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
router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  try {
    // Trouver la facture à supprimer
    const facture = await Facture.findById(id);
    if (!facture) {
      return res.status(404).json({ error: 'Facture non trouvée.' });
    }

    // // Vérifier si l'utilisateur est autorisé à supprimer cette facture
    // if (facture.userId !== userId) {
    //   return res.status(403).json({ error: 'Vous n\'êtes pas autorisé à supprimer cette facture.' });
    // }

    // Remettre les machines en état "Disponible"
    await Machine.updateMany({ _id: { $in: facture.machines } }, { $set: { etat: 'Disponible' } });

    // Supprimer la facture
    await Facture.findByIdAndDelete(id);

    // Ajouter l'entrée dans l'historique
    await Historique.create({
      entityType: 'Facture',
      entityId: id,
      user: userId,
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
    //  // Ajouter l'entrée dans l'historique
    //  const factures = Facture.findById(id);
    // //  await Historique.create({
    // //   entityType: 'Facture',
    // //   entityId: id,
    // //   action: 'Facture payé',
    // //   details: `Facture avec avec somme de ${factures.totalPrice} payé`,
    // // });
    res.json(facture);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.get('/details', async (req, res) => {
  try {
    //const factures = await Facture.find({ etat: "encaisser" })
    const factures = await Facture.find()
      .populate({
        path: 'machines',
        model: 'Machine',
        select: 'modelNumber type etat',
      })
      .lean();

    // Structurer les données et compter les occurrences des machines
    const detailedFactures = factures.flatMap(facture => {
      // Créer une map pour compter les machines
      const machineCount = facture.machines.reduce((acc, machine) => {
        acc[machine._id] = (acc[machine._id] || 0) + 1; // Compter les occurrences de chaque machine
        return acc;
      }, {});

      return facture.machines.map(machine => {
        return {
          factureId: facture._id,
          reference: facture.reference,
          client : facture.customerName,
          date: facture.createdAt,
          machineId: machine._id,
          machineModelNumber: machine.modelNumber,
          machineType: machine.type,
          machineEtat: machine.etat,
          ticketNumber: facture.ticketNumber,
          nombreMachine: machineCount[machine._id], // Nombre d'occurrences pour cette machine
        };
      });
    });

    res.json(detailedFactures);
  } catch (error) {
    console.error("Erreur dans /factures-details : ", error.message);
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
// Route pour récupérer toutes les factures, avec détails des machines
router.get("/", async (req, res) => {
  try {
    const factures = await Facture.find()
      .populate('machines', 'modelNumber'); // Peuple le champ 'machines' avec 'modelNumber'

    res.json(factures);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }

});


// Exemple d'implémentation dans le backend Express
router.get("/last-ticket", async (req, res) => {
  try {
    // Trouver la facture avec le plus grand numéro de ticket
    const latestFacture = await Facture.findOne().sort({ ticketNumber: -1 });

    if (!latestFacture) {
      // Si aucune facture n'est trouvée, retourner le numéro de ticket initial
      return res.status(200).json({ ticketNumber: 1 });
    }

    // Retourner le dernier numéro de ticket
    res.status(200).json({ ticketNumber: latestFacture.ticketNumber });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération du dernier ticket" });
  }
});


router.post('/cancel/:id', authMiddleware, async (req, res) => {
  const factureId = req.params.id;
  console.log("ID reçu pour annulation :", factureId);

  try {
    // 1. Récupérer la facture
    const facture = await Facture.findById(factureId);
    if (!facture) {
      console.log("Facture non trouvée :", factureId);
      return res.status(404).json({ error: "Facture non trouvée." });
    }

    if (facture.etat === 'annulée') {
      return res.status(400).json({ error: "Cette facture est déjà annulée." });
    }

    // 2. Mettre à jour les machines pour les rendre disponibles
    await Machine.updateMany(
      { _id: { $in: facture.machines } },
      { $set: { etat: 'Disponible' } }
    );

    // 3. Restaurer les produits dans le stock
    for (let product of facture.quantities) {
      const { productId, quantity } = product;
    
      // Récupérer les détails du produit avant la mise à jour
      const productDetails = await Product.findById(productId);
      const currentStock = productDetails.stock; // Stock actuel avant restauration
    
    //  console.log(`Produit ID: ${productId}, Stock actuel: ${currentStock}, Quantité à restaurer: ${quantity}`);
    
      // Restaurer le stock utilisé
      const newStock = currentStock + quantity;
    
      // Mettre à jour le stock
      await Product.findByIdAndUpdate(productId, {
        $inc: { stock: quantity }
      });
   //   console.log(`Produit ID: ${productId}, Nouveau stock après restauration: ${newStock}, Quantité restaurée: ${quantity}`);
    
      // Enregistrer l'historique du produit
      await ProductHistory.create({
        product: productId,
        date: new Date(),
        stockChange: quantity, // Quantité restaurée
        remainingStock: newStock,
        type: "addition", // Type d'ajustement
        source: "Facture",
      });
    }
    

    // 4. Mettre à jour l'état de la facture
    facture.etat = 'annulée';
    await facture.save();

    // 5. Récupérer les paiements associés à la facture
    const payments = await Payment.find({ facture: facture._id });

    for (let payment of payments) {
      for (let historique of payment.historique) {
        // 1. Récupérer la caisse associée
        const caisse = await Caisse.findById(historique.caisse);
        if (!caisse) {
          return res.status(404).json({ error: "Caisse non trouvée." });
        }
    
        // 2. Restaurer le montant dans la caisse
        const montantRestauré = -historique.montant; // Montant négatif pour indiquer le retrait
        await Caisse.findOneAndUpdate(
          { _id: caisse._id },
          { $inc: { solde: montantRestauré } }, // Ajouter le montant restauré (négatif)
          { new: true }
        );
    
      //  console.log(`Après mise à jour, caisse.solde = ${updatedCaisse.solde}`);
    
        // 3. Ajouter à l'historique global de la caisse
        await HistoriqueCaisse.create({
          caisse: caisse._id,
          type: "Ajout",
          action: "Annulation de paiement",
          montant: montantRestauré, // Montant négatif
          date: new Date(),
          motif: "Facture Restauré",
        });
    
        // 4. Mettre à jour l'historique interne de la caisse
        caisse.historique.push({
          action: `Retrait de ${Math.abs(montantRestauré)} du solde`,
          type: "Ajout",
          montant: montantRestauré, // Montant négatif
          date: new Date(),
        });
    
        await caisse.save();
    
        // 5. Mettre à jour l'historique du paiement
        historique.action = "Annulation de paiement";
        historique.date = new Date();
        await payment.save();
      }
    }
    

    // 7. Enregistrer l'historique pour l'annulation de la facture
    await Historique.create({
      entityType: 'Facture',
      entityId: facture._id,
      action: 'Facture annulée et paiements restaurés',
      user: req.user._id,
      details: `Annulation de la facture avec retour des montants de paiement dans la caisse.`,
      date: new Date()
    });

    res.status(200).json({
      message: 'Facture annulée, paiements restaurés, stocks et machines mis à jour.',
      facture
    });
  } catch (error) {
    console.error("Erreur lors de l'annulation de la facture :", error.message);
    res.status(500).json({ error: error.message });
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
router.get('/listPar/:id', async (req, res) => {
  try {
    const facture = await Facture.findById(req.params.id)
      .populate('machines')
      .populate('products')
      .populate('articles.articleId')
      .populate('articles.machineId')
      .populate('articleDetails.articleId')
      .populate('articleDetails.machineId');
    res.status(200).json(facture);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération de la facture.' });
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
