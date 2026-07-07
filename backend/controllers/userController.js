// backend/controllers/userController.js
// User settings and profile management

const User = require('../models/User');

// @desc    Update username
// @route   PUT /api/user/update-username
// @access  Private
exports.updateUsername = async (req, res) => {
  try {
    const { username } = req.body;

    // Validation
    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a username'
      });
    }

    if (username.length < 3 || username.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Username must be between 3 and 50 characters'
      });
    }

    // Check if username already taken
    const existingUser = await User.findOne({ 
      username, 
      _id: { $ne: req.user.id } // Exclude current user
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username already taken'
      });
    }

    // Update username
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { username },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Username updated successfully',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          theme: user.theme
        }
      }
    });
  } catch (error) {
    console.error('Update Username Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating username',
      error: error.message
    });
  }
};

// @desc    Update theme preference
// @route   PUT /api/user/update-theme
// @access  Private
exports.updateTheme = async (req, res) => {
  try {
    const { theme } = req.body;

    // Validation
    if (!theme || !['light', 'dark'].includes(theme)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid theme. Must be "light" or "dark"'
      });
    }

    // Update theme
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { theme },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Theme updated successfully',
      data: {
        theme: user.theme
      }
    });
  } catch (error) {
    console.error('Update Theme Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating theme',
      error: error.message
    });
  }
};

// @desc    Change password
// @route   PUT /api/user/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all password fields'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New passwords do not match'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');

    // Verify current password
    const isPasswordCorrect = await user.comparePassword(currentPassword);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change Password Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password',
      error: error.message
    });
  }
};

// @desc    Delete user account
// @route   DELETE /api/user/delete-account
// @access  Private
exports.deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;

    // Validation - require password for security
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your password to confirm deletion'
      });
    }

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');

    // Verify password
    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password'
      });
    }

    // Delete user
    await User.findByIdAndDelete(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete Account Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting account',
      error: error.message
    });
  }
};