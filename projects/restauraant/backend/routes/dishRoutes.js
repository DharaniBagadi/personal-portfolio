const express = require('express');
const router = express.Router();
const Dish = require('../models/Dish');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// @route   GET /api/dishes
// @desc    Get all dishes with optional search, category, foodType & section filtering
// @access  Public
router.get('/', async (req, res) => {
  try {
    const {
      search,
      category,
      foodType,
      section,
      isChefsSpecial,
      isPopular,
      isMostOrdered,
      isRecommended,
      isNewArrival,
      sortBy,
      limit
    } = req.query;

    let query = { availability: true };

    // Search filter (matches name, description, category, cuisine, or ingredients)
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
        { cuisine: searchRegex },
        { ingredients: { $in: [searchRegex] } }
      ];
    }

    // Category filter
    if (category && category !== 'All' && category.trim() !== '') {
      // If category is Vegetarian or Non-Vegetarian
      if (category.toLowerCase() === 'vegetarian' || category.toLowerCase() === 'veg') {
        query.foodType = 'veg';
      } else if (category.toLowerCase() === 'non-vegetarian' || category.toLowerCase() === 'non-veg') {
        query.foodType = 'non-veg';
      } else {
        query.category = new RegExp(`^${category.trim()}$`, 'i');
      }
    }

    // Food type filter (veg / non-veg / vegan)
    if (foodType && foodType.trim() !== '') {
      query.foodType = foodType.toLowerCase();
    }

    // Flag filters
    if (isChefsSpecial === 'true') query.isChefsSpecial = true;
    if (isPopular === 'true') query.isPopular = true;
    if (isMostOrdered === 'true') query.isMostOrdered = true;
    if (isRecommended === 'true') query.isRecommended = true;
    if (isNewArrival === 'true') query.isNewArrival = true;

    // Named section filter
    if (section) {
      if (section === 'chefs-special') query.isChefsSpecial = true;
      if (section === 'popular-today') query.isPopular = true;
      if (section === 'most-ordered') query.isMostOrdered = true;
      if (section === 'recommended') query.isRecommended = true;
      if (section === 'new-arrivals') query.isNewArrival = true;
    }

    // Sorting
    let sortOptions = { rating: -1, createdAt: -1 };
    if (sortBy === 'price-low') sortOptions = { price: 1 };
    if (sortBy === 'price-high') sortOptions = { price: -1 };
    if (sortBy === 'rating') sortOptions = { rating: -1 };
    if (sortBy === 'newest') sortOptions = { createdAt: -1 };

    let dishQuery = Dish.find(query).sort(sortOptions);
    if (limit) {
      dishQuery = dishQuery.limit(parseInt(limit, 10));
    }

    const dishes = await dishQuery;

    res.status(200).json({
      success: true,
      count: dishes.length,
      data: dishes
    });
  } catch (err) {
    console.error('Error fetching dishes:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve restaurant menu items.'
    });
  }
});

// @route   GET /api/dishes/sections/all
// @desc    Get categorized curated sections for the home page in a single efficient call
// @access  Public
router.get('/sections/all', async (req, res) => {
  try {
    const [
      chefsSpecial,
      popularToday,
      mostOrdered,
      recommended,
      newArrivals,
      allDishes
    ] = await Promise.all([
      Dish.find({ isChefsSpecial: true, availability: true }).limit(8),
      Dish.find({ isPopular: true, availability: true }).limit(8),
      Dish.find({ isMostOrdered: true, availability: true }).limit(8),
      Dish.find({ isRecommended: true, availability: true }).limit(8),
      Dish.find({ isNewArrival: true, availability: true }).limit(8),
      Dish.find({ availability: true })
    ]);

    res.status(200).json({
      success: true,
      sections: {
        chefsSpecial,
        popularToday,
        mostOrdered,
        recommended,
        newArrivals,
        allDishes
      }
    });
  } catch (err) {
    console.error('Error fetching sections:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve food sections.'
    });
  }
});

// @route   GET /api/dishes/:id
// @desc    Get single dish details
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const dish = await Dish.findById(req.params.id);
    if (!dish) {
      return res.status(404).json({
        success: false,
        message: 'Dish not found with the specified ID.'
      });
    }

    res.status(200).json({
      success: true,
      data: dish
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dish information.'
    });
  }
});

// @route   GET /api/dishes/related/:id
// @desc    Get related dishes for a given dish ID (same category/cuisine, excluding current dish)
// @access  Public
router.get('/related/:id', async (req, res) => {
  try {
    const currentDish = await Dish.findById(req.params.id);
    if (!currentDish) {
      return res.status(404).json({
        success: false,
        message: 'Original dish not found.'
      });
    }

    // First try finding dishes with same category
    let relatedDishes = await Dish.find({
      category: currentDish.category,
      _id: { $ne: currentDish._id },
      availability: true
    }).limit(8);

    // If fewer than 4 dishes found, supplement with same cuisine or top-rated dishes
    if (relatedDishes.length < 4) {
      const existingIds = [currentDish._id, ...relatedDishes.map((d) => d._id)];
      const supplementalDishes = await Dish.find({
        _id: { $nin: existingIds },
        availability: true,
        $or: [
          { cuisine: currentDish.cuisine },
          { foodType: currentDish.foodType },
          { isPopular: true }
        ]
      }).limit(8 - relatedDishes.length);

      relatedDishes = [...relatedDishes, ...supplementalDishes];
    }

    res.status(200).json({
      success: true,
      count: relatedDishes.length,
      data: relatedDishes
    });
  } catch (err) {
    console.error('Error fetching related dishes:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve related dishes.'
    });
  }
});

// @route   POST /api/dishes
// @desc    Create a new dish (Admin only)
// @access  Private/Admin
router.post('/', protect, authorizeRoles('admin'), async (req, res) => {
  try {
    const newDish = new Dish(req.body);
    await newDish.save();

    res.status(201).json({
      success: true,
      message: 'New dish added to menu successfully.',
      data: newDish
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message || 'Failed to add dish.'
    });
  }
});

// @route   PUT /api/dishes/:id
// @desc    Update an existing dish (Admin only)
// @access  Private/Admin
router.put('/:id', protect, authorizeRoles('admin'), async (req, res) => {
  try {
    const updatedDish = await Dish.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!updatedDish) {
      return res.status(404).json({
        success: false,
        message: 'Dish not found to update.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Dish updated successfully.',
      data: updatedDish
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message || 'Failed to update dish.'
    });
  }
});

// @route   DELETE /api/dishes/:id
// @desc    Delete a dish (Admin only)
// @access  Private/Admin
router.delete('/:id', protect, authorizeRoles('admin'), async (req, res) => {
  try {
    const dish = await Dish.findByIdAndDelete(req.params.id);
    if (!dish) {
      return res.status(404).json({
        success: false,
        message: 'Dish not found to delete.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Dish removed from menu successfully.'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete dish.'
    });
  }
});

module.exports = router;
