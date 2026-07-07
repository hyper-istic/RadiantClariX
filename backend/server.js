// backend/server.js
// Main entry point for the Express server

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();

// Middleware
app.use(express.json({ limit: '50mb' })); // Increase limit for base64 images
app.use(express.urlencoded({ limit: '50mb', extended: true })); // Increase limit for base64 images
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api/scan-history', require('./routes/scanHistory'));

// Health check route
app.get('/', (req, res) => {
  res.json({ 
    message: 'RadiantClariX API is running',
    version: '1.0.0',
    status: 'OK'
  });
});

// 404 Error Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 API Base URL: http://localhost:${PORT}`);
});