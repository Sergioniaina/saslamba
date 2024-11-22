// routes/companyInfo.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const CompanyInfo = require('../models/logo'); // Assurez-vous que le nom du modèle est correct

const router = express.Router();

// Configuration de Multer pour les fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'logo/'); // Dossier de destination des fichiers
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Renommer les fichiers pour éviter les conflits
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 5 }, // Limite à 5 Mo
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true); // Fichier valide
    } else {
      cb(new Error('Seules les images (JPEG, JPG, PNG) sont acceptées.'));
    }
  },
});

// Route pour ajouter ou mettre à jour les informations de l'entreprise
router.post('/add', upload.single('photo'), async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const photoPath = req.file?.path || null;

    let companyInfo = await CompanyInfo.findOne();

    if (!companyInfo) {
      // Créer une nouvelle entreprise si aucune entrée existante
      companyInfo = new CompanyInfo({
        name, phone, address, photo: photoPath
      });
    } else {
      // Mettre à jour les informations de l'entreprise existante
      companyInfo.name = name || companyInfo.name;
      companyInfo.phone = phone || companyInfo.phone;
      companyInfo.address = address || companyInfo.address;
      companyInfo.photo = photoPath || companyInfo.photo;
    }

    await companyInfo.save();
    res.status(201).json({ message: 'Informations mises à jour avec succès', data: companyInfo });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Route pour ajouter une nouvelle entreprise
router.post('/ajout', upload.single('photo'), async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const photoPath = req.file?.path || null;

    // Créer une nouvelle entreprise et l'ajouter à la base de données
    const companyInfo = new CompanyInfo({
      name, phone, address, photo: photoPath
    });

    await companyInfo.save();
    res.status(201).json({ message: 'Entreprise ajoutée avec succès', data: companyInfo });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Route pour récupérer les informations de l'entreprise
router.get('/', async (req, res) => {
  try {
    const companyInfo = await CompanyInfo.find();
    if (!companyInfo) {
      return res.status(404).json({ message: 'Aucune information trouvée.' });
    }
    res.status(200).json(companyInfo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.get('/list', async (req, res) => {
    try {
      const companyInfoList = await CompanyInfo.find(); // Récupère toutes les entrées de la collection CompanyInfo
      if (companyInfoList.length === 0) {
        return res.status(404).json({ message: 'Aucune information trouvée.' });
      }
      res.status(200).json(companyInfoList);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

// Route pour mettre à jour les informations de l'entreprise
router.put('/update', upload.single('photo'), async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const photoPath = req.file?.path || null;

    const companyInfo = await CompanyInfo.findOne();

    if (!companyInfo) {
      return res.status(404).json({ error: 'Aucune information trouvée pour mise à jour.' });
    }

    // Mise à jour des champs
    companyInfo.name = name || companyInfo.name;
    companyInfo.phone = phone || companyInfo.phone;
    companyInfo.address = address || companyInfo.address;
    companyInfo.photo = photoPath || companyInfo.photo;

    await companyInfo.save();
    res.status(200).json({ message: 'Informations mises à jour avec succès', data: companyInfo });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await CompanyInfo.findByIdAndDelete(id);
    res.json({ message: 'Article supprimé avec succès' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Route pour supprimer les informations de l'entreprise
router.delete('/delete', async (req, res) => {
  try {
    const companyInfo = await CompanyInfo.findOne();

    if (!companyInfo) {
      return res.status(404).json({ error: 'Aucune information trouvée à supprimer.' });
    }

    // Supprimer le fichier associé (photo)
    if (companyInfo.photo) {
      fs.unlinkSync(companyInfo.photo); // Supprimer le fichier photo
    }

    // Supprimer l'entrée de la base de données
    await CompanyInfo.deleteOne({ _id: companyInfo._id });

    res.status(200).json({ message: 'Informations supprimées avec succès.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
