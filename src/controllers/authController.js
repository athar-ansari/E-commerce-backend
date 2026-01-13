const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const { generateToken } = require("../utils/jwt");

const {
  generateSendAndSaveOTP,
  verifyOTP,
  clearOTP,
} = require("../services/otpService");

/**  
===============================================
Common login for ALL users (admin, seller, user)
=============================================== 
 */

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user with userType populated
    const user = await User.findOne({ email }).populate("userType");
    // console.log(`userRole: ${user.userType.role}`);
    if (!user) {
      return res.status(400).json({ message: "user not found" });
    }

    //  Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account is deactivated. Please contact support.",
      });
    }

    // Check if user/seller signup but not verified email with OTP
    if (!user.isVerified) {
      return res
        .status(403)
        .json({ message: "Email not verified. Please verify your email." });
    }

    // Seller: Must be verified by admin
    if (user.userType.role === "seller" && user.sellerStatus === "pending") {
      return res.status(403).json({
        message: "Your seller account is pending, wait for admin approval",
      });
    }

    // Check password
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    // Create token with role info
    const token = generateToken({
      userId: user._id,
      role: user.userType.role,
      email: user.email,
      name: user.name,
    });
    // console.log(`token: ${token}`);

    // Prepare user response
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.userType.role,
      isVerified: user.isVerified,
      isActive: user.isActive,
      ...(user.userType.role === "seller" && {
        sellerStatus: user.sellerStatus,
        storeName: user.sellerInfo?.storeName,
      }),
    };

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**  
===============================================
Forgot Password - Send OTP
=============================================== 
 */

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    // Still return success even if user not found (security)
    if (!user) {
      return res.status(200).json({
        success: true,
        message: "User email not found, Please Signup",
      });
    }

    //  Check if user is active (optional - depends on requirement)
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account is deactivated. Please contact support.",
      });
    }

    //  Using new otpService - Single line for generate, send and save
    const otpResult = await generateSendAndSaveOTP(user, "forgotPassword", {
      userName: user.name,
    });

    if (!otpResult.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP. Please try again.",
      });
    }

    res.status(200).json({
      success: true,
      message: "OTP sent to your email",
      expiresIn: "5 minutes",
    });
  } catch (error) {
    console.error("Forgot password error:", error);

    // Check if error is from OTP service
    if (error.message.includes("Invalid OTP email type")) {
      return res.status(400).json({
        success: false,
        message: "Invalid request type",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to process request",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**  
===============================================
Verify OTP and Reset Password
=============================================== 
 */

exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    //  Using new otpService for verification
    const verificationResult = verifyOTP(user, otp);

    if (!verificationResult.success) {
      return res.status(400).json({
        success: false,
        message: verificationResult.message,
      });
    }

    // Update password
    user.password = await bcrypt.hash(newPassword, 10);

    //  Clear OTP using service function
    await clearOTP(user);

    res.status(200).json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reset password",
      // error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
