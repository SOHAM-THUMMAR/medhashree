const express = require('express');
const router = express.Router();
const fixedQuizController = require('../controllers/fixedQuizController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Get all fixed quizzes (public)
router.get('/', fixedQuizController.getAllQuizzes);

// Get a single quiz's configuration details (admin only)
router.get('/:id', protect, adminOnly, fixedQuizController.getQuizById);

// Create a new fixed quiz card (admin only)
router.post('/', protect, adminOnly, fixedQuizController.createQuiz);

// Update a fixed quiz card (admin only)
router.put('/:id', protect, adminOnly, fixedQuizController.updateQuiz);

// Delete a fixed quiz card (admin only)
router.delete('/:id', protect, adminOnly, fixedQuizController.deleteQuiz);

// Play a fixed quiz (creates a session) - requires regular student authentication
router.post('/:id/play', protect, fixedQuizController.playQuiz);

module.exports = router;
