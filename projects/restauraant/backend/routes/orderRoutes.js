const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const Dish = require('../models/Dish');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/authMiddleware');

// Helper to generate luxury Order ID (e.g., RF-2026-89412)
const generateOrderId = () => {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `RF-${year}-${randomNum}`;
};

// ==========================================
// 1. ADDRESS MANAGEMENT APIs
// ==========================================

// @route   GET /api/orders/addresses
// @desc    Get user's saved delivery addresses
// @access  Private
router.get('/addresses', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({
      success: true,
      data: user.addresses || []
    });
  } catch (err) {
    console.error('Error fetching addresses:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve addresses.' });
  }
});

// @route   POST /api/orders/addresses
// @desc    Save a new delivery address
// @access  Private
router.post('/addresses', protect, async (req, res) => {
  try {
    const {
      fullName,
      phone,
      houseNo,
      street,
      area,
      city,
      state,
      pincode,
      landmark,
      isDefault
    } = req.body;

    if (!fullName || !phone || !houseNo || !street || !area || !city || !state || !pincode) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required delivery address fields.'
      });
    }

    const user = await User.findById(req.user._id);
    if (!user.addresses) user.addresses = [];

    // If setting as default or if first address, make it default
    const shouldBeDefault = isDefault || user.addresses.length === 0;
    if (shouldBeDefault) {
      user.addresses.forEach((addr) => (addr.isDefault = false));
    }

    const newAddress = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      houseNo: houseNo.trim(),
      street: street.trim(),
      area: area.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      landmark: landmark ? landmark.trim() : '',
      isDefault: shouldBeDefault
    };

    user.addresses.push(newAddress);
    await user.save();

    const savedAddr = user.addresses[user.addresses.length - 1];

    res.status(201).json({
      success: true,
      message: 'Delivery address saved successfully.',
      data: savedAddr,
      addresses: user.addresses
    });
  } catch (err) {
    console.error('Error saving address:', err);
    res.status(500).json({ success: false, message: 'Failed to save address.' });
  }
});

// @route   DELETE /api/orders/addresses/:addressId
// @desc    Delete a saved address
// @access  Private
router.delete('/addresses/:addressId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.addresses = (user.addresses || []).filter(
      (a) => a._id.toString() !== req.params.addressId
    );
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Address removed successfully.',
      data: user.addresses
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete address.' });
  }
});

// ==========================================
// 2. ORDER PROCESSING APIs
// ==========================================

// @route   POST /api/orders
// @desc    Create and place a new order (from Cart or Buy Now)
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const {
      items,
      paymentMethod = 'UPI',
      paymentStatus = 'Paid',
      subtotal,
      deliveryFee = 40,
      tax,
      discount = 0,
      totalAmount
    } = req.body;

    const deliveryAddress = req.body.address || req.body.shippingAddress;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot place an order with empty items.'
      });
    }

    if (!deliveryAddress || !deliveryAddress.fullName || !deliveryAddress.phone || !deliveryAddress.houseNo || !deliveryAddress.city) {
      return res.status(400).json({
        success: false,
        message: 'A complete delivery address is required to place your order.'
      });
    }

    // Format ordered items
    const orderItems = items.map((item) => ({
      dish: item.dish || item.dishId || item._id,
      name: item.name,
      price: Number(item.price),
      quantity: Number(item.quantity) || 1,
      image: item.image,
      category: item.category || 'Gourmet'
    }));

    const calcSubtotal = subtotal !== undefined 
      ? Number(subtotal) 
      : orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const calcTax = tax !== undefined ? Number(tax) : Math.round(calcSubtotal * 0.05);
    const calcDelivery = calcSubtotal > 0 ? Number(deliveryFee) : 0;
    const calcDiscount = Number(discount) || 0;
    const calcTotal = totalAmount !== undefined 
      ? Number(totalAmount) 
      : Math.max(0, calcSubtotal + calcDelivery + calcTax - calcDiscount);

    const orderId = generateOrderId();

    const newOrder = new Order({
      user: req.user._id,
      orderId,
      items: orderItems,
      subtotal: calcSubtotal,
      deliveryFee: calcDelivery,
      tax: calcTax,
      discount: calcDiscount,
      totalAmount: calcTotal,
      address: deliveryAddress,
      paymentMethod,
      paymentStatus,
      orderStatus: 'Confirmed',
      estimatedDelivery: '30-40 mins',
      createdAt: new Date()
    });

    await newOrder.save();

    // Clear user's cart in MongoDB after successful order
    const user = await User.findById(req.user._id);
    if (user) {
      user.cart = [];
      await user.save();
    }

    // Generate Order Placed Notification
    const notification = new Notification({
      user: req.user._id,
      title: 'Order Confirmed! 👑',
      message: `Your feast order #${orderId} (₹${calcTotal}) has been received and confirmed by the Executive Chef.`,
      type: 'order',
      orderId: newOrder._id
    });
    await notification.save();

    res.status(201).json({
      success: true,
      message: '🎉 Order Placed Successfully! Your royal banquet is being prepared.',
      data: newOrder
    });
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to place your royal order.'
    });
  }
});

// @route   GET /api/orders
// @desc    Get all orders for authenticated user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve order history.' });
  }
});

// @route   GET /api/orders/:id
// @desc    Get single order details by MongoDB _id or orderId
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const param = req.params.id;
    let order;

    if (param.startsWith('RF-')) {
      order = await Order.findOne({ orderId: param });
    } else {
      order = await Order.findById(param);
    }

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Verify ownership unless admin
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied to this order.' });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (err) {
    console.error('Error fetching order details:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve order specifications.' });
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order status & create status notification (Demo & Kitchen controls)
// @access  Private
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = [
      'Pending',
      'Confirmed',
      'Preparing',
      'Ready',
      'Out for Delivery',
      'Delivered',
      'Cancelled'
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid order status transition.' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    order.orderStatus = status;
    await order.save();

    // Create contextual message based on status
    const statusMessages = {
      Confirmed: `Your order #${order.orderId} has been confirmed.`,
      Preparing: `Your food for order #${order.orderId} is being prepared with royal precision.`,
      Ready: `Your order #${order.orderId} is plated, packed and ready for dispatch.`,
      'Out for Delivery': `Your order #${order.orderId} is out for delivery with our Royal Valet.`,
      Delivered: `Your order #${order.orderId} has been delivered. Savor your royal dining experience!`,
      Cancelled: `Your order #${order.orderId} has been cancelled.`
    };

    const notification = new Notification({
      user: order.user,
      title: `Order Update: ${status}`,
      message: statusMessages[status] || `Order #${order.orderId} is now ${status}.`,
      type: 'order',
      orderId: order._id
    });
    await notification.save();

    res.status(200).json({
      success: true,
      message: `Order status updated to "${status}".`,
      data: order
    });
  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(500).json({ success: false, message: 'Failed to update order status.' });
  }
});

module.exports = router;
