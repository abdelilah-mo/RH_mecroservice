// =======================================================================
// MICROSERVICE AUTH - PORT 3001
// =======================================================================
// Responsabilite : inscription et connexion avec MongoDB.
// Routes :
//   POST http://localhost:3001/auth/register
//   POST http://localhost:3001/auth/login
// =======================================================================

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const express = require('express');
const bcrypt = require('bcryptjs');
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

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    password: {
      type: String,
      required: true
    }
  },
  {
    versionKey: false,
    timestamps: true
  }
);

const User = mongoose.model('User', userSchema);

function buildUsernameFromEmail(email) {
  return email.split('@')[0].replace(/[^a-zA-Z0-9_-]/g, '') || 'user';
}

async function generateUniqueUsername(baseUsername, excludeUserId = null) {
  const normalizedBase = baseUsername.trim();
  let candidate = normalizedBase;
  let counter = 1;

  while (true) {
    const existingUser = await User.findOne({ username: candidate });

    if (!existingUser || existingUser._id.toString() === excludeUserId) {
      return candidate;
    }

    candidate = `${normalizedBase}${counter}`;
    counter += 1;
  }
}

app.post('/auth/register', async (req, res) => {
  try {
    const username = req.body.username?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const { password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email et mot de passe requis' });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ error: 'Email deja utilise' });
    }

    const existingUsername = await User.findOne({ username });

    if (existingUsername) {
      return res.status(400).json({ error: 'Username deja utilise' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username,
      email,
      password: hashedPassword
    });

    res.status(201).json({ message: 'Utilisateur cree', id: newUser._id });
  } catch (error) {
    if (error.code === 11000) {
      if (error.keyPattern?.username) {
        return res.status(400).json({ error: 'Username deja utilise' });
      }

      return res.status(400).json({ error: 'Email deja utilise' });
    }

    console.error('Erreur register:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const { password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    if (!user.username) {
      user.username = await generateUniqueUsername(
        buildUsernameFromEmail(user.email),
        user._id.toString()
      );
      await user.save();
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        username: user.username
      },
      process.env.SECRET_KEY,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Connexion reussie',
      token,
      userId: user._id,
      username: user.username
    });
  } catch (error) {
    console.error('Erreur login:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

async function startServer() {
  try {
    const mongoUri = process.env.AUTH_MONGO_URI || process.env.MONGO_URI;
    await mongoose.connect(mongoUri);

    const PORT = process.env.AUTH_PORT || 3001;
    app.listen(PORT, () => {
      console.log(`\n Auth Service    -> http://localhost:${PORT}`);
      console.log(`   MongoDB       -> ${mongoUri}`);
      console.log('   POST /auth/register  (inscription)');
      console.log('   POST /auth/login     (connexion)\n');
    });
  } catch (error) {
    console.error('Erreur de connexion MongoDB :', error.message);
    process.exit(1);
  }
}

startServer();
