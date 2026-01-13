const Product = require("../models/productModel");
const Category = require("../models/categoryModel");

// Seller: Add Product
exports.addProduct = async (req, res) => {
  try {
    const {
      name,
      price,
      description,
      shortDescription,
      category,
      brand,
      stockQuantity,
      tags,
      discount,
      featuredType,
    } = req.body;

    //  Validate category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        message: "Invalid category",
      });
    }

    // Create images array
    const images = [];

    if (req.files && req.files.length > 0) {
      // First image = primary
      images.push({
        url: req.files[0].path,
        public_id: req.files[0].filename,
        isPrimary: true,
      });

      // Rest images = additional
      for (let i = 1; i < req.files.length; i++) {
        images.push({
          url: req.files[i].path,
          public_id: req.files[i].filename,
          isPrimary: false,
        });
      }
    } else {
      // ✅ At least one image check (frontend responsibility but good to have)
      return res.status(400).json({
        success: false,
        message: "At least one product image is required",
      });
    }

    // Parse tags if string
    const tagsArray =
      typeof tags === "string"
        ? JSON.parse(tags)
        : Array.isArray(tags)
        ? tags
        : [];

    // Create product
    const product = new Product({
      name,
      price: Number(price),
      description,
      shortDescription,
      category,
      seller: req.user._id,
      brand,
      stockQuantity: stockQuantity ? Number(stockQuantity) : 0,
      discount: discount ? Number(discount) : 0,
      tags: tagsArray,
      images,
      featuredType: featuredType || "none",
    });

    await product.save();

    // Populate before sending response
    await product.populate("category", "name");
    await product.populate("seller", "name email");

    res.status(201).json({
      success: true,
      message: "Product added successfully",
      product,
    });
  } catch (error) {
    console.error("Add product error:", error);

    // Handle duplicate slug/SKU errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Product with similar name already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to add product",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get All Products (Public)
exports.getAllProducts = async (req, res) => {
  try {
    const {
      category,
      minPrice,
      maxPrice,
      featured,
      search,
      sort = "createdAt",
      order = "desc",
      page = 1,
      limit = 10,
    } = req.query;

    const filter = {
      status: "approved",
      isActive: true,
    };

    // Apply filters
    if (category) filter.category = category;
    if (featured && featured !== "none") filter.featuredType = featured;

    // Price range filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Search (using text index)
    if (search) {
      filter.$text = { $search: search };
    }

    // Sorting options
    const sortOptions = {};
    const validSortFields = ["price", "createdAt", "name", "discount"];
    const validOrders = ["asc", "desc"];

    const sortField = validSortFields.includes(sort) ? sort : "createdAt";
    const sortOrder = validOrders.includes(order)
      ? order === "desc"
        ? -1
        : 1
      : -1;

    sortOptions[sortField] = sortOrder;

    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const products = await Product.find(filter)
      .populate("category", "name")
      .populate("seller", "name email")
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .select("-__v"); // Exclude version key

    const total = await Product.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      limit: limitNum,
      products,
    });
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get Single Product
exports.getProduct = async (req, res) => {
  try {
    const { slug } = req.params;

    const product = await Product.findOne({
      slug,
      status: "approved",
      isActive: true,
    })
      .populate("category", "name")
      .populate("seller", "name email storeName")
      .select("-__v");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Increment view count
    product.views += 1;
    await product.save();

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Get product error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Seller: Get My Products
exports.getMyProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const filter = { seller: req.user._id };

    // Filter by status if provided
    if (status && ["approved", "rejected"].includes(status)) {
      filter.status = status;
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const products = await Product.find(filter)
      .populate("category", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .select("-__v");

    const total = await Product.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      products,
    });
  } catch (error) {
    console.error("Get my products error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch your products",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

//  Update Product (Seller)
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const product = await Product.findOne({
      _id: id,
      seller: req.user._id,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or unauthorized",
      });
    }

    // Update fields
    Object.keys(updateData).forEach((key) => {
      if (key !== "seller" && key !== "status" && key !== "slug") {
        product[key] = updateData[key];
      }
    });

    await product.save();
    await product.populate("category", "name");

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update product",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

//   Delete/Deactivate Product (Seller)
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findOne({
      _id: id,
      seller: req.user._id,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or unauthorized",
      });
    }

    // Soft delete (set isActive to false)
    product.isActive = false;
    await product.save();

    res.status(200).json({
      success: true,
      message: "Product deactivated successfully",
    });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete product",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
