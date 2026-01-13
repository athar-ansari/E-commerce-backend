const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { uploadProfile } = require("../utils/upload");

/**  
===============================================
 SINGLE SIGNUP ROUTE FOR BOTH USER & SELLER
=============================================== 
*/

router.post(
  "/signup",
  uploadProfile.single("profileImage"),
  userController.signup
);

/**  
===============================================
 Verify OTP route
=============================================== 
*/

router.post("/verify-otp", userController.verifyOtp);
/**  
===============================================
  Resend OTP route
=============================================== 
*/

router.post("/resend-otp", userController.resendOtp);

module.exports = router;
