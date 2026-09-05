const db = require('../config/db');
const QuizModel = require('../models/quizModel');
const QuestionModel = require('../models/questionModel');
const ActivityModel = require('../models/activityModel');
const loggerService = require('../services/loggerService');
const presenceService = require('../services/presenceService');
const alertEmailService = require('../services/alertEmailService');
const { success, error } = require('../utils/apiResponse');

// @desc    Get admin dashboard stats
// @route   GET /api/admin/dashboard
// @access  Admin
exports.getDashboardStats = async (req, res) => {
  try {
    const usersCount = await db.query('SELECT COUNT(*) FROM users');
    const quizzesCount = await db.query('SELECT COUNT(*) FROM question_files');
    const tournamentsCount = await db.query("SELECT COUNT(*) FROM tournaments WHERE status = 'active' OR status = 'upcoming'");
    const reportsCount = await db.query("SELECT COUNT(*) FROM bug_reports WHERE status = 'unresolved'");

    const recentActivity = await ActivityModel.getRecent(5);
    const onlineUsers = presenceService.getOnlineCount();

    return success(res, {
      totalUsers: parseInt(usersCount.rows[0].count),
      totalQuizzes: parseInt(quizzesCount.rows[0].count),
      activeTournaments: parseInt(tournamentsCount.rows[0].count),
      pendingReports: parseInt(reportsCount.rows[0].count),
      onlineUsers,
      recentActivity
    }, 'Dashboard stats fetched');
  } catch (err) {
    console.error('Dashboard Stats Error:', err);
    return error(res, 'Failed to fetch dashboard stats', 500);
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Admin
exports.getAllUsers = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT user_id, full_name, email, username, role, total_points, is_active, created_at FROM users ORDER BY created_at DESC'
    );
    return success(res, result.rows, 'Users fetched successfully');
  } catch (err) {
    console.error('Get Users Error:', err);
    return error(res, 'Failed to fetch users', 500);
  }
};

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Admin
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['student', 'instructor', 'admin'].includes(role)) {
      return error(res, 'Invalid role', 400);
    }

    const result = await db.query(
      'UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 RETURNING user_id, username, role',
      [role, req.params.id]
    );

    if (result.rows.length === 0) return error(res, 'User not found', 404);
    return success(res, result.rows[0], `User role updated to ${role}`);
  } catch (err) {
    console.error('Update Role Error:', err);
    return error(res, 'Failed to update role', 500);
  }
};

