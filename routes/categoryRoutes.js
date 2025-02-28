const express = require('express');
const router = express.Router();
const Category = require('../models/Category');

// Create a new category
router.post('/', async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Category name is required' });
        }

        const newCategory = new Category({ name });
        await newCategory.save();

        res.status(201).json(newCategory);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
