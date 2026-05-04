// backend/models/Chat.js
const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  conversationId: { type: String, default: 'legacy' },
  role: { type: String, required: true }, // Will be 'user' or 'bot'
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Chat', chatSchema);
