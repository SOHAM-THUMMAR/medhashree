const db = require('../config/db');

class BugReportModel {
  // Create bug report
  static async create(data) {
    const { reported_by, title, description, specific_issue, type, priority } = data;
    const result = await db.query(
      `INSERT INTO bug_reports (reported_by, title, description, specific_issue, type, priority)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [reported_by, title, description, specific_issue || null, type || 'bug', priority || 'medium']
    );
    return result.rows[0];
  }

  // Get all bug reports (admin)
  static async getAll() {
    const result = await db.query(
      `SELECT br.*, u.username, u.email
       FROM bug_reports br
       JOIN users u ON br.reported_by = u.user_id
       ORDER BY br.created_at DESC`
    );
    return result.rows;
  }

  // Get by id
  static async getById(id) {
    const result = await db.query('SELECT * FROM bug_reports WHERE report_id = $1', [id]);
    return result.rows[0];
  }

  // Update status
  static async updateStatus(id, status) {
    const resolvedAt = status === 'resolved' ? 'CURRENT_TIMESTAMP' : 'NULL';
    const result = await db.query(
      `UPDATE bug_reports SET status = $1, resolved_at = ${resolvedAt} WHERE report_id = $2 RETURNING *`,
      [status, id]
    );
    return result.rows[0];
  }
}

module.exports = BugReportModel;