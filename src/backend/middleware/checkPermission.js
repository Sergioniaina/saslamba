const Privilege = require('../models/privilege');

const checkPermission = (resource, action) => {
    return async (req, res, next) => {
      try {
        // Vérifiez si req.user est défini
        if (!req.user) {
          console.log("req.user est undefined ou null"); // Log supplémentaire
          return res.status(401).json({ message: 'Utilisateur non authentifié.' });
        }
  
        const { role, subRole } = req.user;
  
        // Vérifiez si le rôle ou le sous-rôle sont absents
        if (!role || !subRole) {
          console.log("Rôle ou sous-rôle manquant dans req.user");
          return res.status(403).json({ message: 'Rôle ou sous-rôle manquant.' });
        }
  
        // Récupérer les privilèges correspondant au rôle et sous-rôle
        const privileges = await Privilege.findOne({ role, subRole });
  
        console.log("Utilisateur connecté - Rôle:", role, "Sous-rôle:", subRole);
        // console.log("Privilèges de l'utilisateur connecté:", privileges);
  
        // Vérifiez si la Map des permissions contient la ressource et l'action
        const resourcePermissions = privileges?.permissions?.get(resource);
  
        if (resourcePermissions && resourcePermissions.includes(action)) {
          // L'utilisateur a la permission pour cette action, continuez
          return next();
        } else if (resourcePermissions) {
          // L'utilisateur n'a pas la permission pour cette action, renvoyez une réponse
          console.log(`Action ${action} non autorisée pour cette ressource.`);
          return res.status(403).json({ message: `Action '${action}' non autorisée pour cette ressource.` });
        } else {
          // L'utilisateur n'a aucune permission pour cette ressource, renvoyez une erreur
          console.log("Permissions insuffisantes pour cette ressource.");
          return res.status(403).json({ message: 'Accès refusé. Permission insuffisante.' });
        }
      } catch (err) {
        console.error("Erreur lors de la vérification des permissions :", err);
        res.status(500).json({ message: 'Erreur lors de la vérification des permissions.' });
      }
    };
  };
  
  
module.exports = checkPermission;
