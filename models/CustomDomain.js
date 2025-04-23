const mongoose = require("mongoose");

const customDomainSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  domain: { type: String, required: true },
  siteId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Subscription' },
  setup: { type: String, enum: ["self", "assisted"], required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("CustomDomain", customDomainSchema);
