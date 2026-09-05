const fs = require('fs');
const path = require('path');

const LOGS_DIR = path.join(__dirname, '../logs');
const LOGS_FILE = path.join(LOGS_DIR, 'activity.json');
const MAX_IN_MEMORY_LOGS = 10000;

class LoggerService {
  constructor() {
    this.logs = [];
    this.nextLogId = 1;
    this.flushTimer = null;
    this.userCache = new Map();
    this.userCacheLastLoaded = 0;
    this._initStore();
  }

  /**
   * Initialize local directory and load JSON log store from disk
   */
  _initStore() {
    try {
      if (!fs.existsSync(LOGS_DIR)) {
        fs.mkdirSync(LOGS_DIR, { recursive: true });
      }

      if (fs.existsSync(LOGS_FILE)) {
        const raw = fs.readFileSync(LOGS_FILE, 'utf8');
        if (raw.trim()) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            this.logs = parsed;
            const maxId = parsed.reduce((max, item) => Math.max(max, item.log_id || 0), 0);
            this.nextLogId = maxId + 1;
          }
        }
      } else {
        fs.writeFileSync(LOGS_FILE, JSON.stringify([], null, 2), 'utf8');
      }
    } catch (err) {
      console.error('[LoggerService Init Error]', err.message);
      this.logs = [];
    }
  }

  /**
   * Flush in-memory logs to JSON file (Debounced & Non-blocking)
   */
  _scheduleFlush() {
    if (this.flushTimer) return;

    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      try {
        fs.writeFile(LOGS_FILE, JSON.stringify(this.logs, null, 2), 'utf8', (err) => {
          if (err) console.error('[LoggerService File Write Error]', err.message);
        });
      } catch (err) {
        console.error('[LoggerService Flush Error]', err.message);
      }
    }, 500); // Flush every 500ms
  }

  /**
   * Load user cache from DB (Cached for 60s)
   */
  async _loadUserCache() {
    if (Date.now() - this.userCacheLastLoaded < 60000 && this.userCache.size > 0) {
      return;
    }
    try {
      const db = require('../config/db');
      await db.dbInitPromise;
      const res = await db.query('SELECT user_id, email, username FROM users');
      if (res && res.rows) {
        this.userCache.clear();
        for (const u of res.rows) {
          this.userCache.set(u.user_id, u);
          this.userCache.set(String(u.user_id), u);
          if (u.username) {
            this.userCache.set(u.username, u);
            this.userCache.set(String(u.username).toLowerCase(), u);
          }
          if (u.email) {
            this.userCache.set(u.email, u);
            this.userCache.set(String(u.email).toLowerCase(), u);
          }
        }
        this.userCacheLastLoaded = Date.now();
      }
    } catch (e) {
      // Non-blocking if DB is initializing
    }
  }

  /**
   * Automatically enrich all logs with user email addresses & handles
   */
  async _enrichLogs() {
    await this._loadUserCache();
    let modified = false;

    for (const log of this.logs) {
      // 1. Enrich by user_id
      if (log.user_id != null && (this.userCache.has(log.user_id) || this.userCache.has(String(log.user_id)))) {
        const u = this.userCache.get(log.user_id) || this.userCache.get(String(log.user_id));
        if (!log.email && u.email) {
          log.email = u.email;
          modified = true;
        }
        if ((!log.username || log.username === `user_${log.user_id}`) && u.username) {
          log.username = u.username;
          modified = true;
        }
      }

      // 2. Enrich by username
      if (!log.email && log.username && (this.userCache.has(log.username) || this.userCache.has(String(log.username).toLowerCase()))) {
        const u = this.userCache.get(log.username) || this.userCache.get(String(log.username).toLowerCase());
        if (u && u.email) {
          log.email = u.email;
          modified = true;
        }
      }

      // 3. Enrich by details.email
      if (!log.email && log.details && typeof log.details === 'object' && log.details.email) {
        log.email = log.details.email;
        modified = true;
      }
    }

    if (modified) {
      this._scheduleFlush();
    }
  }

  /**
   * Log an activity entry into JSON store
   */
  async log({
    userId = null,
    username = null,
    email = null,
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

      if (this.userCache.size === 0) {
        await this._loadUserCache();
      }

      const formattedDetails = details 
        ? (typeof details === 'object' ? details : { info: String(details) })
        : null;

      let userEmail = email || details?.email || (typeof details === 'object' && details?.email) || null;

      if (!userEmail && userId != null && (this.userCache.has(userId) || this.userCache.has(String(userId)))) {
        const u = this.userCache.get(userId) || this.userCache.get(String(userId));
        userEmail = u.email;
      }

      let userHandle = username;
      if (!userHandle && userId != null && (this.userCache.has(userId) || this.userCache.has(String(userId)))) {
        const u = this.userCache.get(userId) || this.userCache.get(String(userId));
        userHandle = u.username;
      }

      const newLog = {
        log_id: this.nextLogId++,
        user_id: userId,
        username: userHandle || (userId ? `user_${userId}` : 'guest'),
        email: userEmail,
        role: role || 'guest',
        action,
        method,
        endpoint,
        ip_address: ipAddress || '127.0.0.1',
        user_agent: userAgent ? String(userAgent).substring(0, 300) : null,
        status_code: statusCode,
        severity: severity || 'info',
        details: formattedDetails,
        created_at: new Date().toISOString()
      };

      // Unshift to front (most recent first)
      this.logs.unshift(newLog);

      // Cap in-memory size
      if (this.logs.length > MAX_IN_MEMORY_LOGS) {
        this.logs = this.logs.slice(0, MAX_IN_MEMORY_LOGS);
      }

      this._scheduleFlush();
    } catch (err) {
      console.error('[LoggerService Log Error]', err.message);
    }
  }

  async logInfo(action, req, details = null) {
    return this.log({
      userId: req?.user?.userId || null,
      username: req?.user?.username || null,
      email: req?.user?.email || req?.body?.email || details?.email || null,
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
      email: req?.user?.email || req?.body?.email || details?.email || null,
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
      email: req?.user?.email || req?.body?.email || null,
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
      email: req?.user?.email || req?.body?.email || details?.email || null,
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
   * Fetch paginated logs for Admin UI directly from JSON store
   */
  async getLogs({ page = 1, limit = 50, severity, action, search, startDate, endDate }) {
    try {
      await this._enrichLogs();
      let filtered = [...this.logs];

      // Severity filter
      if (severity && severity !== 'all') {
        filtered = filtered.filter(l => l.severity === severity);
      }

      // Action filter
      if (action && action !== 'all') {
        const queryAction = action.toLowerCase();
        filtered = filtered.filter(l => l.action && l.action.toLowerCase().includes(queryAction));
      }

      // General Search filter (checking email, username, action, ip_address, endpoint, details)
      if (search) {
        const query = search.toLowerCase().trim();
        filtered = filtered.filter(l =>
          (l.email && l.email.toLowerCase().includes(query)) ||
          (l.action && l.action.toLowerCase().includes(query)) ||
          (l.username && l.username.toLowerCase().includes(query)) ||
          (l.endpoint && l.endpoint.toLowerCase().includes(query)) ||
          (l.ip_address && l.ip_address.toLowerCase().includes(query)) ||
          (l.details && JSON.stringify(l.details).toLowerCase().includes(query))
        );
      }

      // Date Range filters
      if (startDate) {
        const startMs = new Date(startDate).getTime();
        filtered = filtered.filter(l => new Date(l.created_at).getTime() >= startMs);
      }

      if (endDate) {
        const endMs = new Date(endDate).getTime();
        filtered = filtered.filter(l => new Date(l.created_at).getTime() <= endMs);
      }

      const total = filtered.length;
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 50;
      const offset = (pageNum - 1) * limitNum;
      const paginatedLogs = filtered.slice(offset, offset + limitNum);

      return {
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum) || 1,
        logs: paginatedLogs
      };
    } catch (err) {
      console.error('[LoggerService getLogs Error]', err.message);
      return { total: 0, page: 1, totalPages: 1, logs: [] };
    }
  }

  /**
   * Get log summary statistics directly from JSON store
   */
  async getStats() {
    try {
      await this._enrichLogs();
      const todayStr = new Date().toISOString().split('T')[0];

      let todayCount = 0;
      let securityCount = 0;
      let errorCount = 0;
      const actionCounts = {};

      for (const log of this.logs) {
        if (log.created_at && log.created_at.startsWith(todayStr)) {
          todayCount++;
        }
        if (log.severity === 'security') securityCount++;
        if (log.severity === 'error') errorCount++;

        if (log.action) {
          actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
        }
      }

      const topActions = Object.entries(actionCounts)
        .map(([action, count]) => ({ action, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        totalLogs: this.logs.length,
        todayLogs: todayCount,
        securityEvents: securityCount,
        errorEvents: errorCount,
        topActions
      };
    } catch (err) {
      console.error('[LoggerService getStats Error]', err.message);
      return { totalLogs: 0, todayLogs: 0, securityEvents: 0, errorEvents: 0, topActions: [] };
    }
  }

  /**
   * Prune activity logs older than retention days
   */
  async pruneOldLogs(days = 60) {
    try {
      const cutoffMs = Date.now() - (days * 24 * 60 * 60 * 1000);
      const initialCount = this.logs.length;
      this.logs = this.logs.filter(l => new Date(l.created_at).getTime() >= cutoffMs);
      const deletedCount = initialCount - this.logs.length;

      this._scheduleFlush();
      return { deletedCount };
    } catch (err) {
      console.error('[LoggerService Prune Error]', err.message);
      return { deletedCount: 0 };
    }
  }
}

module.exports = new LoggerService();
