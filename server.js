const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const CustomDomain = require("./models/CustomDomain"); // Adjust the path as needed
const nodemailer = require("nodemailer");

// Load environment variables from .env
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Models
const User = require("./models/User");
const Subscription = require("./models/Subscription");
const authRoutes = require("./routes/authRoutes"); // This path must be correct

const requestManagedDomainRoute = require("./routes/requestManagedDomain");
app.use("/api/request-managed-domain", requestManagedDomainRoute);


app.use("/api/auth", authRoutes); // must be a valid router


app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    res.json({ user });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});


// Password reset
app.post("/api/auth/reset", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Email not found." });

    const newPass = Math.random().toString(36).substring(2, 8);
    user.password = newPass;
    await user.save();

    console.log(`New password for ${email}: ${newPass}`);
    res.json({ message: "Password has been reset. Check the server console." });
  } catch (error) {
    console.error("Reset error:", error);
    res.status(500).json({ message: "Server error during reset" });
  }
});

// Subscribe to a site
app.post("/api/subscribe", async (req, res) => {
  try {
    const { email, siteName, price } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "User not found" });

    const subscription = await Subscription.create({
      userId: user._id,
      siteName,
      price,
    });

    res.json({ subscription });
  } catch (error) {
    console.error("Subscribe error:", error);
    res.status(500).json({ message: "Server error during subscription" });
  }
});

// Get user subscriptions
app.get("/api/user-subscriptions", async (req, res) => {
  try {
    const { email } = req.query;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const subs = await Subscription.find({ userId: user._id });
    res.json(subs);
  } catch (error) {
    console.error("Fetch subscriptions error:", error);
    res.status(500).json({ message: "Server error getting subscriptions" });
  }
});
app.post("/api/site-settings", async (req, res) => {
  const { id, customName, domain } = req.body;

  try {
    const subscription = await Subscription.findById(id);
    if (!subscription) return res.status(404).json({ message: "Subscription not found" });

    subscription.customName = customName;
    subscription.domain = domain;

    await subscription.save();

    res.json({ message: "Site updated successfully" });
  } catch (error) {
    console.error("Site update error:", error);
    res.status(500).json({ message: "Server error updating site" });
  }
});
app.post("/api/claim-subdomain", async (req, res) => {
  const { email, subdomain, siteId } = req.body;

  if (!email || !subdomain || !siteId) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found" });

  const domain = `${subdomain.toLowerCase()}.iyonicorp.com`;

  // Check if domain is already taken
  const isTaken = await Subscription.findOne({ domain });
  if (isTaken) return res.status(409).json({ message: "Domain already taken" });

  // Enforce 5 free subdomain limit
  const userClaims = await Subscription.countDocuments({
    userId: user._id,
    domain: { $regex: /\.iyonicorp\.com$/i }
  });

  if (userClaims >= 5) {
    return res.status(403).json({
      message: "You have reached your free subdomain limit (5/5)."
    });
  }

  // Ensure the subscription is valid and belongs to user
  const userSub = await Subscription.findOne({ _id: siteId, userId: user._id });
  if (!userSub) return res.status(404).json({ message: "Subscription not found for this site" });

  // Assign subdomain
  userSub.domain = domain;
  await userSub.save();

  res.json({ message: `You claimed ${domain} successfully! (${userClaims + 1}/5 used)` });
});

app.get("/api/user-subdomain-count", async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ message: "Email required" });

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found" });

  const count = await Subscription.countDocuments({
    userId: user._id,
    domain: { $regex: /\.iyonicorp\.com$/i }
  });

  res.json({ count });
});



app.post("/api/record-payment", async (req, res) => {
  const { subscriptionId, amount } = req.body;

  try {
    const sub = await Subscription.findById(subscriptionId);
    if (!sub) return res.status(404).json({ message: "Subscription not found" });

    const planDurations = {
      daily: 1,
      weekly: 7,
      monthly: 30
    };

    const plan = sub.planType || 'monthly';
    const planDays = planDurations[plan];
    const monthlyPrice = sub.price;
    const newTotal = (sub.totalPaid || 0) + parseFloat(amount);

    // Handle overpayment with credit
    if (newTotal > monthlyPrice) {
      const extra = newTotal - monthlyPrice;
      sub.totalPaid = monthlyPrice;
      sub.credit = (sub.credit || 0) + extra;
    } else {
      sub.totalPaid = newTotal;
    }

    // Set expiry date
    sub.lastPaymentDate = new Date();
    sub.expiresAt = new Date(Date.now() + planDays * 24 * 60 * 60 * 1000);

    await sub.save();
    res.json({ message: "Payment recorded and expiry date set." });

  } catch (err) {
    console.error("Payment recording failed:", err);
    res.status(500).json({ message: "Server error" });
  }
});


