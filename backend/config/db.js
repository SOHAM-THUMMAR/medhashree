const { Pool, Client } = require('pg');
const bcrypt = require('bcryptjs');
const env = require('./env');

// Configure SSL dynamically:
// Enabled if DB_SSL is explicitly 'true', or if NODE_ENV is production and DB_SSL is not explicitly 'false'.
const useSsl = env.DB_SSL === 'true' || (env.NODE_ENV === 'production' && env.DB_SSL !== 'false');

const poolConfig = env.DATABASE_URL
  ? {
    connectionString: env.DATABASE_URL,
    ssl: useSsl ? { rejectUnauthorized: false } : false,
    max: parseInt(process.env.PG_POOL_MAX || '25', 10),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
  }
  : {
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    ssl: useSsl ? { rejectUnauthorized: false } : false,
    max: parseInt(process.env.PG_POOL_MAX || '25', 10),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
  };

// Instantiate main pool (connection will be opened after checking/creating DB)
const pool = new Pool(poolConfig);

// 1. Ensure target database exists
const ensureDatabaseExists = async () => {
  const client = new Client({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: 'postgres', // Connect to default database
  });

  try {
    await client.connect();

    // Check if the target database exists
    const res = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [env.DB_NAME]
    );

    if (res.rowCount === 0) {
      console.log(`Database "${env.DB_NAME}" does not exist. Creating it...`);
      // Sanitize the database name to prevent syntax or security issues
      const dbNameSanitized = env.DB_NAME.replace(/[^a-zA-Z0-9_]/g, '');
      await client.query(`CREATE DATABASE ${dbNameSanitized}`);
      console.log(`Database "${dbNameSanitized}" created successfully.`);
    } else {
      console.log(`Database "${env.DB_NAME}" already exists.`);
    }
  } catch (err) {
    console.error("Error checking or creating database:", err);
    throw err;
  } finally {
    await client.end();
  }
};

