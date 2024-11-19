const mongoose = require("mongoose");

const checkoutSchema = new mongoose.Schema({
  id_product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  id_user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "pending",
  },
  date_checkout: { type: Date, default: Date.now },
  amount: { type: Number, required: true },
  quantity: { type: Number, required: true },
  orderId: { type: String, required: true },
  payUrl: { type: String },
  message: { type: String },
});

module.exports = mongoose.model("Checkout", checkoutSchema);