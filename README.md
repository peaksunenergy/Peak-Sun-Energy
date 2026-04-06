# ☀️ Peak Sun Energy

Application de gestion pour **Peak Sun Energy** — une entreprise d'installation et de maintenance de panneaux solaires en Tunisie.

## 📋 Fonctionnalités

### Espace Administrateur
- Tableau de bord avec statistiques (clients, réclamations, devis)
- Gestion des clients (ajout, modification, suppression)
- Suivi des demandes de devis
- Gestion des réclamations (techniques et administratives)
- Notifications automatiques (réclamations non traitées > 48h)

### Espace Client
- Suivi de l'état de l'installation
- Soumission de réclamations (avec photo)
- Historique des réclamations

### Pages Publiques
- Présentation des services
- Demande de devis en ligne
- Formulaire de contact

---

## 🏗️ Architecture

```
Peak-Sun-Energy/
├── App.js                    # Point d'entrée Expo
├── src/
│   ├── components/           # Composants réutilisables
│   ├── constants/            # Configuration, couleurs, constantes
│   ├── context/              # AuthContext (gestion de session)
│   ├── navigation/           # React Navigation (tabs + stacks)
│   ├── screens/              # Écrans (admin/, client/, publics)
│   ├── services/api.js       # Appels HTTP vers le backend
│   └── utils/validators.js   # Validation de formulaires
├── backend/
│   ├── server.js             # Serveur Express
│   ├── db/pool.js            # Connexion PostgreSQL (Supabase)
│   └── routes/               # Routes API REST
│       ├── auth.js           # POST /api/auth/login
│       ├── clients.js        # CRUD /api/clients
│       ├── claims.js         # CRUD /api/claims
│       ├── quotes.js         # GET|POST /api/quotes
│       ├── contact.js        # GET|POST /api/contact
│       └── notifications.js  # GET|POST /api/notifications
```

---

## 🛠️ Technologies

| Couche      | Stack                                    |
|-------------|------------------------------------------|
| Mobile/Web  | React Native + Expo (SDK 55)             |
| Navigation  | React Navigation 7                       |
| Backend     | Node.js + Express                        |
| Base de données | PostgreSQL via **Supabase**           |
| Auth        | bcrypt (hash de mots de passe)           |

---

## 🚀 Mise en route

### Prérequis
- **Node.js** ≥ 18
- **npm** ou **yarn**
- Un projet **Supabase** avec les tables créées (voir section Base de données)
- **Expo CLI** : `npm install -g expo-cli` (optionnel, `npx expo` fonctionne aussi)

### 1. Cloner le projet

```bash
git clone https://github.com/your-username/Peak-Sun-Energy.git
cd Peak-Sun-Energy
```

### 2. Configurer la base de données Supabase

