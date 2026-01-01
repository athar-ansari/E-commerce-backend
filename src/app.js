require("dotenv").config();
const express = require("express");
const app = express();
const connectDB = require("./config/dbConfig");

const adminRoutes = require("./routes/adminRoute");
const userRoutes = require("./routes/userRoute");  
const authRoutes = require("./routes/authRoute");  
connectDB();

// Middleware
app.use(express.json());

// Routes
 
app.use("/api/admin", adminRoutes);
app.use("/api/user", userRoutes); 
app.use("/api/auth", authRoutes);  

app.get("/", (req, res) => {
  res.send("API is running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// -------- Js resposne after hit '/create-admin' routes - when we create admin --------
// {
//   "message": "Admin user created successfully",
//   "user": {
//       "name": "Admin",
//       "email": "admin@gmail.com",
//       "password": "$2b$10$IgKfSN4TLP6enU0DFUHUVujfxg/OEaS1w8rnhpWRlY4oL/sdQ/XPO",
//       "address": "Asansol",
//       "mobile": "1234567890",
//       "userType": "69554d02d97dac9de38ec225",
//       "isActive": true,
//       "isVerified": true,
//       "isDeleted": null,
//       "_id": "695558e88ab7570c1e06a5fe",
//       "createdAt": "2025-12-31T17:10:00.125Z",
//       "updatedAt": "2025-12-31T17:10:00.125Z",
//       "__v": 0
//   }
// }
