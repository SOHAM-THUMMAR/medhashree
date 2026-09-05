const loggerService = require('../services/loggerService');

/**
 * Middleware to capture key HTTP activity and log status codes
 */
const activityLoggerMiddleware = (req, res, next) => {
  // Ignore static assets or health checks from noise
  if (req.originalUrl.startsWith('/uploads') || req.originalUrl === '/api/health') {
    return next();
  }

  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    
    // Categorize severity based on status code
    let severity = 'info';
    if (statusCode >= 500) {
      severity = 'error';
    } else if (statusCode === 401 || statusCode === 403) {
      severity = 'security';
    } else if (statusCode >= 400) {
      severity = 'warning';
    }

    // Determine action name based on request path and method
    let action = `${req.method}_${req.baseUrl || ''}${req.path || ''}`
      .replace(/\/api\//, '')
      .replace(/\//g, '_')
      .toUpperCase();

    // Simplify common endpoints
    if (req.originalUrl.includes('/api/auth/login')) action = 'USER_LOGIN_ATTEMPT';
    if (req.originalUrl.includes('/api/auth/register')) action = 'USER_REGISTER_ATTEMPT';
    if (req.originalUrl.includes('/api/auth/forgot-password')) action = 'PASSWORD_RESET_REQUEST';
    if (req.originalUrl.includes('/api/admin')) action = `ADMIN_${req.method}_${req.path.replace(/\//g, '_').toUpperCase()}`;

    // Skip logging high-frequency GET polling calls to keep logs clean and meaningful
    if (req.method === 'GET' && (
      req.originalUrl.includes('/online-users') ||
      req.originalUrl.includes('/resource-stats') ||
      req.originalUrl.includes('/activity-logs') ||
      req.originalUrl.includes('/alerts/config') ||
      req.originalUrl.includes('/leaderboard') ||
      req.originalUrl.includes('/news')
    )) {
      return;
    }

    loggerService.log({
      userId: req.user?.userId || null,
      username: req.user?.username || null,
      email: req.user?.email || req.body?.email || null,
      role: req.user?.role || null,
      action,
      method: req.method,
      endpoint: req.originalUrl,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
      statusCode,
      severity,
      details: {
        durationMs: duration,
        query: Object.keys(req.query).length > 0 ? req.query : undefined
      }
    });
  });

  next();
};

module.exports = activityLoggerMiddleware;
