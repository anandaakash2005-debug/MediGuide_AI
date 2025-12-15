const mysql = require("mysql2");

const isProduction = process.env.NODE_ENV === "production";

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306, // ✅ REQUIRED
  ssl: isProduction ? { rejectUnauthorized: true } : undefined
});

db.connect(err => {
  if (err) {
    console.error("❌ MySQL connection failed:", err);
  } else {
    console.log("✅ MySQL connected");
  }
});

module.exports = db;
