const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// GET /api/orders
// Fetch all orders
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('customerId')
      .populate('commentId')
      .sort({ createdAt: -1 }); // Newest first

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/orders/:id/status
// Update order status
router.patch('/:id/status', async (req, res) => {
  try {
     const { status } = req.body;
     const orderId = req.params.id;

     // Validate status
     if(!['pending', 'confirmed', 'canceled'].includes(status)){
         return res.status(400).json({ error: 'Invalid status' });
     }

     const updatedOrder = await Order.findByIdAndUpdate(
         orderId, 
         { status }, 
         { new: true }
     ).populate('customerId').populate('commentId');

     if (!updatedOrder) return res.status(404).json({ error: 'Order not found' });

     // Tell UI the status changed
     const io = req.app.get('io');
     if(io) {
        io.emit('order_updated', updatedOrder);
     }

     res.json(updatedOrder);
  } catch(err) {
     res.status(500).json({ error: err.message });
  }
});

// DELETE /api/orders/:id
router.delete('/:id', async (req, res) => {
    try {
        await Order.findByIdAndDelete(req.params.id);
        const io = req.app.get('io');
        if (io) {
             io.emit('order_deleted', { _id: req.params.id });
        }
        res.status(200).json({ message: 'Order deleted' });
     } catch(err) {
        res.status(500).json({ error: err.message });
     }
});

module.exports = router;
