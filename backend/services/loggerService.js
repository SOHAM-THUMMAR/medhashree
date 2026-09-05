const db = require('../config/db');

/**
 * Service for managing system and user activity logs in PostgreSQL
 */
class LoggerService {
  /**
   * Log an activity entry asynchronously
   * @param {Object} params
   * @param {number|null} params.userId
   * @param {string} [params.username]
   * @param {string} [params.role]
   * @param {string} params.action - Short descriptor (e.g. 'USER_LOGIN', 'QUIZ_SUBMIT', 'ADMIN_USER_DELETE')
   * @param {string} [params.method] - HTTP method (GET, POST, etc.)
   * @param {string} [params.endpoint] - Endpoint path
   * @param {string} [params.ipAddress] - Request IP
   * @param {string} [params.userAgent] - Client browser user agent
   * @param {number} [params.statusCode] - HTTP status code
   * @param {string} [params.severity] - 'info', 'warning', 'error', 'security'
   * @param {Object|string} [params.details] - Additional contextual payload
   */
  async log({
    userId = null,
    username = null,
    role = null,
    action,
    method = null,
    endpoint = null,
    ipAddress = null,
    userAgent = null,
    statusCode = null,
    severity = 'info',
    details = null
  }) {
    try {
      if (!action) return;

      const formattedDetails = details ? (typeof details === 'object' ? JSON.stringify(details) : String(details)) : null;

      await db.query(
        `INSERT INTO activity_logs 
         (user_id, username, role, action, method, endpoint, ip_address, user_agent, status_code, severity, details)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb)`,
        [
          userId,
          username,
          role,
          action,
          method,
          endpoint,
          ipAddress,
          userAgent ? userAgent.substring(0, 500) : null,
          statusCode,
          severity,
          formattedDetails
        ]
      );
    } catch (err) {
      // Non-blocking log error
      console.error('[LoggerService Error]', err.message);
    }
  }

  async logInfo(action, req, details = null) {
    return this.log({
      userId: req?.user?.userId || null,
      username: req?.user?.username || null,
      role: req?.user?.role || null,
      action,
      method: req?.method,
      endpoint: req?.originalUrl || req?.url,
      ipAddress: req?.ip || req?.headers?.['x-forwarded-for'],
      userAgent: req?.headers?.['user-agent'],
      statusCode: 200,
      severity: 'info',
      details
    });
  }

  async logWarning(action, req, details = null) {
    return this.log({
      userId: req?.user?.userId || null,
      username: req?.user?.username || null,
      role: req?.user?.role || null,
      action,
      method: req?.method,
      endpoint: req?.originalUrl || req?.url,
      ipAddress: req?.ip || req?.headers?.['x-forwarded-for'],
      userAgent: req?.headers?.['user-agent'],
      severity: 'warning',
      details
    });
  }

  async logError(action, req, err, statusCode = 500) {
    return this.log({
      userId: req?.user?.userId || null,
      username: req?.user?.username || null,
      role: req?.user?.role || null,
      action,
      method: req?.method,
      endpoint: req?.originalUrl || req?.url,
      ipAddress: req?.ip || req?.headers?.['x-forwarded-for'],
      userAgent: req?.headers?.['user-agent'],
      statusCode,
      severity: 'error',
      details: { error: err?.message || String(err), stack: err?.stack }
    });
  }

  async logSecurity(action, req, details = null, statusCode = 401) {
    return this.log({
      userId: req?.user?.userId || null,
      username: req?.user?.username || null,
      role: req?.user?.role || null,
      action,
      method: req?.method,
      endpoint: req?.originalUrl || req?.url,
      ipAddress: req?.ip || req?.headers?.['x-forwarded-for'],
      userAgent: req?.headers?.['user-agent'],
      statusCode,
      severity: 'security',
      details
    });
  }

  /**
   * Fetch paginated logs for Admin Section
   */
  async getLogs({ page = 1, limit = 50, severity, action, search, startDate, endDate }) {
    try {
      const offset = (page - 1) * limit;
      const conditions = [];
      const values = [];
      let index = 1;

      if (severity && severity !== 'all') {
        conditions.push(`severity = $${index++}`);
        values.push(severity);
      }

      if (action && action !== 'all') {
        conditions.push(`action ILIKE $${index++}`);
        values.push(`%${action}%`);
      }

      if (search) {
        conditions.push(`(action ILIKE $${index} OR username ILIKE $${index} OR endpoint ILIKE $${index} OR ip_address ILIKE $${index})`);
        values.push(`%${search}%`);
        index++;
      }

      if (startDate) {
        conditions.push(`created_at >= $${index++}`);
        values.push(startDate);
      }

      if (endDate) {
        conditions.push(`created_at <= $${index++}`);
        values.push(endDate);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const countQuery = `SELECT COUNT(*) FROM activity_logs ${whereClause}`;
      const dataQuery = `
        SELECT log_id, user_id, username, role, action, method, endpoint, ip_address, user_agent, status_code, severity, details, created_at
        FROM activity_logs
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${index++} OFFSET $${index++}
      `;

      const countResult = await db.query(countQuery, values);
      const total = parseInt(countResult.rows[0].count, 10);

      const dataValues = [...values, limit, offset];
      const dataResult = await db.query(dataQuery, dataValues);

      return {
        total,
        page: parseInt(page, 10),
        totalPages: Math.ceil(total / limit),
        logs: dataResult.rows
      };
    } catch (err) {
      console.error('[LoggerService getLogs Error]', err);
      throw err;
    }
  }

  /**
   * Get log summary statistics
   */
  async getStats() {
    try {
      const totalResult = await db.query('SELECT COUNT(*) FROM activity_logs');
      const todayResult = await db.query("SELECT COUNT(*) FROM activity_logs WHERE created_at >= CURRENT_DATE");
      const securityResult = await db.query("SELECT COUNT(*) FROM activity_logs WHERE severity = 'security'");
      const errorResult = await db.query("SELECT COUNT(*) FROM activity_logs WHERE severity = 'error'");

      const topActionsResult = await db.query(`
        SELECT action, COUNT(*) as count 
        FROM activity_logs 
        GROUP BY action 
        ORDER BY count DESC 
        LIMIT 5
      `);

      return {
        totalLogs: parseInt(totalResult.rows[0].count, 10),
        todayLogs: parseInt(todayResult.rows[0].count, 10),
        securityEvents: parseInt(securityResult.rows[0].count, 10),
        errorEvents: parseInt(errorResult.rows[0].count, 10),
        topActions: topActionsResult.rows
      };
    } catch (err) {
      console.error('[LoggerService getStats Error]', err);
      return { totalLogs: 0, todayLogs: 0, securityEvents: 0, errorEvents: 0, topActions: [] };
    }
  }

  /**
   * Prune activity logs older than retention days (default 60 days) to optimize DB storage
   */
  async pruneOldLogs(days = 60) {
    try {
      const res = await db.query(
        "DELETE FROM activity_logs WHERE created_at < NOW() - (INTERVAL '1 day' * $1)",
        [days]
      );
      return { deletedCount: res.rowCount };
    } catch (err) {
      console.error('[LoggerService Prune Error]', err.message);
      return { deletedCount: 0 };
    }
  }
}

module.exports = new LoggerService();
