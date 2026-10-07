const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Dish = require('../models/Dish');
const { protect } = require('../middleware/authMiddleware');

// @route   POST /api/reviews
// @desc    Submit a customer review for a dish
// @access  Private (Logged-in users)
router.post('/', protect, async (req, res) => {
  try {
    const { dishId, rating, comment } = req.body;

    if (!dishId) {
      return res.status(400).json({
        success: false,
        message: 'Dish ID is required to submit a review.'
      });
    }

    const numRating = Number(rating);
    if (!numRating || numRating < 1 || numRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid rating between 1 and 5 stars.'
      });
    }

    if (!comment || comment.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a detailed review comment (minimum 2 characters).'
      });
    }

    // Verify dish exists
    const dish = await Dish.findById(dishId);
    if (!dish) {
      return res.status(404).json({
        success: false,
        message: 'The requested dish was not found.'
      });
    }

    // Create and save review
    const newReview = new Review({
      user: req.user._id,
      dish: dishId,
      rating: numRating,
      comment: comment.trim()
    });

    await newReview.save();

    // Recalculate average rating & total reviews for this dish
    const allReviews = await Review.find({ dish: dishId });
    const totalRatingSum = allReviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = totalRatingSum / allReviews.length;

    dish.rating = Math.round(avgRating * 10) / 10;
    dish.numReviews = allReviews.length;
    await dish.save();

    // Populate user info for immediate frontend display
    await newReview.populate('user', 'name email role');

    res.status(201).json({
      success: true,
      message: 'Your royal review has been published with honor!',
      data: newReview,
      updatedDishRating: {
        rating: dish.rating,
        numReviews: dish.numReviews
      }
    });
  } catch (err) {
    console.error('Error submitting review:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to submit review.'
    });
  }
});

// @route   GET /api/reviews/:dishId
// @desc    Get all reviews and rating breakdown for a dish
// @access  Public
router.get('/:dishId', async (req, res) => {
  try {
    const { dishId } = req.params;

    const reviews = await Review.find({ dish: dishId })
      .populate('user', 'name email role createdAt')
      .sort({ createdAt: -1 });

    // Calculate rating breakdown distribution (1-5 stars)
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let totalScore = 0;

    reviews.forEach(r => {
      const roundedStar = Math.min(5, Math.max(1, Math.round(r.rating)));
      breakdown[roundedStar] = (breakdown[roundedStar] || 0) + 1;
      totalScore += r.rating;
    });

    const averageRating = reviews.length > 0 ? Math.round((totalScore / reviews.length) * 10) / 10 : 5.0;

    res.status(200).json({
      success: true,
      count: reviews.length,
      averageRating,
      ratingBreakdown: breakdown,
      data: reviews
    });
  } catch (err) {
    console.error('Error fetching reviews:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dish reviews.'
    });
  }
});

module.exports = router;
