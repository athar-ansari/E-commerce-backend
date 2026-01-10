const User = require("../models/userModel");
const UserType = require("../models/UserTypeModel");
const {
  getSignupEmailVerification,
  sendEmail,
} = require("../services/emailService");
const bcrypt = require("bcrypt");

// Signup Controller
const signup = async (req, res) => {
  try {
    const { name, email, password, mobile, role = "user" } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      if (existingUser.isVerified) {
        return res.status(400).json({
          success: false,
          message: "Email already registered, Please login",
        });
      } else {
        return res.status(400).json({
          success: false,
          message:
            "Email already registered but not verified . Please verify your email.",
          redirectTo: "/resend-otp", // Frontend can use this
        });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Prepare profile image
    let profileImage = null;
    if (req.file) {
      profileImage = {
        url: req.file.path,
        public_id: req.file.filename,
      };
    }

    // Parse address fields from request body
    const { street, city, state, pincode, country } = req.body;

    let addressArray = [];

    // Only create address if at least one field is provided
    if (street || city || state || pincode) {
      addressArray = [
        {
          street: street,
          city: city,
          state: state,
          pincode: pincode,
          country: country,
        },
      ];
    }

    // Get UserType based on role
    let userType = await UserType.findOne({ role: role.toLowerCase() });

    if (!userType) {
      userType = await UserType.findOne({ role: "user" });
    }

    // Prepare user data
    const userData = {
      name,
      email,
      password: hashedPassword,
      mobile,
      profileImage,
      address: addressArray,
      otp,
      otpExpiry,
      otpVerified: false,
      userType: userType._id,
    };

    // Add seller-specific fields if role is seller
    if (role.toLowerCase() === "seller") {
      const { storeName, gstNumber, businessType } = req.body;

      userData.sellerInfo = {
        storeName: storeName,
        gstNumber: gstNumber,
        businessType: businessType,
      };
      userData.sellerStatus = "pending";
    } else {
      userData.sellerInfo = null;
      userData.sellerStatus = null;
    }

    // Create new user
    const newUser = new User(userData);
    await newUser.save();

    // Send OTP email
    const emailTemplate = getSignupEmailVerification(email, otp, role);
    const emailResult = await sendEmail(
      email,
      emailTemplate.subject,
      emailTemplate.html
    );

    // Return success response
    const responseUser = {
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: role,
      isVerified: newUser.isVerified,
      ...(role === "seller" && { sellerStatus: newUser.sellerStatus }),
      address: newUser.address,
    };

    res.status(201).json({
      success: true,
      message: "Signup successful! Please verify your email with OTP.",
      user: responseUser,
      emailSent: emailResult.success,
      note: "OTP will expire in 5 minutes",
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({
      success: false,
      message: "Signup failed",
      error: error.message,
    });
  }
};

// OTP Verification (same as before)
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.otpVerified) {
      return res.status(400).json({
        success: false,
        message: "Email already verified. Please login.",
      });
    }

    if (user.otp !== parseInt(otp)) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    if (user.otpExpiry < new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
    }

    // Update verification status
    user.otpVerified = true;
    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;

    await user.save();

    // Get role for response
    let role = "user";
    if (user.userType) {
      const userTypeDoc = await UserType.findById(user.userType);
      role = userTypeDoc ? userTypeDoc.role : "user";
    }

    const responseUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: role,
      isVerified: user.isVerified,
      isActive: user.isActive,
      address: user.address,
      ...(role === "seller" && {
        sellerStatus: user.sellerStatus,
        storeName: user.sellerInfo?.storeName,
      }),
    };

    res.status(200).json({
      success: true,
      message: "Email verified successfully!",
      user: responseUser,
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({
      success: false,
      message: "OTP verification failed",
      error: error.message,
    });
  }
};

// Resend OTP (same as before)
const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isVerified && user.otpVerified) {
      return res.status(400).json({
        success: false,
        message: "Email already verified. Please login.",
      });
    }

    // Generate new OTP
    const newOtp = Math.floor(100000 + Math.random() * 900000);
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    user.otp = newOtp;
    user.otpExpiry = otpExpiry;
    user.otpVerified = false;

    await user.save();

    // Get user role for email
    let role = "user";
    if (user.userType) {
      const userTypeDoc = await UserType.findById(user.userType);
      role = userTypeDoc ? userTypeDoc.role : "user";
    }

    // Send email
    const emailTemplate = getSignupEmailVerification(email, newOtp, role);
    const emailResult = await sendEmail(
      email,
      emailTemplate.subject,
      emailTemplate.html
    );

    res.status(200).json({
      success: true,
      message: "New OTP sent successfully!",
      emailSent: emailResult.success,
      note: "OTP will expire in 5 minutes",
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to resend OTP",
      error: error.message,
    });
  }
};

module.exports = {
  signup,
  verifyOtp,
  resendOtp,
};
