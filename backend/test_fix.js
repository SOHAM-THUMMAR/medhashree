const fs = require('fs');
const path = require('path');

async function testFix() {
  console.log("Starting test...");
  
  // 1. Login to get token
  let res = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@example.com', password: 'admin123' })
  });
  let data = await res.json();
  const token = data.data.token;
  
  if (!token) {
    console.log("Failed to login as admin");
    return;
  }
  console.log("Logged in successfully.");

  // Create dummy csv
  const dummyCsvPath = path.join(__dirname, 'dummy_test.csv');
  fs.writeFileSync(dummyCsvPath, "full_question_text,option_a,option_b,option_c,option_d,correct_answer\nTest Q,A,B,C,D,A");

  const fileBuffer = fs.readFileSync(dummyCsvPath);
  const blob = new Blob([fileBuffer], { type: 'text/csv' });
  
  // 2. Upload Tournament
  const fdTourn = new FormData();
  fdTourn.append('csvFile', blob, 'dummy_test.csv');
  fdTourn.append('subject', 'Tournament-Subject');
  fdTourn.append('isTournament', 'true');

  console.log("Uploading Tournament File...");
  res = await fetch('http://localhost:5000/api/quizzes/upload', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: fdTourn
  });
  data = await res.json();
  console.log("Tournament Upload:", data.success ? "Success" : data.error);
  
  // 3. Upload Normal Quiz
  const fdQuiz = new FormData();
  fdQuiz.append('csvFile', blob, 'dummy_test.csv');
  fdQuiz.append('subject', 'Regular-Quiz-Subject');
  
  console.log("Uploading Regular Quiz File...");
  res = await fetch('http://localhost:5000/api/quizzes/upload', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: fdQuiz
  });
  data = await res.json();
  console.log("Regular Quiz Upload:", data.success ? "Success" : data.error);

  // 4. Fetch Explore Quizzes
  console.log("Fetching Explore Quizzes...");
  res = await fetch('http://localhost:5000/api/quizzes/explore');
  data = await res.json();
  
  if (data.success) {
    const quizzes = data.data;
    const hasTourn = quizzes.some(q => q.category === 'Tournament-Subject');
    const hasQuiz = quizzes.some(q => q.category === 'Regular-Quiz-Subject');
    
    console.log(`Tournament File in Explore? : ${hasTourn} (Expected: false)`);
    console.log(`Regular Quiz in Explore?    : ${hasQuiz} (Expected: true)`);
    
    if (!hasTourn && hasQuiz) {
      console.log("TEST PASSED! The fix works perfectly.");
    } else {
      console.log("TEST FAILED!");
    }
  } else {
    console.log("Failed to fetch explore quizzes.");
  }
}

testFix().catch(console.error);
