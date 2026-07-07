// backend/models/User.js
// User model schema for MongoDB

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Please provide a username'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [50, 'Username cannot exceed 50 characters']
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email'
      ]
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false // Don't return password by default in queries
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'dark' // Default theme
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastLogin: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true // Automatically adds createdAt and updatedAt fields
  }
);

// Hash password before saving to database
UserSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Generate salt
    const salt = await bcrypt.genSalt(10);
    // Hash password
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare entered password with hashed password
UserSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to generate JWT token (optional - we'll use it in controller)
UserSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password; // Remove password from JSON response
  return user;
};

module.exports = mongoose.model('User', UserSchema);

// // backend/models/User.js
// // User model schema for MongoDB

// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');

// const UserSchema = new mongoose.Schema(
//   {
//     username: {
//       type: String,
//       required: [true, 'Please provide a username'],
//       unique: true,
//       trim: true,
//       minlength: [3, 'Username must be at least 3 characters'],
//       maxlength: [30, 'Username cannot exceed 30 characters']
//     },
//     email: {
//       type: String,
//       required: [true, 'Please provide an email'],
//       unique: true,
//       lowercase: true,
//       trim: true,
//       match: [
//         /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
//         'Please provide a valid email'
//       ]
//     },
//     password: {
//       type: String,
//       required: [true, 'Please provide a password'],
//       minlength: [8, 'Password must be at least 8 characters'],
//       select: false // Don't return password by default in queries
//     },
//     role: {
//       type: String,
//       enum: ['user', 'admin'],
//       default: 'user'
//     },
//     isActive: {
//       type: Boolean,
//       default: true
//     },
//     lastLogin: {
//       type: Date,
//       default: null
//     }
//   },
//   {
//     timestamps: true // Automatically adds createdAt and updatedAt fields
//   }
// );

// // Hash password before saving to database
// UserSchema.pre('save', async function (next) {
//   // Only hash the password if it has been modified (or is new)
//   if (!this.isModified('password')) {
//     return next();
//   }

//   try {
//     // Generate salt
//     const salt = await bcrypt.genSalt(10);
//     // Hash password
//     this.password = await bcrypt.hash(this.password, salt);
//     next();
//   } catch (error) {
//     next(error);
//   }
// });

// // Method to compare entered password with hashed password
// UserSchema.methods.comparePassword = async function (enteredPassword) {
//   return await bcrypt.compare(enteredPassword, this.password);
// };

// // Method to generate JWT token (optional - we'll use it in controller)
// UserSchema.methods.toJSON = function () {
//   const user = this.toObject();
//   delete user.password; // Remove password from JSON response
//   return user;
// };

// module.exports = mongoose.model('User', UserSchema);
// backend/models/User.js
// User model schema for MongoDB
