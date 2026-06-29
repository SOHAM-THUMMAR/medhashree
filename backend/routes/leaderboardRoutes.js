const express = require('express');
const router = express.Router();
const leaderboardController = require('../controllers/leaderboardController');

// Get leaderboard
router.get('/', leaderboardController.getLeaderboard);

// Get user rank
router.get('/rank/:userId', leaderboardController.getUserRank);

module.exports = router;