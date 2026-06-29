const db = require('../config/db');

class SessionModel {
  // Create a quiz session (battle or solo)
  static async create(data) {
    const {
      quiz_type, category_id, subject_id, topic_id, micro_topic_id,
      difficulty, question_count, time_per_question, user1_id, user2_id, status
    } = data;

    const result = await db.query(
      `INSERT INTO quiz_sessions (
        quiz_type, category_id, subject_id, topic_id, micro_topic_id,
        difficulty, question_count, time_per_question, user1_id, user2_id, status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [
        quiz_type, category_id || null, subject_id || null, topic_id || null, micro_topic_id || null,
        difficulty || 'Medium', question_count, time_per_question || 10, user1_id, user2_id || null,
        status || 'in_progress'
      ]
    );
    return result.rows[0];
  }

  // Get session by id
  static async getById(id) {
    const result = await db.query('SELECT * FROM quiz_sessions WHERE session_id = $1', [id]);
    return result.rows[0];
  }

  // Find a waiting 1v1 session matching filters (for matchmaking)
  // Matches on category + subject ONLY to maximize pairing chances
  static async findWaitingSession(filters, excludeUserId) {
    let query = `SELECT * FROM quiz_sessions WHERE status = 'waiting' AND quiz_type = '1v1' AND user1_id != $1`;
    const params = [excludeUserId];
    let idx = 2;

    if (filters.category_id) {
      query += ` AND category_id = $${idx++}`;
      params.push(filters.category_id);
    }
    if (filters.subject_id) {
      query += ` AND subject_id = $${idx++}`;
      params.push(filters.subject_id);
    }

    query += ' ORDER BY started_at ASC LIMIT 1';
    const result = await db.query(query, params);
    return result.rows[0] || null;
  }

  // Join a waiting session as user2
  static async joinSession(sessionId, userId) {
    const result = await db.query(
      `UPDATE quiz_sessions SET user2_id = $1, status = 'in_progress' WHERE session_id = $2 AND status = 'waiting' RETURNING *`,
      [userId, sessionId]
    );
    return result.rows[0];
  }

  // Cancel expired waiting sessions (older than 5 minutes)
  static async cancelExpiredSessions() {
    await db.query(
      `UPDATE quiz_sessions SET status = 'cancelled' WHERE status = 'waiting' AND started_at < NOW() - INTERVAL '5 minutes'`
    );
  }

  // Add question to session
  static async addQuestion(sessionId, questionId, order) {
    const result = await db.query(
      `INSERT INTO quiz_session_questions (session_id, question_id, question_order)
       VALUES ($1, $2, $3) RETURNING *`,
      [sessionId, questionId, order]
    );
    return result.rows[0];
  }

  // Get session questions with full question data
  static async getQuestions(sessionId) {
    const result = await db.query(
      `SELECT qsq.*, q.full_question_text, q.option_a, q.option_b, q.option_c, q.option_d,
              q.correct_answer, q.question_image_url, q.difficulty_label, q.hint
       FROM quiz_session_questions qsq
       JOIN questions q ON qsq.question_id = q.question_id
       WHERE qsq.session_id = $1
       ORDER BY qsq.question_order ASC`,
      [sessionId]
    );
    return result.rows;
  }

  // Submit answer for a question in session
  static async submitAnswer(sessionQuestionId, userId, answer, isUser1, timeSec) {
    const col = isUser1 ? 'user1_answer' : 'user2_answer';
    const correctCol = isUser1 ? 'user1_correct' : 'user2_correct';
    const timeCol = isUser1 ? 'user1_time_sec' : 'user2_time_sec';

    // Get the correct answer AND all options for robust matching
    const qResult = await db.query(
      `SELECT q.correct_answer, q.option_a, q.option_b, q.option_c, q.option_d
       FROM quiz_session_questions qsq
       JOIN questions q ON qsq.question_id = q.question_id
       WHERE qsq.id = $1`,
      [sessionQuestionId]
    );

    if (!qResult.rows[0]) return false;

    const { correct_answer, option_a, option_b, option_c, option_d } = qResult.rows[0];
    const userAnswer = (answer || '').trim().toLowerCase();
    const correctRaw = (correct_answer || '').trim().toLowerCase();

    // Build option map for letter ↔ text matching
    const optionMap = {
      'a': (option_a || '').trim().toLowerCase(),
      'b': (option_b || '').trim().toLowerCase(),
      'c': (option_c || '').trim().toLowerCase(),
      'd': (option_d || '').trim().toLowerCase(),
      'option a': (option_a || '').trim().toLowerCase(),
      'option b': (option_b || '').trim().toLowerCase(),
      'option c': (option_c || '').trim().toLowerCase(),
      'option d': (option_d || '').trim().toLowerCase(),
    };

    // Reverse map: option text → letter
    const textToLetter = {};
    if (option_a) textToLetter[(option_a).trim().toLowerCase()] = 'a';
    if (option_b) textToLetter[(option_b).trim().toLowerCase()] = 'b';
    if (option_c) textToLetter[(option_c).trim().toLowerCase()] = 'c';
    if (option_d) textToLetter[(option_d).trim().toLowerCase()] = 'd';

    let isCorrect = false;

    // Strategy 1: Direct match (both are same format)
    if (correctRaw === userAnswer) {
      isCorrect = true;
    }
    // Strategy 2: correct_answer is a letter/label, user sent full text
    else if (optionMap[correctRaw] && optionMap[correctRaw] === userAnswer) {
      isCorrect = true;
    }
    // Strategy 3: correct_answer is full text, user sent full text — compare via letter mapping
    else if (textToLetter[correctRaw] && textToLetter[userAnswer] && textToLetter[correctRaw] === textToLetter[userAnswer]) {
      isCorrect = true;
    }
    // Strategy 4: user sent a letter, correct_answer is full text
    else if (optionMap[userAnswer] && optionMap[userAnswer] === correctRaw) {
      isCorrect = true;
    }

    // Try with time column first, fallback to without it if column doesn't exist
    try {
      await db.query(
        `UPDATE quiz_session_questions SET ${col} = $1, ${correctCol} = $2, ${timeCol} = $3, answered_at = CURRENT_TIMESTAMP WHERE id = $4`,
        [answer, isCorrect, timeSec || 0, sessionQuestionId]
      );
    } catch (updateErr) {
      // Fallback: time column may not exist in older schemas
      console.warn('submitAnswer: time column update failed, retrying without time:', updateErr.message);
      await db.query(
        `UPDATE quiz_session_questions SET ${col} = $1, ${correctCol} = $2, answered_at = CURRENT_TIMESTAMP WHERE id = $3`,
        [answer, isCorrect, sessionQuestionId]
      );
    }

    return isCorrect;
  }

  // Complete session
  static async complete(sessionId, winnerId, user1TotalTime, user2TotalTime) {
    const result = await db.query(
      `UPDATE quiz_sessions SET status = 'completed', completed_at = CURRENT_TIMESTAMP, winner_id = $1,
       user1_total_time_sec = $3, user2_total_time_sec = $4
       WHERE session_id = $2 RETURNING *`,
      [winnerId, sessionId, user1TotalTime || 0, user2TotalTime || 0]
    );
    return result.rows[0];
  }

  // Update scores
  static async updateScore(sessionId, user1Score, user2Score) {
    await db.query(
      'UPDATE quiz_sessions SET user1_score = $1, user2_score = $2 WHERE session_id = $3',
      [user1Score, user2Score, sessionId]
    );
  }

  // Mark a player as completed (for 1v1 sync)
  static async markPlayerCompleted(sessionId, isUser1) {
    const col = isUser1 ? 'user1_completed' : 'user2_completed';
    const result = await db.query(
      `UPDATE quiz_sessions SET ${col} = TRUE WHERE session_id = $1 RETURNING *`,
      [sessionId]
    );
    return result.rows[0];
  }
}

module.exports = SessionModel;
