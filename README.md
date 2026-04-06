# ☀️ Peak Sun Energy

Application de gestion pour **Peak Sun Energy** — une entreprise d'installation et de maintenance de panneaux solaires en Tunisie.

## 📋 Fonctionnalités

### Espace Administrateur
- Tableau de bord avec statistiques (clients, réclamations, devis)
- Gestion des clients (ajout, modification, suppression)
- Suivi des demandes de devis
- Gestion des réclamations (techniques et administratives)
- **Assignation** des réclamations aux techniciens
- **Historique complet** de chaque réclamation (audit trail)
- **Statistiques techniciens** : tickets assignés, résolus, en cours, taux de résolution
- **Escalade automatique** : notifications + e-mail pour les réclamations non résolues > 48h

### Espace Technicien
- Tableau de bord avec réclamations assignées
- Changement de statut des réclamations (en cours, résolu)
- **Transfert** d'une réclamation à un autre technicien (avec motif)
- Historique des interventions et transferts

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
│   ├── context/              # AuthContext (gestion de session JWT)
│   ├── navigation/           # React Navigation (stacks par rôle)
│   ├── screens/              # Écrans (admin/, client/, tech/, publics)
│   ├── services/api.js       # Appels HTTP vers le backend
│   └── utils/validators.js   # Validation de formulaires
├── backend/
│   ├── server.js             # Serveur Express (JWT, CORS, rate-limit)
│   ├── middleware/auth.js     # JWT auth + requireRole
│   ├── db/pool.js            # Client Supabase (@supabase/supabase-js)
│   ├── services/email.js     # Envoi e-mail d'escalade (nodemailer)
│   └── routes/               # Routes API REST
│       ├── auth.js           # POST /api/auth/login
│       ├── clients.js        # CRUD /api/clients
│       ├── claims.js         # CRUD /api/claims (assign, forward, history)
│       ├── users.js          # GET /api/users/technicians (list + stats)
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
| Base de données | PostgreSQL via **Supabase** (@supabase/supabase-js) |
| Auth        | JWT (jsonwebtoken) + bcrypt              |
| Sécurité    | CORS, express-rate-limit, requireRole    |
| E-mail      | nodemailer (escalade 48h)                |

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

Puis exécutez la migration pour les fonctionnalités technicien / audit trail :

```sql
-- Ajout des champs assignation + escalade sur la table claims
ALTER TABLE claims
  ADD COLUMN IF NOT EXISTS assigned_to INT REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS assigned_name VARCHAR(200),
  ADD COLUMN IF NOT EXISTS escalated BOOLEAN DEFAULT FALSE;

-- Table d'historique / audit trail
CREATE TABLE IF NOT EXISTS claim_history (
  id             SERIAL PRIMARY KEY,
  claim_id       INT NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  action         VARCHAR(50) NOT NULL,
  from_value     VARCHAR(100),
  to_value       VARCHAR(100),
  performed_by   INT REFERENCES users(id),
  performer_name VARCHAR(200),
  note           TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_claim_history_claim_id ON claim_history(claim_id);
CREATE INDEX IF NOT EXISTS idx_claims_assigned_to ON claims(assigned_to);
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
SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
SUPABASE_SERVICE_KEY=eyJ...your-service-role-key
JWT_SECRET=your-random-hex-secret-here
PORT=3000

# Optionnel — pour les e-mails d'escalade
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
ADMIN_EMAIL=admin@peaksunenergy.tn
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

| Méthode | Route                          | Auth     | Description                            |
|---------|--------------------------------|----------|----------------------------------------|
| POST    | `/api/auth/login`              | Non      | Connexion utilisateur (retourne JWT)   |
| GET     | `/api/clients`                 | Admin    | Liste des clients                      |
| POST    | `/api/clients`                 | Admin    | Ajouter un client                      |
| PUT     | `/api/clients/:id`             | Admin    | Modifier un client                     |
| DELETE  | `/api/clients/:id`             | Admin    | Supprimer un client                    |
| GET     | `/api/clients/:id/installation`| JWT      | Détails installation client            |
| GET     | `/api/claims`                  | JWT      | Toutes les réclamations                |
| GET     | `/api/claims/client/:id`       | JWT      | Réclamations d'un client               |
| GET     | `/api/claims/assigned/:techId` | JWT      | Réclamations assignées à un technicien |
| GET     | `/api/claims/:id/history`      | JWT      | Historique/audit d'une réclamation     |
| POST    | `/api/claims`                  | JWT      | Créer une réclamation                  |
| PUT     | `/api/claims/:id/status`       | JWT      | Modifier statut (avec note optionnelle)|
| PUT     | `/api/claims/:id/assign`       | Admin    | Assigner à un technicien               |
| PUT     | `/api/claims/:id/forward`      | Tech     | Transférer à un autre technicien       |
| GET     | `/api/claims/overdue`          | Admin    | Réclamations > 48h (+ e-mail escalade) |
| GET     | `/api/users/technicians`       | JWT      | Liste des techniciens                  |
| GET     | `/api/users/technicians/stats` | Admin    | Statistiques par technicien            |
| GET     | `/api/quotes`                  | JWT      | Liste des demandes de devis            |
| POST    | `/api/quotes`                  | Non      | Soumettre une demande de devis         |
| GET     | `/api/contact`                 | JWT      | Messages de contact                    |
| POST    | `/api/contact`                 | Non      | Envoyer un message de contact          |
| GET     | `/api/notifications`           | JWT      | Liste des notifications                |
| POST    | `/api/notifications`           | JWT      | Créer une notification                 |

---

## 👤 Rôles utilisateur

| Rôle         | Accès                                                         |
|--------------|---------------------------------------------------------------|
| `admin`      | Tableau de bord, gestion clients/réclamations/devis, assignation, stats techniciens, escalade |
| `technician` | Réclamations assignées, changement de statut, transfert entre techniciens |
| `client`     | Suivi installation, soumission et suivi de réclamations       |

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
Définissez les variables d'environnement `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `JWT_SECRET` et `PORT` sur la plateforme choisie.
Pour l'escalade e-mail, ajoutez aussi `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `ADMIN_EMAIL`.

---

## 📝 Licence

Projet privé — Peak Sun Energy © 2025