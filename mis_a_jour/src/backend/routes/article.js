const express = require('express');
const router = express.Router();
const Article = require('../models/article');

// Récupérer tous les articles
router.get('/', async (req, res) => {
  try {
    const articles = await Article.find();
    res.json(articles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Ajouter un nouvel article
router.post('/', async (req, res) => {
  const { type, prices } = req.body;
  
  const newArticle = new Article({
    type,
    prices
  });

  try {
    const savedArticle = await newArticle.save();
    res.status(201).json(savedArticle);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Modifier un article existant
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { type, prices } = req.body;

  try {
    const updatedArticle = await Article.findByIdAndUpdate(
      id,
      { type, prices },
      { new: true }
    );
    res.json(updatedArticle);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Supprimer un article
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    await Article.findByIdAndDelete(id);
    res.json({ message: 'Article supprimé avec succès' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
