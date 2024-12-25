const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
Message:{ type: String, required: true }
  });

module.exports.MessageSchema = mongoose.model("messages", MessageSchema);