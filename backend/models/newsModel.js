const db = require('../config/db');

class NewsModel {
  // Create news
  static async create(data) {
    const { title, description, tag, published_by } = data;
    const result = await db.query(
      `INSERT INTO news_updates (title, description, tag, published_by)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [title, description, tag || 'NEW FEATURE', published_by]
    );
    return result.rows[0];
  }

  // Get all news with optional tag filter
  static async getAll(tag) {
    let query = 'SELECT * FROM news_updates';
    const params = [];

    if (tag && tag !== 'All Updates') {
      query += ' WHERE tag = $1';
      params.push(tag);
    }

    query += ' ORDER BY published_at DESC';
    const result = await db.query(query, params);
    return result.rows;
  }

  // Get latest
  static async getLatest() {
    const result = await db.query('SELECT * FROM news_updates ORDER BY published_at DESC LIMIT 1');
    return result.rows[0];
  }

  // Get by id
  static async getById(id) {
    const result = await db.query('SELECT * FROM news_updates WHERE news_id = $1', [id]);
    return result.rows[0];
  }

  // Delete news
  static async delete(id) {
    await db.query('DELETE FROM news_updates WHERE news_id = $1', [id]);
  }
}

module.exports = NewsModel;