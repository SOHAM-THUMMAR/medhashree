const db = require('./config/db');

async function seedDummyData() {
  try {
    console.log("Starting dummy data seeding...");
    
    // Wait for DB initialization promise to resolve
    await db.dbInitPromise;

    // 1. Get categories
    const catRes = await db.query("SELECT category_id, name FROM categories");
    const categories = {};
    catRes.rows.forEach(row => {
      categories[row.name] = row.category_id;
    });
    console.log("Categories in db:", categories);

    // 2. Define premium questions
    const dummyQuestions = [
      {
        category_name: 'Technology',
        full_question_text: 'What is the primary visual difference between React 18 and React 19 Server Components (RSCs)?',
        option_a: 'React 19 Server Components execute solely on the client side during hydration.',
        option_b: 'React 19 RSCs render exclusively on the server, sending HTML/JSON streams rather than bundling JS to the client.',
        option_c: 'React 18 RSCs required Webpack while React 19 RSCs require Vite exclusively.',
        option_d: 'There are no architectural or performance differences between them.',
        correct_answer: 'B',
        explanation: 'React 19 Server Components execute on the server side and stream the UI description to the client. This means zero bundle size for server dependencies and faster initial loads.',
        hint: 'Think about bundle size optimizations and server-side execution.',
        difficulty_label: 'Hard',
        primary_concept: 'React Server Components Architecture'
      },
      {
        category_name: 'Technology',
        full_question_text: 'In JavaScript microtask schedules, which queue has the highest priority of execution during the event loop phase?',
        option_a: 'setTimeout macro tasks',
        option_b: 'setImmediate callback queue',
        option_c: 'Promise resolution callbacks (Microtask queue)',
        option_d: 'requestAnimationFrame render cycles',
        correct_answer: 'C',
        explanation: 'The microtask queue (Promises, queueMicrotask) is executed immediately after the current operation finishes and before the event loop moves to the next macro task queue.',
        hint: 'Microtasks execute before macrotasks in the loop tick.',
        difficulty_label: 'Hard',
        primary_concept: 'JS Event Loop Priority'
      },
      {
        category_name: 'JEE',
        full_question_text: 'Let a, b, c be distinct real numbers such that a³ + b³ + c³ = 3abc. What is the value of a + b + c?',
        option_a: '0',
        option_b: '1',
        option_c: '-1',
        option_d: 'Cannot be determined',
        correct_answer: 'A',
        explanation: 'Since a³ + b³ + c³ - 3abc = (a + b + c)(a² + b² + c² - ab - bc - ca), and a, b, c are distinct, a² + b² + c² - ab - bc - ca cannot be 0. Thus, a + b + c must be 0.',
        hint: 'Use the algebraic factorization of a³ + b³ + c³ - 3abc.',
        difficulty_label: 'Medium',
        primary_concept: 'Algebraic Identities'
      },
      {
        category_name: 'NEET',
        full_question_text: 'Which organelle is referred to as the powerhouse of the cell due to ATP generation through aerobic respiration?',
        option_a: 'Lysosome',
        option_b: 'Chloroplast',
        option_c: 'Mitochondrion',
        option_d: 'Golgi Apparatus',
        correct_answer: 'C',
        explanation: 'Mitochondria are the sites of aerobic respiration where glucose is converted into ATP, earning them the nickname "powerhouse of the cell".',
        hint: 'It is double-membraned and contains its own circular DNA.',
        difficulty_label: 'Easy',
        primary_concept: 'Cellular Organelles'
      },
      {
        category_name: 'Technology',
        full_question_text: 'Which SQL join query allows fetching matching rows as well as non-matching rows from both left and right tables?',
        option_a: 'LEFT OUTER JOIN',
        option_b: 'RIGHT OUTER JOIN',
        option_c: 'FULL OUTER JOIN',
        option_d: 'INNER JOIN',
        correct_answer: 'C',
        explanation: 'FULL OUTER JOIN returns all records when there is a match in either left or right table records.',
        hint: 'It encompasses both left and right outer sets.',
        difficulty_label: 'Medium',
        primary_concept: 'SQL Join Types'
      }
    ];

    // 3. Insert each question
    for (const q of dummyQuestions) {
      const categoryId = categories[q.category_name] || null;
      await db.query(`
        INSERT INTO questions (
          category_id, exam, difficulty_label, question_type,
          full_question_text, option_a, option_b, option_c, option_d,
          correct_answer, explanation, hint, primary_concept, is_active
        ) VALUES ($1, $2, $3, 'MCQ', $4, $5, $6, $7, $8, $9, $10, $11, $12, true)
      `, [
        categoryId, q.category_name, q.difficulty_label,
        q.full_question_text, q.option_a, q.option_b, q.option_c, q.option_d,
        q.correct_answer, q.explanation, q.hint, q.primary_concept
      ]);
      console.log(`Inserted question: "${q.full_question_text.slice(0, 30)}..."`);
    }

    console.log("Seeding dummy questions completed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
}

seedDummyData().catch(console.error);
