const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: [200, "Product name cannot exceed 200 characters"],
    },

    slug: {
      type: String,
      // unique: true,
      lowercase: true,
    },

    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Price cannot be negative"],
    },

    discount: {
      type: Number,
      default: 0,
      min: [0, "Discount cannot be negative"],
      max: [100, "Discount cannot exceed 100%"],
    },

    description: {
      type: String,
      required: [true, "Product description is required"],
      trim: true,
    },

    shortDescription: {
      type: String,
      trim: true,
      maxlength: [500, "Short description cannot exceed 500 characters"],
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },

    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Seller is required"],
    },

    brand: {
      type: String,
      trim: true,
    },

    sku: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true,
    },

    stockQuantity: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Stock quantity cannot be negative"],
    },

    images: [
      {
        url: {
          type: String,
          required: true,
        },
        public_id: {
          type: String,
          required: true,
        },
        isPrimary: {
          type: Boolean,
          default: false,
        },
      },
    ],

    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],

    featuredType: {
      type: String,
      enum: ["none", "best_seller", "new_arrival", "trending"],
      default: "none",
    },

    status: {
      type: String,
      enum: ["approved", "rejected"],
      default: "approved",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    ratings: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/** VIRTUAL FIELDS (Calculated, not stored in database) */

// Original price before discount
productSchema.virtual("originalPrice").get(function () {
  if (this.discount > 0 && this.discount <= 100) {
    // Calculate original price from discounted price
    // Formula: originalPrice = price / (1 - discount/100)
    return Math.round(this.price / (1 - this.discount / 100));
  }
  return this.price; // No discount, price is original
});
// Amount saved by customer
productSchema.virtual("youSave").get(function () {
  // Difference between original and discounted price
  return Math.round(this.originalPrice - this.price);
});

// Discount amount in currency
productSchema.virtual("discountAmount").get(function () {
  // Discount value in actual currency
  return Math.round((this.originalPrice * this.discount) / 100);
});

// Stock availability status
productSchema.virtual("stockStatus").get(function () {
  if (this.stockQuantity <= 0) {
    return "out_of_stock";
  } else if (this.stockQuantity <= 10) {
    return "low_stock";
  } else {
    return "in_stock";
  }
});

// PRE-SAVE MIDDLEWARE (Runs before saving to database)
productSchema.pre("save", function (next) {
  // Generate slug from product name if not provided
  if (this.name && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^\w\s]/gi, "") // Remove special characters
      .replace(/\s+/g, "-"); // Replace spaces with hyphens
  }

  // Generate SKU if not provided
  if (!this.sku) {
    const randomNum = Math.floor(1000 + Math.random() * 9000); // 4-digit random
    const brandPrefix = this.brand
      ? this.brand.substring(0, 3).toUpperCase() // First 3 letters of brand
      : "PRD"; // Default prefix
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
    this.sku = `${brandPrefix}-${timestamp}-${randomNum}`;
  }

  // Ensure at least one image is marked as primary
  if (this.images.length > 0 && !this.images.some((img) => img.isPrimary)) {
    this.images[0].isPrimary = true;
  }

  next();
});

//  DATABASE INDEXES (For faster queries)
productSchema.index({ name: "text", description: "text", tags: "text" }); // Text search
productSchema.index({ category: 1, isActive: 1, status: 1 }); // Category filtering
productSchema.index({ seller: 1, isActive: 1 }); // Seller dashboard queries
productSchema.index({ price: 1 }); // Price range filtering
productSchema.index({ featuredType: 1 }); // Featured products queries
productSchema.index({ slug: 1 }); // Quick slug lookup
productSchema.index({ status: 1, isActive: 1 }); // Admin product management

const Product = mongoose.model("Product", productSchema);
module.exports = Product;

/**  

PRODUCT MODEL OVERVIEW:
=======================
1. BASIC INFO: name, slug, description
2. PRICING: price, discount (with virtual fields for calculations)
3. INVENTORY: stockQuantity, SKU
4. MEDIA: images array with primary flag
5. CATEGORIZATION: category, tags, featuredType
6. RELATIONSHIPS: seller (User), category (Category)
7. STATUS: approval status, active flag
8. RATINGS: average rating and count
9. METADATA: timestamps (createdAt, updatedAt)

VIRTUAL FIELDS (Auto-calculated):
- originalPrice: Price before discount
- youSave: Amount customer saves
- discountAmount: Discount in currency
- stockStatus: "in_stock"/"low_stock"/"out_of_stock"

USE CASES:
- Customers: Browse, search, filter products
- Sellers: Add, manage their products
- Admin: Approve/reject products, manage categories
- Frontend: Display products with proper pricing info

PRODUCT MODEL FEATURES:
- Data validation and constraints
- Pre-save middleware for slug and SKU generation
- Indexes for optimized queries 

*/
