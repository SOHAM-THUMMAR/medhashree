const db = require('../config/db');

class TournamentModel {
  // Create tournament
  static async create(data) {
    const {
      name, description, category_id, subject, thumbnail_url,
      start_date, end_date, registration_deadline, rounds, total_questions, created_by
    } = data;

    const result = await db.query(
      `INSERT INTO tournaments (
        name, description, category_id, subject, thumbnail_url,
        start_date, end_date, registration_deadline, rounds, total_questions, created_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [
        name, description, category_id || null, subject, thumbnail_url || null,
        start_date, end_date, registration_deadline || null, rounds || 1, total_questions || 50, created_by
      ]
    );
    return result.rows[0];
  }

  // Get all tournaments with optional category filter
  static async getAll(categoryId) {
    let query = `
      SELECT t.*, c.name as category_name,
        (SELECT COUNT(*) FROM tournament_participants tp WHERE tp.tournament_id = t.tournament_id) as participant_count
      FROM tournaments t
      LEFT JOIN categories c ON t.category_id = c.category_id
    `;
    const params = [];

    if (categoryId) {
      query += ' WHERE t.category_id = $1';
      params.push(categoryId);
    }

    query += ' ORDER BY t.created_at DESC';
    const result = await db.query(query, params);
    return result.rows;
  }

  // Get by id
  static async getById(id) {
    const result = await db.query(
      `SELECT t.*, c.name as category_name,
        (SELECT COUNT(*) FROM tournament_participants tp WHERE tp.tournament_id = t.tournament_id) as participant_count
       FROM tournaments t
       LEFT JOIN categories c ON t.category_id = c.category_id
       WHERE t.tournament_id = $1`,
      [id]
    );
    return result.rows[0];
  }

  // Update tournament
  static async update(id, data) {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
    values.push(id);

    const result = await db.query(
      `UPDATE tournaments SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE tournament_id = $${values.length} RETURNING *`,
      values
    );
    return result.rows[0];
  }

  // Add participant
  static async addParticipant(tournamentId, userId) {
    const exists = await db.query(
      'SELECT id FROM tournament_participants WHERE tournament_id = $1 AND user_id = $2',
      [tournamentId, userId]
    );
    if (exists.rows.length > 0) {
      return { alreadyJoined: true };
    }

    const result = await db.query(
      'INSERT INTO tournament_participants (tournament_id, user_id) VALUES ($1, $2) RETURNING *',
      [tournamentId, userId]
    );
    return result.rows[0];
  }

  // Get participants
  static async getParticipants(tournamentId) {
    const result = await db.query(
      `SELECT tp.*, u.username, u.full_name, u.total_points
       FROM tournament_participants tp
       JOIN users u ON tp.user_id = u.user_id
       WHERE tp.tournament_id = $1
       ORDER BY tp.score DESC`,
      [tournamentId]
    );
    return result.rows;
  }

  // End tournament
  static async endTournament(id) {
    const result = await db.query(
      `UPDATE tournaments SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE tournament_id = $1 RETURNING *`,
      [id]
    );
    return result.rows[0];
  }

  // Record an attempt
  static async addAttempt(tournamentId, userId, score, correctAnswers, totalQuestions, timeTaken) {
    const result = await db.query(
      `INSERT INTO tournament_attempts (tournament_id, user_id, score, correct_answers, total_questions, time_taken)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [tournamentId, userId, score || 0, correctAnswers || 0, totalQuestions || 0, timeTaken || 0]
    );
    
    // Auto update best score in participants table maybe?
    // User already joined if they are taking attempt, just update their score if it's highest.
    await db.query(
      `UPDATE tournament_participants 
       SET score = GREATEST(score, $1)
       WHERE tournament_id = $2 AND user_id = $3`,
      [score || 0, tournamentId, userId]
    );

    return result.rows[0];
  }

  // Get attempt count
  static async getAttemptCount(tournamentId, userId) {
    const result = await db.query(
      'SELECT COUNT(*) FROM tournament_attempts WHERE tournament_id = $1 AND user_id = $2',
      [tournamentId, userId]
    );
    return parseInt(result.rows[0].count);
  }

  // Get best score
  static async getBestScore(tournamentId, userId) {
    const result = await db.query(
      'SELECT MAX(score) as best_score FROM tournament_attempts WHERE tournament_id = $1 AND user_id = $2',
      [tournamentId, userId]
    );
    return parseInt(result.rows[0].best_score) || 0;
  }

  // Get Leaderboard
  static async getLeaderboard(tournamentId) {
    const result = await db.query(
      `SELECT u.user_id, u.username, u.full_name, MAX(t.score) AS best_score, MIN(t.time_taken) AS time_taken
       FROM tournament_attempts t
       JOIN users u ON t.user_id = u.user_id
       WHERE t.tournament_id = $1
       GROUP BY u.user_id, u.username, u.full_name
       ORDER BY best_score DESC, time_taken ASC`,
      [tournamentId]
    );
    return result.rows;
  }
}

module.exports = TournamentModel;
