const mongoose = require('mongoose');

// Define the schema for the Site model
const siteSchema = new mongoose.Schema({
  name: { type: String, required: true },
  newName: { type: String },
  price: { type: Number, required: true },
  domain: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to User
  amountPaid: { type: Number, default: 0 },
  credit: { type: Number, default: 0 },
});

// Create and export the Site model
const Site = mongoose.model('Site', siteSchema);
module.exports = Site;
