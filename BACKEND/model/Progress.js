const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  completedMaterials: [{ type: mongoose.Schema.Types.ObjectId }]
}, { timestamps: true });

module.exports = mongoose.model('Progress', progressSchema);
