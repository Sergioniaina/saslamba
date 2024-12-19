const express = require("express");
const multer = require("multer");
const path = require("path");
const Product = require("../models/Products");
const Historique = require("../models/Historique");
const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/User");
const router = express.Router();
const checkPermission = require('../middleware/checkPermission');
const ProductHistory = require('../models/ProductHistorique');

// Configuration de multer pour le stockage des fichiers
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Dossier où les fichiers seront stockés
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Nom unique pour chaque fichier
  },
});

// Initialisation de multer
const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 5 }, // Limite de 5 Mo
  fileFilter: function (req, file, cb) {
    const fileTypes = /jpeg|jpg|png/;
    const extname = fileTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = fileTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error("Seules les images (jpeg, jpg, png) sont acceptées."));
    }
  },
});

// Route avec les middlewares
router.get("/", authMiddleware, checkPermission("produits", "list"), async (req, res) => {
  try {
    console.log("Accès autorisé - Récupération des produits");
    const products = await Product.find().sort({ date: -1 });
    res.json(products);
  } catch (error) {
    console.error("Erreur lors de la récupération des produits:", error);
    res.status(500).json({ error: error.message });
  }
});
// Get products with optional search parameter
router.get("/search", async (req, res) => {
  try {
    const { search } = req.query;
    const query = search
      ? {
          $or: [
            { name: new RegExp(search, "i") },
            { description: new RegExp(search, "i") },
          ],
        }
      : {};
    const products = await Product.find(query).sort({ date: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create or update a product with photo upload
router.post("/",authMiddleware,checkPermission('produits', 'add'), upload.single("photo"), async (req, res) => {
  const { name, price, description, date, stock } = req.body;
  const photo = req.file ? req.file.path : null; // Si la photo est téléchargée
  const userId = req.user._id;
  try {
    let existingProduct = await Product.findOne({
      name: name,
      price: price,
      description: description,
    });

    if (existingProduct) {
      existingProduct.stock += parseInt(stock, 10);
      existingProduct.price = price;
      existingProduct.description = description;
      existingProduct.date = date;
      if (photo) existingProduct.photo = photo; // Met à jour la photo si elle est fournie
      await existingProduct.save();

      return res
        .status(200)
        .json({
          message: "Product updated successfully",
          product: existingProduct,
        });
    } else {
      const newProduct = new Product({
        name,
        price,
        description,
        date,
        stock: stock || 1,
        photo, // Ajout de la photo
      });
      await newProduct.save();

      // Ajout d'un historique
      const newHistorique = new Historique({
        action: "Ajout de produit",
        entityType: "Product",
        entityId: newProduct._id,
        user: userId,
        date: new Date(),
        details: `Le produit ${name} a été ajouté avec un stock de ${newProduct.stock}.`,
      });
      await newHistorique.save();

      return res
        .status(201)
        .json({ message: "Product added successfully", product: newProduct });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a product
router.put("/:id", authMiddleware, checkPermission('produits', 'edit'), upload.single("photo"), async (req, res) => {
  const { id } = req.params;
  const { name, price, description, stock, date,source } = req.body;
  const photo = req.file ? req.file.path : null;
  const userId = req.user._id;

  try {
    // Récupérer le produit actuel pour conserver l'ancienne image si aucune nouvelle image n'est fournie
    const currentProduct = await Product.findById(id);
    const currentUser = await User.findById(userId);

    if (!currentProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Préparer les mises à jour et stock actuel
    const updateData = {
      name,
      price,
      description,
      stock: parseInt(stock, 10),
      date,
      photo: photo || currentProduct.photo,
    };

    const stockAvant = currentProduct.stock; // Stock avant modification
    
    const stockApres = parseInt(stock, 10); // Stock après modification
    const stockEntrer = stockApres-stockAvant;

    // Mettre à jour le produit
    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    const productHistory = new ProductHistory({
      product: updatedProduct._id,
      date: new Date(),
      stockChange: stockEntrer,
      remainingStock: stockApres,
      totalSpent: stockEntrer < 0 ? Math.abs(stockEntrer) * currentProduct.price : undefined, // Calcul du total dépensé si stock déduit
      type: stockEntrer >= 0 ? "addition" : "deduction", // Définir si c'est une addition ou une déduction
      source : source,
    });
    await productHistory.save();

    // Enregistrer l'historique
    const newHistorique = new Historique({
      action: "Mise à jour",
      entityType: "Product",
      entityId: updatedProduct._id,
      user: userId,
      date: new Date(),
      details: `Le produit ${currentProduct.name} a été mis à jour par ${currentUser.name}. Stock avant: ${stockAvant},Entrer: ${stockEntrer}, Stock après: ${stockApres}`,
    });
    await newHistorique.save();

    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a product by ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a product
router.delete("/:id",authMiddleware, checkPermission('produits', 'delete'), async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;
  try {
    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const newHistorique = new Historique({
      action: "Suppression de produit",
      entityType: "Product",
      entityId: id,
      user:userId,
      date: new Date(),
      details: `Le produit ${product.name} a été supprimé.`,
    });
    await newHistorique.save();

    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update stock for selected products
router.post("/update-stock", authMiddleware, async (req, res) => {
  const { stockUpdates } = req.body;
  const userId = req.user._id;

  try {
    for (let update of stockUpdates) {
      const product = await Product.findById(update.id);
      if (product) {
        const stockAvant = product.stock; // Stock avant la modification
        const stockApres = stockAvant + parseInt(update.quantity, 10); // Nouveau stock après mise à jour
        const stockEntrer = parseInt(update.quantity, 10); // La différence de stock entré

        // Mise à jour du stock du produit
        product.stock = stockApres;
        await product.save();
        const productHistory = new ProductHistory({
          product: product._id,
          date: new Date(),
          stockChange: stockEntrer,
          remainingStock: stockApres,
          totalSpent: stockEntrer < 0 ? Math.abs(stockEntrer) * product.price : undefined, // Calcul du total dépensé si stock déduit
          type: stockEntrer >= 0 ? "addition" : "deduction", // "addition" ou "deduction"
          source : "Entrer en stock"
        });
        await productHistory.save();

        // Enregistrement de l'historique
        const currentUser = await User.findById(userId);
        const newHistorique = new Historique({
          action: 'Entrer en stock',
          entityType: 'Product',
          entityId: product._id,
          user: userId,
          date: new Date(),
          details: `Mise à jour du stock pour le produit ${product.name} :
            - Stock avant : ${stockAvant}
            - Stock après : ${stockApres}
            - Stock entré : ${stockEntrer}
            - Action effectuée par : ${currentUser.name}`,
        });
        await newHistorique.save();
      }
    }

    res.status(200).json({ message: "Stock updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;
