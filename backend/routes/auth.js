const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../config/db');
require('dotenv').config();

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /api/auth/send-otp
router.post('/send-otp', async (req, res) => {
  const { phone } = req.body;

  if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
    return res.status(400).json({ error: 'Enter a valid 10-digit Indian mobile number.' });
  }

  try {
    // Create user if not exists
    await db.query(
      'INSERT IGNORE INTO users (phone) VALUES (?)',
      [phone]
    );

    // Invalidate old OTPs
    await db.query(
      'UPDATE otp_verifications SET used = TRUE WHERE phone = ? AND used = FALSE',
      [phone]
    );

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await db.query(
      'INSERT INTO otp_verifications (phone, otp, expires_at) VALUES (?, ?, ?)',
      [phone, otp, expiresAt]
    );


    console.log(`📱 OTP for ${phone}: ${otp}`);
    res.json({ message: 'OTP sent successfully.', otp_preview: otp });  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    return res.status(400).json({ error: 'Phone and OTP are required.' });
  }

  try {
    const [rows] = await db.query(
      `SELECT * FROM otp_verifications 
       WHERE phone = ? AND otp = ? AND used = FALSE AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [phone, otp]
    );

    if (rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired OTP.' });
    }

    // Mark OTP as used
    await db.query('UPDATE otp_verifications SET used = TRUE WHERE id = ?', [rows[0].id]);

    // Get user
    const [users] = await db.query('SELECT * FROM users WHERE phone = ?', [phone]);
    const user = users[0];

    const token = jwt.sign(
      { user_id: user.id, phone: user.phone },
      process.env.JWT_SECRET,
      { expiresIn: '6h' }
    );

    res.json({ message: 'Login successful.', token, user_id: user.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;