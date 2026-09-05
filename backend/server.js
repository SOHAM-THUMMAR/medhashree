const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const path = require('path');

// Security & Rate Limiting
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const xss = require('xss');

const env = require('./config/env');
const db = require('./config/db'); // Will log connection status
const activityLoggerMiddleware = require('./middleware/loggerMiddleware');
const presenceService = require('./services/presenceService');

const app = express();
const server = http.createServer(app);

// Trust proxy for Nginx / reverse proxy deployment
app.set('trust proxy', 1);

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
// Security Middleware & Headers
// ──────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // Disabled: SPA with inline scripts, MathJax CDN, Google OAuth
  crossOriginEmbedderPolicy: false,
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  frameguard: { action: 'deny' },
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

// Hide framework signature
app.disable('x-powered-by');

// Middleware
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Global Input Sanitization Middleware (XSS prevention)
app.use((req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = xss(req.body[key]);
      }
    }
  }
  next();
});

// Track REST API User Presence Heartbeat
app.use((req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const { verifyToken } = require('./utils/generateToken');
      const decoded = verifyToken(token);
      if (decoded && decoded.userId) {
        req.user = decoded;
        presenceService.recordApiActivity(decoded.userId);
      }
    } catch (e) {
      // Ignore token parse error for unauthenticated requests
    }
  }
  next();
});

// Mount System Activity Logger
app.use(activityLoggerMiddleware);

// ──────────────────────────────────────────
// Rate Limiting
// ──────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 500, // 500 requests per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests from this IP. Please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // 15 auth attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many login/register attempts. Please try again later.' }
});

app.use('/api/', globalLimiter);


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
const frontendDistPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDistPath));

// SPA router fallback (directs non-API traffic to React)
app.get('*all', (req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({ success: false, error: 'API endpoint not found' });
  }
  const indexHtmlPath = path.join(frontendDistPath, 'index.html');
  if (require('fs').existsSync(indexHtmlPath)) {
    res.sendFile(indexHtmlPath);
  } else {
    res.json({ success: true, message: 'Medhashree API is running. Build frontend with "python start.py" or "cd frontend && pnpm run build" to view UI.' });
  }
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
