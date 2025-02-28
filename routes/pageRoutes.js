const express = require('express');
const router = express.Router();
const Page = require('../models/Page');
const Theme = require('../models/Theme');

// Get all pages for a theme
router.get('/:themeId', async (req, res) => {
    const pages = await Page.find({ theme: req.params.themeId });
    res.json(pages);
});

// Create a new page
router.post('/', async (req, res) => {
    const { name, html, themeId } = req.body;
    const page = new Page({ name, html, theme: themeId });
    await page.save();

    const theme = await Theme.findById(themeId);
    theme.pages.push(page);
    await theme.save();

    res.json(page);
});

// Edit a page
router.put('/:id', async (req, res) => {
    const { html } = req.body;
    const page = await Page.findByIdAndUpdate(req.params.id, { html }, { new: true });
    res.json(page);
});

// Delete a page
router.delete('/:id', async (req, res) => {
    await Page.findByIdAndDelete(req.params.id);
    res.json({ message: 'Page deleted' });
});

module.exports = router;
