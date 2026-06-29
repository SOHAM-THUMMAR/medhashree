const SessionModel = require('../models/sessionModel');
const QuestionModel = require('../models/questionModel');
const QuizAttemptModel = require('../models/quizAttemptModel');
const ActivityModel = require('../models/activityModel');
const db = require('../config/db');
const { success, error } = require('../utils/apiResponse');

// @desc    Find or create a 1v1 match (HTTP fallback — primary matchmaking is via Socket.io)
// @route   POST /api/battle/find-match
// @access  Protected
exports.findMatch = async (req, res) => {
  try {
    const {
      category_id, subject_id,
      question_count, time_per_question
    } = req.body;

    const userId = req.user.userId;
    const qCount = Math.min(parseInt(question_count) || 10, 30);

    // Cancel any expired waiting sessions first
    await SessionModel.cancelExpiredSessions();

    // 1. Look for an existing waiting session matching category + subject
    const existingSession = await SessionModel.findWaitingSession(
      { category_id, subject_id },
      userId
    );

    if (existingSession) {
      // Found an opponent — join the session
      const joined = await SessionModel.joinSession(existingSession.session_id, userId);

      if (joined) {
        return success(res, {
          session: joined,
          matched: true,
          questionCount: joined.question_count
        }, 'Opponent found! Battle starting.', 200);
      }
    }

    // 2. No match found — fetch questions and create a waiting session
    const questions = await QuestionModel.getRandomByFilters({
      category_id,
      subject_id,
      limit: qCount
    });

    if (questions.length === 0) {
      return error(res, 'No questions match the selected criteria', 404);
    }

    // Create session with 'waiting' status
    const session = await SessionModel.create({
      quiz_type: '1v1',
      category_id: category_id || questions[0]?.category_id || null,
      subject_id: subject_id || questions[0]?.subject_id || null,
      topic_id: null,
      micro_topic_id: null,
      difficulty: 'Medium',
      question_count: questions.length,
      time_per_question: 60,
      user1_id: userId,
      user2_id: null,
      status: 'waiting'
    });

    // Link questions to session
    for (let i = 0; i < questions.length; i++) {
      await SessionModel.addQuestion(session.session_id, questions[i].question_id, i + 1);
    }

    return success(res, {
      session,
      matched: false,
      questionCount: questions.length
    }, 'Waiting for opponent...', 201);
  } catch (err) {
    console.error('Find Match Error:', err);
    return error(res, 'Failed to find match', 500);
  }
};

// @desc    Check match status (polling endpoint for 1v1)
// @route   GET /api/battle/:sessionId/status
// @access  Protected
exports.checkMatchStatus = async (req, res) => {
  try {
    const session = await SessionModel.getById(req.params.sessionId);
    if (!session) return error(res, 'Session not found', 404);

    // Check if 5 min timeout exceeded
    const waitingTime = Date.now() - new Date(session.started_at).getTime();
    const FIVE_MINUTES = 5 * 60 * 1000;

    if (session.status === 'waiting' && waitingTime > FIVE_MINUTES) {
      // Cancel the session
      await db.query(
        `UPDATE quiz_sessions SET status = 'cancelled' WHERE session_id = $1`,
        [session.session_id]
      );
      return success(res, {
        status: 'cancelled',
        matched: false,
        message: 'No opponent found'
      }, 'Match timed out');
    }

    return success(res, {
      status: session.status,
      matched: session.status === 'in_progress' && session.user2_id !== null,
      session
    }, 'Match status fetched');
  } catch (err) {
    console.error('Check Match Status Error:', err);
    return error(res, 'Failed to check status', 500);
  }
};

