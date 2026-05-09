const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  applicationId: { type: String, required: true },
  senderLogin: { type: String, required: true },
  senderType: { type: String, enum: ["user", "service"], required: true },
  text: { type: String, required: true },
  readBy: [{ type: String }], // логины тех, кто прочитал
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Message", MessageSchema);