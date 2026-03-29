const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
  commentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
  },
  productName: {
    type: String,
    required: true,
  },
  productCode: {
    type: String,
  },
  quantity: {
    type: Number,
    required: true,
    default: 1,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'canceled'],
    default: 'pending',
  },
  pageId: {
    type: String,
    required: true,
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
