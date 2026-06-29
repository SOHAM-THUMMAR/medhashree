const { verifyToken } = require('../utils/generateToken');
const SessionModel = require('../models/sessionModel');
const QuestionModel = require('../models/questionModel');
const db = require('../config/db');

/**
 * In-memory matchmaking queue
 * Key: "category_id:subject_id" (the matching criteria)
 * Value: Array of { userId, socketId, questionCount, joinedAt }
 */
const matchQueue = new Map();

/**
 * Track which user is in which queue key (for fast cleanup)
 * Key: socketId → { queueKey, userId, timeoutId }
 */
const socketToQueue = new Map();

const FIVE_MINUTES = 5 * 60 * 1000;

/**
 * Authenticate socket connection using the SAME verifyToken as HTTP middleware
 */
function authenticateSocket(socket, next) {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (!token) {
    console.log('[Socket Auth] No token provided');
    return next(new Error('Authentication required'));
  }
  
  const decoded = verifyToken(token);
  if (!decoded || !decoded.userId) {
    console.log('[Socket Auth] Invalid token');
    return next(new Error('Invalid token'));
  }

  socket.userId = decoded.userId;
  socket.userRole = decoded.role;
  console.log(`[Socket Auth] Authenticated user ${decoded.userId} (role: ${decoded.role})`);
  next();
}

/**
 * Remove a user from the matchmaking queue
 */
function removeFromQueue(socketId) {
  const entry = socketToQueue.get(socketId);
  if (!entry) return;

  // Clear the timeout
  if (entry.timeoutId) clearTimeout(entry.timeoutId);

  // Remove from the queue map
  const queueKey = entry.queueKey;
  const queueList = matchQueue.get(queueKey);
  if (queueList) {
    const filtered = queueList.filter(item => item.socketId !== socketId);
    if (filtered.length === 0) {
      matchQueue.delete(queueKey);
    } else {
      matchQueue.set(queueKey, filtered);
    }
  }

  socketToQueue.delete(socketId);
  console.log(`[Queue] Removed socket ${socketId} from queue "${queueKey}". Queue sizes:`, getQueueSummary());
}

/**
 * Debug helper: show current queue state
 */
function getQueueSummary() {
  const summary = {};
  for (const [key, list] of matchQueue.entries()) {
    summary[key] = list.map(e => `user:${e.userId}`);
  }
  return JSON.stringify(summary);
}

/**
 * Initialize battle socket handlers
 */
