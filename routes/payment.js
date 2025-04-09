const express = require('express');
const paymentController = require('../controllers/payment'); // Ensure this path is correct
const verifyToken = require('../middleware/auth'); // If you're using JWT authentication

const router = express.Router();

// Route for handling payments (POST)
router.post('/create', verifyToken, paymentController.createPayment);

module.exports = router;
