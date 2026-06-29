const express = require('express');
const router = express.Router();
const selfStudyController = require('../controllers/selfStudyController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Get all self study paths
router.get('/', selfStudyController.getAllCategories);

// Get subjects for a self study path
router.get('/:id/subjects', selfStudyController.getSubjects);

// Admin routes for managing self study paths
router.post('/', protect, adminOnly, selfStudyController.createCategory);
router.put('/:id', protect, adminOnly, selfStudyController.updateCategory);
router.delete('/:id', protect, adminOnly, selfStudyController.deleteCategory);

module.exports = router;
