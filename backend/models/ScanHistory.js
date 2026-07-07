// backend/models/ScanHistory.js
const mongoose = require('mongoose');

const scanHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  patientName: {
    type: String,
    required: true,
    trim: true
  },
  model: {
    type: String,
    required: true,
    enum: ['chest', 'bones']
  },
  imageBase64: {
    type: String,
    required: true
  },
  technicalReport: {
    type: String,
    required: true
  },
  plainLanguageReport: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  // Auto-delete after 15 days
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 15 * 24 * 60 * 60 * 1000); // 15 days from now
    },
    index: { expires: 0 } // TTL index
  }
}, {
  timestamps: true
});

// Index for faster queries
scanHistorySchema.index({ userId: 1, timestamp: -1 });
scanHistorySchema.index({ expiresAt: 1 });

module.exports = mongoose.model('ScanHistory', scanHistorySchema);
