const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// GET /api/site-settings (Public)
router.get('/', settingsController.getSettings);

// PUT /api/site-settings (Admin only)
router.put('/', protect, adminOnly, settingsController.updateSettings);

module.exports = router;