// 2. Define schema creation queries in dependency order
const schemaQueries = [
  // Site Settings
  `CREATE TABLE IF NOT EXISTS site_settings (
    key VARCHAR(255) PRIMARY KEY,
    value TEXT NOT NULL
  )`,

  // Users
  `CREATE TABLE IF NOT EXISTS users (
    user_id         SERIAL PRIMARY KEY,
    full_name       VARCHAR(100) NOT NULL,
    email           VARCHAR(150) UNIQUE NOT NULL,
    username        VARCHAR(50) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    role            VARCHAR(20) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'instructor', 'admin')),
    profile_picture VARCHAR(500),
    country         VARCHAR(50) DEFAULT 'INDIA',
    total_points    INTEGER DEFAULT 0,
    total_quizzes   INTEGER DEFAULT 0,
    global_rank     INTEGER,
    current_streak  INTEGER DEFAULT 0,
    highest_streak  INTEGER DEFAULT 0,
    average_score   DECIMAL(5,2) DEFAULT 0.00,
    win_rate        DECIMAL(5,2) DEFAULT 0.00,
    time_played_min INTEGER DEFAULT 0,
    completion_rate DECIMAL(5,2) DEFAULT 0.00,
    best_category   VARCHAR(50),
    fav_category    VARCHAR(50),
    weakest_category VARCHAR(50),
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // Categories
  `CREATE TABLE IF NOT EXISTS categories (
    category_id     SERIAL PRIMARY KEY,
    name            VARCHAR(50) UNIQUE NOT NULL,
    description     TEXT,
    gradient_from   VARCHAR(20),
    gradient_to     VARCHAR(20),
    border_color    VARCHAR(20),
    is_active       BOOLEAN DEFAULT TRUE,
    sort_order      INTEGER DEFAULT 0,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // Subjects
  `CREATE TABLE IF NOT EXISTS subjects (
    subject_id      SERIAL PRIMARY KEY,
    category_id     INTEGER REFERENCES categories(category_id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (category_id, name)
  )`,

  // Topics
  `CREATE TABLE IF NOT EXISTS topics (
    topic_id        SERIAL PRIMARY KEY,
    subject_id      INTEGER REFERENCES subjects(subject_id) ON DELETE CASCADE,
    name            VARCHAR(150) NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (subject_id, name)
  )`,

  // Micro Topics
  `CREATE TABLE IF NOT EXISTS micro_topics (
    micro_topic_id  SERIAL PRIMARY KEY,
    topic_id        INTEGER REFERENCES topics(topic_id) ON DELETE CASCADE,
    name            VARCHAR(200) NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (topic_id, name)
  )`,

  // Question Files
  `CREATE TABLE IF NOT EXISTS question_files (
    file_id         SERIAL PRIMARY KEY,
    uploaded_by     INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    file_name       VARCHAR(255) NOT NULL,
    file_url        VARCHAR(500),
    subject         VARCHAR(100),
    topic           VARCHAR(150),
    micro_topic     VARCHAR(200),
    question_count  INTEGER DEFAULT 0,
    status          VARCHAR(20) DEFAULT 'Draft' CHECK (status IN ('Draft', 'Published', 'Archived')),
    is_solved_paper BOOLEAN DEFAULT FALSE,
    year            INTEGER,
    month           VARCHAR(50),
    uploaded_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // Questions
  `CREATE TABLE IF NOT EXISTS questions (
    question_id             SERIAL PRIMARY KEY,
    created_by              INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    file_id                 INTEGER REFERENCES question_files(file_id) ON DELETE SET NULL,
    category_id             INTEGER REFERENCES categories(category_id),
    subject_id              INTEGER REFERENCES subjects(subject_id),
    topic_id                INTEGER REFERENCES topics(topic_id),
    micro_topic_id          INTEGER REFERENCES micro_topics(micro_topic_id),
    exam                    VARCHAR(50),
    year                    INTEGER,
    shift                   VARCHAR(20),
    language                VARCHAR(20) DEFAULT 'English',
    source_type             VARCHAR(50),
    source_organization     VARCHAR(100),
    question_type           VARCHAR(30) DEFAULT 'MCQ' CHECK (question_type IN ('MCQ', 'MSQ', 'Numerical', 'Text', 'Ordered_Pair')),
    full_question_text      TEXT NOT NULL,
    option_a                TEXT,
    option_b                TEXT,
    option_c                TEXT,
    option_d                TEXT,
    correct_answer          VARCHAR(10) NOT NULL,
    explanation             TEXT,
    hint                    TEXT,
    answer_format           VARCHAR(30) DEFAULT 'Single_Option',
    answer_range            VARCHAR(50),
    contains_diagram        BOOLEAN DEFAULT FALSE,
    diagram_file_url        VARCHAR(500),
    question_image_url      TEXT,
    concept_difficulty      SMALLINT CHECK (concept_difficulty BETWEEN 1 AND 5),
    calculation_intensity   SMALLINT CHECK (calculation_intensity BETWEEN 1 AND 5),
    logical_complexity      SMALLINT CHECK (logical_complexity BETWEEN 1 AND 5),
    visual_complexity       SMALLINT CHECK (visual_complexity BETWEEN 1 AND 5),
    overall_difficulty      SMALLINT CHECK (overall_difficulty BETWEEN 1 AND 5),
    difficulty_label        VARCHAR(10) DEFAULT 'Medium' CHECK (difficulty_label IN ('Easy', 'Medium', 'Hard')),
    primary_concept         VARCHAR(200),
    secondary_concepts      TEXT,
    multi_concept_flag      BOOLEAN DEFAULT FALSE,
    interdisciplinary_flag  BOOLEAN DEFAULT FALSE,
    version_number          INTEGER DEFAULT 1,
    is_active               BOOLEAN DEFAULT TRUE,
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // Quiz Sessions
  `CREATE TABLE IF NOT EXISTS quiz_sessions (
    session_id      SERIAL PRIMARY KEY,
    quiz_type       VARCHAR(10) NOT NULL CHECK (quiz_type IN ('1v1', 'solo')),
    category_id     INTEGER REFERENCES categories(category_id),
    subject_id      INTEGER REFERENCES subjects(subject_id),
    topic_id        INTEGER REFERENCES topics(topic_id),
    micro_topic_id  INTEGER REFERENCES micro_topics(micro_topic_id),
    difficulty      VARCHAR(10) DEFAULT 'Medium' CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    question_count  INTEGER NOT NULL,
    time_per_question INTEGER DEFAULT 10,
    user1_id        INTEGER NOT NULL REFERENCES users(user_id),
    user2_id        INTEGER REFERENCES users(user_id),
    user1_score     INTEGER DEFAULT 0,
    user2_score     INTEGER DEFAULT 0,
    winner_id       INTEGER REFERENCES users(user_id),
    user1_total_time_sec INTEGER DEFAULT 0,
    user2_total_time_sec INTEGER DEFAULT 0,
    user1_completed BOOLEAN DEFAULT FALSE,
    user2_completed BOOLEAN DEFAULT FALSE,
    started_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at    TIMESTAMP,
    status          VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'cancelled'))
  )`,

  // Quiz Session Questions
  `CREATE TABLE IF NOT EXISTS quiz_session_questions (
    id              SERIAL PRIMARY KEY,
    session_id      INTEGER NOT NULL REFERENCES quiz_sessions(session_id) ON DELETE CASCADE,
    question_id     INTEGER NOT NULL REFERENCES questions(question_id),
    question_order  INTEGER NOT NULL,
    user1_answer    VARCHAR(10),
    user2_answer    VARCHAR(10),
    user1_correct   BOOLEAN,
    user2_correct   BOOLEAN,
    user1_time_sec  INTEGER DEFAULT 0,
    user2_time_sec  INTEGER DEFAULT 0,
    answered_at     TIMESTAMP
  )`,

  // Quiz Attempts
  `CREATE TABLE IF NOT EXISTS quiz_attempts (
    attempt_id      SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    file_id         INTEGER REFERENCES question_files(file_id) ON DELETE SET NULL,
    session_id      INTEGER REFERENCES quiz_sessions(session_id) ON DELETE SET NULL,
    score_percent   DECIMAL(5,2),
    total_questions  INTEGER,
    correct_answers  INTEGER,
    time_taken_sec  INTEGER,
    status          VARCHAR(20) DEFAULT 'Completed' CHECK (status IN ('Active', 'Completed', 'Abandoned')),
    attempted_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // Tournaments
  `CREATE TABLE IF NOT EXISTS tournaments (
    tournament_id   SERIAL PRIMARY KEY,
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    category_id     INTEGER REFERENCES categories(category_id),
    subject         VARCHAR(100),
    thumbnail_url   VARCHAR(500),
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    registration_deadline DATE,
    rounds          INTEGER DEFAULT 1,
    total_questions INTEGER DEFAULT 50,
    status          VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')),
    created_by      INTEGER REFERENCES users(user_id),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // Tournament Questions
  `CREATE TABLE IF NOT EXISTS tournament_questions (
    id              SERIAL PRIMARY KEY,
    tournament_id   INTEGER NOT NULL REFERENCES tournaments(tournament_id) ON DELETE CASCADE,
    question_id     INTEGER NOT NULL REFERENCES questions(question_id) ON DELETE CASCADE,
    question_score  INTEGER DEFAULT 1,
    question_order  INTEGER,
    round_number    INTEGER DEFAULT 1,
    UNIQUE (tournament_id, question_id)
  )`,

  // Tournament Participants
  `CREATE TABLE IF NOT EXISTS tournament_participants (
    id              SERIAL PRIMARY KEY,
    tournament_id   INTEGER NOT NULL REFERENCES tournaments(tournament_id) ON DELETE CASCADE,
    user_id         INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    score           INTEGER DEFAULT 0,
    rank            INTEGER,
    joined_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at    TIMESTAMP,
    UNIQUE (tournament_id, user_id)
  )`,

  // Bug Reports
  `CREATE TABLE IF NOT EXISTS bug_reports (
    report_id       SERIAL PRIMARY KEY,
    reported_by     INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    title           VARCHAR(200) NOT NULL,
    description     TEXT,
    specific_issue  VARCHAR(50),
    type            VARCHAR(30) CHECK (type IN ('bug', 'feature', 'improvement', 'crash')),
    priority        VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status          VARCHAR(20) DEFAULT 'unresolved' CHECK (status IN ('unresolved', 'resolved', 'closed')),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at     TIMESTAMP
  )`,

  // News Updates
  `CREATE TABLE IF NOT EXISTS news_updates (
    news_id         SERIAL PRIMARY KEY,
    title           VARCHAR(200) NOT NULL,
    description     TEXT NOT NULL,
    tag             VARCHAR(30) DEFAULT 'NEW FEATURE' CHECK (tag IN ('NEW FEATURE', 'UI IMPROVEMENT', 'PERFORMANCE', 'BUG FIX', 'ANNOUNCEMENT')),
    published_by    INTEGER REFERENCES users(user_id),
    published_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // User Activity
  `CREATE TABLE IF NOT EXISTS user_activity (
    activity_id     SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    activity_type   VARCHAR(30) NOT NULL CHECK (activity_type IN ('quiz_completed', 'tournament_joined', 'battle_won', 'badge_earned', 'quiz_created')),
    title           VARCHAR(300) NOT NULL,
    score           VARCHAR(20),
    metadata        JSONB,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // Password Resets
  `CREATE TABLE IF NOT EXISTS password_resets (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    otp             VARCHAR(20) NOT NULL,
    expires_at      TIMESTAMP NOT NULL,
    is_used         BOOLEAN DEFAULT FALSE
  )`,

  // Tournament Attempts
  `CREATE TABLE IF NOT EXISTS tournament_attempts (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    tournament_id   INTEGER NOT NULL REFERENCES tournaments(tournament_id) ON DELETE CASCADE,
    score           INTEGER DEFAULT 0,
    correct_answers  INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 0,
    time_taken      INTEGER DEFAULT 0,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // Fixed Quizzes
  `CREATE TABLE IF NOT EXISTS fixed_quizzes (
    quiz_id         SERIAL PRIMARY KEY,
    title           VARCHAR(255) NOT NULL,
    category_id     INTEGER REFERENCES categories(category_id) ON DELETE SET NULL,
    subject_id      INTEGER REFERENCES subjects(subject_id) ON DELETE SET NULL,
    topic_id        INTEGER REFERENCES topics(topic_id) ON DELETE SET NULL,
    micro_topic_id  INTEGER REFERENCES micro_topics(micro_topic_id) ON DELETE SET NULL,
    question_count  INTEGER DEFAULT 10,
    gradient_from   VARCHAR(50) DEFAULT '#4f46e5',
    gradient_to     VARCHAR(50) DEFAULT '#06b6d4',
    border_color    VARCHAR(50) DEFAULT '#6366f1',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // System & User Activity Logs
  `CREATE TABLE IF NOT EXISTS activity_logs (
    log_id          SERIAL PRIMARY KEY,
    user_id         INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    username        VARCHAR(100),
    role            VARCHAR(20),
    action          VARCHAR(100) NOT NULL,
    method          VARCHAR(10),
    endpoint        VARCHAR(255),
    ip_address      VARCHAR(45),
    user_agent      TEXT,
    status_code     INTEGER,
    severity        VARCHAR(20) DEFAULT 'info',
    details         JSONB,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`
];

const path = require('path');
const fs = require('fs');

let activeEngine = 'pg'; // 'pg' or 'sqlite'
let sqliteDb = null;

// Helper to run query against SQLite fallback engine
function runSqliteQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    let convertedSql = sql.replace(/\$(\d+)/g, '?');
    
    // Clean PostgreSQL specific DDL if present
    convertedSql = convertedSql
      .replace(/::JSONB/gi, '')
      .replace(/SERIAL PRIMARY KEY/gi, 'INTEGER PRIMARY KEY AUTOINCREMENT')
      .replace(/JSONB/gi, 'TEXT')
      .replace(/DECIMAL\(\d+,\d+\)/gi, 'REAL')
      .replace(/BOOLEAN DEFAULT TRUE/gi, 'INTEGER DEFAULT 1')
      .replace(/BOOLEAN DEFAULT FALSE/gi, 'INTEGER DEFAULT 0')
      .replace(/IS TRUE/gi, '= 1')
      .replace(/IS FALSE/gi, '= 0');

    const trimmed = convertedSql.trim().toUpperCase();
    if (trimmed.startsWith('SELECT') || trimmed.startsWith('PRAGMA') || trimmed.startsWith('EXPLAIN')) {
      sqliteDb.all(convertedSql, params, (err, rows) => {
        if (err) return reject(err);
        resolve({ rows: rows || [], rowCount: rows ? rows.length : 0 });
      });
    } else {
      sqliteDb.run(convertedSql, params, function (err) {
        if (err) return reject(err);
        resolve({ rows: [], rowCount: this.changes || 0, insertId: this.lastID });
      });
    }
  });
}

// Unified query exporter
const executeQuery = (text, params) => {
  if (activeEngine === 'sqlite') {
    return runSqliteQuery(text, params);
  }
  return pool.query(text, params);
};

// SQLite Initialization Helper
const initializeSqliteFallback = async () => {
  activeEngine = 'sqlite';
  const sqlite3 = require('sqlite3').verbose();
  const dataDir = path.join(__dirname, '../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, 'medhashree_local.db');
  console.log(`\n⚡ [DB FALLBACK] Activating Local SQLite Engine: ${dbPath}`);

  sqliteDb = new sqlite3.Database(dbPath);

  // Enable WAL mode & foreign keys
  await runSqliteQuery('PRAGMA journal_mode = WAL;');
  await runSqliteQuery('PRAGMA foreign_keys = ON;');

  // Create tables in SQLite
  const sqliteTables = [
    `CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )`,

    `CREATE TABLE IF NOT EXISTS users (
      user_id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student',
      profile_picture TEXT,
      country TEXT DEFAULT 'INDIA',
      total_points INTEGER DEFAULT 0,
      total_quizzes INTEGER DEFAULT 0,
      global_rank INTEGER,
      current_streak INTEGER DEFAULT 0,
      highest_streak INTEGER DEFAULT 0,
      average_score REAL DEFAULT 0.00,
      win_rate REAL DEFAULT 0.00,
      time_played_min INTEGER DEFAULT 0,
      completion_rate REAL DEFAULT 0.00,
      best_category TEXT,
      fav_category TEXT,
      weakest_category TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS categories (
      category_id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      gradient_from TEXT,
      gradient_to TEXT,
      border_color TEXT,
      is_active INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS password_resets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      otp TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      is_used INTEGER DEFAULT 0
    )`,

    `CREATE TABLE IF NOT EXISTS activity_logs (
      log_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
      username TEXT,
      role TEXT,
      action TEXT NOT NULL,
      method TEXT,
      endpoint TEXT,
      ip_address TEXT,
      user_agent TEXT,
      status_code INTEGER,
      severity TEXT DEFAULT 'info',
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  for (const q of sqliteTables) {
    await runSqliteQuery(q);
  }

  // Seed default admin users
  const adminEmails = ['sohamthummar04@gmail.com', 'sohamthummae04@gmail.com', env.ADMIN_EMAIL].filter(Boolean);
  for (const email of adminEmails) {
    const existing = await runSqliteQuery('SELECT * FROM users WHERE email = ?', [email]);
    if (existing.rows.length === 0) {
      const defaultPassword = process.env.INITIAL_ADMIN_PASSWORD || 'Admin@12345';
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(defaultPassword, salt);
      const username = email.split('@')[0];

      await runSqliteQuery(
        `INSERT INTO users (full_name, email, username, password_hash, role) VALUES (?, ?, ?, ?, 'admin')`,
        ['System Admin', email, username, passwordHash]
      );
      console.log(`[SQLITE INIT] 👑 Admin Account created/seeded: ${email}`);
    } else if (existing.rows[0].role !== 'admin') {
      await runSqliteQuery(`UPDATE users SET role = 'admin' WHERE email = ?`, [email]);
      console.log(`[SQLITE INIT] 👑 Admin role granted to: ${email}`);
    }
  }

  // Seed default site settings
  const defaults = {
    'login_heading': 'Welcome Back',
    'login_subheading': 'Enter your credentials to enter the quiz arena'
  };
  for (const [k, v] of Object.entries(defaults)) {
    await runSqliteQuery(`INSERT OR IGNORE INTO site_settings (key, value) VALUES (?, ?)`, [k, v]);
  }

  console.log(`✅ [SQLITE INIT] Local database initialized successfully.`);
};

// 3. Database initialization helper
const initialize = async () => {
  try {
    // A. Test connection to the target database pool first with a retry mechanism
    let connectedDirectly = false;
    const maxRetries = 2;
    const retryIntervalMs = 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Connecting to database (attempt ${attempt}/${maxRetries})...`);

        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('PostgreSQL connection timeout')), 2000);
          pool.connect((err, client, release) => {
            clearTimeout(timeout);
            if (err) {
              reject(err);
            } else {
              release();
              resolve();
            }
          });
        });

        console.log('Connected to PostgreSQL database successfully.');
        connectedDirectly = true;
        break;
      } catch (err) {
        console.warn(`Connection attempt ${attempt} failed: ${err.message}`);

        const isDbDoesNotExist = err.code === '3D000' || (err.message && err.message.includes('does not exist'));
        const isLocal = !env.DATABASE_URL || env.DB_HOST === 'localhost' || env.DB_HOST === '127.0.0.1';

        if (attempt === 1 && isDbDoesNotExist && isLocal) {
          console.log('Target database does not exist and running locally. Attempting automatic creation...');
          try {
            await ensureDatabaseExists();
            continue; // Retry connection now that DB is created
          } catch (createErr) {
            console.error('Failed to automatically create database:', createErr.message);
          }
        }

        if (attempt < maxRetries) {
          console.log(`Waiting ${retryIntervalMs / 1000} seconds before next attempt...`);
          await new Promise(resolve => setTimeout(resolve, retryIntervalMs));
        } else {
          console.warn(`⚠️ PostgreSQL connection unavailable (${err.message}). Activating Local SQLite Engine Fallback...`);
          await initializeSqliteFallback();
          return;
        }
      }
    }

    // C. Create all tables in order
    for (const query of schemaQueries) {
      await pool.query(query);
    }
    console.log('All database tables verified/created successfully.');

    // C2. Run database migrations (e.g. check/add is_solved_paper to question_files)
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS highest_streak INTEGER DEFAULT 0');
    await pool.query('ALTER TABLE question_files ADD COLUMN IF NOT EXISTS is_solved_paper BOOLEAN DEFAULT FALSE');
    await pool.query('ALTER TABLE question_files ADD COLUMN IF NOT EXISTS year INTEGER');
    await pool.query('ALTER TABLE question_files ADD COLUMN IF NOT EXISTS month VARCHAR(50)');
    await pool.query('ALTER TABLE questions ALTER COLUMN question_image_url TYPE TEXT');
    await pool.query('ALTER TABLE quiz_sessions ADD COLUMN IF NOT EXISTS user1_total_time_sec INTEGER DEFAULT 0');
    await pool.query('ALTER TABLE quiz_sessions ADD COLUMN IF NOT EXISTS user2_total_time_sec INTEGER DEFAULT 0');
    await pool.query('ALTER TABLE quiz_sessions ADD COLUMN IF NOT EXISTS user1_completed BOOLEAN DEFAULT FALSE');
    await pool.query('ALTER TABLE quiz_sessions ADD COLUMN IF NOT EXISTS user2_completed BOOLEAN DEFAULT FALSE');
    await pool.query('ALTER TABLE quiz_session_questions ADD COLUMN IF NOT EXISTS user1_time_sec INTEGER DEFAULT 0');
    await pool.query('ALTER TABLE quiz_session_questions ADD COLUMN IF NOT EXISTS user2_time_sec INTEGER DEFAULT 0');

    // C3. Performance Indexing for highly constrained environments (1 Core / 1 GB RAM)
    await pool.query('CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user1 ON quiz_sessions(user1_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user2 ON quiz_sessions(user2_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON quiz_attempts(user_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_user_activity_user ON user_activity(user_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_tournament_participants_user ON tournament_participants(user_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_questions_filters ON questions(category_id, subject_id, topic_id, micro_topic_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at DESC)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_activity_logs_severity ON activity_logs(severity)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action)');
    console.log('Performance database indexes verified/created successfully.');
    console.log('Database migrations verified/executed successfully.');

    // C4. Seed default owner/admin account(s) if missing or grant admin role
    const adminEmails = Array.from(new Set([
      'sohamthummar04@gmail.com',
      'sohamthummae04@gmail.com',
      env.ADMIN_EMAIL
    ])).filter(Boolean);

    for (const email of adminEmails) {
      const adminCheck = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
      if (adminCheck.rows.length === 0) {
        const defaultPassword = process.env.INITIAL_ADMIN_PASSWORD || 'Admin@12345';
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(defaultPassword, salt);
        const username = email.split('@')[0];

        await pool.query(
          `INSERT INTO users (full_name, email, username, password_hash, role)
           VALUES ($1, $2, $3, $4, 'admin')
           ON CONFLICT (email) DO UPDATE SET role = 'admin'`,
          ['System Admin', email, username, passwordHash]
        );
        console.log(`[DB INIT] 👑 Admin Account created/seeded: ${email} (Role: admin)`);
      } else if (adminCheck.rows[0].role !== 'admin') {
        await pool.query("UPDATE users SET role = 'admin' WHERE email = $1", [email]);
        console.log(`[DB INIT] 👑 Admin role granted to existing account: ${email}`);
      }
    }

    // D. Seed default site settings if they don't exist
    const defaults = {
      'landing_hero_badge': 'New Seeded Tournaments Live',
      'landing_hero_title': 'The Ultimate Competitive Quiz Battleground for Tech Elite',
      'landing_hero_subtitle': 'Unlock your true capacity. Participate in premium, curated engineering contests spanning React 19 architecture, JavaScript memory leak audits, and PostgreSQL optimization models.',
      'landing_compete_btn_text': 'Compete Now',
      'landing_explore_btn_text': 'Explore Quizzes',
      'landing_stats_1_value': '10,000+',
      'landing_stats_1_label': 'Expert Audited Questions',
      'landing_stats_2_value': '50,000+',
      'landing_stats_2_label': 'Completed Battles',
      'landing_stats_3_value': '100%',
      'landing_stats_3_label': 'Interactive Feedback Loop',
      'login_heading': 'Welcome Back',
      'login_subheading': 'Enter your credentials to enter the quiz arena',
      'register_heading': 'Create Account',
      'register_subheading': 'Join Medhashree and start your tech quiz league',
      'forgot_password_heading': 'Reset Password',
      'auth_left_title': 'Sharpen Your\nEngineering Edge',
      'auth_left_subtitle': 'Dive deep into core technical assessments. Compete live inside professional environments, secure your rank on our global leaderboard, and gain instant, audited feedback.',
      'auth_footer_text': 'SECURED PROTOCOL // CONTEST HUB 2026',

      // Brand headers & footers
      'brand_logo_text': 'MEDHASHREE',
      'brand_logo_badge': 'League',
      'brand_nav_login_text': 'Log In',
      'brand_nav_signup_text': 'Get Started',
      'brand_footer_copyright': '© 2026',
      'brand_footer_link_1': 'Play',
      'brand_footer_link_2': 'Sign Up',
      'brand_footer_link_3': 'Support',

      // Premium Tournaments Section
      'landing_tournaments_title': 'Compete in Premium Seeded Tournaments',
      'landing_tournaments_subtitle': 'These exclusive tournaments are populated with verified expert questions and isolated from search filters.',

      // Featured Tournament Card 1
      'landing_tournament_1_icon': '⚛️',
      'landing_tournament_1_badge': 'React 19 & RSCs',
      'landing_tournament_1_name': 'React Mastermind League',
      'landing_tournament_1_difficulty': 'Expert',
      'landing_tournament_1_questions': '3',
      'landing_tournament_1_desc': 'Test your mastery of Server Components, React 19 Hooks, rendering lifecycles, and modern state architectures.',

      // Featured Tournament Card 2
      'landing_tournament_2_icon': '💛',
      'landing_tournament_2_badge': 'ESNext & Event Loop',
      'landing_tournament_2_name': 'JavaScript Champions Cup',
      'landing_tournament_2_difficulty': 'Advanced',
      'landing_tournament_2_questions': '3',
      'landing_tournament_2_desc': 'Crack core concepts including the Javascript Event Loop,WeakMap collections, memory optimizations, and async schedules.',

      // Featured Tournament Card 3
      'landing_tournament_3_icon': '🗄️',
      'landing_tournament_3_badge': 'PostgreSQL & SQL Core',
      'landing_tournament_3_name': 'Database Titans Arena',
      'landing_tournament_3_difficulty': 'Hard',
      'landing_tournament_3_questions': '3',
      'landing_tournament_3_desc': 'Conquer advanced LATERAL joins, composite index patterns, execution plan tunings, and transactional control.',

      // Platform Features
      'landing_feature_1_emoji': '⚡',
      'landing_feature_1_title': 'Solo Exploration',
      'landing_feature_1_desc': 'Hone your skills in standard quizzes across core languages with detailed answers to level up your knowledge.',
      'landing_feature_2_emoji': '🏆',
      'landing_feature_2_title': 'Premium Tournaments',
      'landing_feature_2_desc': 'Participate in time-bound, competitive leagues designed by experts and fight for the top leaderboard rank.',
      'landing_feature_3_emoji': '🧠',
      'landing_feature_3_title': 'Dynamic Explanations',
      'landing_feature_3_desc': 'Every single question includes a comprehensive explanation block with references, enabling real growth.',

      // FAQ general & details
      'landing_faq_title': 'Frequently Asked Questions',
      'landing_faq_1_q': 'How do I participate in tournaments?',
      'landing_faq_1_a': 'Simply click "Get Started" to register your account. Once registered, log in to access the active Tournaments board, select your desired league, and click "Play Now"!',
      'landing_faq_2_q': 'Can I upload custom quizzes?',
      'landing_faq_2_a': 'Absolutely! Users with an instructor or administrator role can build custom quizzes and tournaments by uploading CSV files directly via our admin console.',
      'landing_faq_3_q': 'What makes Medhashree different?',
      'landing_faq_3_a': 'We isolate tournament-bound, highly challenging premium questions from regular search feeds, combining high-octane battles with elite learning feedback.',

      // Mock Battle Arena Card
      'landing_mock_arena_title': 'QUIZ-MATCH://BATTLE-ARENA',
      'landing_mock_badge': 'LIVE',
      'landing_mock_p1_label': 'YOU',
      'landing_mock_p1_name': 'Dev_Mastermind',
      'landing_mock_p1_pts': '950',
      'landing_mock_p1_pct': '92',
      'landing_mock_question_header': 'QUESTION 3 OF 3',
      'landing_mock_question_text': 'WeakMap key collection?',
      'landing_mock_vs_text': 'VS',
      'landing_mock_p2_label': 'OPPONENT',
      'landing_mock_p2_name': 'Algorithm_Bot',
      'landing_mock_p2_pts': '820',
      'landing_mock_p2_pct': '82'
    };

    for (const [key, val] of Object.entries(defaults)) {
      await pool.query(`
        INSERT INTO site_settings (key, value)
        VALUES ($1, $2)
        ON CONFLICT (key) DO NOTHING
      `, [key, val]);
    }
    console.log('Database seeded with default site_settings successfully.');

    // E. Seed default categories if empty
    const categoriesCount = await pool.query("SELECT COUNT(*) FROM categories");
    if (parseInt(categoriesCount.rows[0].count) === 0) {
      const categorySeeds = [
        ['NEET', 'Medical Entrance Prep & Biology Specialist Quizzes', 1],
        ['JEE', 'Engineering Entrance focused on Physics, Chemistry & Maths', 2],
        ['NDA-NA', 'Defence Academy Prep: General Ability & Mathematics Mocks', 3],
        ['SSC CGL', 'Government Tier 1 & 2 Competitive Patterns', 4],
        ['GATE', 'Advanced Engineering & PSU Entrance Mock Tests', 5],
        ['Boards', 'CBSE, ICSE & State Board Mock Exams', 6],
        ['Technology', 'Programming, Web Dev, and Computer Science', 7]
      ];
      for (const [name, desc, order] of categorySeeds) {
        await pool.query(
          "INSERT INTO categories (name, description, sort_order) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING",
          [name, desc, order]
        );
      }
      console.log('Database seeded with default categories successfully.');
    }
  } catch (err) {
    console.warn(`⚠️ PostgreSQL initialization failed (${err.message}). Activating Local SQLite Engine Fallback...`);
    await initializeSqliteFallback();
  }
};

// Start initialization sequence and export the promise
const dbInitPromise = initialize();

module.exports = {
  query: executeQuery,
  pool,
  dbInitPromise
};
