const mysql = require("mysql2");

if (
  !process.env.DB_HOST ||
  !process.env.DB_USER ||
  !process.env.DB_NAME ||
  !process.env.DB_PORT
) {
  console.error("❌ Database environment variables missing");
  module.exports = null;
} else {
  const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS || "",
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT), // 🔥 CRITICAL FOR RAILWAY
  });

  db.connect((err) => {
    if (err) {
      console.error("❌ MySQL connection failed:", err.message);
    } else {
      console.log("✅ MySQL connected successfully");
    }
  });

  module.exports = db;
}
