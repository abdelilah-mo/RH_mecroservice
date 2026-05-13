// ============================================
// api.js — SERVEUR PRINCIPAL (PORT 3000)
// Role : servir l interface web au navigateur
// ============================================

// Charger les variables d environnement depuis .env
// process.env.PORT sera disponible apres cette ligne
require('dotenv').config();

// Importer Express : framework web pour Node.js
const express = require('express');

// Importer path : module natif Node.js pour les chemins de fichiers
// path.join() cree des chemins compatibles Windows et Linux
const path = require('path');

// Creer l instance Express
// app est l objet principal sur lequel on branche tout
const app = express();

// ---- MIDDLEWARES ----

// Middleware 1 : lire le JSON des requetes POST/PATCH
// Sans ca, req.body serait undefined
app.use(express.json());

// Middleware 2 : servir les fichiers statiques du dossier public/
// Quand le navigateur demande http://localhost:3000/
// Express renvoie automatiquement public/index.html
app.use(express.static(path.join(__dirname, 'public')));

// ---- DEMARRER LE SERVEUR ----
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`\n Serveur web → http://localhost:${PORT}`);
  console.log(`   Ouvrez votre navigateur sur http://localhost:${PORT}\n`);
});
