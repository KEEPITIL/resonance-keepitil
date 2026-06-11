require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const morgan = require('morgan');

const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

// Routes
const authRoutes          = require('./routes/auth');
const djRoutes            = require('./routes/djs');
const eventRoutes         = require('./routes/events');
const ticketRoutes        = require('./routes/tickets');
const bookingRoutes       = require('./routes/bookings');
const analyticsRoutes     = require('./routes/analytics');
const externalEventRoutes = require('./routes/externalEvents');
const adminRoutes         = require('./routes/admin');

const app = express();

// ── Security & compression ────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());

// ── CORS ──────────────────────────────────────────────────────────────────────
// CLIENT_URL can be comma-separated for multiple origins, e.g.:
//   CLIENT_URL=https://myapp.vercel.app,https://myapp.com
const allowedOrigins = [
  ...(process.env.CLIENT_URL || 'http://localhost:3000').split(',').map(s => s.trim()),
  'https://resonanceevents.com',
  'https://www.resonanceevents.com',
];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // allow server-to-server / curl
    if (allowedOrigins.includes(origin)) return cb(null, true);
    // Allow any Vercel preview / production URL during deployment
    if (origin.endsWith('.vercel.app') || origin.endsWith('.onrender.com')) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
}));

// ── Stripe webhook — raw body (must be BEFORE express.json) ──────────────────
app.use('/api/tickets/webhook', express.raw({ type: 'application/json' }));

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(mongoSanitize());

// ── Logging ───────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
}

// ── Rate limiting ─────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later' },
});
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { success: false, message: 'Too many auth attempts' } });

app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({
  status: 'ok',
  service: 'RESONANCE API',
  timestamp: new Date().toISOString(),
  environment: process.env.NODE_ENV,
}));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/djs', djRoutes);
// IMPORTANT: /api/events/external MUST be mounted before /api/events
// or Express will match 'external' as an :id/:slug param in the events router.
app.use('/api/events/external', externalEventRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/analytics', analyticsRoutes);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use('*', (req, res) => res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` }));

// ── Global error handler ──────────────────────────────────────────────────────
app.use(errorHandler);

// ── Database connection ───────────────────────────────────────────────────────
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    logger.info(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    logger.error('MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => {
    logger.info(`🎵 RESONANCE API running on port ${PORT} [${process.env.NODE_ENV}]`);
  });
});

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled rejection:', err.message);
  process.exit(1);
});

module.exports = app;
