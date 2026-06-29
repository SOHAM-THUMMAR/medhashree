const db = require('../config/db');

class UserModel {
  // Find user by email
  static async findByEmail(email) {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
  }

  // Find user by username
  static async findByUsername(username) {
    const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    return result.rows[0];
  }

  // Create new user
  static async create(user) {
    const { full_name, email, username, password_hash, role } = user;
    
    // Ensure role is either admin, instructor or student (default)
    let finalRole = 'student';
    if (role === 'instructor' || role === 'admin') {
      finalRole = role;
    }

    const text = `
      INSERT INTO users (full_name, email, username, password_hash, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING user_id, full_name, email, username, role, created_at
    `;
    const values = [full_name, email, username, password_hash, finalRole];
    
    const result = await db.query(text, values);
    return result.rows[0];
  }
}

module.exports = UserModel;
