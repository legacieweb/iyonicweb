const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Subscription = require("../models/Subscription");
const Pipeline = require("../models/Pipeline");
const db = require("../config/db");

// Admin auth
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
    const totalUsersResult = await db('Users').count('* as count');
    const totalUsers = parseInt(totalUsersResult[0].count);

    const activeSitesResult = await db('Subscriptions')
      .where('expiresAt', '>=', new Date())
      .count('* as count');
    const activeSites = parseInt(activeSitesResult[0].count);

    const totalRevenueResult = await db('Subscriptions').sum('totalPaid as total');
    const totalRevenue = parseFloat(totalRevenueResult[0].total) || 0;

    res.json({
      totalUsers,
      activeSites,
      totalRevenue
    });
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// 2. All users
router.get("/users", async (req, res) => {
  try {
    const users = await db('Users').select('id', 'name', 'email', 'phone', 'banned', 'subdomainsClaimed');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

// 3. All sites (subscriptions)
router.get("/sites", async (req, res) => {
  try {
    const sites = await db('Subscriptions')
      .join('Users', 'Subscriptions.userId', '=', 'Users.id')
      .select('Subscriptions.*', 'Users.email as userEmail', 'Users.name as userName');
    
    // Format to match Mongoose populate style if needed by frontend
    const formattedSites = sites.map(site => ({
      ...site,
      userId: { id: site.userId, email: site.userEmail, name: site.userName }
    }));
    
    res.json(formattedSites);
  } catch (err) {
    console.error("Fetch sites error:", err);
    res.status(500).json({ message: "Failed to fetch sites" });
  }
});

// 4. Plan breakdown
router.get("/plans", async (req, res) => {
  try {
    const result = await db('Subscriptions')
      .select('planType as _id')
      .count('* as count')
      .sum('totalPaid as totalRevenue')
      .groupBy('planType');
    
    res.json(result.map(r => ({
       ...r,
       count: parseInt(r.count),
       totalRevenue: parseFloat(r.totalRevenue) || 0
    })));
  } catch (err) {
    res.status(500).json({ message: "Error getting plans" });
  }
});

// 5. Domain requests
router.get("/domains", async (req, res) => {
  try {
    const domains = await db('Subscriptions')
      .join('Users', 'Subscriptions.userId', '=', 'Users.id')
      .whereNotNull('domain')
      .select('Subscriptions.id', 'Subscriptions.siteName', 'Subscriptions.domain', 'Subscriptions.userId', 'Subscriptions.createdAt', 'Users.email as userEmail', 'Users.name as userName');

    const formattedDomains = domains.map(d => ({
       ...d,
       _id: d.id, // for frontend compatibility
       userId: { id: d.userId, email: d.userEmail, name: d.userName }
    }));

    res.json(formattedDomains);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch domain requests" });
  }
});

router.get("/users-with-sites", async (req, res) => {
    try {
      const users = await db('Users').select('id', 'name', 'email', 'phone', 'banned', 'subdomainsClaimed');
      const subscriptions = await db('Subscriptions')
        .join('Users', 'Subscriptions.userId', '=', 'Users.id')
        .select('Subscriptions.*', 'Users.email as userEmail');
  
      // Group subscriptions by user ID
      const userSitesMap = {};
      subscriptions.forEach(sub => {
        const uid = sub.userId.toString();
        if (!userSitesMap[uid]) userSitesMap[uid] = [];
        userSitesMap[uid].push({
          id: sub.id,
          _id: sub.id, // frontend compatibility
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
        ...user,
        _id: user.id, // frontend compatibility
        sites: userSitesMap[user.id.toString()] || []
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
    await Subscription.save(sub);
    res.json({ message: `Site ${suspend ? "suspended" : "unsuspended"} successfully.` });
  } catch (err) {
    console.error("Toggle suspend error:", err);
    res.status(500).json({ message: "Server error while toggling suspension." });
  }
});

// 6. Pipeline endpoints
router.get("/pipeline", async (req, res) => {
  try {
    const pipeline = await db('Pipelines').orderBy('createdAt', 'desc');
    res.json(pipeline);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch pipeline" });
  }
});

router.post("/pipeline", async (req, res) => {
  try {
    const newEntry = await Pipeline.create(req.body);
    res.json(newEntry);
  } catch (err) {
    res.status(500).json({ message: "Failed to create pipeline entry" });
  }
});

router.put("/pipeline/:id", async (req, res) => {
  try {
    const updated = await Pipeline.findByIdAndUpdate(req.params.id, req.body);
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
