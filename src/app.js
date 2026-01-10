require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const connectDB = require("./config/dbConfig");

const adminRoutes = require("./routes/adminRoute");
const userRoutes = require("./routes/userRoute");
const authRoutes = require("./routes/authRoute");
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes

app.use("/api/admin", adminRoutes);
app.use("/api/user", userRoutes);
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("API is running...");
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// home work
// product add , admin add category ,seller add product
