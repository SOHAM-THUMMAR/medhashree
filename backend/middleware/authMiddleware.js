const { verifyToken } = require('../utils/generateToken');
const { error } = require('../utils/apiResponse');

/**
 * Protect routes — verify JWT token
 */
exports.protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return error(res, 'Not authorized — no token provided', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return error(res, 'Not authorized — invalid token', 401);
    }

    req.user = decoded; // { userId, role }
    next();
  } catch (err) {
    console.error('Auth Middleware Error:', err);
    return error(res, 'Not authorized', 401);
  }
};

/**
 * Admin only access
 */
exports.adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return error(res, 'Access denied — admin only', 403);
};

/**
 * Instructor or Admin access
 */
exports.instructorOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'instructor' || req.user.role === 'admin')) {
    return next();
  }
  return error(res, 'Access denied — instructor or admin only', 403);
};