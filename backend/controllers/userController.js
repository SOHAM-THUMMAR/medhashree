const db = require('../config/db');
const { success, error } = require('../utils/apiResponse');

// @desc    Get user profile by ID
// @route   GET /api/users/:id
// @access  Public (or Protected later)
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;

    // Fetch basic user data (using valid columns from the schema)
    const userResult = await db.query(
      'SELECT user_id, full_name, email, username, role, profile_picture, created_at, total_points, total_quizzes, global_rank, current_streak, highest_streak, win_rate, time_played_min, completion_rate, best_category, fav_category, weakest_category FROM users WHERE user_id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return error(res, 'User not found', 404);
    }

    const user = userResult.rows[0];

    // Fetch user recent activity
    const activityResult = await db.query(
      'SELECT activity_type, title as description, metadata, created_at FROM user_activity WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10',
      [userId]
    );

    user.activity_feed = activityResult.rows;

    return success(res, user, 'User profile fetched successfully');
  } catch (err) {
    console.error('Error fetching user profile:', err);
    return error(res, 'Server error while fetching profile', 500);
  }
};

// @desc    Get dashboard metrics for a user
// @route   GET /api/users/dashboard/:id
// @access  Public (or Protected later)
exports.getDashboardData = async (req, res) => {
  try {
    const userId = req.params.id;

    // Auto-validate and reset broken streaks before fetching stats
    try {
      const activeStreakRes = await db.query(
        'SELECT current_streak FROM users WHERE user_id = $1',
        [userId]
      );
      if (activeStreakRes.rows.length > 0 && parseInt(activeStreakRes.rows[0].current_streak) > 0) {
        // Check if there was any completed attempt today or yesterday
        const recentAttempts = await db.query(
          `SELECT COUNT(*) as count FROM quiz_attempts 
           WHERE user_id = $1 AND status = 'Completed' 
             AND attempted_at >= CURRENT_DATE - INTERVAL '1 day'`,
          [userId]
        );
        if (parseInt(recentAttempts.rows[0].count) === 0) {
          // No attempts today or yesterday! Reset streak to 0.
          await db.query('UPDATE users SET current_streak = 0 WHERE user_id = $1', [userId]);
        }
      }
    } catch (streakErr) {
      console.error('Error auto-validating user streak:', streakErr.message);
    }

    // Get user's basic info including total_points, rank, streaks
    const userResult = await db.query(
      'SELECT total_points, global_rank, total_quizzes, current_streak, highest_streak FROM users WHERE user_id = $1',
      [userId]
    );

    // Get quiz session stats — use CASE WHEN to select the user's own score
    let sessionStats = { total_quizzes_taken: 0, completed_quizzes: 0, total_score_earned: 0, highest_score: 0 };
    try {
      const statsResult = await db.query(`
        SELECT 
          COUNT(*) as total_quizzes_taken,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_quizzes,
          COALESCE(SUM(
            CASE WHEN user1_id = $1 THEN COALESCE(user1_score, 0)
                 ELSE COALESCE(user2_score, 0) END
          ), 0) as total_score_earned,
          COALESCE(MAX(
            CASE WHEN user1_id = $1 THEN COALESCE(user1_score, 0)
                 ELSE COALESCE(user2_score, 0) END
          ), 0) as highest_score
        FROM quiz_sessions
        WHERE user1_id = $1 OR user2_id = $1
      `, [userId]);
      if (statsResult.rows.length > 0) {
        sessionStats = statsResult.rows[0];
      }
    } catch (e) {
      console.error('Quiz sessions query error (table may not exist yet):', e.message);
    }

    // Get quiz activity by subject (for chart)
    let subjectActivity = [];
    try {
      const subjectResult = await db.query(`
        SELECT s.name as subject_name, COUNT(qs.session_id) as quiz_count
        FROM quiz_sessions qs
        LEFT JOIN subjects s ON qs.subject_id = s.subject_id
        WHERE (qs.user1_id = $1 OR qs.user2_id = $1) AND qs.status = 'completed'
        GROUP BY s.name
        ORDER BY quiz_count DESC
        LIMIT 5
      `, [userId]);
      subjectActivity = subjectResult.rows;
    } catch (e) {
      console.error('Subject activity query error:', e.message);
    }

    // Get subjects the user is best at (highest average score percentage)
    let bestSubjects = [];
    try {
      const bestResult = await db.query(`
        SELECT s.name as subject_name, 
               ROUND(AVG(
                 CASE WHEN qs.user1_id = $1 THEN COALESCE(qs.user1_score, 0) * 100.0 / NULLIF(qs.question_count, 0)
                      ELSE COALESCE(qs.user2_score, 0) * 100.0 / NULLIF(qs.question_count, 0) END
               ), 0) as avg_score_percent,
               COUNT(*) as completed_count
        FROM quiz_sessions qs
        JOIN subjects s ON qs.subject_id = s.subject_id
        WHERE (qs.user1_id = $1 OR qs.user2_id = $1) AND qs.status = 'completed'
        GROUP BY s.name
        ORDER BY avg_score_percent DESC, completed_count DESC
        LIMIT 3
      `, [userId]);
      bestSubjects = bestResult.rows.map(row => ({
        subject_name: row.subject_name,
        avg_score_percent: parseInt(row.avg_score_percent) || 0,
        completed_count: parseInt(row.completed_count) || 0
      }));
    } catch (e) {
      console.error('Best subjects query error:', e.message);
    }

    // Get highest score highlights
    let highestScores = [];
    try {
      const highScoresResult = await db.query(`
        SELECT qa.score_percent, qa.total_questions, qa.correct_answers,
               qf.file_name, c.name as category_name
        FROM quiz_attempts qa
        LEFT JOIN question_files qf ON qa.file_id = qf.file_id
        LEFT JOIN quiz_sessions qs ON qa.session_id = qs.session_id
        LEFT JOIN categories c ON qs.category_id = c.category_id
        WHERE qa.user_id = $1
        ORDER BY qa.score_percent DESC
        LIMIT 3
      `, [userId]);
      highestScores = highScoresResult.rows;
    } catch (e) {
      console.error('Highest scores query error:', e.message);
    }

    // Get contest/tournament scores
    let contestScores = [];
    try {
      const contestResult = await db.query(`
        SELECT t.name, tp.score, tp.rank
        FROM tournament_participants tp
        JOIN tournaments t ON tp.tournament_id = t.tournament_id
        WHERE tp.user_id = $1
        ORDER BY tp.score DESC
        LIMIT 3
      `, [userId]);
      contestScores = contestResult.rows;
    } catch (e) {
      console.error('Contest scores query error:', e.message);
    }

    // Get daily activity for consistency chart (last 70 days / 10 weeks)
    let dailyActivity = [];
    try {
      const activityResult = await db.query(`
        SELECT TO_CHAR(attempted_at, 'YYYY-MM-DD') as date, COUNT(*) as count
        FROM quiz_attempts
        WHERE user_id = $1 AND attempted_at >= CURRENT_DATE - INTERVAL '70 days'
        GROUP BY TO_CHAR(attempted_at, 'YYYY-MM-DD')
        ORDER BY date ASC
      `, [userId]);
      
      dailyActivity = activityResult.rows.map(row => ({
        date: row.date,
        count: parseInt(row.count) || 0
      }));
    } catch (e) {
      console.error('Daily activity query error:', e.message);
    }

    const dashData = {
      total_quizzes_taken: parseInt(sessionStats.total_quizzes_taken) || (userResult.rows[0]?.total_quizzes || 0),
      completed_quizzes: parseInt(sessionStats.completed_quizzes) || 0,
      total_score_earned: parseInt(sessionStats.total_score_earned) || (userResult.rows[0]?.total_points || 0),
      highest_score: parseInt(sessionStats.highest_score) || 0,
      global_rank: userResult.rows[0]?.global_rank || null,
      current_streak: userResult.rows[0]?.current_streak || 0,
      highest_streak: userResult.rows[0]?.highest_streak || 0,
      subjectActivity,
      highestScores,
      contestScores,
      dailyActivity,
      bestSubjects
    };

    return success(res, dashData, 'Dashboard data fetched successfully');
  } catch (err) {
    console.error('Error fetching dashboard data:', err);
    return error(res, 'Server error while fetching dashboard data', 500);
  }
};

