const express = require('express');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const authMiddleware = require('../middleware/authMiddleware');
const authRole = require('../middleware/authRole');
const router = express.Router();
const bcrypt = require('bcryptjs');
// Configuration de multer pour les téléchargements de photos de profil
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploadUser/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 5 }, // Limite de 5 Mo
  fileFilter: function (req, file, cb) {
    const fileTypes = /jpeg|jpg|png/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Seules les images (jpeg, jpg, png) sont acceptées.'));
    }
  },
});

// Route pour l'inscription
router.post('/signup', upload.single('photo'), async (req, res) => {
  const { name, password, role } = req.body;
  let photo = req.file ? req.file.path : null;

  try {
    // Définir une image par défaut si aucune photo n'est fournie
    if (!photo) {
      photo = role === 'admin' ? 'default_images/admin_default.jpg' : 'default_images/user_default.jpg';
    }

    // subRole est laissé à null par défaut
    const user = new User({ name, password, role, subRole: null, photo });
    await user.save();

    res.status(201).json({ message: 'User registered successfully', user });
  } catch (error) {
    console.error('Error during signup:', error); // Log d'erreur
    res.status(500).json({ message: 'Server error', error });
  }
});
// Route pour la connexion
router.post('/login', async (req, res) => {
  const { name, password } = req.body;
  try {
    console.log('Login attempt for user:', name); // Log pour vérifier le nom d'utilisateur
    const user = await User.findOne({ name });
    console.log('Found user:', user); // Log pour voir l'utilisateur trouvé
    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id, role: user.role,subRole: user.subRole }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Renvoyer le token et les informations de l'utilisateur
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        photo: user.photo,
        role: user.role,
        subRole :user.subRole
      },
    });
  } catch (error) {
    console.error('Error during login:', error); // Log d'erreur
    res.status(500).json({ message: 'Server error', error });
  }
});

// Route pour obtenir les informations de l'utilisateur actuel
router.get('/users/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ user });
  } catch (error) {
    console.error('Error fetching current user:', error); // Log d'erreur
    res.status(500).json({ message: 'Server error', error });
  }
});

// Route pour la mise à jour du profil utilisateur
router.put('/users/me', authMiddleware, upload.single('photo'), async (req, res) => {
  const userId = req.user.id;
  const { name, password } = req.body;
  const photo = req.file ? req.file.path : null;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) user.name = name;
    if (password) {
      user.password = await bcrypt.hash(password, 10); // Hachage du nouveau mot de passe
    }
    if (photo) user.photo = photo;

    await user.save();
    res.status(200).json({ message: 'Profile updated successfully', user });
  } catch (error) {
    console.error('Error updating profile:', error); // Log d'erreur
    res.status(500).json({ message: 'Server error', error });
  }
});

// Routes pour la gestion des utilisateurs par l'admin
router.get('/users', authMiddleware, authRole('admin'), async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json({ users });
  } catch (error) {
    console.error('Error fetching users:', error); // Log d'erreur
    res.status(500).json({ message: 'Server error', error });
  }
});

// Route pour créer un nouvel utilisateur
router.post('/users', authMiddleware, authRole('admin'), upload.single('photo'), async (req, res) => {
  const { name, password, role } = req.body;
  let photo = req.file ? req.file.path : null;

  try {
    if (!photo) {
      photo = role === 'admin' ? 'default_images/admin_default.jpg' : 'default_images/user_default.jpg';
    }

    const user = new User({ name, password, role, photo });
    await user.save();
    res.status(201).json({ message: 'User created successfully', user });
  } catch (error) {
    console.error('Error creating user:', error); // Log d'erreur
    res.status(500).json({ message: 'Server error', error });
  }
});
router.post('/users/ajout', authMiddleware, authRole('admin'), upload.single('photo'), async (req, res) => {
  const { name, password, role, subRole } = req.body;
  let photo = req.file ? req.file.path : null;

  try {
    // Log des données pour débogage
    console.log('Request body:', req.body);
    console.log('Uploaded photo path:', photo);

    // Validation des rôles
    const validRoles = ['user', 'admin'];
    const validSubRoles = ['superAdmin', 'simpleAdmin', 'caissiere', 'magasinier', null];

    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role provided' });
    }

    if (!validSubRoles.includes(subRole)) {
      return res.status(400).json({ message: 'Invalid subRole provided' });
    }

    // Assignation d'une photo par défaut si nécessaire
    if (!photo) {
      photo = role === 'admin' ? 'default_images/admin_default.jpg' : 'default_images/user_default.jpg';
    }

    // Création de l'utilisateur
    const user = new User({ name, password, role, subRole, photo });
    await user.save();

    res.status(201).json({ message: 'User created successfully', user });
  } catch (error) {
    console.error('Error creating user:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation error', details: error.errors });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// Route pour mettre à jour un utilisateur
router.put('/users/:id', authMiddleware, authRole('admin'), upload.single('photo'), async (req, res) => {
  const { id } = req.params;
  const { name, password, role, subRole } = req.body;
  const photo = req.file ? req.file.path : null;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Mise à jour des champs uniquement s'ils sont fournis
    if (name) user.name = name;
    if (password) {
      user.password = await bcrypt.hash(password, 10); // Hachage du nouveau mot de passe
    }
    if (role) user.role = role;
    if (subRole) user.subRole = subRole; // Mise à jour du subRole si fourni
    if (photo) user.photo = photo;

    await user.save();

    res.status(200).json({ message: 'User updated successfully', user });
  } catch (error) {
    console.error('Error updating user:', error); // Log d'erreur
    res.status(500).json({ message: 'Server error', error });
  }
});

router.get('/get', async (req, res) => {
  const { ids } = req.query;
  try {
    const users = await User.find({ '_id': { $in: ids } }).select('name'); // Sélectionner seulement le champ 'name'
    res.json(users);
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs :', error);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
});

// Route pour supprimer un utilisateur
router.delete('/users/:id', authMiddleware, authRole('admin'), async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error); // Log d'erreur
    res.status(500).json({ message: 'Server error', error });
  }
});

// Route pour le contenu admin
router.get('/admin', authRole('admin'), (req, res) => {
  res.send('Admin content');
});

// Route pour vérifier le nombre d'admins
router.get('/admin-count', async (req, res) => {
  try {
    const adminCount = await User.countDocuments({ role: 'admin' });
    res.status(200).json({ adminCount });
  } catch (error) {
    console.error('Error fetching admin count:', error); // Log d'erreur
    res.status(500).json({ message: 'Server error', error });
  }
});

module.exports = router;
