const mongoose = require("mongoose");

const ManagedDomainRequestSchema = new mongoose.Schema({
  email: { type: String, required: true },
  domainInterest: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("ManagedDomainRequest", ManagedDomainRequestSchema);
