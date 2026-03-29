const express = require('express');
const router = express.Router();
const commentProcessor = require('../services/commentProcessor');

// 1. GET request for Webhook Verification (Facebook calls this)
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // Check if mode and token is correct
  if (mode === 'subscribe' && token === (process.env.FB_VERIFY_TOKEN || 'my_secret_verify_token')) {
    console.log('WEBHOOK_VERIFIED');
    return res.status(200).send(challenge);
  } else {
    console.log('WEBHOOK_VERIFICATION_FAILED');
    return res.sendStatus(403);
  }
});

// 2. POST request for real-time events (incoming comments)
router.post('/', async (req, res) => {
  // Always respond with 200 OK immediately to Facebook
  res.status(200).send('EVENT_RECEIVED');

  try {
    const body = req.body;
    
    // For Mock Testing (Simulate comment button)
    if (body.isMock) {
       console.log('MOCK_WEBHOOK_RECEIVED');
       const io = req.app.get('io');
       // Simulate a CF comment processing
       await commentProcessor.processComment({
         from: { id: 'mock_user_123', name: 'Mock User' },
         message: body.message || 'CF1',
         created_time: new Date().toISOString(),
         post_id: 'mock_post_123',
         id: 'mock_comment_' + Date.now()
       }, io);
       return;
    }

    // For Real Facebook Events
    if (body.object === 'page') {
      const io = req.app.get('io');
      
      body.entry.forEach(async (entry) => {
        if (entry.changes) {
          entry.changes.forEach(async (change) => {
            if (change.field === 'feed' && change.value.item === 'comment' && change.value.verb === 'add') {
               console.log('REAL_COMMENT_RECEIVED:', change.value.message);
               // Process real comment
               await commentProcessor.processComment(change.value, io);
            }
          });
        }
      });
    }
  } catch (err) {
    console.error('Webhook Error:', err);
  }
});

module.exports = router;
