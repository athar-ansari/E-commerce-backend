const UserType = require("../models/UserTypeModel");
const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const cloudinary = require("../utils/cloudinary");
const {
  sendEmail,
  getSellerApprovalEmail,
  getSellerCreationEmail,
} = require("../services/emailService");

exports.createAdminUser = async (req, res) => {
  try {
    // Check if environment variables are set
    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
      console.log("Admin credentials not configured in environment");
      return res.status(500).json({
        message:
          "Admin credentials not configured. Please set ADMIN_EMAIL and ADMIN_PASSWORD in .env file",
      });
    }

    const adminType = await UserType.findOne({ role: "admin" });
    if (!adminType) {
      console.log("Admin user type not found");

      return res.status(400).json({ message: "Admin user type not found" });
    }

    //  environment variables
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminName = process.env.ADMIN_NAME;
    const adminMobile = process.env.ADMIN_MOBILE;
    const adminStreet = process.env.ADMIN_STREET;
    const adminCity = process.env.ADMIN_CITY;
    const adminState = process.env.ADMIN_STATE;
    const adminPincode = process.env.ADMIN_PINCODE;
    const adminCountry = process.env.ADMIN_COUNTRY;

    const isAdminExists = await User.findOne({ email: adminEmail });
    if (isAdminExists) {
      console.log("Admin  already exists");
      return res.status(400).json({ message: "Admin  already exists" });
    }
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Create Admin

    const newAdmin = new User({
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      address: [
        {
          street: adminStreet,
          city: adminCity,
          state: adminState,
          pincode: adminPincode,
          country: adminCountry,
        },
      ],
      mobile: adminMobile,
      userType: adminType._id,
      isVerified: true,
      isActive: true,
    });
    await newAdmin.save();

    console.log("Admin user created successfully");
    res.status(201).json({
      message: "Admin user created successfully",
      admin: {
        name: newAdmin.name,
        email: newAdmin.email,
      },
    });
  } catch (error) {
    console.log(`Error creating Admin: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

// Admin creates seller directly (no approval needed)
exports.createSellerByAdmin = async (req, res) => {
  try {
    const { name, email, password, address, mobile } = req.body;

    const sellerType = await UserType.findOne({ role: "seller" });

    let isExistUser = await User.findOne({ email: email });
    if (isExistUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // If file uploaded, get Cloudinary URL
    let profileImage = null;
    if (req.file) {
      profileImage = {
        url: req.file.path, // Cloudinary URL
        public_id: req.file.filename, // Cloudinary public_id
      };
    }
    const newSeller = new User({
      name,
      email,
      password: hashedPassword,
      address: address || [],
      mobile,
      userType: sellerType._id,
      sellerStatus: "approved",
      isVerified: true, // Directly verified
      isActive: true, // Directly active
      profileImage, // Use the object from file upload
    });

    await newSeller.save();

    //  SEND CREATION EMAIL WITH PASSWORD
    const emailTemplate = getSellerCreationEmail(name, email, password);
    const emailResult = await sendEmail(
      email,
      emailTemplate.subject,
      emailTemplate.html
    );

    res.status(201).json({
      message:
        "Seller created successfully" +
        (emailResult.success ? " and credentials emailed" : ""),
      seller: {
        id: newSeller._id,
        name: newSeller.name,
        email: newSeller.email,
        sellerStatus: newSeller.sellerStatus,
        isVerified: newSeller.isVerified,
        isActive: newSeller.isActive,
        profileImage: newSeller.profileImage?.url || null,
      },
    });
  } catch (error) {
    if (req.file && req.file.filename) {
      try {
        await cloudinary.uploader.destroy(req.file.filename);
      } catch (cleanupError) {
        console.error("Cleanup error:", cleanupError);
      }
    }
    console.log(`Error creating seller: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

// Admin approves pending sellers
exports.approveSeller = async (req, res) => {
  try {
    const { sellerId } = req.params;

    // Verify the user is actually a seller
    const sellerType = await UserType.findOne({ role: "seller" });
    const seller = await User.findOne({
      _id: sellerId,
      userType: sellerType._id, //   Check both ID and userType
    });

    if (!seller) {
      return res
        .status(404)
        .json({ success: false, message: "Seller not found" });
    }

    if (seller.isVerified && seller.isActive) {
      return res.status(400).json({
        success: false,
        message: "Seller is already approved",
      });
    }

    // Update seller status
    seller.isVerified = true;
    seller.isActive = true;
    seller.sellerStatus = "approved";

    await seller.save();

    //  SEND APPROVAL EMAIL
    const emailTemplate = getSellerApprovalEmail(seller.name, seller.email);
    const emailResult = await sendEmail(
      seller.email,
      emailTemplate.subject,
      emailTemplate.html
    );

    res.status(200).json({
      message:
        "Seller approved successfully" +
        (emailResult.success ? " and email sent" : ""),
      seller: {
        id: seller._id,
        name: seller.name,
        email: seller.email,
        isVerified: seller.isVerified,
        isActive: seller.isActive,
        sellerStatus: seller.sellerStatus,
        profileImage: seller.profileImage?.url || null,
      },
    });
  } catch (error) {
    console.log(`Error approving seller: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

// Get all pending sellers for admin
exports.getPendingSellers = async (req, res) => {
  try {
    const sellerType = await UserType.findOne({ role: "seller" });

    const pendingSellers = await User.find({
      userType: sellerType._id,
      sellerStatus: "pending",
      isVerified: false,
      isActive: false,
      isDeleted: null,
    })
      .populate({
        path: "userType",
        select: "role",
      }) // explicit field selection
      .select("name email mobile  createdAt") // Instead of excluding fields, explicitly include what you need (safer)
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      message: "Pending sellers fetched successfully",
      count: pendingSellers.length,
      data: pendingSellers,
    });
  } catch (error) {
    console.log(`Error fetching pending sellers: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Error fetching pending sellers",
      error: error.message,
    });
  }
};

// -----------

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    const sellerType = await UserType.findOne({ role: "seller" });
    const userType = await UserType.findOne({ role: "user" });
    const adminType = await UserType.findOne({ role: "admin" });

    // Count total users (regular users only, not sellers/admins)
    const totalUsers = await User.countDocuments({
      userType: userType?._id,
      isDeleted: null,
    });

    // Count total sellers
    const totalSellers = await User.countDocuments({
      userType: sellerType?._id,
      isDeleted: null,
    });

    // Count active sellers
    const activeSellers = await User.countDocuments({
      userType: sellerType?._id,
      sellerStatus: "approved",
      isActive: true,
      isDeleted: null,
    });

    // Count pending sellers
    const pendingSellers = await User.countDocuments({
      userType: sellerType?._id,
      sellerStatus: "pending",
      isDeleted: null,
    });

    res.status(200).json({
      success: true,
      data: {
        totalUsers: totalUsers || 0,
        totalSellers: totalSellers || 0,
        activeSellers: activeSellers || 0,
        pendingSellers: pendingSellers || 0,
      },
    });
  } catch (error) {
    console.log(`Error fetching dashboard stats: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Error fetching dashboard stats",
      error: error.message,
    });
  }
};

// Get all users (excluding admins)
exports.getAllUsers = async (req, res) => {
  try {
    const userType = await UserType.findOne({ role: "user" });
    const adminType = await UserType.findOne({ role: "admin" });

    const users = await User.find({
      userType: userType?._id,
      isDeleted: null,
    })
      .select("name email mobile createdAt isActive")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: users.length,
      users: users,
    });
  } catch (error) {
    console.log(`Error fetching users: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Error fetching users",
      error: error.message,
    });
  }
};

// Get all sellers
exports.getAllSellers = async (req, res) => {
  try {
    const sellerType = await UserType.findOne({ role: "seller" });

    const sellers = await User.find({
      userType: sellerType?._id,
      isDeleted: null,
    })
      .select("name email mobile sellerStatus isActive isVerified createdAt")
      .populate("userType", "role")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: sellers.length,
      sellers: sellers,
    });
  } catch (error) {
    console.log(`Error fetching sellers: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Error fetching sellers",
      error: error.message,
    });
  }
};
