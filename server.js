require("dotenv").config();

const db = require("./js/db");
const express = require("express");
const https = require("https");
const path = require("path");
const cors = require("cors");
const { Resend } = require("resend");
const bcrypt = require("bcryptjs");

const app = express();
const PORT = process.env.PORT || 3001;

// ENV variables
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);
// Middlewares
app.use(cors());
app.use(express.json());

/* =====================================================
   📧 EMAIL OTP LOGIC
===================================================== */

let otpStore = {}; // { email: otp,expiresAt }

// Email transporter



// Send OTP
app.post("/send-otp", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email required" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000);

  otpStore[email] = {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000,
  };

  try {
    await resend.emails.send({
      from: "MediGuide <onboarding@resend.dev>",
      to: email,
      subject: "Your MediGuide OTP",
      text: `Your OTP is ${otp}. It is valid for 5 minutes.`,
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Resend error:", error);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});


// Verify OTP
app.post("/verify-otp", (req, res) => {
  const { email, otp, fullName, phone, password } = req.body;

  const record = otpStore[email];

  if (!record) {
    return res.status(400).json({ error: "OTP expired" });
  }

  if (record.otp != otp || Date.now() > record.expiresAt) {
    return res.status(400).json({ error: "Invalid or expired OTP" });
  }

  delete otpStore[email];

  const hashedPassword = bcrypt.hashSync(password, 10);

  const sql = `
    INSERT INTO users (name, email, phone, password, is_verified)
    VALUES (?, ?, ?, ?, true)
  `;

  db.query(sql, [fullName, email, phone, hashedPassword], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ success: true });
  });
});



app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const sql = "SELECT * FROM users WHERE email = ?";

  db.query(sql, [email], (err, users) => {
    if (err) {
      return res.status(500).json({ error: "DB error" });
    }

    if (users.length === 0) {
      return res.status(400).json({ error: "User not found" });
    }

    const user = users[0];

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid password" });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
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

app.use(express.static(__dirname));

  // 🔁 helper function (closure has access to req/res variables)
  



app.listen(PORT, () => {
  console.log(`✅ MediGuide AI server running on port ${PORT}`);
});
