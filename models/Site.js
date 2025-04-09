const mongoose = require('mongoose');

const siteSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    name: String,
    domain: String
});

module.exports = mongoose.model('Site', siteSchema);
