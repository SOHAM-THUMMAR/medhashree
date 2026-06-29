const express = require('express');
const router = express.Router();
const bugReportController = require('../controllers/bugReportController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Create bug report (any logged-in user)
router.post('/', protect, bugReportController.createReport);

// Get all reports (admin)
router.get('/', protect, adminOnly, bugReportController.getAllReports);

// Update report status (admin)
router.put('/:id/status', protect, adminOnly, bugReportController.updateReportStatus);

module.exports = router;