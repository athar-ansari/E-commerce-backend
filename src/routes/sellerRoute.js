const express = require("express");
const { authSeller } = require("../middlewares/auth");
const { uploadProduct } = require("../utils/upload");
const {
  addProduct,
  getMyProducts,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

const router = express.Router();

/**  
===============================================
          SELLER PRODUCT, ROUTE
=============================================== 
*/

router.post(
  "/add",
  authSeller,
  uploadProduct.array("images", 5), // Max 5 images
  addProduct
);

router.get("/my-products", authSeller, getMyProducts);
router.put("/update/:id", authSeller, updateProduct);
router.delete("/delete/:id", authSeller, deleteProduct);
module.exports = router;
