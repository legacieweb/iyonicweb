const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const session = require('express-session');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const nodemailer = require("nodemailer");

const app = express();
const port = 5000;

// JWT Secret Key
const JWT_SECRET = 'mySuperSecretJWTKey123!';  // Added here, replace with a strong secret key

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Configure session middleware
app.use(session({
    secret: JWT_SECRET,  // Use the JWT secret key here as the session secret
    resave: false,              // Prevents session from being saved back to the store if it wasn't modified
    saveUninitialized: true,    // Forces a session to be saved when it's new but not modified
    cookie: { secure: false }   // Set to true if you're using HTTPS
}));
// ✅ Import Routes

// Routes
// Create Express App

// MongoDB Connection
// Ensure MONGO_URI is read correctly
const mongoURI = process.env.MONGO_URI;
if (!mongoURI) {
  console.error("❌ ERROR: MONGO_URI is undefined. Check your .env file!");
  process.exit(1);
}

// Connect to MongoDB
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ Connected to MongoDB Atlas"))
.catch(err => console.error("❌ MongoDB Connection Error:", err));

// Define Schemas
const CategorySchema = new mongoose.Schema({
    name: String,
});

const ThemeSchema = new mongoose.Schema({
    category: String,
    name: String,
    price: String,
    image: String,
    pages: [
        {
            name: String,
            html: String,
        },
    ],
});

const Category = mongoose.model('Category', CategorySchema);
const Theme = mongoose.model('Theme', ThemeSchema);


// ---- ROUTES ----

// 1. Create a New Category
app.post('/api/category', async (req, res) => {
    try {
        const category = new Category(req.body);
        await category.save();
        res.status(201).send(category);
    } catch (err) {
        res.status(500).send({ error: 'Failed to create category', details: err.message });
    }
});

// 2. Get All Categories
app.get('/api/categories', async (req, res) => {
    try {
        const categories = await Category.find();
        res.send(categories);
    } catch (err) {
        res.status(500).send({ error: 'Failed to fetch categories', details: err.message });
    }
});

// 3. Create a New Theme
app.post('/api/theme', async (req, res) => {
    try {
        const theme = new Theme(req.body);
        await theme.save();
        res.status(201).send(theme);
    } catch (err) {
        res.status(500).send({ error: 'Failed to create theme', details: err.message });
    }
});

// 4. Get Themes by Category
app.get('/api/themes/:category', async (req, res) => {
    try {
        const themes = await Theme.find({ category: req.params.category });
        res.send(themes);
    } catch (err) {
        res.status(500).send({ error: 'Failed to fetch themes', details: err.message });
    }
});

// 5. Get a Single Theme by ID
app.get('/api/theme/:id', async (req, res) => {
    try {
        const theme = await Theme.findById(req.params.id);
        if (!theme) {
            return res.status(404).send({ error: 'Theme not found' });
        }
        res.send(theme);
    } catch (err) {
        res.status(500).send({ error: 'Failed to fetch theme', details: err.message });
    }
});

// 6. Add a New Page to a Theme
app.post('/api/theme/:id/pages', async (req, res) => {
    try {
        const { name, html } = req.body;
        const theme = await Theme.findById(req.params.id);

        if (!theme) {
            return res.status(404).send({ error: 'Theme not found' });
        }

        theme.pages.push({ name, html });
        await theme.save();
        res.status(201).send(theme);
    } catch (err) {
        res.status(500).send({ error: 'Failed to add page', details: err.message });
    }
});

// Delete a Page from a Theme (but protect the "Home" page)
app.delete('/api/theme/:id/pages/:pageName', async (req, res) => {
    try {
        const theme = await Theme.findById(req.params.id);

        if (!theme) {
            return res.status(404).send({ error: 'Theme not found' });
        }

        // Prevent deleting the "Home" page
        if (req.params.pageName === 'Home') {
            return res.status(400).send({ error: 'Cannot delete the Home page.' });
        }

        // Remove the selected page
        theme.pages = theme.pages.filter((page) => page.name !== req.params.pageName);

        // Save the updated theme after the page has been deleted
        await theme.save();

        res.send({ message: `Page "${req.params.pageName}" deleted successfully` });
    } catch (err) {
        res.status(500).send({ error: 'Failed to delete page', details: err.message });
    }
});

