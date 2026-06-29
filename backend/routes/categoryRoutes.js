const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Get all categories
router.get('/', categoryController.getAllCategories);

// Get subjects for a category
router.get('/:id/subjects', categoryController.getSubjects);

// Admin routes for managing categories
router.post('/', protect, adminOnly, categoryController.createCategory);
router.put('/:id', protect, adminOnly, categoryController.updateCategory);
router.delete('/:id', protect, adminOnly, categoryController.deleteCategory);

// Get topics for a subject (mounted on /api/subjects)
// Note: This is a special case — the route is registered in server.js under /api/subjects
// But we keep it here for the category hierarchy

module.exports = router;