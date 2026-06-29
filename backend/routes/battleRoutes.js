const express = require('express');
const router = express.Router();
const battleController = require('../controllers/battleController');
const { protect } = require('../middleware/authMiddleware');

// Find match (1v1 matchmaking)
router.post('/find-match', protect, battleController.findMatch);

// Check match status (polling for 1v1)
router.get('/:sessionId/status', protect, battleController.checkMatchStatus);

// Create quiz session (solo mode)
router.post('/create', protect, battleController.createSession);

// Get questions for a session
router.get('/:sessionId/questions', protect, battleController.getSessionQuestions);

// Submit answer
router.post('/:sessionId/answer', protect, battleController.submitAnswer);

// Complete session
router.post('/:sessionId/complete', protect, battleController.completeSession);

module.exports = router;
