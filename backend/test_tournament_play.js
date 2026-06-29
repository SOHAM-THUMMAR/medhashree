const db = require('./config/db');

async function testTournamentPlay() {
  console.log("Starting Tournament Play Test...");

  // 1. Login to get token
  let res = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@example.com', password: 'admin123' })
  });
  let data = await res.json();
  const token = data?.data?.token;
  
  if (!token) {
    console.log("Failed to login as admin. Response:", data);
    process.exit(1);
  }
  console.log("Logged in successfully.");

  // Fetch tournaments
  const tournRes = await db.query('SELECT tournament_id, name, category_id, subject, total_questions, status FROM tournaments');
  const tournaments = tournRes.rows;
  console.log(`Found ${tournaments.length} tournaments:`);

  for (const t of tournaments) {
    console.log(`\n-----------------------------------------`);
    console.log(`Testing Tournament: ${t.name} (ID: ${t.tournament_id})`);
    console.log(`Category ID: ${t.category_id}, Subject: ${t.subject}`);

    // Join tournament
    let joinRes = await fetch(`http://localhost:5000/api/tournaments/${t.tournament_id}/join`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    let joinData = await joinRes.json();
    console.log(`Join Tournament Result:`, joinData.success ? "Success" : joinData.message || joinData.error);

    // Create session (simulate Play Now button in UI)
    console.log("Creating Battle Session...");
    let battleCreateRes = await fetch('http://localhost:5000/api/battle/create', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        quiz_type: 'solo',
        category_id: t.category_id || null,
        subject_id: null,
        subject_name: t.subject || null,
        difficulty: null,
        question_count: t.total_questions || 50,
        time_per_question: 60
      })
    });
    let battleCreateData = await battleCreateRes.json();
    console.log(`Create Battle Session Result:`, battleCreateData.success ? "Success" : "Failed");
    
    if (!battleCreateData.success) {
      console.log(`Error Response:`, battleCreateData);
      continue;
    }

    const sessionId = battleCreateData.data?.session?.session_id;
    console.log(`Created Session ID: ${sessionId}`);

    // Fetch session questions
    console.log("Fetching Session Questions...");
    let questionsRes = await fetch(`http://localhost:5000/api/battle/${sessionId}/questions`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    let questionsData = await questionsRes.json();
    console.log(`Fetch Questions Result:`, questionsData.success ? "Success" : "Failed");
    if (questionsData.success) {
      console.log(`Fetched ${questionsData.data?.questions?.length || 0} questions.`);
    } else {
      console.log(`Error Response:`, questionsData);
    }
  }

  process.exit(0);
}

testTournamentPlay().catch(e => {
  console.error(e);
  process.exit(1);
});
