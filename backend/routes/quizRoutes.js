const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const { protect, instructorOrAdmin } = require('../middleware/authMiddleware');
const upload = require('../config/uploadConfig');

// Upload quiz via CSV (instructor or admin only)
router.post('/upload', protect, instructorOrAdmin, upload.single('csvFile'), quizController.uploadQuiz);

// Upload quiz via JSON payload (instructor or admin only)
router.post('/upload-json', protect, instructorOrAdmin, quizController.uploadQuizJSON);

// Solved papers routes (public)
router.get('/solved-papers', quizController.getSolvedPapers);
router.get('/solved-papers/:fileId/questions', quizController.getSolvedPaperQuestions);

// Get latest quizzes (public)
router.get('/latest', quizController.getLatestQuizzes);

// Get explore quizzes (public)
router.get('/explore', quizController.getExploreQuizzes);

// Get explore questions directly from db (public)
router.get('/explore-questions', quizController.getExploreQuestions);

// Get logged-in user's quizzes
router.get('/my', protect, quizController.getMyQuizzes);

// Get questions for a quiz file
router.get('/:fileId/questions', quizController.getQuizQuestions);

// Delete a quiz file
router.delete('/:fileId', protect, quizController.deleteQuiz);

module.exports = router;
