const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Subscription = require("../models/Subscription");
const Pipeline = require("../models/Pipeline");

// Admin auth (simple static check – replace with token system for real-world use)
router.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
    return res.json({ message: "Authenticated", isAdmin: true });
  }
  return res.status(401).json({ message: "Unauthorized" });
});

// 1. Platform stats
router.get("/stats", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeSites = await Subscription.countDocuments({ expiresAt: { $gte: new Date() } });
    const totalRevenue = await Subscription.aggregate([
      { $group: { _id: null, total: { $sum: "$totalPaid" } } }
    ]);

    res.json({
      totalUsers,
      activeSites,
      totalRevenue: totalRevenue[0]?.total || 0
    });
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// 2. All users
router.get("/users", async (req, res) => {
  try {
    const users = await User.find({}, "-password"); // omit password
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

// 3. All sites (subscriptions)
router.get("/sites", async (req, res) => {
  try {
    const sites = await Subscription.find().populate("userId", "email name");
    res.json(sites);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch sites" });
  }
});

// 4. Plan breakdown
router.get("/plans", async (req, res) => {
  try {
    const result = await Subscription.aggregate([
      {
        $group: {
          _id: "$planType",
          count: { $sum: 1 },
          totalRevenue: { $sum: "$totalPaid" }
        }
      }
    ]);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Error getting plans" });
  }
});

// 5. Domain requests
router.get("/domains", async (req, res) => {
  try {
    const domains = await Subscription.find({
      domain: { $ne: null }
    }).select("siteName domain userId createdAt").populate("userId", "email name");

    res.json(domains);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch domain requests" });
  }
});

router.get("/users-with-sites", async (req, res) => {
    try {
      const users = await User.find({}, "-password");
      const subscriptions = await Subscription.find().populate("userId", "email");
  
      // Group subscriptions by user ID
      const userSitesMap = {};
      subscriptions.forEach(sub => {
        const uid = sub.userId?._id?.toString();
        if (!uid) return;
        if (!userSitesMap[uid]) userSitesMap[uid] = [];
        userSitesMap[uid].push({
          _id: sub._id, // IMPORTANT: send the subscription ID
          siteName: sub.siteName,
          customName: sub.customName,
          domain: sub.domain,
          price: sub.price,
          planType: sub.planType || "monthly",
          lastPaymentDate: sub.lastPaymentDate,
          suspended: sub.suspended || false,
          status: new Date(sub.expiresAt) > new Date() ? "Active" : "Expired"
        });
        
      });
  
      const enrichedUsers = users.map(user => ({
        ...user.toObject(),
        sites: userSitesMap[user._id?.toString()] || []
      }));
  
      res.json(enrichedUsers);
    } catch (err) {
      console.error("Error loading users with sites:", err);
      res.status(500).json({ message: "Server error fetching users with sites" });
    }
  });
  
  // Toggle site suspension
router.post("/toggle-suspend", async (req, res) => {
  const { subscriptionId, suspend } = req.body;
  try {
    const sub = await Subscription.findById(subscriptionId);
    if (!sub) return res.status(404).json({ message: "Subscription not found" });

    sub.suspended = suspend;
    await sub.save();
    res.json({ message: `Site ${suspend ? "suspended" : "unsuspended"} successfully.` });
  } catch (err) {
    console.error("Toggle suspend error:", err);
    res.status(500).json({ message: "Server error while toggling suspension." });
  }
});

// 6. Pipeline endpoints
router.get("/pipeline", async (req, res) => {
  try {
    const pipeline = await Pipeline.find().sort({ createdAt: -1 });
    res.json(pipeline);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch pipeline" });
  }
});

router.post("/pipeline", async (req, res) => {
  try {
    const newEntry = new Pipeline(req.body);
    await newEntry.save();
    res.json(newEntry);
  } catch (err) {
    res.status(500).json({ message: "Failed to create pipeline entry" });
  }
});

router.put("/pipeline/:id", async (req, res) => {
  try {
    const updated = await Pipeline.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Failed to update pipeline entry" });
  }
});

router.delete("/pipeline/:id", async (req, res) => {
  try {
    await Pipeline.findByIdAndDelete(req.params.id);
    res.json({ message: "Entry deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete pipeline entry" });
  }
});

module.exports = router;
