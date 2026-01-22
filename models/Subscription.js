const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  siteName: String,
  customName: String,
  price: Number,
  planType: { type: String, default: 'monthly' },
  domain: String,
  totalPaid: { type: Number, default: 0 },
  credit: { type: Number, default: 0 },
  lastPaymentDate: Date,
  expiresAt: Date, // Add this
  createdAt: { type: Date, default: Date.now },
  suspended: {
    type: Boolean,
    default: false
  }
  
});

module.exports = mongoose.model("Subscription", subscriptionSchema);
