// =======================================================================
// MICROSERVICE AFFECTATIONS - PORT 3007
// =======================================================================
// Responsabilite : CRUD simple des affectations catalogue/employee.
// Toutes les routes sont protegees par JWT.
// Routes :
//   GET    http://localhost:3007/affectations
//   GET    http://localhost:3007/affectations/:id
//   POST   http://localhost:3007/affectations
//   PATCH  http://localhost:3007/affectations/:id
//   DELETE http://localhost:3007/affectations/:id
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

const affectationSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true
    },
    employeeName: {
      type: String,
      required: true,
      trim: true
    },
    catalogueId: {
      type: String,
      required: true
    },
    catalogueName: {
      type: String,
      required: true,
      trim: true
    },
    commentaire: {
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

const Affectation = mongoose.model('Affectation', affectationSchema);

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

// Nettoie les champs recus avant creation ou mise a jour d'une affectation.
function normalizeAffectationPayload(body) {
  return {
    employeeId: body.employeeId?.trim(),
    employeeName: body.employeeName?.trim(),
    catalogueId: body.catalogueId?.trim(),
    catalogueName: body.catalogueName?.trim(),
    commentaire: body.commentaire?.trim()
  };
}

// Retourne toutes les affectations du plus recent au plus ancien.
app.get('/affectations', verifyToken, async (req, res) => {
  try {
    const affectations = await Affectation.find().sort({ createdAt: -1 });
    res.json({ affectations });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Retourne une affectation precise a partir de son identifiant.
app.get('/affectations/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ error: 'ID invalide' });
    }

    const affectation = await Affectation.findById(id);

    if (!affectation) {
      return res.status(404).json({ error: 'Affectation non trouvee' });
    }

    res.json({ affectation });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Cree une nouvelle affectation entre un employe et un catalogue.
app.post('/affectations', verifyToken, async (req, res) => {
  try {
    const payload = normalizeAffectationPayload(req.body);

    if (!payload.employeeId || !payload.employeeName || !payload.catalogueId || !payload.catalogueName) {
      return res.status(400).json({ error: 'Employee et catalogue sont requis' });
    }

    const affectation = await Affectation.create({
      ...payload,
      createdBy: req.username
    });

    res.status(201).json({
      message: 'Affectation creee',
      affectation
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Met a jour uniquement les champs recus pour une affectation.
app.patch('/affectations/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const payload = normalizeAffectationPayload(req.body);

    if (!validateObjectId(id)) {
      return res.status(400).json({ error: 'ID invalide' });
    }

    const update = {};

    if (payload.employeeId) update.employeeId = payload.employeeId;
    if (payload.employeeName) update.employeeName = payload.employeeName;
    if (payload.catalogueId) update.catalogueId = payload.catalogueId;
    if (payload.catalogueName) update.catalogueName = payload.catalogueName;
    if (payload.commentaire !== undefined) update.commentaire = payload.commentaire;

    if (!Object.keys(update).length) {
      return res.status(400).json({ error: 'Aucune donnee a modifier' });
    }

    const affectation = await Affectation.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true
    });

    if (!affectation) {
      return res.status(404).json({ error: 'Affectation non trouvee' });
    }

    res.json({
      message: 'Affectation mise a jour',
      affectation
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprime une affectation si son identifiant existe.
app.delete('/affectations/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ error: 'ID invalide' });
    }

    const affectation = await Affectation.findByIdAndDelete(id);

    if (!affectation) {
      return res.status(404).json({ error: 'Affectation non trouvee' });
    }

    res.json({ message: 'Affectation supprimee' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Demarre le service apres connexion reussie a MongoDB.
async function startServer() {
  try {
    const mongoUri = process.env.AFFECTATIONS_MONGO_URI;
    await mongoose.connect(mongoUri);

    const PORT = process.env.AFFECTATIONS_PORT || 3007;
    app.listen(PORT, () => {
      console.log(`\n Affectations Service -> http://localhost:${PORT}`);
      console.log(`   MongoDB            -> ${mongoUri}`);
      console.log('   GET    /affectations');
      console.log('   GET    /affectations/:id');
      console.log('   POST   /affectations');
      console.log('   PATCH  /affectations/:id');
      console.log('   DELETE /affectations/:id\n');
    });
  } catch (error) {
    console.error('Erreur de connexion MongoDB :', error.message);
    process.exit(1);
  }
}

startServer();
