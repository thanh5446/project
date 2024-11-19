const mongoose = require("mongoose");

const AutoIncrement = require("mongoose-sequence")(mongoose);

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    googleId: { type: String },
    id_role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      default: new mongoose.Types.ObjectId("6713daec0b1bee2f1eeec409"), // Set your actual default role ID here
    },
    numberphone: { type: String },
    address: { type: String },
  });
  
  userSchema.plugin(AutoIncrement, { inc_field: "id" });
  // "6713daec0b1bee2f1eeec409
  
  module.exports = mongoose.model("User", userSchema);