const express = require("express");
const cors = require("cors");
const app = express();

const adminRoutes = require("./routes/adminRoute");
const userRoutes = require("./routes/userRoute");
const sellerRoutes = require("./routes/sellerRoute");
const authRoutes = require("./routes/authRoute");
const productRoute = require("./routes/productRoute");

// ===== Global Middlewares =====
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== Routes =====
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/seller", sellerRoutes);
app.use("/api/products", productRoute);

// ===== Health Check =====
app.get("/", (req, res) => {
  res.send("API is running...");
});

module.exports = app;
// home work
// product add , admin add category ,seller add product
