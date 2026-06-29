const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const path = require('path');

// Security & Rate Limiting
let helmet;
try { helmet = require('helmet'); } catch (e) { helmet = null; }
let rateLimit;
try { rateLimit = require('express-rate-limit'); } catch (e) { rateLimit = null; }

const env = require('./config/env');
const db = require('./config/db'); // Will log connection status

const app = express();
const server = http.createServer(app);

// Configure allowed origins based on FRONTEND_URL env var
const allowedOrigins = env.FRONTEND_URL 
  ? env.FRONTEND_URL.split(',').map(url => url.trim()) 
  : '*';

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// ──────────────────────────────────────────
// Security Middleware
// ──────────────────────────────────────────
if (helmet) {
  app.use(helmet({
    contentSecurityPolicy: false, // Disabled: SPA with inline scripts, MathJax CDN, Google OAuth
    crossOriginEmbedderPolicy: false, // Disabled: allows loading Google OAuth, MathJax assets
  }));
} else if (env.NODE_ENV === 'production') {
  console.warn('Warning: helmet is not installed. Run: npm install helmet');
}

// Hide framework signature
app.disable('x-powered-by');

// Middleware
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ──────────────────────────────────────────
// Rate Limiting (Auth endpoints)
// ──────────────────────────────────────────
let authLimiter = null;
if (rateLimit) {
  authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 attempts per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many attempts. Please try again later.' }
  });
} else if (env.NODE_ENV === 'production') {
  console.warn('Warning: express-rate-limit is not installed. Run: npm install express-rate-limit');
}

// ──────────────────────────────────────────
// Import ALL Routes
// ──────────────────────────────────────────
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const quizRoutes = require('./routes/quizRoutes');
const battleRoutes = require('./routes/battleRoutes');
const tournamentRoutes = require('./routes/tournamentRoutes');
const selfStudyRoutes = require('./routes/selfStudyRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const bugReportRoutes = require('./routes/bugReportRoutes');
const newsRoutes = require('./routes/newsRoutes');
const adminRoutes = require('./routes/adminRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const fixedQuizRoutes = require('./routes/fixedQuizRoutes');

// Self Study hierarchy controllers (special routes)
const selfStudyController = require('./controllers/selfStudyController');

// ──────────────────────────────────────────
// Apply ALL Routes
// ──────────────────────────────────────────
app.use('/api/auth', authLimiter ? authLimiter : (req, res, next) => next(), authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/battle', battleRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/self-study', selfStudyRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/bug-reports', bugReportRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/site-settings', settingsRoutes);
app.use('/api/fixed-quizzes', fixedQuizRoutes);

// Self Study hierarchy — separate mount points
app.get('/api/subjects/:id/topics', selfStudyController.getTopics);
app.get('/api/topics/:id/micro-topics', selfStudyController.getMicroTopics);

// Health check (verifies database connectivity)
app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ success: true, message: 'API and Database are connected!' });
  } catch (err) {
    res.status(503).json({ success: false, error: 'Database connection failed' });
  }
});

// Initialize Socket.io battle matchmaking
const initBattleSocket = require('./sockets/battleSocket');
initBattleSocket(io);

// Create global io instance to use in controllers if needed
app.set('io', io);

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve React client static files
app.use(express.static(path.join(__dirname, '../client/dist')));

// SPA router fallback (directs non-API traffic to React)
app.get('*all', (req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({ success: false, error: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// ──────────────────────────────────────────
// Global Error Handler (sanitizes errors in production)
// ──────────────────────────────────────────
app.use((err, req, res, _next) => {
  const statusCode = err.status || err.statusCode || 500;
  const message = env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message || 'Internal server error';
  
  if (env.NODE_ENV !== 'production') {
    console.error('Unhandled Error:', err);
  }
  
  res.status(statusCode).json({ success: false, error: message });
});

// ──────────────────────────────────────────
// Start Server
// ──────────────────────────────────────────
db.dbInitPromise.then(() => {
  server.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT} (${env.NODE_ENV})`);
  });
}).catch(err => {
  console.error("Failed to start server due to database error:", err);
  process.exit(1);
});

// ──────────────────────────────────────────
// Graceful Shutdown (Docker / PM2)
// ──────────────────────────────────────────
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log('HTTP server closed.');
    db.pool.end(() => {
      console.log('Database pool closed.');
      process.exit(0);
    });
  });
  // Force exit after 10 seconds if graceful shutdown fails
  setTimeout(() => {
    console.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
