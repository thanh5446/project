const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  category_name: { type: String, required: true },
  icon: { type: String, required: true },
  color: { type: String, required: true },
});

module.exports = mongoose.model("Category", categorySchema);