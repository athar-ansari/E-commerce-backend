const { verifyToken } = require("../utils/jwt");
const User = require("../models/userModel");

// 1. Token verify karega (for all users)
exports.authenticate = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ message: "Authentication token required" });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    // Find user with populated userType
    const user = await User.findById(decoded.userId).populate("userType");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: "Account is deactivated" });
    }

    // Additional checks based on role
    if (user.userType.role === "seller" && !user.isVerified) {
      return res.status(403).json({
        message: "Seller account not approved by admin",
      });
    }

    // Store user info in request
    req.user = {
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.userType.role,
      userType: user.userType,
    };

    req.token = token;
    next();
  } catch (error) {
    console.error("Auth error:", error.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// 2. Role check karega (for specific routes)
exports.authorize = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      // Role already stored in req.user from authenticate middleware
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          message: `Access denied. Required role: ${allowedRoles.join(", ")}`,
        });
      }

      next();
    } catch (error) {
      res.status(500).json({ message: "Authorization error" });
    }
  };
};
