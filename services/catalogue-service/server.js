// =======================================================================
// MICROSERVICE CATALOGUES - PORT 3006
// =======================================================================
// Responsabilite : CRUD simple des catalogues avec MongoDB.
// Toutes les routes sont protegees par JWT.
// Routes :
//   GET    http://localhost:3006/catalogues
//   GET    http://localhost:3006/catalogues/:id
//   POST   http://localhost:3006/catalogues
//   PATCH  http://localhost:3006/catalogues/:id
//   DELETE http://localhost:3006/catalogues/:id
// =======================================================================

// Charge les variables d'environnement communes (.env a la racine).
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

// Dependances principales du service (API, securite, base de donnees).
const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Instance Express qui porte l'API catalogues.
const app = express();

// Permet de lire le JSON des requetes entrantes.
app.use(express.json());

// Autorise les appels du front et les headers utiles entre services.
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
  next();
});

// Schema MongoDB qui decrit la structure d'un catalogue.
const catalogueSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    createdBy: {
      type: String,
      required: true
    }
  },
  {
    versionKey: false,
    timestamps: true
  }
);

// Modele Mongoose pour acceder a la collection des catalogues.
const Catalogue = mongoose.model('Catalogue', catalogueSchema);

// Verifie le JWT puis attache l'utilisateur connecte a la requete.
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token manquant' });
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    req.userId = decoded.userId;
    req.username = decoded.username || decoded.userId;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token invalide' });
  }
}

// Verifie qu'un identifiant respecte le format MongoDB.
function validateObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// ---- ROUTES: LECTURE ----
// Retourne tous les catalogues du plus recent au plus ancien.
app.get('/catalogues', verifyToken, async (req, res) => {
  try {
    const catalogues = await Catalogue.find().sort({ createdAt: -1 });
    res.json({ catalogues });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Retourne un catalogue precis a partir de son identifiant.
app.get('/catalogues/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ error: 'ID invalide' });
    }

    const catalogue = await Catalogue.findById(id);

    if (!catalogue) {
      return res.status(404).json({ error: 'Catalogue non trouve' });
    }

    res.json({ catalogue });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ---- ROUTES: CREATION ----
// Cree un nouveau catalogue lie a l'utilisateur connecte.
app.post('/catalogues', verifyToken, async (req, res) => {
  try {
    const nom = req.body.nom?.trim();
    const description = req.body.description?.trim();

    if (!nom) {
      return res.status(400).json({ error: 'Nom requis' });
    }

    const catalogue = await Catalogue.create({
      nom,
      description,
      createdBy: req.username
    });

    res.status(201).json({
      message: 'Catalogue cree',
      catalogue
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ---- ROUTES: MISE A JOUR ----
// Met a jour uniquement les champs recus pour un catalogue.
app.patch('/catalogues/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const nom = req.body.nom?.trim();
    const description = typeof req.body.description === 'string'
      ? req.body.description.trim()
      : req.body.description;

    if (!validateObjectId(id)) {
      return res.status(400).json({ error: 'ID invalide' });
    }

    if (!nom && description === undefined) {
      return res.status(400).json({ error: 'Aucune donnee a modifier' });
    }

    const update = {};

    if (nom) {
      update.nom = nom;
    }

    if (description !== undefined) {
      update.description = description;
    }

    const catalogue = await Catalogue.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true
    });

    if (!catalogue) {
      return res.status(404).json({ error: 'Catalogue non trouve' });
    }

    res.json({
      message: 'Catalogue mis a jour',
      catalogue
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ---- ROUTES: SUPPRESSION ----
// Supprime un catalogue si son identifiant existe.
app.delete('/catalogues/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ error: 'ID invalide' });
    }

    const catalogue = await Catalogue.findByIdAndDelete(id);

    if (!catalogue) {
      return res.status(404).json({ error: 'Catalogue non trouve' });
    }

    res.json({ message: 'Catalogue supprime' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Demarre le service apres connexion reussie a MongoDB.
async function startServer() {
  try {
    const mongoUri = process.env.CATALOGUES_MONGO_URI;
    await mongoose.connect(mongoUri);

    const PORT = process.env.CATALOGUES_PORT || 3006;
    app.listen(PORT, () => {
      console.log(`\n Catalogues Service  -> http://localhost:${PORT}`);
      console.log(`   MongoDB           -> ${mongoUri}`);
      console.log('   GET    /catalogues');
      console.log('   GET    /catalogues/:id');
      console.log('   POST   /catalogues');
      console.log('   PATCH  /catalogues/:id');
      console.log('   DELETE /catalogues/:id\n');
    });
  } catch (error) {
    console.error('Erreur de connexion MongoDB :', error.message);
    process.exit(1);
  }
}

startServer();
