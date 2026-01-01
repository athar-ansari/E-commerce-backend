const mongoose = require("mongoose");
const seedUserTypes = require("./seedDataConfig");

const connectDB = async () => {
  try {
    const connect = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`MongoDB Connected: ${connect.connection.host}`);
    console.log(`Database: ${connect.connection.name}`);

    
    // Run seed data AFTER connection
    await seedUserTypes(); // ← Call here
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
