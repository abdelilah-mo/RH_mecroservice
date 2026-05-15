// =======================================================================
// MICROSERVICE EMPLOYEES - PORT 3005
// =======================================================================
// Responsabilite : CRUD simple des employees avec MongoDB.
// Toutes les routes sont protegees par JWT.
// Routes :
//   GET    http://localhost:3005/employees
//   GET    http://localhost:3005/employees/:id
//   POST   http://localhost:3005/employees
//   PATCH  http://localhost:3005/employees/:id
//   DELETE http://localhost:3005/employees/:id
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

const employeeSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    departmentId: {
      type: String,
      required: true
    },
    departmentName: {
      type: String,
      required: true,
      trim: true
    },
    positionId: {
      type: String,
      required: true
    },
    positionName: {
      type: String,
      required: true,
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

const Employee = mongoose.model('Employee', employeeSchema);

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

// Nettoie les champs recus avant creation ou mise a jour d'un employe.
function normalizeEmployeePayload(body) {
  return {
    nom: body.nom?.trim(),
    email: body.email?.trim().toLowerCase(),
    departmentId: body.departmentId?.trim(),
    departmentName: body.departmentName?.trim(),
    positionId: body.positionId?.trim(),
    positionName: body.positionName?.trim()
  };
}

// Retourne tous les employes du plus recent au plus ancien.
app.get('/employees', verifyToken, async (req, res) => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 });
    res.json({ employees });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Retourne un employe precis a partir de son identifiant.
app.get('/employees/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ error: 'ID invalide' });
    }

    const employee = await Employee.findById(id);

    if (!employee) {
      return res.status(404).json({ error: 'Employee non trouve' });
    }

    res.json({ employee });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Cree un nouvel employe avec ses references departement et position.
app.post('/employees', verifyToken, async (req, res) => {
  try {
    const payload = normalizeEmployeePayload(req.body);

    if (!payload.nom || !payload.email || !payload.departmentId || !payload.departmentName || !payload.positionId || !payload.positionName) {
      return res.status(400).json({ error: 'Nom, email, departement et position sont requis' });
    }

    const employee = await Employee.create({
      ...payload,
      createdBy: req.username
    });

    res.status(201).json({
      message: 'Employee cree',
      employee
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Met a jour uniquement les champs recus pour un employe.
app.patch('/employees/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const payload = normalizeEmployeePayload(req.body);

    if (!validateObjectId(id)) {
      return res.status(400).json({ error: 'ID invalide' });
    }

    const update = {};

    if (payload.nom) update.nom = payload.nom;
    if (payload.email) update.email = payload.email;
    if (payload.departmentId) update.departmentId = payload.departmentId;
    if (payload.departmentName) update.departmentName = payload.departmentName;
    if (payload.positionId) update.positionId = payload.positionId;
    if (payload.positionName) update.positionName = payload.positionName;

    if (!Object.keys(update).length) {
      return res.status(400).json({ error: 'Aucune donnee a modifier' });
    }

    const employee = await Employee.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee non trouve' });
    }

    res.json({
      message: 'Employee mis a jour',
      employee
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprime un employe si son identifiant existe.
app.delete('/employees/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ error: 'ID invalide' });
    }

    const employee = await Employee.findByIdAndDelete(id);

    if (!employee) {
      return res.status(404).json({ error: 'Employee non trouve' });
    }

    res.json({ message: 'Employee supprime' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Demarre le service apres connexion reussie a MongoDB.
async function startServer() {
  try {
    const mongoUri = process.env.EMPLOYEES_MONGO_URI;
    await mongoose.connect(mongoUri);

    const PORT = process.env.EMPLOYEES_PORT || 3005;
    app.listen(PORT, () => {
      console.log(`\n Employees Service   -> http://localhost:${PORT}`);
      console.log(`   MongoDB           -> ${mongoUri}`);
      console.log('   GET    /employees');
      console.log('   GET    /employees/:id');
      console.log('   POST   /employees');
      console.log('   PATCH  /employees/:id');
      console.log('   DELETE /employees/:id\n');
    });
  } catch (error) {
    console.error('Erreur de connexion MongoDB :', error.message);
    process.exit(1);
  }
}

startServer();
