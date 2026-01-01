const UserType = require("../models/UserTypeModel");
const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const cloudinary = require("../utils/cloudinary");

exports.signup = async (req, res) => {
  try {
    const { name, email, password, address, mobile, role = "user" } = req.body;

    // Validate role
    const validRoles = ["user", "seller"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        message: `Invalid role '${role}'. Valid roles: ${validRoles.join(
          ", "
        )}`,
      });
    }

    // Validate required fields
    if (!name || !email || !password || !mobile) {
      return res.status(400).json({
        message: "Name, email, password and mobile are required",
      });
    }

    // Find userType
    const userType = await UserType.findOne({ role });
    if (!userType) {
      return res.status(500).json({
        message: "System error: User role not configured",
      });
    }

    // Check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message:
          "Email already registered. Please login or use different email.",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    let profileImage = null;
    if (req.file) {
      profileImage = {
        url: req.file.path, // Cloudinary URL
        public_id: req.file.filename, // Cloudinary public_id
      };
    }

    // Create user
    const userData = {
      name,
      email,
      password: hashedPassword,
      address: Array.isArray(address) ? address : address ? [address] : [],
      mobile,
      userType: userType._id,
      profileImage, // Store object with url and public_id
    };

    // Set verification flags based on role
    if (role === "user") {
      userData.isVerified = true;
      userData.isActive = true;
    } else if (role === "seller") {
      userData.isVerified = false;
      userData.isActive = false;
      userData.sellerStatus = "pending"; // Optional: track seller status
    }

    const newUser = new User(userData);
    await newUser.save();

    // Prepare response
    const userResponse = newUser.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message:
        role === "seller"
          ? "Seller account created. Please wait for admin approval."
          : "Account created successfully!",
      user: userResponse,
      requiresApproval: role === "seller",
    });
  } catch (error) {
    console.error("Signup error:", error);

    //  Cleanup: If user creation failed but image was uploaded
    if (req.file && req.file.filename) {
      try {
        await cloudinary.uploader.destroy(req.file.filename);
      } catch (cleanupError) {
        console.error("Cleanup error:", cleanupError);
      }
    }

    res.status(500).json({
      success: false,
      message: "Server error during signup",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
