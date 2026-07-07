// // backend/config/db.js
// // MongoDB connection configuration

// const mongoose = require('mongoose');

// const connectDB = async () => {
//   try {
//     const conn = await mongoose.connect(process.env.MONGODB_URI, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     });

//     console.log(`\n✅ MongoDB Connected Successfully`);
//     // console.log(`📊 Database Host: ${conn.connection.host}`);
//     // console.log(`🗄️  Database Name: ${conn.connection.name}\n`);
//   } catch (error) {
//     console.error(`\n❌ MongoDB Connection Error: ${error.message}\n`);
//     process.exit(1); // Exit process with failure
//   }
// };

// module.exports = connectDB;

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
      socketTimeoutMS: 45000,
    });

    console.log(`\n✅ MongoDB Connected Successfully`);
    console.log(`📊 Database Host: ${conn.connection.host}`);
    console.log(`🗄️  Database Name: ${conn.connection.name}\n`);
  } catch (error) {
    console.error(`\n❌ MongoDB Connection Error: ${error.message}\n`);
    process.exit(1);
  }
};


module.exports = connectDB;