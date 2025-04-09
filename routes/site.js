const express = require('express');
const jwt = require('jsonwebtoken');
const Site = require('../models/Site');
const router = express.Router();

const auth = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).send("Access denied");
  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = verified.userId;
    next();
  } catch {
    res.status(401).send("Invalid token");
  }
};

// Create Site
router.post('/', auth, async (req, res) => {
  const newSite = new Site({ ...req.body, userId: req.userId });
  await newSite.save();
  res.json(newSite);
});

// Get Sites
router.get('/', auth, async (req, res) => {
  const sites = await Site.find({ userId: req.userId });
  res.json(sites);
});

// Update Site
router.put('/:id', auth, async (req, res) => {
  const updated = await Site.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

module.exports = router;