function initBattleSocket(io) {
  // Apply authentication middleware
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    console.log(`[Socket] User ${socket.userId} connected (${socket.id})`);

    // ─── FIND MATCH ───────────────────────────────────────────────
    socket.on('battle:find-match', async (data) => {
      try {
        const { category_id, subject_id, question_count } = data || {};
        const userId = socket.userId;
        const qCount = Math.min(parseInt(question_count) || 10, 30);

        // Normalize IDs to strings for consistent queue keys
        const catKey = category_id ? String(category_id) : 'any';
        const subKey = subject_id ? String(subject_id) : 'any';
        const queueKey = `${catKey}:${subKey}`;

        console.log(`[Queue] User ${userId} searching for match (key: "${queueKey}", questions: ${qCount})`);
        console.log(`[Queue] Current queues:`, getQueueSummary());

        // Check if this user is already in a queue
        if (socketToQueue.has(socket.id)) {
          console.log(`[Queue] User ${userId} already in queue, removing first`);
          removeFromQueue(socket.id);
        }

        // Check if there's already someone waiting in this queue
        const queueList = matchQueue.get(queueKey) || [];
        const opponent = queueList.find(item => item.userId !== userId);

        if (opponent) {
          // ── MATCH FOUND! ──
          console.log(`[Match] ✅ Pairing user ${userId} with user ${opponent.userId} (key: "${queueKey}")`);

          // Remove opponent from queue
          removeFromQueue(opponent.socketId);

          // Use the smaller question_count between both players
          const finalQuestionCount = Math.min(qCount, opponent.questionCount);

          // Normalize IDs to integers for DB queries
          const catId = category_id ? parseInt(category_id) : null;
          const subId = subject_id ? parseInt(subject_id) : null;

          // Fetch random questions (no difficulty/topic filter)
          const questions = await QuestionModel.getRandomByFilters({
            category_id: catId,
            subject_id: subId,
            limit: finalQuestionCount
          });

          console.log(`[Match] Found ${questions.length} questions for key "${queueKey}"`);

          if (questions.length === 0) {
            socket.emit('battle:error', { message: 'No questions available for this category/subject' });
            const opponentSocket = io.sockets.sockets.get(opponent.socketId);
            if (opponentSocket) {
              opponentSocket.emit('battle:error', { message: 'No questions available for this category/subject' });
            }
            return;
          }

          // Create the session
          const session = await SessionModel.create({
            quiz_type: '1v1',
            category_id: catId,
            subject_id: subId,
            topic_id: null,
            micro_topic_id: null,
            difficulty: 'Medium',
            question_count: questions.length,
            time_per_question: 60,
            user1_id: opponent.userId,  // First person in queue is user1
            user2_id: userId,           // Joiner is user2
            status: 'in_progress'
          });

          console.log(`[Match] Session ${session.session_id} created`);

          // Link questions to session
          for (let i = 0; i < questions.length; i++) {
            await SessionModel.addQuestion(session.session_id, questions[i].question_id, i + 1);
          }

          // Get player names for the match popup
          let user1Name = 'Player 1', user2Name = 'Player 2';
          try {
            const u1 = await db.query('SELECT full_name, username FROM users WHERE user_id = $1', [opponent.userId]);
            if (u1.rows[0]) user1Name = u1.rows[0].full_name || u1.rows[0].username;
            const u2 = await db.query('SELECT full_name, username FROM users WHERE user_id = $1', [userId]);
            if (u2.rows[0]) user2Name = u2.rows[0].full_name || u2.rows[0].username;
          } catch (e) { console.error('[Match] Error fetching names:', e); }

          // Notify both players
          const baseMatchData = {
            session_id: session.session_id,
            question_count: questions.length
          };

          // Notify the opponent (user1 — was waiting)
          const opponentSocket = io.sockets.sockets.get(opponent.socketId);
          if (opponentSocket) {
            opponentSocket.emit('battle:matched', {
              ...baseMatchData,
              opponent_name: user2Name,
              you_are: 'user1'
            });
            console.log(`[Match] Notified user1 (${opponent.userId}) via socket ${opponent.socketId}`);
          } else {
            console.log(`[Match] ⚠️ Could not find socket for user1 (${opponent.userId}), socket ${opponent.socketId}`);
          }

          // Notify current user (user2 — just joined)
          socket.emit('battle:matched', {
            ...baseMatchData,
            opponent_name: user1Name,
            you_are: 'user2'
          });
          console.log(`[Match] Notified user2 (${userId}) via socket ${socket.id}`);

          console.log(`[Match] ✅ Session ${session.session_id} ready with ${questions.length} questions`);

        } else {
          // ── NO MATCH — ADD TO QUEUE ──
          const queueEntry = {
            userId,
            socketId: socket.id,
            questionCount: qCount,
            joinedAt: Date.now()
          };

          // Set 5-minute timeout
          const timeoutId = setTimeout(() => {
            console.log(`[Timeout] User ${userId} timed out from queue "${queueKey}"`);
            removeFromQueue(socket.id);
            socket.emit('battle:timeout', { message: 'No opponent found within 5 minutes' });
          }, FIVE_MINUTES);

          // Store references
          socketToQueue.set(socket.id, { queueKey, userId, timeoutId });

          if (!matchQueue.has(queueKey)) {
            matchQueue.set(queueKey, []);
          }
          matchQueue.get(queueKey).push(queueEntry);

          console.log(`[Queue] User ${userId} added to queue "${queueKey}". Queue sizes:`, getQueueSummary());

          // Confirm to user they're in the queue
          socket.emit('battle:searching', {
            message: 'Searching for opponent...',
            queueKey
          });
        }
      } catch (err) {
        console.error('[Socket] Find match error:', err);
        socket.emit('battle:error', { message: 'Failed to find match: ' + err.message });
      }
    });

    // ─── CANCEL SEARCH ────────────────────────────────────────────
    socket.on('battle:cancel-search', () => {
      console.log(`[Queue] User ${socket.userId} cancelled search`);
      removeFromQueue(socket.id);
      socket.emit('battle:cancelled', { message: 'Search cancelled' });
    });

    // ─── DISCONNECT ───────────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`[Socket] User ${socket.userId} disconnected (${socket.id})`);
      removeFromQueue(socket.id);
    });
  });
}

module.exports = initBattleSocket;
