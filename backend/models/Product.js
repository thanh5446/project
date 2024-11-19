const mongoose = require("mongoose");


const productSchema = new mongoose.Schema({
  product_name: { type: String, required: true },
  money: { type: Number, required: true },
  discount_amount: { type: Number, default: 0 },
  quantity: { type: Number, default: 0 },
  image: { type: String, required: true },
  id_category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  isDeleted: { type: Boolean, default: false }, // New field for deleted status
});

// Create a text index for product_name to allow text search
productSchema.index({ product_name: "text" });

module.exports = mongoose.model("Product", productSchema);
