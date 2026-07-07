// backend/routes/scanHistory.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  saveScan,
  getAllScans,
  getScanById,
  deleteScan,
  deleteAllScans,
  cleanupOldScans
} = require('../controllers/scanHistoryController');

// Protect all routes - require authentication
router.use(protect);

// @route   POST /api/scan-history
// @desc    Save new scan to history
// @access  Private
router.post('/', saveScan);

// @route   GET /api/scan-history
// @desc    Get all scans for logged-in user
// @access  Private
router.get('/', getAllScans);

// @route   DELETE /api/scan-history/all
// @desc    Delete all scans for user (clear history)
// @access  Private
router.delete('/all', deleteAllScans);

// @route   DELETE /api/scan-history/cleanup/old
// @desc    Manually cleanup old scans (admin use)
// @access  Private
router.delete('/cleanup/old', cleanupOldScans);

// @route   GET /api/scan-history/:id
// @desc    Get single scan by ID
// @access  Private
router.get('/:id', getScanById);

// @route   DELETE /api/scan-history/:id
// @desc    Delete scan by ID
// @access  Private
router.delete('/:id', deleteScan);

module.exports = router;
