const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String }, 
  role: { type: String, enum: ['admin', 'student'], default: 'student' },
  unit: { type: String, required: true }, 
  isBlocked: { type: Boolean, default: false }, 
  inviteToken: { type: String, default: null }, 
  tokenExpires: { type: Date, default: null },
  lastActive: { type: Date, default: null },
}, { timestamps: true });

// Pre-save middleware to hash password
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
