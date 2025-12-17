// server.js
require('dotenv').config();

const db = require('./js/db');
const express = require('express');
const path = require('path');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3001;

// Environment variables
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // serve frontend files

// In-memory OTP store (use Redis in production)
const otpStore = {};

// Email transporter (Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS, // Use App Password
  },
});

// Email validation helper
const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// ─── OTP Routes ─────────────────────────────────────

app.post('/send-otp', async (req, res) => {
  const { email } = req.body;

  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit
  otpStore[email] = {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
  };

  try {
    await transporter.sendMail({
      from: `"MediGuide AI" <${EMAIL_USER}>`,
      to: email,
      subject: 'Your MediGuide AI OTP',
      text: `Your 6-digit OTP is: ${otp}\nValid for 5 minutes.`,
    });

    res.json({ success: true, message: 'OTP sent' });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ error: 'Failed to send OTP. Please try again.' });
  }
});

app.post('/verify-otp', (req, res) => {
  const { email, otp, fullName, phone } = req.body;

  if (!email || !otp || !fullName || !phone) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const record = otpStore[email];

  if (!record || Date.now() > record.expiresAt) {
    return res.status(400).json({ error: 'OTP expired' });
  }

  if (record.otp !== Number(otp)) {
    return res.status(400).json({ error: 'Invalid OTP' });
  }

  // Clean up OTP
  delete otpStore[email];

  // Save or update user
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
      console.error('DB error:', err);
      return res.status(500).json({ error: 'Account setup failed' });
    }
    res.json({ success: true });
  });
});

// ─── Health Plan / Reminders ───────────────────────

app.post('/api/reminders', (req, res) => {
  const { email, title, message, time } = req.body;

  if (!email || !title || !time) {
    return res.status(400).json({ error: 'Email, title, and time are required' });
  }

  const findUser = 'SELECT id FROM users WHERE email = ? AND is_verified = true';
  db.query(findUser, [email], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Verified user not found' });
    }

    const userId = results[0].id;
    const today = new Date().toISOString().split('T')[0];
    const remindDateTime = `${today} ${time}:00`;

    const insertReminder = `
      INSERT INTO reminders (user_id, title, message, remind_time)
      VALUES (?, ?, ?, ?)
    `;

    db.query(insertReminder, [userId, title, message, remindDateTime], (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to save reminder' });
      }
      res.json({ success: true });
    });
  });
});

// ─── Serve App ─────────────────────────────────────

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ MediGuide AI server running on port ${PORT}`);
});