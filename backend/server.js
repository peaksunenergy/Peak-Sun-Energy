const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const clientsRoutes = require('./routes/clients');
const claimsRoutes = require('./routes/claims');
const quotesRoutes = require('./routes/quotes');
const contactRoutes = require('./routes/contact');
const notificationsRoutes = require('./routes/notifications');
const { authMiddleware } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Security ---
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : ['http://localhost:8081', 'http://localhost:19006'];

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (mobile apps, curl)
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(null, true); // In dev, allow all; tighten in production
  },
}));

app.use(express.json({ limit: '5mb' }));

// Rate limiting: 100 requests per 15 min per IP
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
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

// Root route
app.get('/', (_req, res) => res.json({ name: 'Peak Sun Energy API', status: 'ok' }));

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