// @desc    Create a quiz session (solo mode)
// @route   POST /api/battle/create
// @access  Protected
exports.createSession = async (req, res) => {
  try {
    const {
      quiz_type, category_id, subject_id, topic_id, micro_topic_id,
      difficulty, question_count, time_per_question, file_id, subject_name
    } = req.body;

    if (!quiz_type) {
      return error(res, 'quiz_type is required', 400);
    }

    // 1. Fetch questions first
    let questions = [];
    let final_subject_id = subject_id;

    if (file_id) {
      questions = await QuestionModel.getByFileId(file_id);
      if (questions.length === 0) return error(res, 'No questions found for this quiz', 404);
      // Limit questions if a count was provided
      if (question_count && question_count < questions.length) {
        questions = questions.slice(0, parseInt(question_count));
      }
    } else {
      // Resolve subject_name → subject_id (case-insensitive)
      if (!final_subject_id && subject_name) {
        const resSub = await db.query(
          'SELECT subject_id FROM subjects WHERE LOWER(name) = LOWER($1) LIMIT 1',
          [subject_name]
        );
        if (resSub.rows.length > 0) final_subject_id = resSub.rows[0].subject_id;
      }

      if (!question_count) return error(res, 'question_count is required when no file_id is provided', 400);
      questions = await QuestionModel.getRandomByFilters({
        category_id,
        subject_id: final_subject_id,
        subject_name: !final_subject_id ? subject_name : undefined,
        topic_id,
        micro_topic_id,
        difficulty_label: difficulty,
        limit: parseInt(question_count)
      });
    }

    if (questions.length === 0) {
      return error(res, 'No questions match the selected criteria', 404);
    }

    // 2. Create session
    const session = await SessionModel.create({
      quiz_type,
      category_id: category_id || questions[0]?.category_id || null,
      subject_id: final_subject_id || questions[0]?.subject_id || null,
      topic_id: topic_id || questions[0]?.topic_id || null,
      micro_topic_id: micro_topic_id || questions[0]?.micro_topic_id || null,
      difficulty: difficulty || questions[0]?.difficulty_label || 'Medium',
      question_count: questions.length,
      time_per_question: parseInt(time_per_question) || 60,
      user1_id: req.user.userId,
      user2_id: null,
      status: 'in_progress'
    });

    // 3. Link questions to session
    for (let i = 0; i < questions.length; i++) {
      await SessionModel.addQuestion(session.session_id, questions[i].question_id, i + 1);
    }

    return success(res, {
      session,
      questionCount: questions.length
    }, 'Quiz session created', 201);
  } catch (err) {
    console.error('Create Session Error:', err);
    return error(res, 'Failed to create session', 500);
  }
};

// @desc    Get questions for a session (also returns session info + opponent name)
// @route   GET /api/battle/:sessionId/questions
// @access  Protected
exports.getSessionQuestions = async (req, res) => {
  try {
    const session = await SessionModel.getById(req.params.sessionId);
    if (!session) return error(res, 'Session not found', 404);

    const questions = await SessionModel.getQuestions(req.params.sessionId);

    // Remove correct_answer from response (don't leak answers)
    const safeQuestions = questions.map(q => ({
      id: q.id,
      question_id: q.question_id,
      question_order: q.question_order,
      full_question_text: q.full_question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      question_image_url: q.question_image_url,
      difficulty_label: q.difficulty_label
    }));

    // Get opponent name for 1v1
    let opponentName = null;
    if (session.quiz_type === '1v1') {
      const isUser1 = session.user1_id === req.user.userId;
      const opponentId = isUser1 ? session.user2_id : session.user1_id;
      if (opponentId) {
        const oppResult = await db.query('SELECT username, full_name FROM users WHERE user_id = $1', [opponentId]);
        if (oppResult.rows[0]) {
          opponentName = oppResult.rows[0].full_name || oppResult.rows[0].username;
        }
      }
    }

    return success(res, {
      questions: safeQuestions,
      timePerQuestion: session.time_per_question || 60,
      quizType: session.quiz_type,
      opponentName
    }, 'Session questions fetched');
  } catch (err) {
    console.error('Get Session Questions Error:', err);
    return error(res, 'Failed to fetch session questions', 500);
  }
};

// @desc    Submit answer for a question
// @route   POST /api/battle/:sessionId/answer
// @access  Protected
exports.submitAnswer = async (req, res) => {
  try {
    const { questionId, answer, timeTaken } = req.body;
    const session = await SessionModel.getById(req.params.sessionId);

    if (!session) return error(res, 'Session not found', 404);

    const isUser1 = session.user1_id === req.user.userId;
    const isCorrect = await SessionModel.submitAnswer(questionId, req.user.userId, answer, isUser1, timeTaken || 0);

    return success(res, { isCorrect }, 'Answer submitted');
  } catch (err) {
    console.error('Submit Answer Error:', err);
    return error(res, 'Failed to submit answer', 500);
  }
};

