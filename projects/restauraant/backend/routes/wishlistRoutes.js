const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Dish = require('../models/Dish');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/wishlist
// @desc    Get the authenticated user's wishlist
// @access  Private (Logged-in users)
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'wishlist',
      match: { availability: true }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.'
      });
    }

    res.status(200).json({
      success: true,
      count: user.wishlist ? user.wishlist.length : 0,
      data: user.wishlist || []
    });
  } catch (err) {
    console.error('Error fetching wishlist:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve your wishlist.'
    });
  }
});

// @route   POST /api/wishlist
// @desc    Add a dish to the user's wishlist (prevents duplicates)
// @access  Private (Logged-in users)
router.post('/', protect, async (req, res) => {
  try {
    const { dishId } = req.body;

    if (!dishId) {
      return res.status(400).json({
        success: false,
        message: 'Dish ID is required.'
      });
    }

    const dish = await Dish.findById(dishId);
    if (!dish) {
      return res.status(404).json({
        success: false,
        message: 'Dish not found.'
      });
    }

    const user = await User.findById(req.user._id);

    if (!user.wishlist) {
      user.wishlist = [];
    }

    // Check for duplicate
    const isAlreadyWishlisted = user.wishlist.some(
      (id) => id.toString() === dishId.toString()
    );

    if (isAlreadyWishlisted) {
      return res.status(200).json({
        success: true,
        message: 'Dish is already in your royal wishlist.',
        isDuplicate: true,
        data: user.wishlist
      });
    }

    user.wishlist.push(dishId);
    await user.save();

    res.status(201).json({
      success: true,
      message: `${dish.name} added to your wishlist!`,
      data: user.wishlist
    });
  } catch (err) {
    console.error('Error adding to wishlist:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to add dish to wishlist.'
    });
  }
});

// @route   DELETE /api/wishlist/:id
// @desc    Remove a dish from the user's wishlist
// @access  Private (Logged-in users)
router.delete('/:id', protect, async (req, res) => {
  try {
    const dishId = req.params.id;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.'
      });
    }

    const initialLength = user.wishlist ? user.wishlist.length : 0;
    user.wishlist = (user.wishlist || []).filter(
      (id) => id.toString() !== dishId.toString()
    );

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Dish removed from your wishlist.',
      data: user.wishlist
    });
  } catch (err) {
    console.error('Error removing from wishlist:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to remove dish from wishlist.'
    });
  }
});

module.exports = router;