app.post("/api/update-plan", async (req, res) => {
  const { subscriptionId, planType } = req.body;
  try {
    const sub = await Subscription.findById(subscriptionId);
    if (!sub) return res.status(404).json({ message: "Subscription not found" });

    sub.planType = planType;
    await sub.save();
    res.json({ message: "Plan updated successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
});
const adminRoutes = require("./routes/adminRoutes");
app.use("/api/admin", adminRoutes);

app.post("/api/claim-subdomain", async (req, res) => {
  const { email, subdomain, siteId } = req.body;

  if (!email || !subdomain || !siteId) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  // Mock check if domain is taken
  const domainTaken = false; // Change this as needed

  if (domainTaken) {
    return res.status(409).json({ message: "Domain already taken" });
  }

  // TODO: Save to your DB
  const domain = `${subdomain.toLowerCase()}.iyonicorp.com`;

  console.log(`User ${email} claimed domain ${domain} for site ${siteId}`);

  return res.json({ message: `You claimed ${domain} successfully!` });
});


// /api/custom-domain-request
app.post("/api/custom-domain-request", async (req, res) => {
  const { email, domains, setup, siteId } = req.body;

  if (!email || !domains || !Array.isArray(domains) || !siteId) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const inserts = domains.map(domain => ({
      userId: user._id,
      siteId,
      domain,
      setup,
      createdAt: new Date()
    }));

    await CustomDomain.insertMany(inserts);
    return res.json({ message: "Custom domains saved!" });
  } catch (err) {
    console.error("Error saving custom domains:", err.message);
    return res.status(500).json({ message: "Server error saving domains" });
  }
});


// GET endpoint to fetch user's custom domains
app.get("/api/custom-domains", async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const domains = await CustomDomain.find({ userId: user._id });
    return res.json(domains);
  } catch (err) {
    console.error("Failed to fetch custom domains:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/assign-domain", async (req, res) => {
  const { domainId, siteId } = req.body;
  if (!domainId || !siteId) return res.status(400).json({ message: "Missing fields" });

  const domain = await CustomDomain.findById(domainId);
  if (!domain) return res.status(404).json({ message: "Domain not found" });

  domain.siteId = siteId;
  await domain.save();

  res.json({ message: "Domain assigned to site." });
});

// Add to your user route file
app.get("/api/user-status", async (req, res) => {
  const email = req.query.email;
  const user = await User.findOne({ email });

  if (!user) return res.status(404).json({ banned: false });
  return res.json({ banned: !!user.banned });
});

app.post("/api/admin/ban-user", async (req, res) => {
  try {
    const { email, banned } = req.body;

    if (!email || typeof banned !== "boolean") {
      return res.status(400).json({ message: "Missing or invalid fields." });
    }

    const user = await User.findOneAndUpdate({ email }, { $set: { banned } });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Send email only on ban
    if (banned) {
      await sendBanEmail(email);
    }

    res.json({ message: `User ${banned ? "banned" : "unbanned"} successfully.` });
  } catch (err) {
    console.error("Ban error:", err);
    res.status(500).json({ message: "Internal server error." });
  }
});
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "iyonicorp@gmail.com",  // Your email
    pass: "dikfirjarvijwskx"          // Use an App Password, NOT regular Gmail password
  }
});

async function sendBanEmail(email) {
  await transporter.sendMail({
    from: `"Iyonicorp Admin" <iyonicorp@gmail.com>`,
    to: email,
    subject: "Your Iyonicorp Account Has Been Banned",
    html: `
      <h2 style="color: red;">Your Iyonicorp Access Has Been Revoked</h2>
      <p>Hello,</p>
      <p>We regret to inform you that your Iyonicorp account has been <strong>banned</strong>.</p>
      <p>If you believe this was in error or wish to appeal, please reach out to our support team:</p>
      <p><a href="mailto:iyonicorp@gmail.com">iyonicorp@gmail.com</a></p>
      <br />
      <p>Regards,</p>
      <p><strong>Iyonicorp Admin Team</strong></p>
    `
  });
}

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