1. Allez sur [supabase.com](https://supabase.com) et ouvrez votre projet
2. Dans **Settings > Database**, copiez le **Connection string (URI)**
3. Créez les tables nécessaires via le SQL Editor de Supabase : 

```sql
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  login         VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20) NOT NULL DEFAULT 'client',
  first_name    VARCHAR(100) NOT NULL,
  last_name     VARCHAR(100) NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clients (
  id              SERIAL PRIMARY KEY,
  user_id         INT REFERENCES users(id) ON DELETE CASCADE,
  phone           VARCHAR(20),
  location        VARCHAR(255),
  usage           VARCHAR(50),
  power           VARCHAR(50),
  characteristics TEXT,
  state           VARCHAR(30) DEFAULT 'pending',
  remark          TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quote_requests (
  id          SERIAL PRIMARY KEY,
  full_name   VARCHAR(200) NOT NULL,
  email       VARCHAR(200),
  phone       VARCHAR(20),
  client_type VARCHAR(50),
  message     TEXT,
  status      VARCHAR(30) DEFAULT 'pending',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id         SERIAL PRIMARY KEY,
  full_name  VARCHAR(200) NOT NULL,
  email      VARCHAR(200),
  phone      VARCHAR(20),
  message    TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS claims (
  id          SERIAL PRIMARY KEY,
  client_id   INT REFERENCES clients(id) ON DELETE CASCADE,
  client_name VARCHAR(200),
  type        VARCHAR(30) NOT NULL,
  description TEXT,
  photo_uri   TEXT,
  status      VARCHAR(30) DEFAULT 'created',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id         SERIAL PRIMARY KEY,
  type       VARCHAR(50),
  claim_id   INT,
  message    TEXT,
  for_roles  TEXT[],
  read       BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. Configurer le backend

```bash
cd backend
npm install
```

Créez le fichier `.env` :

```bash
cp .env.example .env
```

Éditez `.env` avec vos informations Supabase :

```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
PORT=3000
```

Démarrez le serveur :

```bash
npm run dev     # développement (avec rechargement auto)
npm start       # production
```

### 4. Configurer l'application (frontend)

```bash
cd ..          # retour à la racine
npm install
```

Éditez `src/constants/apiConfig.js` et remplacez l'IP locale par celle de votre machine :

```js
const LOCAL_IP = '192.168.1.100'; // <-- votre IP locale (ipconfig sous Windows)
```

> **Trouver votre IP locale** : ouvrez un terminal et tapez `ipconfig` (Windows) ou `ifconfig` (Mac/Linux). Prenez l'adresse IPv4 de votre adaptateur Wi-Fi.

### 5. Lancer l'application

```bash
npx expo start          # menu interactif
npx expo start --web    # navigateur uniquement
npx expo start --android  # émulateur Android / appareil
```

---

## 📡 API Endpoints

| Méthode | Route                        | Description                    |
|---------|------------------------------|--------------------------------|
| POST    | `/api/auth/login`            | Connexion utilisateur          |
| GET     | `/api/clients`               | Liste des clients              |
| POST    | `/api/clients`               | Ajouter un client              |
| PUT     | `/api/clients/:id`           | Modifier un client             |
| DELETE  | `/api/clients/:id`           | Supprimer un client            |
| GET     | `/api/clients/:id/installation` | Détails installation client |
| GET     | `/api/claims`                | Toutes les réclamations        |
| GET     | `/api/claims/client/:id`     | Réclamations d'un client       |
| POST    | `/api/claims`                | Créer une réclamation          |
| PUT     | `/api/claims/:id/status`     | Modifier statut réclamation    |
| GET     | `/api/claims/overdue`        | Réclamations > 48h non traitées|
| GET     | `/api/quotes`                | Liste des demandes de devis    |
| POST    | `/api/quotes`                | Soumettre une demande de devis |
| GET     | `/api/contact`               | Messages de contact            |
| POST    | `/api/contact`               | Envoyer un message de contact  |
| GET     | `/api/notifications`         | Liste des notifications        |
| POST    | `/api/notifications`         | Créer une notification         |
| GET     | `/api/health`                | Vérification de santé du serveur|

---

## 👤 Rôles utilisateur

| Rôle        | Accès                                           |
|-------------|--------------------------------------------------|
| `admin`     | Tableau de bord, gestion clients/réclamations/devis |
| `technician`| Notifications réclamations techniques             |
| `client`    | Suivi installation, soumission de réclamations    |

---

## 📦 Build & Déploiement

### Build mobile (EAS)

```bash
npx eas build --platform android --profile development   # APK de dev
npx eas build --platform android --profile preview        # APK de preview
npx eas build --platform android --profile production     # AAB pour Play Store
```

### Déploiement backend

Le backend peut être déployé sur n'importe quelle plateforme Node.js (Render, Railway, Fly.io, VPS...).
Définissez les variables d'environnement `DATABASE_URL` et `PORT` sur la plateforme choisie.

---

## 📝 Licence

Projet privé — Peak Sun Energy © 2025