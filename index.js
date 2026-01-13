require("dotenv").config();
const app = require("./src/app");
const connectDB = require("./src/config/dbConfig");

// ===== Database Connection =====
connectDB();

// ===== Start Server =====
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
