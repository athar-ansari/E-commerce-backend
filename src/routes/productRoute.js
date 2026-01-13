const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");


// ==================== PUBLIC ROUTES ====================
router.get("/", productController.getAllProducts);
router.get("/:slug", productController.getProduct);




module.exports = router;
