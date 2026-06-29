const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// All admin routes require protect + adminOnly
router.use(protect, adminOnly);

// Dashboard stats
router.get('/dashboard', adminController.getDashboardStats);

// User management
router.get('/users', adminController.getAllUsers);
router.put('/users/:id/role', adminController.updateUserRole);
router.put('/users/:id/active', adminController.toggleUserActive);
router.delete('/users/:id', adminController.deleteUser);

// Content management
router.get('/content', adminController.getAllContent);
router.get('/content/:fileId/questions', adminController.getContentQuestions);
router.delete('/content/:fileId', adminController.deleteContent);
router.put('/content/:fileId', adminController.updateContent);
router.delete('/questions/:questionId', adminController.deleteQuestion);
router.put('/questions/:questionId', adminController.updateQuestion);

module.exports = router;