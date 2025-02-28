const mongoose = require('mongoose');

const pageSchema = new mongoose.Schema({
    name: { type: String, required: true },
    html: { type: String, required: true },
    theme: { type: mongoose.Schema.Types.ObjectId, ref: 'Theme', required: true },
});

module.exports = mongoose.model('Page', pageSchema);
