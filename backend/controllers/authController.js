// backend/controllers/authController.js
// Authentication controller with business logic

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: userExists.email === email 
          ? 'Email already registered' 
          : 'Username already taken'
      });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          theme: user.theme,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user with password field
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Compare password
    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          lastLogin: user.lastLogin
        }
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private (Requires token)
exports.getMe = async (req, res) => {
  try {
    // req.user is set by auth middleware
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Get Me Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user data',
      error: error.message
    });
  }
};

// @desc    Logout user (optional - mainly for clearing client-side token)
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    // In a stateless JWT system, logout is typically handled on the client
    // by removing the token from storage
    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging out',
      error: error.message
    });
  }
};


// // backend/controllers/authController.js
// // Authentication controller with business logic

// const jwt = require('jsonwebtoken');
// const User = require('../models/User');

// // Generate JWT Token
// const generateToken = (userId) => {
//   return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
//     expiresIn: process.env.JWT_EXPIRE || '7d'
//   });
// };

// // @desc    Register a new user
// // @route   POST /api/auth/register
// // @access  Public
// exports.register = async (req, res) => {
//   try {
//     const { username, email, password } = req.body;

//     // Validation
//     if (!username || !email || !password) {
//       return res.status(400).json({
//         success: false,
//         message: 'Please provide all required fields'
//       });
//     }

//     // Check if user already exists
//     const userExists = await User.findOne({ 
//       $or: [{ email }, { username }] 
//     });

//     if (userExists) {
//       return res.status(400).json({
//         success: false,
//         message: userExists.email === email 
//           ? 'Email already registered' 
//           : 'Username already taken'
//       });
//     }

//     // Create user
//     const user = await User.create({
//       username,
//       email,
//       password
//     });

//     // Generate token
//     const token = generateToken(user._id);

//     res.status(201).json({
//       success: true,
//       message: 'User registered successfully',
//       data: {
//         token,
//         user: {
//           id: user._id,
//           username: user.username,
//           email: user.email,
//           role: user.role,
//           createdAt: user.createdAt
//         }
//       }
//     });
//   } catch (error) {
//     console.error('Register Error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error registering user',
//       error: error.message
//     });
//   }
// };

// // @desc    Login user
// // @route   POST /api/auth/login
// // @access  Public
// exports.login = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     // Validation
//     if (!email || !password) {
//       return res.status(400).json({
//         success: false,
//         message: 'Please provide email and password'
//       });
//     }

//     // Find user with password field
//     const user = await User.findOne({ email }).select('+password');

//     if (!user) {
//       return res.status(401).json({
//         success: false,
//         message: 'Invalid username or email'
//       });
//     }

//     // Check if user is active
//     if (!user.isActive) {
//       return res.status(401).json({
//         success: false,
//         message: 'Account is deactivated. Please contact support.'
//       });
//     }

//     // Compare password
//     const isPasswordCorrect = await user.comparePassword(password);

//     if (!isPasswordCorrect) {
//       return res.status(401).json({
//         success: false,
//         message: 'Invalid password'
//       });
//     }

//     // Update last login
//     user.lastLogin = new Date();
//     await user.save();

//     // Generate token
//     const token = generateToken(user._id);

//     res.status(200).json({
//       success: true,
//       message: 'Login successful',
//       data: {
//         token,
//         user: {
//           id: user._id,
//           username: user.username,
//           email: user.email,
//           role: user.role,
//           lastLogin: user.lastLogin
//         }
//       }
//     });
//   } catch (error) {
//     console.error('Login Error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error logging in',
//       error: error.message
//     });
//   }
// };

// // @desc    Get current logged in user
// // @route   GET /api/auth/me
// // @access  Private (Requires token)
// exports.getMe = async (req, res) => {
//   try {
//     // req.user is set by auth middleware
//     const user = await User.findById(req.user.id);

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found'
//       });
//     }

//     res.status(200).json({
//       success: true,
//       data: {
//         user: {
//           id: user._id,
//           username: user.username,
//           email: user.email,
//           role: user.role,
//           isActive: user.isActive,
//           lastLogin: user.lastLogin,
//           createdAt: user.createdAt
//         }
//       }
//     });
//   } catch (error) {
//     console.error('Get Me Error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching user data',
//       error: error.message
//     });
//   }
// };

// // @desc    Logout user (optional - mainly for clearing client-side token)
// // @route   POST /api/auth/logout
// // @access  Private
// exports.logout = async (req, res) => {
//   try {
//     // In a stateless JWT system, logout is typically handled on the client
//     // by removing the token from storage
//     res.status(200).json({
//       success: true,
//       message: 'Logout successful'
//     });
//   } catch (error) {
//     console.error('Logout Error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error logging out',
//       error: error.message
//     });
//   }
// };