const db = require('../../config/db');
const ActivityModel = require('../../models/activityModel');
const presenceService = require('../../services/presenceService');
const { success, error } = require('../../utils/apiResponse');

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
      totalUsers: parseInt(usersCount.rows[0].count, 10),
      totalQuizzes: parseInt(quizzesCount.rows[0].count, 10),
      activeTournaments: parseInt(tournamentsCount.rows[0].count, 10),
      pendingReports: parseInt(reportsCount.rows[0].count, 10),
      onlineUsers,
      recentActivity
    }, 'Dashboard stats fetched');
  } catch (err) {
    console.error('Dashboard Stats Error:', err);
    return error(res, 'Failed to fetch dashboard stats', 500);
  }
};
