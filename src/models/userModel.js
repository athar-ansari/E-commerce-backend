const mongoose = require("mongoose");

const user = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    profileImage: {
      url: { type: String, default: null },
      public_id: { type: String, default: null },
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },

    address: [
      {
        street: {
          type: String,
          default: "",
        },
        city: {
          type: String,
          default: "",
        },
        state: {
          type: String,
          default: "",
        },
        pincode: {
          type: String,
          default: "",
        },
        country: {
          type: String,
          default: "",
        },
      },
    ],
    mobile: {
      type: String,
      required: true,
    },

    otp: { type: Number, default: null },
    otpVerified: {
      type: Boolean,
      default: true,
    },
    otpExpiry: { type: Date, default: null },
    userType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserType",
      required: true,
    },

    sellerInfo: {
      storeName: { type: String, default: "" },
      gstNumber: { type: String, default: "" },
      businessType: { type: String, default: "" },
      approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      approvedAt: { type: Date },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", user);
module.exports = User;
