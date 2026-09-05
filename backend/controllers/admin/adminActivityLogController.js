const loggerService = require('../../services/loggerService');
const resourceMonitorService = require('../../services/resourceMonitorService');
const presenceService = require('../../services/presenceService');
const { success, error } = require('../../utils/apiResponse');

// @desc    Get real-time server resource monitoring metrics (CPU, RAM, DB Pool, Uptime)
// @route   GET /api/admin/resource-stats
// @access  Admin
exports.getResourceStats = async (req, res) => {
  try {
    const stats = await resourceMonitorService.getResourceStats();
    return success(res, stats, 'Resource monitoring stats fetched');
  } catch (err) {
    console.error('Get Resource Stats Error:', err);
    return error(res, 'Failed to fetch resource stats', 500);
  }
};

// @desc    Get paginated activity logs
// @route   GET /api/admin/activity-logs
// @access  Admin
exports.getActivityLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, severity, action, search, startDate, endDate } = req.query;
    const result = await loggerService.getLogs({ page, limit, severity, action, search, startDate, endDate });
    return success(res, result, 'Activity logs fetched successfully');
  } catch (err) {
    console.error('Get Activity Logs Error:', err);
    return error(res, 'Failed to fetch activity logs', 500);
  }
};

// @desc    Get activity log statistics
// @route   GET /api/admin/activity-logs/stats
// @access  Admin
exports.getActivityLogStats = async (req, res) => {
  try {
    const stats = await loggerService.getStats();
    return success(res, stats, 'Activity log statistics fetched');
  } catch (err) {
    console.error('Get Activity Log Stats Error:', err);
    return error(res, 'Failed to fetch log statistics', 500);
  }
};

// @desc    Export activity logs (JSON or CSV)
// @route   GET /api/admin/activity-logs/export
// @access  Admin
exports.exportActivityLogs = async (req, res) => {
  try {
    const { format = 'csv', severity, action, search } = req.query;
    const result = await loggerService.getLogs({ page: 1, limit: 5000, severity, action, search });

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="activity_logs.json"');
      return res.send(JSON.stringify(result.logs, null, 2));
    }

    // CSV Format
    const headers = ['Log ID', 'Created At', 'Severity', 'Action', 'User ID', 'Username', 'Role', 'Method', 'Endpoint', 'IP Address', 'Status Code'];
    const rows = result.logs.map(log => [
      log.log_id,
      `"${new Date(log.created_at).toISOString()}"`,
      `"${log.severity}"`,
      `"${log.action}"`,
      log.user_id || '',
      `"${log.username || ''}"`,
      `"${log.role || ''}"`,
      `"${log.method || ''}"`,
      `"${log.endpoint || ''}"`,
      `"${log.ip_address || ''}"`,
      log.status_code || ''
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="activity_logs.csv"');
    return res.send(csvContent);
  } catch (err) {
    console.error('Export Activity Logs Error:', err);
    return error(res, 'Failed to export activity logs', 500);
  }
};

// @desc    Get current real-time online user count
// @route   GET /api/admin/online-users
// @access  Admin
exports.getOnlineUserCount = async (req, res) => {
  try {
    const count = presenceService.getOnlineCount();
    return success(res, { onlineUsers: count }, 'Online user count fetched');
  } catch (err) {
    console.error('Get Online User Count Error:', err);
    return error(res, 'Failed to fetch online user count', 500);
  }
};