// ─────────────────────────────────────────────────────────────
// HELPER: Finalize a 1v1 session (called only when BOTH players done)
// ─────────────────────────────────────────────────────────────
async function finalizeSession(session, questions, requestingUserId) {
  const user1Score = questions.filter(q => q.user1_correct).length;
  const user2Score = questions.filter(q => q.user2_correct).length;

  const user1TotalTime = questions.reduce((sum, q) => sum + (q.user1_time_sec || 0), 0);
  const user2TotalTime = questions.reduce((sum, q) => sum + (q.user2_time_sec || 0), 0);

  await SessionModel.updateScore(session.session_id, user1Score, user2Score);

  let winnerId = null;
  if (session.quiz_type === '1v1' && session.user2_id) {
    if (user1Score > user2Score) winnerId = session.user1_id;
    else if (user2Score > user1Score) winnerId = session.user2_id;
    // tie = no winner
  }

  const completed = await SessionModel.complete(session.session_id, winnerId, user1TotalTime, user2TotalTime);

  // --- Create quiz_attempt records ---
  const scorePercent1 = questions.length > 0 ? Math.round((user1Score / questions.length) * 100) : 0;
  await QuizAttemptModel.create({
    user_id: session.user1_id,
    session_id: session.session_id,
    score_percent: scorePercent1,
    total_questions: questions.length,
    correct_answers: user1Score,
    time_taken_sec: user1TotalTime,
    status: 'Completed'
  });

  if (session.user2_id) {
    const scorePercent2 = questions.length > 0 ? Math.round((user2Score / questions.length) * 100) : 0;
    await QuizAttemptModel.create({
      user_id: session.user2_id,
      session_id: session.session_id,
      score_percent: scorePercent2,
      total_questions: questions.length,
      correct_answers: user2Score,
      time_taken_sec: user2TotalTime,
      status: 'Completed'
    });
  }

  // --- Update user streaks ---
  await updateUserStreak(session.user1_id);
  if (session.user2_id) {
    await updateUserStreak(session.user2_id);
  }

  // --- Update user stats ---
  await db.query(
    `UPDATE users SET total_points = total_points + $1, total_quizzes = total_quizzes + 1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2`,
    [user1Score, session.user1_id]
  );

  if (session.user2_id) {
    await db.query(
      `UPDATE users SET total_points = total_points + $1, total_quizzes = total_quizzes + 1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2`,
      [user2Score, session.user2_id]
    );

    // Update win_rate for both players in 1v1
    for (const uid of [session.user1_id, session.user2_id]) {
      const winData = await db.query(
        `SELECT COUNT(*) as total, COUNT(CASE WHEN winner_id = $1 THEN 1 END) as wins
         FROM quiz_sessions WHERE quiz_type = '1v1' AND (user1_id = $1 OR user2_id = $1) AND status = 'completed'`,
        [uid]
      );
      const total = parseInt(winData.rows[0].total) || 0;
      const wins = parseInt(winData.rows[0].wins) || 0;
      const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
      await db.query('UPDATE users SET win_rate = $1 WHERE user_id = $2', [winRate, uid]);
    }
  }

  // --- Log activity for all players ---
  if (session.quiz_type === '1v1' && session.user2_id) {
    if (winnerId === session.user1_id) {
      await ActivityModel.create({
        user_id: session.user1_id,
        activity_type: 'battle_won',
        title: `Won 1v1 battle with score ${user1Score}/${questions.length}`,
        score: `${user1Score}/${questions.length}`
      });
      await ActivityModel.create({
        user_id: session.user2_id,
        activity_type: 'battle_lost',
        title: `Lost 1v1 battle with score ${user2Score}/${questions.length}`,
        score: `${user2Score}/${questions.length}`
      });
    } else if (winnerId === session.user2_id) {
      await ActivityModel.create({
        user_id: session.user2_id,
        activity_type: 'battle_won',
        title: `Won 1v1 battle with score ${user2Score}/${questions.length}`,
        score: `${user2Score}/${questions.length}`
      });
      await ActivityModel.create({
        user_id: session.user1_id,
        activity_type: 'battle_lost',
        title: `Lost 1v1 battle with score ${user1Score}/${questions.length}`,
        score: `${user1Score}/${questions.length}`
      });
    } else {
      // Tie
      await ActivityModel.create({
        user_id: session.user1_id,
        activity_type: 'quiz_completed',
        title: `Tied 1v1 battle with score ${user1Score}/${questions.length}`,
        score: `${user1Score}/${questions.length}`
      });
      await ActivityModel.create({
        user_id: session.user2_id,
        activity_type: 'quiz_completed',
        title: `Tied 1v1 battle with score ${user2Score}/${questions.length}`,
        score: `${user2Score}/${questions.length}`
      });
    }
  } else {
    // Solo quiz
    await ActivityModel.create({
      user_id: requestingUserId,
      activity_type: 'quiz_completed',
      title: `Completed solo quiz with score ${user1Score}/${questions.length}`,
      score: `${user1Score}/${questions.length}`
    });
  }

  // Get player names
  let user1Name = null, user2Name = null;
  const u1 = await db.query('SELECT username, full_name FROM users WHERE user_id = $1', [session.user1_id]);
  if (u1.rows[0]) user1Name = u1.rows[0].full_name || u1.rows[0].username;
  if (session.user2_id) {
    const u2 = await db.query('SELECT username, full_name FROM users WHERE user_id = $1', [session.user2_id]);
    if (u2.rows[0]) user2Name = u2.rows[0].full_name || u2.rows[0].username;
  }

  return {
    session: completed,
    user1Score,
    user2Score,
    totalQuestions: questions.length,
    user1TotalTime,
    user2TotalTime,
    winnerId,
    user1_id: session.user1_id,
    user2_id: session.user2_id,
    user1Name,
    user2Name,
    quizType: session.quiz_type
  };
}