// Update a Page's HTML for a Theme (Edit and Save)
app.put('/api/theme/:id/page', async (req, res) => {
    const { pageName, html } = req.body;

    try {
        const theme = await Theme.findById(req.params.id);  // Check if theme exists

        if (!theme) {
            return res.status(404).send({ error: 'Theme not found' });
        }

        // Find the specific page within the theme and update its HTML
        const page = theme.pages.find((p) => p.name === pageName);
        if (page) {
            page.html = html;  // Update the page's HTML content
            await theme.save();  // Save the updated theme with the modified page
            return res.send({ message: 'Page updated successfully', theme });
        } else {
            return res.status(404).send({ error: `Page "${pageName}" not found in theme.` });
        }
    } catch (err) {
        return res.status(500).send({ error: 'Failed to update page', details: err.message });
    }
});

// 9. Save All Pages for a Theme
app.put('/api/theme/:id/pages', async (req, res) => {
    const { pages } = req.body;

    try {
        const theme = await Theme.findById(req.params.id);

        if (!theme) {
            return res.status(404).send({ error: 'Theme not found' });
        }

        theme.pages = pages;  // Overwrite the pages array
        await theme.save();
        res.send({ message: 'Theme pages updated successfully', theme });
    } catch (err) {
        res.status(500).send({ error: 'Failed to save pages', details: err.message });
    }
});




// 🔹 API: Delete a Theme
app.delete("/api/theme/:id", async (req, res) => {
    try {
        const deletedTheme = await Theme.findByIdAndDelete(req.params.id);
        if (!deletedTheme) {
            return res.status(404).json({ error: "Theme not found" });
        }
        res.json({ message: "Theme deleted successfully!" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete theme" });
    }
});

// Define User Schema
// Define User Schema
const UserSchema = new mongoose.Schema({
    fullName: String,
    email: { type: String, unique: true },
    phone: String,
    password: String,
    appointments: [{
        templateName: String,
        date: String,
        time: String,
        customizationDetails: String
    }]
});

const User = mongoose.model("User", UserSchema);

// 🔹 Check If Email Exists
app.get("/api/user/:email", async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email });
        if (!user) return res.status(404).json({ error: "User not found" });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// 🔹 Register & Save User Data
app.post("/api/register", async (req, res) => {
    try {
        const { fullName, email, phone, password, templateName, date, time, customizationDetails } = req.body;

        let user = await User.findOne({ email });

        if (!user) {
            const hashedPassword = await bcrypt.hash(password, 10);
            user = new User({ fullName, email, phone, password: hashedPassword, appointments: [] });
        }

        user.appointments.push({ templateName, date, time, customizationDetails });
        await user.save();

        res.status(201).json({ message: "✅ User registered & appointment scheduled!" });
    } catch (err) {
        res.status(500).json({ error: "Server error. Please try again." });
    }
});

// 🔹 Login User
app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(404).json({ error: "User not found. Please sign up." });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: "Incorrect password" });

        res.json({ message: "✅ Login successful", user });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});
// Define Schema & Model
const ScheduleSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    templateName: String,
    scheduleDate: { type: String, required: true },
    scheduleTime: { type: String, required: true },
    scheduleNotes: String
});