// @desc    Toggle user active status
// @route   PUT /api/admin/users/:id/active
// @access  Admin
exports.toggleUserActive = async (req, res) => {
  try {
    const { is_active } = req.body;
    const result = await db.query(
      'UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 RETURNING user_id, username, is_active',
      [is_active, req.params.id]
    );

    if (result.rows.length === 0) return error(res, 'User not found', 404);
    return success(res, result.rows[0], `User ${is_active ? 'activated' : 'deactivated'}`);
  } catch (err) {
    console.error('Toggle Active Error:', err);
    return error(res, 'Failed to toggle user status', 500);
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Admin
exports.deleteUser = async (req, res) => {
  try {
    await db.query('DELETE FROM users WHERE user_id = $1', [req.params.id]);
    return success(res, null, 'User deleted successfully');
  } catch (err) {
    console.error('Delete User Error:', err);
    return error(res, 'Failed to delete user', 500);
  }
};

// @desc    Get all content (question files)
// @route   GET /api/admin/content
// @access  Admin
exports.getAllContent = async (req, res) => {
  try {
    const files = await QuizModel.getAllFiles();
    return success(res, files, 'Content fetched successfully');
  } catch (err) {
    console.error('Get Content Error:', err);
    return error(res, 'Failed to fetch content', 500);
  }
};

// @desc    Get questions in a file
// @route   GET /api/admin/content/:fileId/questions
// @access  Admin
exports.getContentQuestions = async (req, res) => {
  try {
    const questions = await QuestionModel.getByFileId(req.params.fileId);
    return success(res, questions, 'Questions fetched successfully');
  } catch (err) {
    console.error('Get Content Questions Error:', err);
    return error(res, 'Failed to fetch questions', 500);
  }
};

// @desc    Delete content file
// @route   DELETE /api/admin/content/:fileId
// @access  Admin
exports.deleteContent = async (req, res) => {
  try {
    await QuizModel.deleteFile(req.params.fileId);
    return success(res, null, 'Content deleted successfully');
  } catch (err) {
    console.error('Delete Content Error:', err);
    return error(res, 'Failed to delete content', 500);
  }
};

// @desc    Delete single question
// @route   DELETE /api/admin/questions/:questionId
// @access  Admin
exports.deleteQuestion = async (req, res) => {
  try {
    await QuestionModel.delete(req.params.questionId);
    return success(res, null, 'Question deleted successfully');
  } catch (err) {
    console.error('Delete Question Error:', err);
    return error(res, 'Failed to delete question', 500);
  }
};

// @desc    Update a question
// @route   PUT /api/admin/questions/:questionId
// @access  Admin
exports.updateQuestion = async (req, res) => {
  try {
    const { full_question_text, option_a, option_b, option_c, option_d, correct_answer, hint, explanation } = req.body;

    if (!full_question_text || !option_a || !option_b || !correct_answer) {
      return error(res, 'Question text, at least options A & B, and correct answer are required', 400);
    }

    const updateData = {};
    if (full_question_text) updateData.full_question_text = full_question_text;
    if (option_a) updateData.option_a = option_a;
    if (option_b) updateData.option_b = option_b;
    if (option_c !== undefined) updateData.option_c = option_c;
    if (option_d !== undefined) updateData.option_d = option_d;
    if (correct_answer) updateData.correct_answer = correct_answer;
    if (hint !== undefined) updateData.hint = hint;
    if (explanation !== undefined) updateData.explanation = explanation;

    const updated = await QuestionModel.update(req.params.questionId, updateData);
    if (!updated) return error(res, 'Question not found', 404);

    return success(res, updated, 'Question updated successfully');
  } catch (err) {
    console.error('Update Question Error:', err);
    return error(res, 'Failed to update question', 500);
  }
};

// @desc    Update quiz / question paper metadata
// @route   PUT /api/admin/content/:fileId
// @access  Admin
exports.updateContent = async (req, res) => {
  try {
    const { file_name, subject, topic, micro_topic, status, year, month, is_solved_paper } = req.body;
    const fileId = req.params.fileId;

    const result = await db.query(
      `UPDATE question_files 
       SET file_name = $1, subject = $2, topic = $3, micro_topic = $4, status = $5, year = $6, month = $7, is_solved_paper = $8, uploaded_at = CURRENT_TIMESTAMP
       WHERE file_id = $9 RETURNING *`,
      [
        file_name,
        subject,
        topic,
        micro_topic,
        status || 'Draft',
        year ? parseInt(year) : null,
        month || null,
        is_solved_paper === true || is_solved_paper === 'true',
        fileId
      ]
    );

    if (result.rows.length === 0) {
      return error(res, 'Question paper not found', 404);
    }

    return success(res, result.rows[0], 'Question paper metadata updated successfully');
  } catch (err) {
    console.error('Update Content Error:', err);
    return error(res, 'Failed to update question paper metadata', 500);
  }
};

// ──────────────────────────────────────────
// Activity Logger, Resource Monitoring & Alert Endpoints
// ──────────────────────────────────────────

const resourceMonitorService = require('../services/resourceMonitorService');

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

// @desc    Send test alert email to specified or admin email
// @route   POST /api/admin/alerts/test
// @access  Admin
exports.sendTestAlertEmail = async (req, res) => {
  try {
    const { targetEmail } = req.body;
    const recipient = targetEmail || await alertEmailService.getRecipientEmail();

    await alertEmailService.sendTestEmail(recipient);
    return success(res, { recipient }, `Test alert email sent to ${recipient}`);
  } catch (err) {
    console.error('Test Alert Email Error:', err);
    return error(res, `Failed to send test email: ${err.message}`, 400);
  }
};

// @desc    Get threshold email alert configuration
// @route   GET /api/admin/alerts/config
// @access  Admin
exports.getAlertConfig = async (req, res) => {
  try {
    const config = await alertEmailService.getThresholdConfig();
    const recipientEmail = await alertEmailService.getRecipientEmail();
    return success(res, { ...config, recipientEmail }, 'Alert configuration fetched');
  } catch (err) {
    console.error('Get Alert Config Error:', err);
    return error(res, 'Failed to fetch alert config', 500);
  }
};

// @desc    Update threshold email alert configuration
// @route   PUT /api/admin/alerts/config
// @access  Admin
exports.updateAlertConfig = async (req, res) => {
  try {
    const { threshold, enabled, cooldownMinutes, recipientEmail } = req.body;

    if (threshold !== undefined) {
      await db.query(
        "INSERT INTO site_settings (key, value) VALUES ('online_user_alert_threshold', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
        [String(threshold)]
      );
    }

    if (enabled !== undefined) {
      await db.query(
        "INSERT INTO site_settings (key, value) VALUES ('enable_online_alerts', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
        [String(enabled)]
      );
    }

    if (cooldownMinutes !== undefined) {
      await db.query(
        "INSERT INTO site_settings (key, value) VALUES ('alert_cooldown_minutes', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
        [String(cooldownMinutes)]
      );
    }

    if (recipientEmail) {
      await db.query(
        "INSERT INTO site_settings (key, value) VALUES ('alert_email', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
        [recipientEmail]
      );
    }

    const updatedConfig = await alertEmailService.getThresholdConfig();
    const updatedRecipient = await alertEmailService.getRecipientEmail();

    return success(res, { ...updatedConfig, recipientEmail: updatedRecipient }, 'Alert configuration updated');
  } catch (err) {
    console.error('Update Alert Config Error:', err);
    return error(res, 'Failed to update alert config', 500);
  }
};

