const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');

// GET /api/comments
// Fetch feed
router.get('/', async (req, res) => {
  try {
    const comments = await Comment.find().sort({ createdAt: -1 }).limit(100);
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
