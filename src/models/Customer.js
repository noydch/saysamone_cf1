const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  facebookId: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  profilePic: {
    type: String,
    default: 'https://via.placeholder.com/150',
  }
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);
