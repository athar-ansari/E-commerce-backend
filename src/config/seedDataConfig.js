const UserType = require("../models/UserTypeModel");

async function seedUserTypes() {
  try {
    // Check if data already exists
    const count = await UserType.countDocuments();

    if (count > 0) {
      console.log("User types already exist");
      return; // Stop here
    }

    // If empty, add default user types
    await UserType.insertMany([
      { role: "admin" },
      { role: "seller" },
      { role: "user" },
    ]);

    console.log("Default user types created");
  } catch (error) {
    console.error(`Error creating user types :  ${error.message}`);
  }
}

module.exports = seedUserTypes;
