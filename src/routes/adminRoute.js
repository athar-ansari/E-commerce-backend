const express = require("express");
const { createAdminUser } = require("../controllers/adminController");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const adminController = require("../controllers/adminController");
const { authAdmin } = require("../middlewares/auth");
const {uploadProfile}= require("../utils/upload");
/**  
===============================================
            ADMIN REGISTER/CREATE, ROUTE  
=============================================== 
*/
router.post("/register", createAdminUser);

// router.get(
//   "/dashboard-stats",
//  authAdmin,
//   adminController.getDashboardStats
// );

// router.get(
//   "/all-users",
//  authAdmin,
//   adminController.getAllUsers
// );

// router.get(
//   "/all-sellers",
//  authAdmin,
//   adminController.getAllSellers
// );

// Protected admin routes
// router.post(
//   "/create-seller",
//  authAdmin,
//   upload.single("profileImage"),
//   adminController.createSellerByAdmin
// );

/**  
===============================================
          ADMIN APPROVE SELLER, ROUTE
=============================================== 
*/

router.put(
  "/approve-seller/:sellerId",
  authMiddleware.authenticate,
  authAdmin,

  adminController.approveSeller
);

/**  
===============================================
          ADMIN GET PENDING SELLERS, ROUTE
=============================================== 
*/

router.get("/pending-sellers", authAdmin, adminController.getPendingSellers);

/**  
===============================================
          ADMIN CREATE SELLER, ROUTE
=============================================== 
*/

router.post(
  "/create-seller",
  authAdmin,
  uploadProfile.single("profileImage"),
  adminController.createSellerByAdmin
);

/**  
===============================================
          ADMIN ADD CATEGORY, ROUTE
=============================================== 
*/

router.post("/add-category", authAdmin, adminController.addCategory);



// ==================== ADMIN ROUTES (Can add later) ====================
// router.get("/admin/all", authAdmin, productController.adminGetAllProducts);
// router.put("/admin/update-status/:id", authAdmin, productController.updateProductStatus);
// router.delete("/admin/delete/:id", authAdmin, productController.adminDeleteProduct);


module.exports = router;
