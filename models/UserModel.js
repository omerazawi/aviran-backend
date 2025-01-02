const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
UserName:{ type: String, required: true },
Password:{ type: String, required: true },
  });

module.exports.UserSchema = mongoose.model("users", UserSchema);