// @desc    Get detailed stats (e.g. for charts)
// @route   GET /api/users/stats/:id
// @access  Public (or Protected later)
exports.getUserStats = async (req, res) => {
  try {
    const userId = req.params.id;

    // Get user base stats
    const userResult = await db.query(
      'SELECT total_points, total_quizzes, win_rate FROM users WHERE user_id = $1',
      [userId]
    );

    // Get win/loss ratio from quiz_sessions (battles)
    const battlesResult = await db.query(`
      SELECT 
        COUNT(*) as total_battles,
        COUNT(CASE WHEN winner_id = $1 THEN 1 END) as wins
      FROM quiz_sessions
      WHERE quiz_type = '1v1' AND (user1_id = $1 OR user2_id = $1) AND status = 'completed'
    `, [userId]);

    const stats = battlesResult.rows[0];

    // Calculate win rate
    stats.win_rate = stats.total_battles > 0
      ? Math.round((stats.wins / stats.total_battles) * 100)
      : (userResult.rows[0]?.win_rate || 0);

    stats.total_points = userResult.rows[0]?.total_points || 0;

    return success(res, stats, 'User stats fetched successfully');
  } catch (err) {
    console.error('Error fetching user stats:', err);
    return error(res, 'Server error while fetching user stats', 500);
  }
};

// @desc    Get user notifications (from activity feed)
// @route   GET /api/users/notifications/:id
// @access  Public
exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.params.id;

    const result = await db.query(
      `SELECT activity_id, activity_type, title, score, metadata, created_at 
       FROM user_activity 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 20`,
      [userId]
    );

    return success(res, result.rows, 'Notifications fetched successfully');
  } catch (err) {
    console.error('Error fetching notifications:', err);
    return error(res, 'Server error while fetching notifications', 500);
  }
};
