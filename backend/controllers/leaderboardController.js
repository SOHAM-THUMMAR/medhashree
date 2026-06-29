const db = require('../config/db');
const { success, error } = require('../utils/apiResponse');

// @desc    Get leaderboard (top users by points)
// @route   GET /api/leaderboard
// @access  Public
exports.getLeaderboard = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const result = await db.query(
      `SELECT user_id, username, full_name, total_points, total_quizzes, best_category, global_rank
       FROM users
       WHERE is_active = true
       ORDER BY total_points DESC
       LIMIT $1`,
      [limit]
    );

    // Add rank
    const leaderboard = result.rows.map((user, index) => ({
      rank: index + 1,
      ...user
    }));

    return success(res, leaderboard, 'Leaderboard fetched successfully');
  } catch (err) {
    console.error('Get Leaderboard Error:', err);
    return error(res, 'Failed to fetch leaderboard', 500);
  }
};

// @desc    Get user's rank
// @route   GET /api/leaderboard/rank/:userId
// @access  Public
exports.getUserRank = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT COUNT(*) + 1 as rank
       FROM users
       WHERE total_points > (SELECT total_points FROM users WHERE user_id = $1)
       AND is_active = true`,
      [req.params.userId]
    );

    return success(res, { rank: parseInt(result.rows[0].rank) }, 'User rank fetched');
  } catch (err) {
    console.error('Get User Rank Error:', err);
    return error(res, 'Failed to fetch user rank', 500);
  }
};