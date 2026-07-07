// backend/routes/user.js
// User settings and profile routes

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  updateUsername,
  updateTheme,
  changePassword,
  deleteAccount
} = require('../controllers/userController');

// All routes require authentication
router.put('/update-username', protect, updateUsername);
router.put('/update-theme', protect, updateTheme);
router.put('/change-password', protect, changePassword);
router.delete('/delete-account', protect, deleteAccount);

module.exports = router;