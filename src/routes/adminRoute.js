const express = require("express");
const { createAdminUser } = require("../controllers/adminController");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const adminController = require("../controllers/adminController");
const upload = require("../utils/upload");

router.post("/register", createAdminUser);

router.get(
  "/dashboard-stats",
  authMiddleware.authenticate,
  authMiddleware.authorize("admin"),
  adminController.getDashboardStats
);

router.get(
  "/all-users",
  authMiddleware.authenticate,
  authMiddleware.authorize("admin"),
  adminController.getAllUsers
);

router.get(
  "/all-sellers",
  authMiddleware.authenticate,
  authMiddleware.authorize("admin"),
  adminController.getAllSellers
);

// Protected admin routes
router.post(
  "/create-seller",
  authMiddleware.authenticate,
  authMiddleware.authorize("admin"),
  upload.single("profileImage"), // Upload profile image
  adminController.createSellerByAdmin
);

router.put(
  "/approve-seller/:sellerId",
  authMiddleware.authenticate,
  authMiddleware.authorize("admin"),
  adminController.approveSeller
);

router.get(
  "/pending-sellers",
  authMiddleware.authenticate,
  authMiddleware.authorize("admin"),
  adminController.getPendingSellers
);

module.exports = router;
