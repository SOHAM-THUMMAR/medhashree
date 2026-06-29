const express = require('express');
const router = express.Router();
const tournamentController = require('../controllers/tournamentController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Create tournament (admin)
router.post('/', protect, adminOnly, tournamentController.createTournament);

// Get all tournaments (public)
router.get('/', tournamentController.getAllTournaments);

// Get single tournament (public)
router.get('/:id', tournamentController.getTournamentById);

// Join tournament (protected)
router.post('/:id/join', protect, tournamentController.joinTournament);

// Update tournament (admin)
router.put('/:id', protect, adminOnly, tournamentController.updateTournament);

// End tournament (admin)
router.post('/:id/end', protect, adminOnly, tournamentController.endTournament);

// Get leaderboard (public)
router.get('/:id/leaderboard', tournamentController.getLeaderboard);

// Get my attempts (protected)
router.get('/:id/my-attempts', protect, tournamentController.getMyAttempts);

// Record attempt (protected)
router.post('/:id/attempt', protect, tournamentController.recordAttempt);

module.exports = router;