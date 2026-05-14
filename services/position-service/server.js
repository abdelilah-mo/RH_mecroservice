// =======================================================================
// MICROSERVICE POSITIONS - PORT 3004
// =======================================================================
// Responsabilite : CRUD simple des positions avec MongoDB.
// Toutes les routes sont protegees par JWT.
// Routes :
//   GET    http://localhost:3004/positions
//   GET    http://localhost:3004/positions/:id
//   POST   http://localhost:3004/positions
//   PATCH  http://localhost:3004/positions/:id
//   DELETE http://localhost:3004/positions/:id
// =======================================================================

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const app = express();

app.use(express.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
  next();
});

const positionSchema = new mongoose.Schema(
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

const Position = mongoose.model('Position', positionSchema);

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

function validateObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

app.get('/positions', verifyToken, async (req, res) => {
  try {
    const positions = await Position.find().sort({ createdAt: -1 });
    res.json({ positions });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.get('/positions/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ error: 'ID invalide' });
    }

    const position = await Position.findById(id);

    if (!position) {
      return res.status(404).json({ error: 'Position non trouvee' });
    }

    res.json({ position });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/positions', verifyToken, async (req, res) => {
  try {
    const nom = req.body.nom?.trim();
    const description = req.body.description?.trim();

    if (!nom) {
      return res.status(400).json({ error: 'Nom requis' });
    }

    const position = await Position.create({
      nom,
      description,
      createdBy: req.username
    });

    res.status(201).json({
      message: 'Position creee',
      position
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.patch('/positions/:id', verifyToken, async (req, res) => {
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

    const position = await Position.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true
    });

    if (!position) {
      return res.status(404).json({ error: 'Position non trouvee' });
    }

    res.json({
      message: 'Position mise a jour',
      position
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.delete('/positions/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ error: 'ID invalide' });
    }

    const position = await Position.findByIdAndDelete(id);

    if (!position) {
      return res.status(404).json({ error: 'Position non trouvee' });
    }

    res.json({ message: 'Position supprimee' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

async function startServer() {
  try {
    const mongoUri = process.env.POSITIONS_MONGO_URI;
    await mongoose.connect(mongoUri);

    const PORT = process.env.POSITIONS_PORT || 3004;
    app.listen(PORT, () => {
      console.log(`\n Positions Service   -> http://localhost:${PORT}`);
      console.log(`   MongoDB           -> ${mongoUri}`);
      console.log('   GET    /positions');
      console.log('   GET    /positions/:id');
      console.log('   POST   /positions');
      console.log('   PATCH  /positions/:id');
      console.log('   DELETE /positions/:id\n');
    });
  } catch (error) {
    console.error('Erreur de connexion MongoDB :', error.message);
    process.exit(1);
  }
}

startServer();
