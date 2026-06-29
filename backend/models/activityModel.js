const db = require('../config/db');

class ActivityModel {
  // Create activity entry
  static async create(data) {
    const { user_id, activity_type, title, score, metadata } = data;
    const result = await db.query(
      `INSERT INTO user_activity (user_id, activity_type, title, score, metadata)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [user_id, activity_type, title, score || null, metadata ? JSON.stringify(metadata) : null]
    );
    return result.rows[0];
  }

  // Get activity by user
  static async getByUser(userId, limit = 10) {
    const result = await db.query(
      'SELECT * FROM user_activity WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
      [userId, limit]
    );
    return result.rows;
  }

  // Get recent activity (admin — all users)
  static async getRecent(limit = 20) {
    const result = await db.query(
      `SELECT ua.*, u.username, u.full_name
       FROM user_activity ua
       JOIN users u ON ua.user_id = u.user_id
       ORDER BY ua.created_at DESC LIMIT $1`,
      [limit]
    );
    return result.rows;
  }
}

module.exports = ActivityModel;
