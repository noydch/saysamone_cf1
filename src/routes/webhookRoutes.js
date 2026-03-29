const express = require('express');
const router = express.Router();
const { addCommentToQueue } = require('../queues/commentQueue');

// GET /api/webhook/facebook 
// Used by Facebook to verify the webhook integration
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === process.env.FB_VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } else {
     // Mock Verify for testing
     res.status(200).send('Mock Verify OK. Provide hub.verify_token manually to mimic FB.');
  }
});

// POST /api/webhook/facebook
// Used by Facebook to push new comments (events)
router.post('/', async (req, res) => {
  const body = req.body;
  const isMock = body.isMock === true; 

  // Fast return 200 OK so Facebook doesn't timeout
  res.status(200).send('EVENT_RECEIVED');

  // Actual Facebook Hook Structure logic OR Mock Custom logic
  if (body.object === 'page' || isMock) {
    // We are mocking to speed up testing
    if (isMock) {
        console.log('Processing MOCK Facebook Webhook Event');
        await addCommentToQueue({
            commentId: body.commentId || 'mock_comment_' + Date.now(),
            message: body.message || 'CF 1',
            senderName: body.senderName || 'Tester ' + Math.floor(Math.random()*100),
            senderId: body.senderId || 'mock_fb_id_001',
            pageId: body.pageId || process.env.MOCK_FB_PAGE_ID,
            postId: body.postId || 'mock_post_001'
        });
        return;
    }

    // Real Facebook payload
    body.entry.forEach(function(entry) {
      const pageId = entry.id;
      
      // Gets the body of the webhook event
      const webhook_event = entry.changes[0].value;
      
      if (webhook_event.item === 'comment' && webhook_event.verb === 'add') {
         // It's a new comment!
         addCommentToQueue({
             commentId: webhook_event.comment_id,
             message: webhook_event.message,
             senderName: webhook_event.from.name,
             senderId: webhook_event.from.id,
             pageId: pageId,
             postId: webhook_event.post_id
         });
      }
    });
  } 
});

module.exports = router;
