const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const upload = require("../utils/upload");
// SINGLE SIGNUP ROUTE FOR BOTH USER & SELLER
router.post("/signup", upload.single("profileImage"), userController.signup);

module.exports = router;
