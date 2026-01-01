const mongoose = require("mongoose");

const userTypeSchema = new mongoose.Schema(
  {
    role: {
      type: String, // admin seller user
    },
    permissions: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);
let UserType = mongoose.model("UserType", userTypeSchema);
module.exports = UserType;
