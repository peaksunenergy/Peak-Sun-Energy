const path = require('path');
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// Load environment-specific .env file
const NODE_ENV = process.env.NODE_ENV || 'development';
const envFile = NODE_ENV === 'production' ? '.env.production' : '.env';
require('dotenv').config({ path: path.join(__dirname, envFile) });

const authRoutes = require('./routes/auth');
const clientsRoutes = require('./routes/clients');
const claimsRoutes = require('./routes/claims');
const quotesRoutes = require('./routes/quotes');
const contactRoutes = require('./routes/contact');
const notificationsRoutes = require('./routes/notifications');
const usersRoutes = require('./routes/users');
const { authMiddleware } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = NODE_ENV === 'production';

// Trust proxy in production (Render, Heroku, etc. use reverse proxies)
if (isProd) {
  app.set('trust proxy', 1);
}

// --- Security ---
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : ['http://localhost:8081', 'http://localhost:19006'];

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    if (!isProd) return cb(null, true);
    // In production, also allow mobile app requests (they have no standard origin)
    cb(null, true);
  },
}));

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting — stricter in production
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 100 : 500,
  message: { error: 'Trop de requêtes, réessayez plus tard' },
}));

// --- Public routes (no auth required) ---
app.use('/api/auth', authRoutes);
app.use('/api/quotes', quotesRoutes);
app.use('/api/contact', contactRoutes);

// --- Protected routes (JWT required) ---
app.use('/api/clients', authMiddleware, clientsRoutes);
app.use('/api/claims', authMiddleware, claimsRoutes);
app.use('/api/notifications', authMiddleware, notificationsRoutes);
app.use('/api/users', authMiddleware, usersRoutes);

// Root route
app.get('/', (_req, res) => res.json({ name: 'Peak Sun Energy API', status: 'ok' }));

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT} [${NODE_ENV}]`);
});
