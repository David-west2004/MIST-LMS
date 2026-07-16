const mongoose = require('mongoose');

const curriculumSchema = new mongoose.Schema({
  unit: { type: String, required: true, unique: true }, 
  modules: [{
    title: { type: String, required: true }, 
    description: { type: String },
    materials: [{
      title: { type: String, required: true }, 
      type: { type: String, enum: ['pdf', 'video', 'link', 'doc'], required: true },
      url: { type: String, required: true } 
    }]
  }]
}, { timestamps: true });

module.exports = mongoose.model('Curriculum', curriculumSchema);
