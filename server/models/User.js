const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  displayName: { type: String, required: true, unique: true },
  password: { type: String, required: true }, 
  reputation: { type: Number, default: 0 },
  isAdmin: { type: Boolean, default: false }
}, { timestamps: true }); 

module.exports = mongoose.model('User', UserSchema);