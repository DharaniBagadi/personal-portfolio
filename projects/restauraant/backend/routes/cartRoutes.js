const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Dish = require('../models/Dish');
const { protect } = require('../middleware/authMiddleware');

// Helper to calculate cart totals
const computeCartTotals = (cartItems) => {
  let subtotal = 0;
  const items = [];

  for (const item of cartItems) {
    if (!item.dish) continue;
    const dish = item.dish;
    const finalPrice = dish.discount > 0 
      ? Math.round(dish.price * (1 - dish.discount / 100)) 
      : dish.price;
    const itemTotal = finalPrice * item.quantity;
    subtotal += itemTotal;

    items.push({
      _id: dish._id,
      dishId: dish._id,
      name: dish.name,
      category: dish.category,
      image: dish.image,
      originalPrice: dish.price,
      price: finalPrice,
      discount: dish.discount || 0,
      quantity: item.quantity,
      itemTotal,
      foodType: dish.foodType || 'veg'
    });
  }

  const deliveryFee = subtotal > 0 ? 40 : 0;
  const tax = Math.round(subtotal * 0.05); // 5% GST
  const discount = subtotal >= 500 ? 100 : 0; // ₹100 welcome royalty discount on orders above ₹500
  const grandTotal = Math.max(0, subtotal + deliveryFee + tax - discount);

  return {
    items,
    itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
    subtotal,
    deliveryFee,
    tax,
    discount,
    grandTotal
  };
};

// @route   GET /api/cart
// @desc    Get user's current shopping cart
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('cart.dish');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const cartData = computeCartTotals(user.cart || []);

    res.status(200).json({
      success: true,
      data: cartData
    });
  } catch (err) {
    console.error('Error fetching cart:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve dining cart.' });
  }
});

// @route   POST /api/cart
// @desc    Add dish to cart or increase quantity
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { dishId, quantity = 1 } = req.body;

    if (!dishId) {
      return res.status(400).json({ success: false, message: 'Dish ID is required.' });
    }

    const dish = await Dish.findById(dishId);
    if (!dish) {
      return res.status(404).json({ success: false, message: 'Dish not found in menu.' });
    }

    const user = await User.findById(req.user._id);
    if (!user.cart) user.cart = [];

    const qtyToAdd = Math.max(1, parseInt(quantity, 10) || 1);
    const existingIndex = user.cart.findIndex(
      (item) => item.dish && item.dish.toString() === dishId.toString()
    );

    if (existingIndex > -1) {
      user.cart[existingIndex].quantity += qtyToAdd;
    } else {
      user.cart.push({ dish: dishId, quantity: qtyToAdd });
    }

    await user.save();
    await user.populate('cart.dish');

    const cartData = computeCartTotals(user.cart);

    res.status(200).json({
      success: true,
      message: `${qtyToAdd}x ${dish.name} added to your dining cart.`,
      data: cartData
    });
  } catch (err) {
    console.error('Error adding to cart:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to add dish to cart.' });
  }
});

// @route   PUT /api/cart/:id
// @desc    Update quantity of an item in cart
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const dishId = req.params.id;
    const { quantity, action } = req.body;

    const user = await User.findById(req.user._id);
    if (!user || !user.cart) {
      return res.status(404).json({ success: false, message: 'Cart is empty.' });
    }

    const itemIndex = user.cart.findIndex(
      (item) => item.dish && item.dish.toString() === dishId.toString()
    );

    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: 'Item not found in cart.' });
    }

    if (action === 'inc') {
      user.cart[itemIndex].quantity += 1;
    } else if (action === 'dec') {
      user.cart[itemIndex].quantity -= 1;
    } else if (typeof quantity === 'number') {
      user.cart[itemIndex].quantity = quantity;
    }

    // If quantity is 0 or less, remove item
    if (user.cart[itemIndex].quantity <= 0) {
      user.cart.splice(itemIndex, 1);
    }

    await user.save();
    await user.populate('cart.dish');

    const cartData = computeCartTotals(user.cart);

    res.status(200).json({
      success: true,
      message: 'Cart updated successfully.',
      data: cartData
    });
  } catch (err) {
    console.error('Error updating cart:', err);
    res.status(500).json({ success: false, message: 'Failed to update item quantity.' });
  }
});

// @route   DELETE /api/cart/:id
// @desc    Remove an item from cart
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const dishId = req.params.id;
    const user = await User.findById(req.user._id);

    if (!user || !user.cart) {
      return res.status(404).json({ success: false, message: 'Cart not found.' });
    }

    user.cart = user.cart.filter(
      (item) => item.dish && item.dish.toString() !== dishId.toString()
    );

    await user.save();
    await user.populate('cart.dish');

    const cartData = computeCartTotals(user.cart);

    res.status(200).json({
      success: true,
      message: 'Item removed from cart.',
      data: cartData
    });
  } catch (err) {
    console.error('Error removing from cart:', err);
    res.status(500).json({ success: false, message: 'Failed to remove item.' });
  }
});

// @route   DELETE /api/cart
// @desc    Clear entire cart
// @access  Private
router.delete('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.cart = [];
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Cart emptied successfully.',
      data: computeCartTotals([])
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to clear cart.' });
  }
});

module.exports = router;
