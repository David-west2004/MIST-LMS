const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  student: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  date: { 
    type: Date, 
    required: true 
  },
  weekNumber: { 
    type: Number, 
    required: true 
  },
  coordinates: {
    latitude: { type: Number },
    longitude: { type: Number }
  }
}, { timestamps: true });

// Enforce single check-in per calendar day per student
attendanceSchema.index({ student: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
