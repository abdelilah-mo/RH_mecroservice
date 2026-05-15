// =======================================================================
// MICROSERVICE RECLAMATIONS - PORT 3008
// =======================================================================
// Responsabilite : CRUD simple des reclamations avec MongoDB.
// Toutes les routes sont protegees par JWT.
// Routes :
//   GET    http://localhost:3008/reclamations
//   GET    http://localhost:3008/reclamations/:id
//   POST   http://localhost:3008/reclamations
//   PATCH  http://localhost:3008/reclamations/:id
//   DELETE http://localhost:3008/reclamations/:id
// =======================================================================

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const app = express();

app.use(express.json());

// Autorise les appels du front et les headers utiles entre services.
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
  next();
});

const reclamationSchema = new mongoose.Schema(
  {
    sujet: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    statut: {
      type: String,
      default: 'ouverte',
      trim: true
    },
    priorite: {
      type: String,
      default: 'moyenne',
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

const Reclamation = mongoose.model('Reclamation', reclamationSchema);

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

// Nettoie les champs recus avant creation ou mise a jour d'une reclamation.
function normalizeReclamationPayload(body) {
  return {
    sujet: body.sujet?.trim(),
    description: typeof body.description === 'string' ? body.description.trim() : body.description,
    statut: typeof body.statut === 'string' ? body.statut.trim() : body.statut,
    priorite: typeof body.priorite === 'string' ? body.priorite.trim() : body.priorite
  };
}

// Retourne toutes les reclamations du plus recent au plus ancien.
app.get('/reclamations', verifyToken, async (req, res) => {
  try {
    const reclamations = await Reclamation.find().sort({ createdAt: -1 });
    res.json({ reclamations });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Retourne une reclamation precise a partir de son identifiant.
app.get('/reclamations/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ error: 'ID invalide' });
    }

    const reclamation = await Reclamation.findById(id);

    if (!reclamation) {
      return res.status(404).json({ error: 'Reclamation non trouvee' });
    }

    res.json({ reclamation });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Cree une nouvelle reclamation liee a l'utilisateur connecte.
app.post('/reclamations', verifyToken, async (req, res) => {
  try {
    const payload = normalizeReclamationPayload(req.body);

    if (!payload.sujet) {
      return res.status(400).json({ error: 'Sujet requis' });
    }

    const reclamation = await Reclamation.create({
      ...payload,
      createdBy: req.username
    });

    res.status(201).json({
      message: 'Reclamation creee',
      reclamation
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Met a jour uniquement les champs recus pour une reclamation.
app.patch('/reclamations/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const payload = normalizeReclamationPayload(req.body);
    const update = {};

    if (!validateObjectId(id)) {
      return res.status(400).json({ error: 'ID invalide' });
    }

    if (payload.sujet) update.sujet = payload.sujet;
    if (payload.description !== undefined) update.description = payload.description;
    if (payload.statut) update.statut = payload.statut;
    if (payload.priorite) update.priorite = payload.priorite;

    if (!Object.keys(update).length) {
      return res.status(400).json({ error: 'Aucune donnee a modifier' });
    }

    const reclamation = await Reclamation.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true
    });

    if (!reclamation) {
      return res.status(404).json({ error: 'Reclamation non trouvee' });
    }

    res.json({
      message: 'Reclamation mise a jour',
      reclamation
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprime une reclamation si son identifiant existe.
app.delete('/reclamations/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ error: 'ID invalide' });
    }

    const reclamation = await Reclamation.findByIdAndDelete(id);

    if (!reclamation) {
      return res.status(404).json({ error: 'Reclamation non trouvee' });
    }

    res.json({ message: 'Reclamation supprimee' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Demarre le service apres connexion reussie a MongoDB.
async function startServer() {
  try {
    const mongoUri = process.env.RECLAMATIONS_MONGO_URI;
    await mongoose.connect(mongoUri);

    const PORT = process.env.RECLAMATIONS_PORT || 3008;
    app.listen(PORT, () => {
      console.log(`\n Reclamations Service -> http://localhost:${PORT}`);
      console.log(`   MongoDB            -> ${mongoUri}`);
      console.log('   GET    /reclamations');
      console.log('   GET    /reclamations/:id');
      console.log('   POST   /reclamations');
      console.log('   PATCH  /reclamations/:id');
      console.log('   DELETE /reclamations/:id\n');
    });
  } catch (error) {
    console.error('Erreur de connexion MongoDB :', error.message);
    process.exit(1);
  }
}

startServer();
