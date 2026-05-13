## API REST JWT - Microservices

Ce projet est une application Node.js basee sur **Express** qui montre comment construire une petite API REST avec **authentification JWT** et **microservices**.

L'application est decoupee en 3 parties :

- **Serveur web** sur le port `3000` : sert l'interface HTML.
- **Auth Service** sur le port `3001` : gere l'inscription et la connexion.
- **Tasks Service** sur le port `3002` : gere les taches de l'utilisateur connecte.

Les donnees sont stockees dans des fichiers JSON locaux :

- `data/users.json`
- `data/tasks.json`

## Definition du projet

Le but de ce projet est d'expliquer simplement :

- le fonctionnement d'une API REST,
- la separation en microservices,
- l'inscription et la connexion avec JWT,
- la protection des routes avec un token,
- le CRUD de taches lie a l'utilisateur authentifie.

Quand un utilisateur se connecte :

1. l'Auth Service verifie l'email et le mot de passe,
2. il genere un token JWT,
3. le client envoie ce token dans le header `Authorization`,
4. le Tasks Service verifie ce token avant d'autoriser l'acces aux taches.

## Fonctionnalites

- creation de compte,
- connexion utilisateur,
- generation d'un token JWT,
- affichage des taches de l'utilisateur,
- creation d'une tache,
- modification d'une tache,
- suppression d'une tache.

## Prerequis

Avant de lancer le projet, il faut avoir installe :

- **Node.js**
- **npm**

## Installation

1. Cloner ou telecharger le projet.
2. Ouvrir un terminal dans le dossier du projet.
3. Installer les dependances :

```bash
npm install
```

## Configuration

Creer ou verifier le fichier `.env` a la racine du projet :

```env
SECRET_KEY=ceci_est_ma_cle_secrete_tres_longue
PORT=3000
```

Explication :

- `SECRET_KEY` : cle utilisee pour signer et verifier les tokens JWT.
- `PORT` : port du serveur web principal.

## Lancement du projet

### Lancer seulement l'interface web

```bash
npm start
```

Le serveur web sera disponible sur :

```text
http://localhost:3000
```

### Lancer seulement le microservice d'authentification

```bash
npm run start:auth
```

Disponible sur :

```text
http://localhost:3001
```

### Lancer seulement le microservice des taches

```bash
npm run start:tasks
```

Disponible sur :

```text
http://localhost:3002
```

### Lancer tous les services en meme temps

```bash
npm run start:all
```

Pour le developpement avec redemarrage automatique :

```bash
npm run dev:all
```

## Routes principales

### Auth Service

- `POST /auth/register`
- `POST /auth/login`

Exemple :

```text
http://localhost:3001/auth/register
http://localhost:3001/auth/login
```

### Tasks Service

- `GET /tasks`
- `POST /tasks`
- `PATCH /tasks/:id`
- `DELETE /tasks/:id`

Exemple :

```text
http://localhost:3002/tasks
```

## Structure du projet

```text
api_rest/
├── api.js
├── package.json
├── .env
├── public/
│   └── index.html
├── services/
│   ├── auth-service/
│   │   └── server.js
│   └── tasks-service/
│       └── server.js
├── routes/
│   ├── authRoutes.js
│   └── taskRoutes.js
└── data/
    ├── users.json
    └── tasks.json
```

## Utilisation

1. Lancer tous les services avec `npm run start:all`.
2. Ouvrir `http://localhost:3000`.
3. Creer un compte.
4. Se connecter.
5. Ajouter, modifier et supprimer des taches.

## Technologies utilisees

- Node.js
- Express
- JSON Web Token (`jsonwebtoken`)
- bcryptjs
- dotenv
- concurrently
- nodemon

## Remarque

Ce projet est surtout un projet **pedagogique** pour comprendre JWT, Express et les microservices.
Il utilise des fichiers JSON comme base de donnees simple, donc il est ideal pour l'apprentissage et les demonstrations.
