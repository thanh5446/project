const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
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
  quantity: { type: Number, required: true, min: 1 },
});

module.exports = mongoose.model("Cart", cartSchema);