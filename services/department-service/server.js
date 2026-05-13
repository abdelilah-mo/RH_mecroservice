// =======================================================================
// MICROSERVICE DEPARTMENTS - PORT 3003
// =======================================================================
// Responsabilite : CRUD simple des departements avec MongoDB.
// Toutes les routes sont protegees par JWT.
// Routes :
//   GET    http://localhost:3003/departments
//   GET    http://localhost:3003/departments/:id
//   POST   http://localhost:3003/departments
//   PATCH  http://localhost:3003/departments/:id
//   DELETE http://localhost:3003/departments/:id
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

const departmentSchema = new mongoose.Schema(
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

const Department = mongoose.model('Department', departmentSchema);

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

app.get('/departments', verifyToken, async (req, res) => {
  try {
    const departments = await Department.find().sort({ createdAt: -1 });
    res.json({ departments });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.get('/departments/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ error: 'ID invalide' });
    }

    const department = await Department.findById(id);

    if (!department) {
      return res.status(404).json({ error: 'Departement non trouve' });
    }

    res.json({ department });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/departments', verifyToken, async (req, res) => {
  try {
    const nom = req.body.nom?.trim();
    const description = req.body.description?.trim();

    if (!nom) {
      return res.status(400).json({ error: 'Nom requis' });
    }

    const department = await Department.create({
      nom,
      description,
      createdBy: req.username
    });

    res.status(201).json({
      message: 'Departement cree',
      department
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.patch('/departments/:id', verifyToken, async (req, res) => {
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

    const department = await Department.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true
    });

    if (!department) {
      return res.status(404).json({ error: 'Departement non trouve' });
    }

    res.json({
      message: 'Departement mis a jour',
      department
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.delete('/departments/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ error: 'ID invalide' });
    }

    const department = await Department.findByIdAndDelete(id);

    if (!department) {
      return res.status(404).json({ error: 'Departement non trouve' });
    }

    res.json({ message: 'Departement supprime' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

async function startServer() {
  try {
    const mongoUri = process.env.DEPARTMENTS_MONGO_URI || process.env.MONGO_URI;
    await mongoose.connect(mongoUri);

    const PORT = process.env.DEPARTMENTS_PORT || 3003;
    app.listen(PORT, () => {
      console.log(`\n Departments Service -> http://localhost:${PORT}`);
      console.log(`   MongoDB           -> ${mongoUri}`);
      console.log('   GET    /departments');
      console.log('   GET    /departments/:id');
      console.log('   POST   /departments');
      console.log('   PATCH  /departments/:id');
      console.log('   DELETE /departments/:id\n');
    });
  } catch (error) {
    console.error('Erreur de connexion MongoDB :', error.message);
    process.exit(1);
  }
}

startServer();
