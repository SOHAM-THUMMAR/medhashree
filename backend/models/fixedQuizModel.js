const db = require('../config/db');

class FixedQuizModel {
  // Get all fixed quizzes with joined metadata names
  static async getAll() {
    const query = `
      SELECT fq.*, 
             c.name as category_name, 
             s.name as subject_name, 
             t.name as topic_name, 
             mt.name as micro_topic_name
      FROM fixed_quizzes fq
      LEFT JOIN categories c ON fq.category_id = c.category_id
      LEFT JOIN subjects s ON fq.subject_id = s.subject_id
      LEFT JOIN topics t ON fq.topic_id = t.topic_id
      LEFT JOIN micro_topics mt ON fq.micro_topic_id = mt.micro_topic_id
      ORDER BY fq.created_at DESC
    `;
    const result = await db.query(query);
    return result.rows;
  }

  // Get a single fixed quiz by ID
  static async getById(id) {
    const query = `
      SELECT fq.*, 
             c.name as category_name, 
             s.name as subject_name, 
             t.name as topic_name, 
             mt.name as micro_topic_name
      FROM fixed_quizzes fq
      LEFT JOIN categories c ON fq.category_id = c.category_id
      LEFT JOIN subjects s ON fq.subject_id = s.subject_id
      LEFT JOIN topics t ON fq.topic_id = t.topic_id
      LEFT JOIN micro_topics mt ON fq.micro_topic_id = mt.micro_topic_id
      WHERE fq.quiz_id = $1
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  // Create a new fixed quiz
  static async create(data) {
    const {
      title,
      category_id,
      subject_id,
      topic_id,
      micro_topic_id,
      question_count,
      gradient_from,
      gradient_to,
      border_color
    } = data;

    const query = `
      INSERT INTO fixed_quizzes (
        title, category_id, subject_id, topic_id, micro_topic_id,
        question_count, gradient_from, gradient_to, border_color
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const result = await db.query(query, [
      title,
      category_id || null,
      subject_id || null,
      topic_id || null,
      micro_topic_id || null,
      question_count || 10,
      gradient_from || '#4f46e5',
      gradient_to || '#06b6d4',
      border_color || '#6366f1'
    ]);
    return result.rows[0];
  }

  // Update an existing fixed quiz
  static async update(id, data) {
    const fields = [];
    const values = [];
    let idx = 1;

    const allowedFields = [
      'title',
      'category_id',
      'subject_id',
      'topic_id',
      'micro_topic_id',
      'question_count',
      'gradient_from',
      'gradient_to',
      'border_color'
    ];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = $${idx++}`);
        // Handle null values for foreign keys
        if (['category_id', 'subject_id', 'topic_id', 'micro_topic_id'].includes(field) && data[field] === '') {
          values.push(null);
        } else {
          values.push(data[field]);
        }
      }
    }

    if (fields.length === 0) return null;

    values.push(id);
    const query = `
      UPDATE fixed_quizzes
      SET ${fields.join(', ')}
      WHERE quiz_id = $${idx}
      RETURNING *
    `;

    const result = await db.query(query, values);
    return result.rows[0];
  }

  // Delete a fixed quiz
  static async delete(id) {
    const query = 'DELETE FROM fixed_quizzes WHERE quiz_id = $1';
    await db.query(query, [id]);
    return true;
  }
}

module.exports = FixedQuizModel;
