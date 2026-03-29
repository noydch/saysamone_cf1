const Comment = require('../models/Comment');
const Customer = require('../models/Customer');
const Order = require('../models/Order');

// Updated Regex to capture code like CF1, A1, B2 and quantity
// Examples: "CF1", "เอา A1 2", "order B2 5"
const CF_REGEX = /(?:cf|order|เอา)?\s*([a-z]+\d+)\s*(?:\s+(\d+))?/i;

const processComment = async (commentData, io) => {
  const { commentId, message, senderName, senderId, pageId, postId } = commentData;
  
  // 1. Check if comment already exists (prevent duplicate processing)
  const existingComment = await Comment.findOne({ commentId });
  if (existingComment) {
    return { status: 'skipped', reason: 'already processed' };
  }

  // 2. Save Comment to database
  const newComment = await Comment.create({
    commentId,
    message,
    fromUser: { name: senderName, facebookId: senderId },
    postId,
    pageId,
  });

  // Emit to UI
  if(io) {
    io.emit('new_comment', newComment);
  }

  // 3. Analyze Comment via Regex
  const match = message.match(CF_REGEX);
  
  if (match) {
    const productCode = match[1].toUpperCase();
    const quantity = match[2] ? parseInt(match[2], 10) : 1;

    // We have a hit! Let's process the order
    // 3.1 Check/Create Customer
    let customer = await Customer.findOne({ facebookId: senderId });
    if (!customer) {
      customer = await Customer.create({
        facebookId: senderId,
        name: senderName
      });
    }

    // 3.2 Create Order
    const newOrder = await Order.create({
      customerId: customer._id,
      commentId: newComment._id,
      productName: `Product ${productCode}`, // Using code as part of name
      productCode: productCode,
      quantity,
      pageId
    });

    // Mark comment as processed
    newComment.isProcessed = true;
    await newComment.save();

    // Fill customer info for frontend display
    await newOrder.populate('customerId');
    await newOrder.populate('commentId');

    // Emit Order to UI
    if(io) {
       io.emit('new_order', newOrder);
    }
    
    return { status: 'ordered', order: newOrder };
  }

  return { status: 'ignored', reason: 'no keywords matched' };
};

module.exports = processComment;
