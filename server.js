require("dotenv").config();
const db = require("./db");
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

app.post("/api/health-plan", (req, res) => {
  const { disease, location } = req.body;

  if (!disease) {
    return res.status(400).json({ error: "Disease name is required" });
  }

  if (!OPENROUTER_API_KEY) {
    return res.status(500).json({ error: "OpenRouter API key not configured" });
  }

  generateHealthPlan(disease, location)
    .then(data => res.json({ success: true, data }))
    .catch(err => res.status(500).json({ error: err.message }));
});

// OpenRouter request
function generateHealthPlan(disease, userLocation) {
  return new Promise((resolve, reject) => {
    const prompt = `The user has the disease: ${disease}.
${userLocation ? `User location: ${userLocation}.` : ""}

Generate a complete personalized health plan including:
1. Foods to eat and avoid
2. Recommended exercises (3–5)
3. Common medicine (name, dosage per day, duration)
4. Type of doctor and specialization

Return valid JSON only with this structure:
{
  "diet": { "take": [], "avoid": [] },
  "exercise": [{ "name": "", "sets": 0, "reps": "" }],
  "medicine": [{ "name": "", "dosage": "", "duration": "" }],
  "doctor": {
    "specialization": "",
    "location": "${userLocation || "General location"}"
  }
}`;

    const data = JSON.stringify({
      model: "openai/gpt-oss-20b:free",
      messages: [
        {
          role: "system",
          content: "You are a medical AI assistant. Always respond with valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const options = {
      hostname: "openrouter.ai",
      path: "/api/v1/chat/completions",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Length": data.length
      }
    };

    const req = https.request(options, res => {
      let body = "";
      res.on("data", chunk => (body += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(body);
          resolve(JSON.parse(json.choices[0].message.content));
        } catch {
          reject(new Error("Failed to parse OpenRouter response"));
        }
      });
    });

    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

/* =====================================================
   🌐 ROOT
===================================================== */

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

/* =====================================================
   🚀 START SERVER
===================================================== */

app.post("/api/reminders", (req, res) => {
  const { email, title, message, time } = req.body;

  const findUser = "SELECT id FROM users WHERE email = ?";
  db.query(findUser, [email], (err, users) => {
    if (err || users.length === 0) {
      return res.status(400).json({ error: "User not found" });
    }

    const userId = users[0].id;

    const insertReminder = `
      INSERT INTO reminders (user_id, title, message, remind_time)
      VALUES (?, ?, ?, ?)
    `;

    db.query(insertReminder, [userId, title, message, time], (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "DB error" });
      }
      res.json({ success: true });
    });
  });
});


app.listen(PORT, () => {
  console.log(`✅ MediGuide AI server running on port ${PORT}`);
});
