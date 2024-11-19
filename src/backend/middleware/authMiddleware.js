const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware pour l'authentification avec gestion de l'expiration et régénération de token.
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Vérification de la présence du token dans les en-têtes
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Accès refusé : token manquant ou format incorrect.' });
    }

    // Extraction du token
    const token = authHeader.split(' ')[1];

    let decoded;

    try {
      // Vérification et décodage du token
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        // Décoder le token expiré pour accéder au payload
        decoded = jwt.decode(token);

        if (!decoded || !decoded.id) {
          return res.status(401).json({ message: 'Token expiré et non décodable. Veuillez vous reconnecter.' });
        }

        // Générer un nouveau token avec une durée de 24 heures
        const newToken = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.setHeader('Authorization', `Bearer ${newToken}`);
        return res.status(401).json({ message: 'Token expiré. Un nouveau token a été généré.', newToken });
      }

      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Token invalide.' });
      }

      throw error;
    }

    // Recherche de l'utilisateur associé dans la base de données
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    // Vérifiez si l'utilisateur est actif
    if (user.isActive === false) {
      return res.status(403).json({ message: 'Compte utilisateur désactivé.' });
    }

    // Attachez l'utilisateur et le token à la requête
    req.user = user;

    // Passez au middleware suivant
    next();
  } catch (error) {
    console.error('Erreur d\'authentification :', error);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
};

module.exports = authMiddleware;