// @desc    Complete a session (handles per-player completion for 1v1)
// @route   POST /api/battle/:sessionId/complete
// @access  Protected
exports.completeSession = async (req, res) => {
  try {
    const session = await SessionModel.getById(req.params.sessionId);
    if (!session) return error(res, 'Session not found', 404);

    // If already completed, return existing results
    if (session.status === 'completed') {
      const questions = await SessionModel.getQuestions(req.params.sessionId);
      const user1Score = questions.filter(q => q.user1_correct).length;
      const user2Score = questions.filter(q => q.user2_correct).length;

      let user1Name = null, user2Name = null;
      const u1 = await db.query('SELECT username, full_name FROM users WHERE user_id = $1', [session.user1_id]);
      if (u1.rows[0]) user1Name = u1.rows[0].full_name || u1.rows[0].username;
      if (session.user2_id) {
        const u2 = await db.query('SELECT username, full_name FROM users WHERE user_id = $1', [session.user2_id]);
        if (u2.rows[0]) user2Name = u2.rows[0].full_name || u2.rows[0].username;
      }

      return success(res, {
        session,
        user1Score,
        user2Score,
        totalQuestions: questions.length,
        user1TotalTime: session.user1_total_time_sec || 0,
        user2TotalTime: session.user2_total_time_sec || 0,
        winnerId: session.winner_id,
        user1_id: session.user1_id,
        user2_id: session.user2_id,
        user1Name,
        user2Name,
        quizType: session.quiz_type,
        waitingForOpponent: false
      }, 'Session already completed');
    }

    const isUser1 = session.user1_id === req.user.userId;
    const is1v1 = session.quiz_type === '1v1' && session.user2_id;

    // ── SOLO MODE or no opponent: finalize immediately ──
    if (!is1v1) {
      const questions = await SessionModel.getQuestions(req.params.sessionId);
      const result = await finalizeSession(session, questions, req.user.userId);
      return success(res, { ...result, waitingForOpponent: false }, 'Session completed');
    }

    // ── 1v1 MODE: Mark this player as completed ──
    const updated = await SessionModel.markPlayerCompleted(session.session_id, isUser1);

    const bothDone = updated.user1_completed && updated.user2_completed;

    if (!bothDone) {
      // Other player hasn't finished yet — tell frontend to wait
      return success(res, {
        waitingForOpponent: true,
        user1Completed: updated.user1_completed,
        user2Completed: updated.user2_completed,
        session_id: session.session_id
      }, 'Waiting for opponent to finish...');
    }

    // ── BOTH DONE: Finalize! ──
    const questions = await SessionModel.getQuestions(req.params.sessionId);
    const result = await finalizeSession(session, questions, req.user.userId);
    return success(res, { ...result, waitingForOpponent: false }, 'Session completed');
  } catch (err) {
    console.error('Complete Session Error:', err);
    return error(res, 'Failed to complete session', 500);
  }
};

// Helper to update user streaks on quiz completion
async function updateUserStreak(userId) {
  try {
    const userRes = await db.query('SELECT current_streak, highest_streak FROM users WHERE user_id = $1', [userId]);
    if (userRes.rows.length === 0) return;

    let { current_streak, highest_streak } = userRes.rows[0];
    current_streak = parseInt(current_streak) || 0;
    highest_streak = parseInt(highest_streak) || 0;

    // Check how many completed quiz attempts this user has today
    const todayAttempts = await db.query(
      `SELECT COUNT(*) as count FROM quiz_attempts 
       WHERE user_id = $1 AND status = 'Completed' 
         AND attempted_at >= CURRENT_DATE AND attempted_at < CURRENT_DATE + INTERVAL '1 day'`,
      [userId]
    );
    const attemptsToday = parseInt(todayAttempts.rows[0].count) || 0;

    // If attemptsToday is exactly 1, it means this was the first completed quiz today!
    if (attemptsToday === 1) {
      // Check if they had any attempts yesterday
      const yesterdayAttempts = await db.query(
        `SELECT COUNT(*) as count FROM quiz_attempts 
         WHERE user_id = $1 AND status = 'Completed' 
           AND attempted_at >= CURRENT_DATE - INTERVAL '1 day' AND attempted_at < CURRENT_DATE`,
        [userId]
      );
      const attemptsYesterday = parseInt(yesterdayAttempts.rows[0].count) || 0;

      if (attemptsYesterday > 0) {
        current_streak += 1;
      } else {
        current_streak = 1;
      }

      if (current_streak > highest_streak) {
        highest_streak = current_streak;
      }

      await db.query(
        'UPDATE users SET current_streak = $1, highest_streak = $2 WHERE user_id = $3',
        [current_streak, highest_streak, userId]
      );
    }
  } catch (err) {
    console.error('Error in updateUserStreak:', err.message);
  }
}
