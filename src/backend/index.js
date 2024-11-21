const mongoose = require('mongoose');
require('dotenv').config();
const { exec } = require('child_process');
const path = require('path');
const net = require('net');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true); // Port utilisé
      } else {
        resolve(false); // Autre erreur
      }
    });
    server.once('listening', () => {
      server.close();
      resolve(false); // Port libre
    });
    server.listen(port);
  });
}

// Fonction pour libérer un port
function killPort(port) {
  return new Promise((resolve, reject) => {
    exec(`netstat -ano | findstr :${port}`, (err, stdout) => {
      if (err || !stdout) {
        console.log(`Port ${port} est déjà libre ou introuvable.`);
        return resolve(); // Aucun processus sur ce port
      }

      const lines = stdout.trim().split('\n');
      const pidLine = lines.find((line) => line.includes(`:${port}`));
      if (pidLine) {
        const parts = pidLine.trim().split(/\s+/);
        const pid = parts[parts.length - 1];

        console.log(`Port ${port} est utilisé par le processus PID ${pid}. Tentative de libération...`);

        exec(`taskkill /PID ${pid} /F`, (killErr) => {
          if (killErr) {
            console.error(`Impossible de tuer le processus PID ${pid}:`, killErr);
            return reject(killErr);
          }
          console.log(`Processus PID ${pid} sur le port ${port} a été arrêté.`);
          resolve();
        });
      } else {
        console.log(`Aucun processus trouvé sur le port ${port}.`);
        resolve();
      }
    });
  });
}

// Fonction pour trouver un port libre
async function findAvailablePort(startPort) {
  let port = startPort;
  while (await isPortInUse(port)) {
    console.log(`Port ${port} utilisé. Tentative avec le port ${port + 1}...`);
    await killPort(port); // Tenter de libérer le port avant de passer au suivant
    port++;
  }
  return port;
}

// Fonction pour lancer le frontend sur un port spécifique
function launchFrontend(frontendPath, port, restartOnFailure = true) {
  console.log(`Lancement du frontend sur le port ${port}...`);
  const command = `npx cross-env PORT=${port} npm start`;

  const child = exec(command, { cwd: frontendPath, shell: true });

  child.stdout.on('data', (data) => {
    console.log(data.toString());
  });

  child.stderr.on('data', (data) => {
    console.error(data.toString());
  });

  child.on('close', async (code) => {
    console.log(`Frontend s'est terminé avec le code ${code}`);

    // Vérifier si le port est encore utilisé après la fermeture
    if (await isPortInUse(port)) {
      console.log(`Le port ${port} est toujours utilisé après la fermeture. Tentative de libération.`);
      await killPort(port);
    }

    if (restartOnFailure || await isPortInUse(port)) {
      console.log(`Redémarrage du frontend après échec ou port toujours utilisé.`);
      const newPort = await findAvailablePort(port);
      launchFrontend(frontendPath, newPort, false); // Ne pas boucler indéfiniment
    }
  });
}

// Fonction pour démarrer le frontend
function startFrontend() {
  const frontendPath = path.join(__dirname, '../../'); // Chemin vers le frontend
  const defaultPort = 3000;

  findAvailablePort(defaultPort)
    .then((availablePort) => {
      console.log(`Port disponible trouvé: ${availablePort}`);
      launchFrontend(frontendPath, availablePort);
    })
    .catch((err) =>
      console.error('Erreur lors de la recherche d’un port libre pour le frontend:', err)
    );
}
// Fonction pour vérifier et démarrer MongoDB sous Windows
function checkAndStartMongoDB() {
  return new Promise((resolve, reject) => {
    console.log('Vérification de MongoDB...');
    exec('sc query MongoDB', (err, stdout, stderr) => {
      if (err || stderr) {
        console.error('Erreur lors de la vérification de MongoDB:', err || stderr);
        return reject(err || stderr);
      }

      if (stdout.includes('STATE              : 4  RUNNING')) {
        console.log('MongoDB est déjà en cours d’exécution.');
        resolve();
      } else {
        console.log('MongoDB n’est pas en cours d’exécution. Démarrage...');
        exec('net start MongoDB', (startErr, startStdout, startStderr) => {
          if (startErr || startStderr) {
            console.error('Erreur lors du démarrage de MongoDB:', startErr || startStderr);
            return reject(startErr || startStderr);
          }
          console.log('MongoDB démarré avec succès.');
          resolve();
        });
      }
    });
  });
}

// Fonction pour vérifier et libérer un port sous Windows
function ensurePortAvailable(port) {
  return new Promise((resolve, reject) => {
    exec(`netstat -ano | findstr :${port}`, (err, stdout) => {
      if (err || !stdout) {
        console.log(`Port ${port} est libre.`);
        return resolve();
      }

      const lines = stdout.trim().split('\n');
      const pidLine = lines.find((line) => line.includes(`:${port}`));
      if (pidLine) {
        const parts = pidLine.trim().split(/\s+/);
        const pid = parts[parts.length - 1];

        console.log(`Port ${port} est utilisé par le processus PID ${pid}. Tentative de libération...`);

        exec(`taskkill /PID ${pid} /F`, (killErr) => {
          if (killErr) {
            console.error(`Impossible de tuer le processus PID ${pid}:`, killErr);
            return reject(killErr);
          }
          console.log(`Processus PID ${pid} sur le port ${port} a été arrêté.`);
          resolve();
        });
      } else {
        console.log(`Aucun processus trouvé sur le port ${port}.`);
        resolve();
      }
    });
  });
}

// Initialisation et démarrage
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connecté à MongoDB');
    return checkAndStartMongoDB();
  })
  .then(() => ensurePortAvailable(PORT))
  .then(() => {
    const app = express();

    // Middlewares
    app.use(cors());
    app.use(bodyParser.json());
    app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
    app.use('/logo', express.static(path.join(__dirname, 'logo')));
    app.use('/uploadUser', express.static(path.join(__dirname, 'uploadUser')));
    app.use('/default_images', express.static(path.join(__dirname, 'default_images')));
    app.use('/machine', express.static(path.join(__dirname, 'machine')));

    // Routes
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

    // Démarrage du backend
    app.listen(PORT, () => {
      console.log(`Serveur backend démarré sur le port ${PORT}`);
      startFrontend(); // Démarrage du frontend après le backend
    });
  })
  .catch((err) => console.error('Erreur lors du démarrage:', err));
