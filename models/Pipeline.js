const mongoose = require("mongoose");

const PipelineSchema = new mongoose.Schema({
  businessName: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  secondaryPhone: { type: String },
  altContact: { type: String },
  status: {
    type: String,
    enum: ["Lead", "Contacted", "Proposal", "In Progress", "Completed"],
    default: "Lead"
  },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

PipelineSchema.pre("save", function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Pipeline", PipelineSchema);
