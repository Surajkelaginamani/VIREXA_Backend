// backend/models/Schedule.js
const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  dayOfWeek: { type: String, required: true },
  subject: { type: String, required: true },
  type: { type: String, enum: ['Lecture', 'Practical', 'Tutorial', 'Interaction', 'Other'] },
  startTime: { type: String, required: true }, 
  endTime: { type: String, required: true },   
  room: { type: String, required: true },
  batch: { type: String, enum: ['ALL', 'AS1', 'AS2', 'AS3'], default: 'ALL' },
  faculty: { type: String } 
});

module.exports = mongoose.model('Schedule', scheduleSchema);
                                                              