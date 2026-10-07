const mongoose = require('mongoose');

const dishSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Dish name is required'],
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Starters',
        'Main Course',
        'Biryani',
        'Indian',
        'Chinese',
        'Italian',
        'Burgers',
        'Pizza',
        'Desserts',
        'Beverages'
      ],
      trim: true
    },
    cuisine: {
      type: String,
      default: 'Royal Heritage',
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Dish description is required']
    },
    ingredients: {
      type: [String],
      default: []
    },
    image: {
      type: String,
      required: [true, 'Image URL or asset path is required']
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price must be positive']
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative'],
      max: [100, 'Discount cannot exceed 100%']
    },
    rating: {
      type: Number,
      default: 4.8,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    numReviews: {
      type: Number,
      default: 120
    },
    availability: {
      type: Boolean,
      default: true
    },
    foodType: {
      type: String,
      enum: ['veg', 'non-veg', 'vegan'],
      default: 'veg'
    },
    isChefsSpecial: {
      type: Boolean,
      default: false
    },
    isPopular: {
      type: Boolean,
      default: false
    },
    isMostOrdered: {
      type: Boolean,
      default: false
    },
    isRecommended: {
      type: Boolean,
      default: false
    },
    isNewArrival: {
      type: Boolean,
      default: false
    },
    preparationTime: {
      type: String,
      default: '20-25 mins'
    },
    calories: {
      type: Number,
      default: 380
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Virtual for discounted price calculation
dishSchema.virtual('finalPrice').get(function () {
  if (this.discount > 0) {
    return Math.round(this.price * (1 - this.discount / 100));
  }
  return this.price;
});

dishSchema.set('toJSON', { virtuals: true });
dishSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Dish', dishSchema);
