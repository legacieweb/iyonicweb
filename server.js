const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();
const Site = require('./siteModel');  // Correctly import the Site model
const router = express.Router(); // Initialize the router



// Set up Express and MongoDB connection
const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json());


// MongoDB connection
mongoose.connect('mongodb+srv://legacieweb:aPX4XHXm7Ye5aUro@iyonicweb.cgaik.mongodb.net/?retryWrites=true&w=majority&appName=iyonicweb', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.log('Error connecting to MongoDB:', err));

// Define a user schema for MongoDB
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);

// Signup route
app.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists.' });
    }

    // Create a new user
    const newUser = new User({ email, password });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});
// Login route
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
  
    try {
      // Find the user by email
      const user = await User.findOne({ email });
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Compare the password (for simplicity, let's assume it's plain text)
      if (user.password !== password) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
  
      // Send a success response
      res.status(200).json({ message: 'Login successful' });
    } catch (error) {
      console.error('Error during login:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });
  
// siteModel.js

const siteSchema = new mongoose.Schema({
  name: { type: String, required: true },
  newName: String,
  price: { type: Number, required: true },
  domain: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});


module.exports = Site;

// Middleware to authenticate the user
const authenticateUser = (req, res, next) => {
  const userId = req.userId; // Fetch userId from JWT or session
  if (!userId) {
    return res.status(403).json({ message: "Unauthorized" });
  }
  req.userId = userId;
  next();
};

// Route for fetching sites
router.get('/api/sites', authenticateUser, async (req, res) => {
    try {
      const sites = await Site.find({}); // Replace with your database query
      res.json(sites);
    } catch (error) {
      console.error('Error fetching sites:', error);
      res.status(500).json({ message: 'Error fetching sites' });
    }
  });
router.post('/api/sites', authenticateUser, async (req, res) => {
  try {
    const { name, price, domain } = req.body;
    const newSite = new Site({
      name,
      price,
      domain,
      userId: req.userId,
    });
    await newSite.save();
    res.status(201).json(newSite);
  } catch (error) {
    console.error("Error saving site:", error);
    res.status(500).json({ message: "Failed to save site" });
  }
});

router.put('/api/sites/:id', authenticateUser, async (req, res) => {
  try {
    const { newName, domain } = req.body;
    const site = await Site.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { newName, domain },
      { new: true }
    );
    if (!site) {
      return res.status(404).json({ message: "Site not found" });
    }
    res.json(site);
  } catch (error) {
    console.error("Error updating site:", error);
    res.status(500).json({ message: "Failed to update site" });
  }
});

// Use the router for the /api routes
// Use the router
app.use('/api', router);
// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
