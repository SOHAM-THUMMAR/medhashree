const db = require('../config/db');

class QuizModel {
  // Create a question file record
  static async createFile(data) {
    const { uploaded_by, file_name, file_url, subject, topic, micro_topic, question_count, status, is_solved_paper, year, month } = data;
    const result = await db.query(
      `INSERT INTO question_files (uploaded_by, file_name, file_url, subject, topic, micro_topic, question_count, status, is_solved_paper, year, month)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [uploaded_by, file_name, file_url, subject, topic, micro_topic, question_count || 0, status || 'Draft', is_solved_paper || false, year || null, month || null]
    );
    return result.rows[0];
  }

  // Get files uploaded by a user
  static async getFilesByUser(userId) {
    const result = await db.query(
      "SELECT * FROM question_files WHERE uploaded_by = $1 AND status != 'Archived' ORDER BY uploaded_at DESC",
      [userId]
    );
    return result.rows;
  }

  // Get file by id
  static async getFileById(id) {
    const result = await db.query("SELECT * FROM question_files WHERE file_id = $1 AND status != 'Archived'", [id]);
    return result.rows[0];
  }

  // Update file status
  static async updateFileStatus(id, status) {
    const result = await db.query(
      'UPDATE question_files SET status = $1 WHERE file_id = $2 RETURNING *',
      [status, id]
    );
    return result.rows[0];
  }

  // Soft Delete file and its questions (to prevent Foreign Key constraint crashes on completed sessions)
  static async deleteFile(id) {
    await db.query('UPDATE questions SET is_active = false WHERE file_id = $1', [id]);
    await db.query("UPDATE question_files SET status = 'Archived' WHERE file_id = $1", [id]);
  }

  // Get all files (admin)
  static async getAllFiles() {
    const result = await db.query(`
      SELECT qf.*, u.username as uploaded_by_username
      FROM question_files qf
      LEFT JOIN users u ON qf.uploaded_by = u.user_id
      WHERE qf.status != 'Archived'
      ORDER BY qf.uploaded_at DESC
    `);
    return result.rows;
  }

  // Update question count on a file
  static async updateQuestionCount(fileId, count) {
    await db.query(
      'UPDATE question_files SET question_count = $1 WHERE file_id = $2',
      [count, fileId]
    );
  }
}

module.exports = QuizModel;
