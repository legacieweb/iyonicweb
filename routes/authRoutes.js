const express = require("express");
const router = express.Router();
const User = require("../models/User"); // Adjust path if needed
const nodemailer = require('nodemailer');

// Store verification codes temporarily
const verificationCodes = {}; // { email: code }

router.post("/send-reset-code", async (req, res) => {
  const { email } = req.body;
  const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found" });

  verificationCodes[email] = code;

  // Send email (using nodemailer)
  const transporter = require("nodemailer").createTransport({
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
  await user.save();

  delete verificationCodes[email]; // cleanup
  res.json({ message: "Password updated successfully" });
});

// Signup and send welcome email
router.post("/signup", async (req, res) => {
  const { name, email, phone, password } = req.body;

  try {
    // Check if email already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Email already exists" });
    }

    // Create user
    const newUser = await User.create({ name, email, phone, password });

    // Nodemailer setup
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
  await user.save();
  res.json({ message: "Password updated" });
});

module.exports = router;
