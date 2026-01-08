const UserType = require("../models/UserTypeModel");
const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const cloudinary = require("../utils/cloudinary");
const {
  sendEmail,
  getSignupEmailVerification,
} = require("../services/emailService");

// Simple OTP-based signup
exports.signup = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      address,
      mobile,
      otp,
      role = "user",
    } = req.body;

    // Check if email already registered
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    // If OTP not provided, send OTP
    if (!otp) {
      // Generate OTP
      const generatedOtp = Math.floor(100000 + Math.random() * 900000);

      // Send OTP email
      const emailTemplate = getSignupEmailVerification(
        email,
        generatedOtp,
        role
      );
      await sendEmail(email, emailTemplate.subject, emailTemplate.html);

      // Create/update user with OTP (not verified)
      if (existingUser) {
        existingUser.otp = generatedOtp;
        existingUser.otpExpiry = Date.now() + 5 * 60 * 1000;
        existingUser.otpVerified = false;
        await existingUser.save();
      } else {
        const tempUser = new User({
          email,
          otp: generatedOtp,
          otpExpiry: Date.now() + 5 * 60 * 1000,
          otpVerified: false,
        });
        await tempUser.save();
      }

      return res.status(200).json({
        success: true,
        message: "OTP sent to email",
        requiresOtp: true,
      });
    }

    // OTP provided, verify it
    if (existingUser) {
      // Check OTP
      if (existingUser.otp !== parseInt(otp)) {
        return res.status(400).json({
          success: false,
          message: "Invalid OTP",
        });
      }

      // Check expiry
      if (Date.now() > existingUser.otpExpiry) {
        return res.status(400).json({
          success: false,
          message: "OTP expired",
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: "Please request OTP first",
      });
    }

    // Validate role
    const validRoles = ["user", "seller"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Use: ${validRoles.join(", ")}`,
      });
    }

    // Get userType
    const userType = await UserType.findOne({ role });
    if (!userType) {
      return res.status(400).json({
        success: false,
        message: "Invalid role configuration",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Prepare profile image
    let profileImage = null;

    // Check if file exists in request
    if (req.file) {
      profileImage = {
        url: req.file.path,
        public_id: req.file.filename,
      };
    }

    // Update existing user with all data
    existingUser.name = name;
    existingUser.password = hashedPassword;
    existingUser.address = [
      {
        street: "",
        city: "",
        state: "",
        pincode: "",
        country: "India",
      },
    ];
    existingUser.mobile = mobile;
    existingUser.userType = userType._id;
    existingUser.profileImage = profileImage;

    // Clear OTP fields
    existingUser.otp = null;
    existingUser.otpExpiry = null;
    existingUser.otpVerified = true;

    // Set role-based status
    if (role === "user") {
      existingUser.isActive = true;
      existingUser.isVerified = true;
      existingUser.sellerInfo = null;
    } else if (role === "seller") {
      existingUser.isActive = false;
      existingUser.isVerified = false;
      existingUser.sellerStatus = "pending";
      existingUser.sellerInfo = {
        storeName: "",
        gstNumber: "",
        businessType: "",
      };
    }

    // Save to DB (only after OTP verification)
    await existingUser.save();

    // Prepare response
    const userResponse = existingUser.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message:
        role === "seller"
          ? "Seller account created. Awaiting admin approval."
          : "Account created successfully",
      user: userResponse,
    });
  } catch (error) {
    console.error("Signup error:", error);

    // Cleanup image if error
    if (req.file?.filename) {
      await cloudinary.uploader.destroy(req.file.filename);
    }

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Resend OTP
exports.resendOtp = async (req, res) => {
  try {
    const { email, role = "user" } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "No signup found",
      });
    }

    // Generate new OTP
    const newOtp = Math.floor(100000 + Math.random() * 900000);

    // Send email
    const emailTemplate = getSignupEmailVerification(email, newOtp, role);
    await sendEmail(email, emailTemplate.subject, emailTemplate.html);

    // Update user
    user.otp = newOtp;
    user.otpExpiry = Date.now() + 5 * 60 * 1000;
    user.otpVerified = false;
    await user.save();

    res.json({
      success: true,
      message: "OTP resent",
    });
  } catch (error) {
    console.error("Resend error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to resend OTP",
    });
  }
};
