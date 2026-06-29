const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Define auth routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-otp', authController.verifyOTP);
router.post('/reset-password', authController.resetPassword);
router.post('/google', authController.googleLogin);

module.exports = router;
