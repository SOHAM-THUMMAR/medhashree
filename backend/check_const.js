const db = require('./config/db');

async function run() {
  const result = await db.query(`
    SELECT pg_get_constraintdef(oid) as def
    FROM pg_constraint
    WHERE conname = 'question_files_status_check'
  `);
  console.log(result.rows[0].def);
  process.exit(0);
}
run();
