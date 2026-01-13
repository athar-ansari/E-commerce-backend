const crypto = require("crypto");
const {
  sendEmail,
  getForgotPasswordEmail,
  getSignupEmailVerification,
} = require("./emailService");
const UserType = require("../models/UserTypeModel");
const User = require("../models/userModel");

/**
 * Generate a cryptographically secure OTP
 * @param {number} length - Length of OTP (default: 6)
 * @returns {string} - Generated OTP
 */
const generateOTP = (length = 6) => {
  // Using crypto.randomInt for secure random number generation
  return crypto
    .randomInt(
      Math.pow(10, length - 1), // Lower bound (e.g., 100000)
      Math.pow(10, length) // Upper bound (e.g., 1000000)
    )
    .toString();
};

/**
 * Get OTP expiry time
 * @param {number} minutes - Minutes until expiry (default: 5)
 * @returns {Date} - Expiry date
 */
const getOTPExpiry = (minutes = 5) => {
  return new Date(Date.now() + minutes * 60000);
};

/**
 * Send OTP email based on type
 * @param {string} email - Recipient email
 * @param {string} otp - OTP to send
 * @param {string} type - Type of OTP email ('signup', 'forgotPassword')
 * @param {object} extraData - Additional data for email template
 * @returns {object} - Email sending result
 */
const sendOTPEmail = async (email, otp, type, extraData = {}) => {
  let emailTemplate;

  switch (type) {
    case "signup":
      emailTemplate = getSignupEmailVerification(
        email,
        otp,
        extraData.role || "user"
      );
      break;

    case "forgotPassword":
      emailTemplate = getForgotPasswordEmail(extraData.userName, email, otp);
      break;

    // Add more cases as needed
    // case 'changeEmail':
    // case 'transactionVerify':

    default:
      throw new Error(`Invalid OTP email type: ${type}`);
  }

  const result = await sendEmail(
    email,
    emailTemplate.subject,
    emailTemplate.html
  );

  return result;
};

/**
 * Main function: Generate OTP, send email, and save to user document
 * @param {object} user - User mongoose document
 * @param {string} type - Type of OTP
 * @param {object} extraData - Additional data for email
 * @returns {object} - Result with OTP data
 */
const generateSendAndSaveOTP = async (user, type, extraData = {}) => {
  try {
    // Generate OTP and expiry
    const otp = generateOTP();
    const otpExpiry = getOTPExpiry();
    const otpVerified = false;

    // Send OTP via email
    await sendOTPEmail(user.email, otp, type, extraData);

    // Save to user document
    user.otp = otp;
    user.otpExpiry = otpExpiry;
    user.otpVerified = otpVerified;

    await user.save();

    return {
      success: true,
      otp,
      otpExpiry,
      otpVerified,
      message: `OTP sent to ${user.email}`,
    };
  } catch (error) {
    console.error("OTP service error:", error);
    return {
      success: false,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
      message: "Failed to generate/send OTP",
    };
  }
};

/**
 * Verify OTP against user's stored OTP
 * @param {object} user - User mongoose document
 * @param {string} enteredOtp - OTP entered by user
 * @returns {object} - Verification result
 */
const verifyOTP = (user, enteredOtp) => {
  // Check if already verified
  if (user.otpVerified) {
    return {
      success: false,
      message: "Email already verified. Please login.",
    };
  }

  // Check if OTP matches
  if (user.otp !== enteredOtp) {
    return {
      success: false,
      message: "Invalid OTP",
    };
  }

  // Check if OTP expired
  if (user.otpExpiry < new Date()) {
    return {
      success: false,
      message: "OTP has expired. Please request a new one.",
    };
  }

  return {
    success: true,
    message: "OTP verified successfully",
  };
};

/**
 * Clear OTP fields from user document after successful verification
 * @param {object} user - User mongoose document
 * @returns {object} - Updated user
 */
const clearOTP = async (user) => {
  user.otp = null;
  user.otpExpiry = null;
  user.otpVerified = true;

  await user.save();
  return user;
};

module.exports = {
  generateOTP,
  getOTPExpiry,
  sendOTPEmail,
  generateSendAndSaveOTP,
  verifyOTP,
  clearOTP,
};
