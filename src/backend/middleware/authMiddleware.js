const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    // Vérification de la présence du token dans les en-têtes de la requête
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Accès refusé : token manquant ou format incorrect.' });
    }

    // Extraction du token après "Bearer "
    const token = authHeader.split(' ')[1];

    // Décodage et vérification du token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Recherche de l'utilisateur dans la base de données
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    // Vérifiez si l'utilisateur est actif (si vous avez un champ `isActive`)
    if (user.isActive === false) {
      return res.status(403).json({ message: 'Compte utilisateur désactivé.' });
    }

    // Attachement de l'utilisateur à la requête
    req.user = user;

    // Passage au middleware suivant
    next();
  } catch (error) {
    // Gestion des erreurs spécifiques de JWT
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expiré. Veuillez vous reconnecter.' });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token invalide.' });
    }

    // Autres erreurs éventuelles
    console.error('Erreur d\'authentification:', error);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
};

module.exports = authMiddleware;
