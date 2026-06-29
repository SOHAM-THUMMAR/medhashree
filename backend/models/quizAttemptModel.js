const db = require('../config/db');

class QuizAttemptModel {
  // Create a new quiz attempt log
  static async create(attempt) {
    const { user_id, file_id, session_id, score_percent, total_questions, correct_answers, time_taken_sec, status } = attempt;
    const result = await db.query(
      `INSERT INTO quiz_attempts (
        user_id, file_id, session_id, score_percent, total_questions, correct_answers, time_taken_sec, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        user_id, 
        file_id || null, 
        session_id || null, 
        score_percent, 
        total_questions, 
        correct_answers, 
        time_taken_sec || 0, 
        status || 'Completed'
      ]
    );
    return result.rows[0];
  }

  // Get attempts for a specific user (used in My Quizzes)
  static async getUserAttempts(userId) {
    const result = await db.query(`
      SELECT 
        qa.attempt_id,
        qa.file_id,
        qa.session_id,
        qa.score_percent,
        qa.total_questions,
        qa.correct_answers,
        qa.time_taken_sec,
        qa.status,
        qa.attempted_at,
        qf.file_name,
        qf.subject,
        qf.topic,
        c.name as category_name
      FROM quiz_attempts qa
      LEFT JOIN quiz_sessions qs ON qa.session_id = qs.session_id
      LEFT JOIN categories c ON qs.category_id = c.category_id
      LEFT JOIN question_files qf ON qa.file_id = qf.file_id
      WHERE qa.user_id = $1
      ORDER BY qa.attempted_at DESC
    `, [userId]);
    
    return result.rows;
  }
}

module.exports = QuizAttemptModel;