const db = require('../config/db');

class QuestionModel {
  // Create a single question
  static async create(q) {
    const result = await db.query(
      `INSERT INTO questions (
        created_by, file_id, category_id, subject_id, topic_id, micro_topic_id,
        exam, year, shift, language, source_type, source_organization,
        question_type, full_question_text, option_a, option_b, option_c, option_d,
        correct_answer, explanation, hint, answer_format,
        difficulty_label, primary_concept, is_active
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)
      RETURNING *`,
      [
        q.created_by, q.file_id, q.category_id, q.subject_id, q.topic_id, q.micro_topic_id,
        q.exam, q.year, q.shift, q.language || 'English', q.source_type, q.source_organization,
        q.question_type || 'MCQ', q.full_question_text, q.option_a, q.option_b, q.option_c, q.option_d,
        q.correct_answer, q.explanation, q.hint, q.answer_format || 'Single_Option',
        q.difficulty_label || 'Medium', q.primary_concept, true
      ]
    );
    return result.rows[0];
  }

  // Bulk create questions (from CSV)
  static async bulkCreate(questions, fileId, userId) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      const inserted = [];

      for (const q of questions) {
        // Normalize difficulty label to fit CHECK constraint ('Easy', 'Medium', 'Hard')
        let diff = q.difficulty_label || 'Medium';
        if (diff) {
          diff = String(diff).trim();
          if (diff === '1' || diff === '2') diff = 'Easy';
          else if (diff === '3') diff = 'Medium';
          else if (diff === '4' || diff === '5') diff = 'Hard';
          else if (diff.toLowerCase() === 'moderate') diff = 'Medium';
          else if (diff.toLowerCase() === 'expert' || diff.toLowerCase() === 'difficult') diff = 'Hard';
          
          diff = diff.charAt(0).toUpperCase() + diff.slice(1).toLowerCase();
        }
        if (!['Easy', 'Medium', 'Hard'].includes(diff)) {
          diff = 'Medium';
        }

        const result = await client.query(
          `INSERT INTO questions (
            created_by, file_id,
            category_id, subject_id, topic_id, micro_topic_id,
            question_type, full_question_text, option_a, option_b, option_c, option_d,
            correct_answer, explanation, hint,
            difficulty_label, exam, primary_concept, question_image_url
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
          RETURNING question_id`,
          [
            userId, fileId,
            q.category_id || null, q.subject_id || null, q.topic_id || null, q.micro_topic_id || null,
            q.question_type || 'MCQ', q.full_question_text, q.option_a, q.option_b, q.option_c, q.option_d,
            q.correct_answer, q.explanation || null, q.hint || null,
            diff, q.category || q.exam || null, q.primary_concept || null,
            q.question_image_url || null
          ]
        );
        inserted.push(result.rows[0]);
      }

      await client.query('COMMIT');
      return inserted;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // Get questions by file_id
  static async getByFileId(fileId) {
    const result = await db.query(
      'SELECT * FROM questions WHERE file_id = $1 AND is_active = true ORDER BY question_id ASC',
      [fileId]
    );
    return result.rows;
  }

  // Get by id
  static async getById(id) {
    const result = await db.query('SELECT * FROM questions WHERE question_id = $1', [id]);
    return result.rows[0];
  }

  // Get random questions by filters (for battles)
  static async getRandomByFilters(filters) {
    // Resolve subject_name to subject_id if needed
    let resolvedSubjectId = filters.subject_id;
    if (!resolvedSubjectId && filters.subject_name) {
      const subRes = await db.query(
        'SELECT subject_id FROM subjects WHERE LOWER(name) = LOWER($1) LIMIT 1',
        [filters.subject_name]
      );
      if (subRes.rows.length > 0) resolvedSubjectId = subRes.rows[0].subject_id;
    }

    let query = 'SELECT * FROM questions WHERE is_active = true';
    const params = [];
    let idx = 1;

    if (filters.category_id) {
      query += ` AND category_id = $${idx++}`;
      params.push(filters.category_id);
    }
    if (resolvedSubjectId) {
      query += ` AND subject_id = $${idx++}`;
      params.push(resolvedSubjectId);
    }
    if (filters.topic_id) {
      query += ` AND topic_id = $${idx++}`;
      params.push(filters.topic_id);
    }
    if (filters.micro_topic_id) {
      query += ` AND micro_topic_id = $${idx++}`;
      params.push(filters.micro_topic_id);
    }
    if (filters.difficulty_label) {
      query += ` AND difficulty_label = $${idx++}`;
      params.push(filters.difficulty_label);
    }

    query += ` ORDER BY RANDOM() LIMIT $${idx}`;
    params.push(filters.limit || 10);

    const result = await db.query(query, params);
    return result.rows;
  }

  // Update question
  static async update(id, data) {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
    values.push(id);

    const result = await db.query(
      `UPDATE questions SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE question_id = $${values.length} RETURNING *`,
      values
    );
    return result.rows[0];
  }

  // Soft Delete question
  static async delete(id) {
    await db.query('UPDATE questions SET is_active = false WHERE question_id = $1', [id]);
  }
}

module.exports = QuestionModel;
