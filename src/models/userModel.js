const mongoose = require("mongoose");

const user = new mongoose.Schema(
  {
    name: {
      type: String,
      default: null,
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
      default: null,
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
          type: Number,
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
      default: null,
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
      default: null,
    },

    sellerInfo: {
      type: {
        storeName: { type: String, default: "" },
        gstNumber: { type: String, default: "" },
        businessType: { type: String, default: "" },
      },
      default: null, //
      required: false,
    },
    sellerStatus: {
      type: String,
      enum: ["pending", "approved", "rejected", "suspended"],
      default: null,
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
