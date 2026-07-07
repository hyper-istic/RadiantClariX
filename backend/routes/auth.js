// backend/routes/auth.js
// Authentication routes

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  register,
  login,
  getMe,
  logout
} = require('../controllers/authController');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes (require authentication)
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

// Example: Admin only route (you can add more later)
// router.get('/admin', protect, authorize('admin'), someAdminController);

module.exports = router;