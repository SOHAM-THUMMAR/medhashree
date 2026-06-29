const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// IMPORTANT: Specific routes MUST come before /:id to avoid being caught by the wildcard
router.get('/dashboard/:id', userController.getDashboardData);
router.get('/stats/:id', userController.getUserStats);
router.get('/notifications/:id', userController.getUserNotifications);
router.get('/:id', userController.getUserProfile);

module.exports = router;
