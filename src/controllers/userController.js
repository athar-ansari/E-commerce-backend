const User = require("../models/userModel");
const UserType = require("../models/UserTypeModel");
const bcrypt = require("bcrypt");
const {
  generateSendAndSaveOTP,
  verifyOTP,
  clearOTP,
} = require("../services/otpService");

/**  
===============================================
 Signup Controller (With OTP verification) 
=============================================== 
 */

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
            "Email already registered but not verified. Please verify your email.",
          redirectTo: "/resend-otp",
        });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

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
      otpVerified: false,
      isVerified: false,
      isActive: true,
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

    //  Using otpService to generate, send and save OTP
    const otpResult = await generateSendAndSaveOTP(newUser, "signup", { role });

    if (!otpResult.success) {
      return res.status(500).json({
        success: false,
        message: "User created but failed to send OTP",
      });
    }

    // Return success response
    const responseUser = {
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: role,
      isVerified: newUser.isVerified,
      isActive: newUser.isActive,
      ...(role === "seller" && { sellerStatus: newUser.sellerStatus }),
      address: newUser.address,
    };

    res.status(201).json({
      success: true,
      message: "Signup successful! Please verify your email with OTP.",
      user: responseUser,
      emailSent: otpResult.success,
      note: "OTP will expire in 5 minutes",
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({
      success: false,
      message: "Signup failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**  
===============================================
 OTP Verification (using otpService)
=============================================== 
 */

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

    //   Using otpService for verification
    const verificationResult = verifyOTP(user, otp);

    if (!verificationResult.success) {
      return res.status(400).json({
        success: false,
        message: verificationResult.message,
      });
    }

    //  Clear OTP using service function
    await clearOTP(user);

    // Update verification status
    user.isVerified = true;

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
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**  
===============================================
 Resend OTP (using otpService)
=============================================== 
 */

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

    //  Using otpService to resend OTP
    const otpResult = await generateSendAndSaveOTP(user, "signup", {
      role: user.userType?.role || "user",
    });

    if (!otpResult.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to resend OTP",
        error: otpResult.error,
      });
    }

    res.status(200).json({
      success: true,
      message: "New OTP sent successfully!",
      emailSent: otpResult.success,
      note: "OTP will expire in 5 minutes",
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to resend OTP",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  signup,
  verifyOtp,
  resendOtp,
};