// API: Save Form Data
app.post("/api/schedule", async (req, res) => {
    try {
        console.log("📥 Received Schedule Data:", req.body);
        const schedule = new Schedule(req.body);
        await schedule.save();
        res.status(201).json({ message: "✅ Schedule saved successfully!" });
    } catch (error) {
        console.error("❌ Error saving schedule:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// API: Get Schedules for a Specific User
app.get("/api/schedules/:email", async (req, res) => {
    try {
        const email = req.params.email;
        const schedules = await Schedule.find({ email: email });
        res.json(schedules);
    } catch (error) {
        console.error("❌ Error fetching schedules:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
// API: Get all users with their schedules
app.get("/api/admin/schedules", async (req, res) => {
    try {
        const users = await Schedule.aggregate([
            { $group: { _id: "$email", fullName: { $first: "$fullName" }, phone: { $first: "$phone" }, schedules: { $push: "$$ROOT" } } }
        ]);
        res.json(users);
    } catch (error) {
        console.error("❌ Error fetching users:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


// Define Models
const Client = mongoose.model("Client", new mongoose.Schema({
    email: String,
    fullName: String,
    templateName: String
}));

const Subscriber = mongoose.model("Subscriber", new mongoose.Schema({
    email: String,
    fullName: String,
    templateName: String,
    price: Number
}));

// 📌 API Routes

// Get Clients
app.get("/api/clients", async (req, res) => {
    const clients = await Client.find();
    res.json(clients);
});

// Add Client
app.post("/api/clients", async (req, res) => {
    const newClient = new Client(req.body);
    await newClient.save();
    res.json({ message: "Client added successfully!" });
});

// Get Subscribers
app.get("/api/subscribers", async (req, res) => {
    const subscribers = await Subscriber.find();
    res.json(subscribers);
});

// Add Subscriber
app.post("/api/subscribers", async (req, res) => {
    const newSubscriber = new Subscriber(req.body);
    await newSubscriber.save();
    res.json({ message: "Subscriber added successfully!" });
});

// Define Models
const Schedule = mongoose.model("Schedule", new mongoose.Schema({
    email: String,
    fullName: String,
    templateName: String,
    scheduleDate: String,
    scheduleTime: String,
    isSeen: { type: Boolean, default: false }
}));

// 📌 Fetch only new schedules (not marked as seen)
app.get("/api/new-schedules", async (req, res) => {
    const schedules = await Schedule.find({ isSeen: false });
    res.json(schedules);
});

// 📌 Mark a schedule as seen (remove it from new schedules)
app.post("/api/mark-seen", async (req, res) => {
    const { scheduleId } = req.body;

    // Validate scheduleId
    if (!scheduleId || scheduleId.length !== 24) {
        return res.status(400).json({ error: "Invalid schedule ID" });
    }

    try {
        const updatedSchedule = await Schedule.findByIdAndUpdate(scheduleId, { isSeen: true }, { new: true });

        if (!updatedSchedule) {
            return res.status(404).json({ error: "Schedule not found" });
        }

        res.json({ message: "Schedule marked as seen!", schedule: updatedSchedule });
    } catch (error) {
        console.error("Error marking schedule as seen:", error);
        res.status(500).json({ error: "Failed to mark as seen" });
    }
});

const functionSchema = new mongoose.Schema({
    name: String,
    price: Number,
    details: String,
    code: String,
    category: String 
});

const FunctionModel = mongoose.model('Function', functionSchema);

// Get functions by category
app.get('/functions/:category', async (req, res) => {
    const functions = await FunctionModel.find({ category: req.params.category });
    res.json(functions);
});

// Get a specific function
app.get('/function/:id', async (req, res) => {
    const func = await FunctionModel.findById(req.params.id);
    res.json(func);
});

// Create a new function
app.post('/functions', async (req, res) => {
    const { name, price, details, code, category } = req.body;
    const newFunction = new FunctionModel({ name, price, details, code, category });
    await newFunction.save();
    res.json(newFunction);
});

// Update a function
app.put('/function/:id', async (req, res) => {
    const { name, price, details, code } = req.body;
    const updatedFunction = await FunctionModel.findByIdAndUpdate(
        req.params.id,
        { name, price, details, code },
        { new: true }
    );
    res.json(updatedFunction);
});
// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
  service: "gmail",  // Change if using another service
  auth: {
    user: process.env.EMAIL_USER,  // Use .env file for security
    pass: process.env.EMAIL_PASS
  }
});

// API endpoint for sending emails
app.post("/send-email", async (req, res) => {
    const { name, email, message } = req.body;

    const mailOptions = {
        from: email,
        to: "iyonicorp@gmail.com", // Replace with your recipient email
        subject: `New Contact Form Submission from ${name}`,
        text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`
    };

    try {
        await transporter.sendMail(mailOptions);
        res.json({ message: "Your message has been sent successfully!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error sending message. Please try again later." });
    }
});
// ---- START SERVER ----
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
