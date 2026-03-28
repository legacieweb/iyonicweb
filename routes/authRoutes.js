const express = require("express");
const router = express.Router();
const User = require("../models/User");
const nodemailer = require('nodemailer');
const axios = require('axios');

// Store verification codes temporarily
const verificationCodes = {}; // { email: code }

router.post("/send-reset-code", async (req, res) => {
  const { email } = req.body;
  const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found" });

  verificationCodes[email] = code;

  // Send email (using nodemailer)
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your Reset Code",
    text: `Your reset code is ${code}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error(error);
      return res.status(500).json({ message: "Failed to send email" });
    }
    res.json({ message: "Code sent to your email." });
  });
});

router.post("/confirm-reset", async (req, res) => {
  const { email, code, newPassword } = req.body;

  if (verificationCodes[email] !== code) {
    return res.status(400).json({ message: "Invalid code" });
  }

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found" });

  user.password = newPassword;
  await User.save(user);

  delete verificationCodes[email]; // cleanup
  res.json({ message: "Password updated successfully" });
});

// Signup and send welcome email
router.post("/signup", async (req, res) => {
  const { name, email, phone, password } = req.body;

  try {
    // 1. Check if email already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Email already exists" });
    }

    // 2. Optional Backend Email Validation
    if (process.env.ABSTRACT_API_KEY) {
       try {
         const validationRes = await axios.get(`https://emailvalidation.abstractapi.com/v1/?api_key=${process.env.ABSTRACT_API_KEY}&email=${encodeURIComponent(email)}`);
         const validationData = validationRes.data;
         
         // Only block if we're sure it's undeliverable. 
         // If API returns 422 or other errors (handled by catch), we allow signup.
         if (validationData.deliverability === "UNDELIVERABLE") {
            return res.status(400).json({ message: "The provided email is undeliverable." });
         }
       } catch (apiErr) {
         console.warn("Abstract API email validation failed or quota exceeded:", apiErr.message);
         // Do not block signup if API fails
       }
    }

    // 3. Create user
    const newUser = await User.create({ name, email, phone, password });

    // 4. Nodemailer setup
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Welcome to Iyonicorp!",
      html: `<h3>Hi ${name},</h3><p>Thanks for signing up at Iyonicorp. We're excited to have you!</p>`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
      } else {
        console.log("Welcome email sent:", info.response);
      }
    });

    res.status(201).json({ user: newUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Signup failed" });
  }
});

router.post("/change-password", async (req, res) => {
  const { email, oldPassword, newPassword } = req.body;
  const user = await User.findOne({ email });

  if (!user) return res.status(404).json({ message: "User not found" });
  if (user.password !== oldPassword) return res.status(400).json({ message: "Incorrect current password" });

  user.password = newPassword;
  await User.save(user);
  res.json({ message: "Password updated" });
});

module.exports = router;
