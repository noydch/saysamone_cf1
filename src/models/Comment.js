const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  commentId: {
    type: String,
    required: true,
    unique: true,
  },
  message: {
    type: String,
    required: true,
  },
  fromUser: {
    name: String,
    facebookId: String,
  },
  postId: String,
  pageId: String,
  isProcessed: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

module.exports = mongoose.model('Comment', commentSchema);
