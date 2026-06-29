const db = require('../config/db');

class CategoryModel {
  // Get all categories
  static async getAll() {
    const result = await db.query('SELECT * FROM categories WHERE is_active = true ORDER BY sort_order ASC');
    return result.rows;
  }

  // Get category by id
  static async getById(id) {
    const result = await db.query('SELECT * FROM categories WHERE category_id = $1', [id]);
    return result.rows[0];
  }

  // Create category
  static async create(data) {
    const { name, description, gradient_from, gradient_to, border_color, sort_order } = data;
    const result = await db.query(
      `INSERT INTO categories (name, description, gradient_from, gradient_to, border_color, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, description, gradient_from, gradient_to, border_color, sort_order || 0]
    );
    return result.rows[0];
  }

  // Update category
  static async update(id, data) {
    const { name, description, gradient_from, gradient_to, border_color, sort_order, is_active } = data;
    
    let query = 'UPDATE categories SET ';
    const params = [];
    let paramIndex = 1;
    const updates = [];

    if (name !== undefined) { updates.push(`name = $${paramIndex++}`); params.push(name); }
    if (description !== undefined) { updates.push(`description = $${paramIndex++}`); params.push(description); }
    if (gradient_from !== undefined) { updates.push(`gradient_from = $${paramIndex++}`); params.push(gradient_from); }
    if (gradient_to !== undefined) { updates.push(`gradient_to = $${paramIndex++}`); params.push(gradient_to); }
    if (border_color !== undefined) { updates.push(`border_color = $${paramIndex++}`); params.push(border_color); }
    if (sort_order !== undefined) { updates.push(`sort_order = $${paramIndex++}`); params.push(sort_order); }
    if (is_active !== undefined) { updates.push(`is_active = $${paramIndex++}`); params.push(is_active); }

    if (updates.length === 0) return null;

    query += updates.join(', ') + ` WHERE category_id = $${paramIndex} RETURNING *`;
    params.push(id);

    const result = await db.query(query, params);
    return result.rows[0];
  }

  // Delete category
  static async delete(id) {
    await db.query('DELETE FROM categories WHERE category_id = $1', [id]);
  }

  // Get subjects for a category
  static async getSubjects(categoryId) {
    const result = await db.query(
      'SELECT * FROM subjects WHERE category_id = $1 ORDER BY name ASC',
      [categoryId]
    );
    return result.rows;
  }

  // Get topics for a subject
  static async getTopics(subjectId) {
    const result = await db.query(
      'SELECT * FROM topics WHERE subject_id = $1 ORDER BY name ASC',
      [subjectId]
    );
    return result.rows;
  }

  // Get micro topics for a topic
  static async getMicroTopics(topicId) {
    const result = await db.query(
      'SELECT * FROM micro_topics WHERE topic_id = $1 ORDER BY name ASC',
      [topicId]
    );
    return result.rows;
  }

  // --- Insertion Methods for CSV Dynamic Parsing ---
  
  static async createCategory(name) {
    const result = await db.query(
      'INSERT INTO categories (name) VALUES ($1) RETURNING *',
      [name]
    );
    return result.rows[0];
  }

  static async createSubject(categoryId, name) {
    const result = await db.query(
      'INSERT INTO subjects (category_id, name) VALUES ($1, $2) RETURNING *',
      [categoryId, name]
    );
    return result.rows[0];
  }

  static async createTopic(subjectId, name) {
    const result = await db.query(
      'INSERT INTO topics (subject_id, name) VALUES ($1, $2) RETURNING *',
      [subjectId, name]
    );
    return result.rows[0];
  }

  static async createMicroTopic(topicId, name) {
    const result = await db.query(
      'INSERT INTO micro_topics (topic_id, name) VALUES ($1, $2) RETURNING *',
      [topicId, name]
    );
    return result.rows[0];
  }
}

module.exports = CategoryModel;