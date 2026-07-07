// backend/controllers/scanHistoryController.js
const ScanHistory = require('../models/ScanHistory');

// Save new scan to history
exports.saveScan = async (req, res) => {
  try {
    const { patientName, model, imageBase64, technicalReport, plainLanguageReport, timestamp } = req.body;

    // Validate required fields
    if (!patientName || !model || !imageBase64 || !technicalReport || !plainLanguageReport) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Create new scan history
    const scanHistory = await ScanHistory.create({
      userId: req.user.id, // From auth middleware
      patientName,
      model,
      imageBase64,
      technicalReport,
      plainLanguageReport,
      timestamp: timestamp || new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Scan saved to history',
      data: {
        id: scanHistory._id,
        patientName: scanHistory.patientName,
        model: scanHistory.model,
        timestamp: scanHistory.timestamp
      }
    });
  } catch (error) {
    console.error('Save scan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save scan to history',
      error: error.message
    });
  }
};

// Get all scans for logged-in user
exports.getAllScans = async (req, res) => {
  try {
    const scans = await ScanHistory.find({ userId: req.user.id })
      .select('-imageBase64') // Exclude base64 from list (too large)
      .sort({ timestamp: -1 }) // Most recent first
      .limit(100); // Limit to 100 records

    res.status(200).json({
      success: true,
      count: scans.length,
      data: scans
    });
  } catch (error) {
    console.error('Get scans error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch scan history',
      error: error.message
    });
  }
};

// Get single scan by ID (with full data including image)
exports.getScanById = async (req, res) => {
  try {
    const scan = await ScanHistory.findOne({
      _id: req.params.id,
      userId: req.user.id // Ensure user owns this scan
    });

    if (!scan) {
      return res.status(404).json({
        success: false,
        message: 'Scan not found'
      });
    }

    res.status(200).json({
      success: true,
      data: scan
    });
  } catch (error) {
    console.error('Get scan by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch scan',
      error: error.message
    });
  }
};

// Delete scan by ID
exports.deleteScan = async (req, res) => {
  try {
    const scan = await ScanHistory.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id // Ensure user owns this scan
    });

    if (!scan) {
      return res.status(404).json({
        success: false,
        message: 'Scan not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Scan deleted successfully'
    });
  } catch (error) {
    console.error('Delete scan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete scan',
      error: error.message
    });
  }
};

// Delete all scans for logged-in user (clear history)
exports.deleteAllScans = async (req, res) => {
  try {
    const result = await ScanHistory.deleteMany({
      userId: req.user.id // Only delete scans belonging to the user
    });

    res.status(200).json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} scan(s)`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Delete all scans error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete scan history',
      error: error.message
    });
  }
};

// Delete all scans older than 15 days (manual cleanup - optional)
exports.cleanupOldScans = async (req, res) => {
  try {
    const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
    
    const result = await ScanHistory.deleteMany({
      timestamp: { $lt: fifteenDaysAgo }
    });

    res.status(200).json({
      success: true,
      message: `Cleaned up ${result.deletedCount} old scans`
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup old scans',
      error: error.message
    });
  }
};
