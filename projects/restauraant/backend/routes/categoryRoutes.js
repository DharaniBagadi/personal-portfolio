const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Dish = require('../models/Dish');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

// Default initial category seeds
const initialCategories = [
  { name: 'Starters', slug: 'starters', icon: '🍢', description: 'Sensational appetizers and royal tandoor platters.' },
  { name: 'Main Course', slug: 'main-course', icon: '🍲', description: 'Signature curries, slow-cooked meats, and rich gravies.' },
  { name: 'Biryani', slug: 'biryani', icon: '🍚', description: 'Royal dum biryanis infused with fragrant 24k saffron and spices.' },
  { name: 'Indian', slug: 'indian', icon: '🫓', description: 'Authentic Nawabi and Awadhi traditional culinary heritage.' },
  { name: 'Chinese', slug: 'chinese', icon: '🥢', description: 'Artisanal dim sums, wok-tossed noodles, and fiery platters.' },
  { name: 'Italian', slug: 'italian', icon: '🍝', description: 'Handcrafted truffle pastas, risottos, and wood-fired recipes.' },
  { name: 'Burgers', slug: 'burgers', icon: '🍔', description: 'Gourmet brioche burgers with prime aged patties and artisanal sauces.' },
  { name: 'Pizza', slug: 'pizza', icon: '🍕', description: 'Stone-baked artisan sourdough pizzas with buffalo mozzarella.' },
  { name: 'Desserts', slug: 'desserts', icon: '🍮', description: 'Gold-leaf shahi desserts, lava cakes, and velvety mousses.' },
  { name: 'Beverages', slug: 'beverages', icon: '🥂', description: 'Mocktails, signature elixirs, artisanal coffees, and royal brews.' },
  { name: 'Vegetarian', slug: 'vegetarian', icon: '🥗', description: 'Wholesome pure-vegetarian culinary delights cooked to perfection.' },
  { name: 'Non-Vegetarian', slug: 'non-vegetarian', icon: '🥩', description: 'Prime succulent meats, seafood delicacies, and poultry feasts.' }
];

// @route   GET /api/categories
// @desc    Get all active categories with dynamic dish counts
// @access  Public
router.get('/', async (req, res) => {
  try {
    let count = await Category.countDocuments();
    if (count === 0) {
      await Category.insertMany(initialCategories);
    }

    const categories = await Category.find({ isActive: true }).sort({ displayOrder: 1, createdAt: 1 });

    // Aggregate dish counts for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        let dishCount = 0;
        if (cat.name === 'Vegetarian') {
          dishCount = await Dish.countDocuments({ foodType: 'veg' });
        } else if (cat.name === 'Non-Vegetarian') {
          dishCount = await Dish.countDocuments({ foodType: 'non-veg' });
        } else {
          dishCount = await Dish.countDocuments({ category: new RegExp(`^${cat.name}$`, 'i') });
        }
        return {
          ...cat.toObject(),
          dishCount
        };
      })
    );

    res.status(200).json({
      success: true,
      count: categoriesWithCount.length,
      data: categoriesWithCount
    });
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve categories.' });
  }
});

// @route   GET /api/categories/:id
// @desc    Get single category with its dishes
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    let dishes = [];
    if (category.name === 'Vegetarian') {
      dishes = await Dish.find({ foodType: 'veg' });
    } else if (category.name === 'Non-Vegetarian') {
      dishes = await Dish.find({ foodType: 'non-veg' });
    } else {
      dishes = await Dish.find({ category: new RegExp(`^${category.name}$`, 'i') });
    }

    res.status(200).json({
      success: true,
      data: {
        category,
        dishCount: dishes.length,
        dishes
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve category details.' });
  }
});

module.exports = router;
module.exports.initialCategories = initialCategories;
