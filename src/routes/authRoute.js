const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

/**  
===============================================
        Public route - Login
=============================================== 
 */

router.post("/login", authController.login);
/**  
===============================================
        Forgot Password - Send OTP 
=============================================== 
 */

router.post("/forgot-password", authController.forgotPassword);
/**  
===============================================
        Verify OTP and Reset Password 
=============================================== 
 */

router.post("/reset-password", authController.resetPassword);

module.exports = router;
