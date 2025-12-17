require("dotenv").config();

const db = require("./js/db");
const express = require("express");
const https = require("https");
const path = require("path");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();
const PORT = process.env.PORT || 3001;

// ENV variables
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

/* =====================================================
   📧 EMAIL OTP LOGIC
===================================================== */

let otpStore = {}; // { email: otp,expiresAt }

// Email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS, // Gmail App Password
  },
});

// Send OTP
app.post("/send-otp", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email required" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000);

  otpStore[email] = {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
  };

  try {
    await transporter.sendMail({
      from: `"MediGuide AI" <${EMAIL_USER}>`,
      to: email,
      subject: "Your MediGuide OTP",
      text: `Your OTP is ${otp}. It is valid for 5 minutes.`,
    });

    res.json({ success: true, message: "OTP sent to email" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

// Verify OTP
app.post("/verify-otp", (req, res) => {
  const { email, otp, fullName, phone } = req.body;

  const record = otpStore[email];

  if (!record) {
    return res.status(400).json({ error: "OTP expired" });
  }

  if (record.otp != otp || Date.now() > record.expiresAt) {
    return res.status(400).json({ error: "Invalid or expired OTP" });
  }

  delete otpStore[email];

  const sql = `
    INSERT INTO users (name, email, phone, is_verified)
    VALUES (?, ?, ?, true)
    ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      phone = VALUES(phone),
      is_verified = true
  `;

  db.query(sql, [fullName, email, phone], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ success: true });
  });
});


/* =====================================================
   🧠 HEALTH PLAN API (OpenRouter)
===================================================== */

app.post("/api/reminders", (req, res) => {
  const { email, title, message, time } = req.body;

  if (!email || !title || !time) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const findUser = "SELECT id FROM users WHERE email = ?";

  db.query(findUser, [email], (err, users) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "DB error" });
    }

    if (users.length === 0) {
      return res.status(400).json({ error: "User not found" });
    }

    const userId = users[0].id;

    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const remindDateTime = `${today} ${time}:00`;          // DATETIME

    const insertReminder = `
      INSERT INTO reminders (user_id, title, message, remind_time)
      VALUES (?, ?, ?, ?)
    `;

    db.query(
      insertReminder,
      [userId, title, message, remindDateTime],
      (err) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "DB error" });
        }

        res.json({ success: true });
      }
    );
  });
});



  // 🔁 helper function (closure has access to req/res variables)
  



app.listen(PORT, () => {
  console.log(`✅ MediGuide AI server running on port ${PORT}`);
});
