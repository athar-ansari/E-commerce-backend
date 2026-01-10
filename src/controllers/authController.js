const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const { generateToken } = require("../utils/jwt");
const {
  sendEmail,
  getForgotPasswordEmail,
} = require("../services/emailService");

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

    res.status(200).json({
      message: "Login successful",
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
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

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    user.otp = otp;
    user.otpExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes
    user.otpVerified = false;
    await user.save();

    //   SEND OTP EMAIL
    const emailTemplate = getForgotPasswordEmail(user.name, email, otp);
    await sendEmail(email, emailTemplate.subject, emailTemplate.html);

    res.status(200).json({
      success: true,
      message: "OTP sent to your email",
      expiresIn: "5 minutes",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process request",
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

    // Check OTP
    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (user.otpExpiry < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    // Update password
    user.password = await bcrypt.hash(newPassword, 10);
    user.otp = null;
    user.otpExpiry = null;
    user.otpVerified = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reset password",
    });
  }
};
