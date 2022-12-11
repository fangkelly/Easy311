const mongoose = require("mongoose");

const SubscriptionSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  neighborhoods: {
    type: Array,
    required: true,
  },
  requests: {
    type: Array,
    required: true,
  },
  encrypted: {
    type: String,
    required: true,
  },
});

const Subscription = mongoose.model("Subscription", SubscriptionSchema);

module.exports = Subscription;