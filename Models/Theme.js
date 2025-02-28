const mongoose = require('mongoose');

const themeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: String, required: true },
    image: { type: String, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    pages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Page' }],
});

module.exports = mongoose.model('Theme', themeSchema);
