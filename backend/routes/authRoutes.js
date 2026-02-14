const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/register', register); // Register new user
router.post('/login', login); // Login user

// Protected routes
router.get('/me', protect, getMe); // Get current user profile

module.exports = router;