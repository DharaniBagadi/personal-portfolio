const express = require('express');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const { connectDB } = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const dishRoutes = require('./routes/dishRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const adminRoutes = require('./routes/adminRoutes');
const Order = require('./models/Order');
const Notification = require('./models/Notification');
const Dish = require('./models/Dish');
const User = require('./models/User');
const Review = require('./models/Review');
const Category = require('./models/Category');
const { sampleDishes } = require('./seed');
const { initialCategories } = require('./routes/categoryRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend assets
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dishes', dishRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// Health Check API
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    restaurant: 'Royal Flame Luxury Fine Dining',
    timestamp: new Date().toISOString()
  });
});

// Explicit frontend page routes for seamless browser navigation
app.get('/login', (req, res) => {
  res.sendFile(path.join(frontendPath, 'login.html'));
});

app.get('/reset-password', (req, res) => {
  res.sendFile(
    path.join(frontendPath, 'reset-password.html')
  );
});

app.get('/home', (req, res) => {
  res.sendFile(path.join(frontendPath, 'home.html'));
});

app.get('/menu', (req, res) => {
  res.sendFile(path.join(frontendPath, 'menu.html'));
});

app.get('/dish-details', (req, res) => {
  res.sendFile(path.join(frontendPath, 'dish-details.html'));
});

app.get('/wishlist', (req, res) => {
  res.sendFile(path.join(frontendPath, 'wishlist.html'));
});

app.get('/cart', (req, res) => {
  res.sendFile(path.join(frontendPath, 'cart.html'));
});

app.get('/checkout', (req, res) => {
  res.sendFile(path.join(frontendPath, 'checkout.html'));
});

app.get('/payment', (req, res) => {
  res.sendFile(path.join(frontendPath, 'payment.html'));
});

app.get('/orders', (req, res) => {
  res.sendFile(path.join(frontendPath, 'orders.html'));
});

app.get('/order-details', (req, res) => {
  res.sendFile(path.join(frontendPath, 'order-details.html'));
});

app.get('/profile', (req, res) => {
  res.sendFile(path.join(frontendPath, 'profile.html'));
});

app.get('/messages', (req, res) => {
  res.sendFile(path.join(frontendPath, 'messages.html'));
});

// Admin Panel Page Routes
app.get('/admin', (req, res) => {
  res.sendFile(path.join(frontendPath, 'admin', 'dashboard.html'));
});

app.get('/admin/dashboard', (req, res) => {
  res.sendFile(path.join(frontendPath, 'admin', 'dashboard.html'));
});

app.get('/admin/dishes', (req, res) => {
  res.sendFile(path.join(frontendPath, 'admin', 'dishes.html'));
});

app.get('/admin/categories', (req, res) => {
  res.sendFile(path.join(frontendPath, 'admin', 'categories.html'));
});

app.get('/admin/orders', (req, res) => {
  res.sendFile(path.join(frontendPath, 'admin', 'orders.html'));
});

app.get('/admin/users', (req, res) => {
  res.sendFile(path.join(frontendPath, 'admin', 'users.html'));
});

app.get('/admin/reviews', (req, res) => {
  res.sendFile(path.join(frontendPath, 'admin', 'reviews.html'));
});

app.get('/admin/analytics', (req, res) => {
  res.sendFile(path.join(frontendPath, 'admin', 'analytics.html'));
});

// Fallback for frontend client routing & unknown paths
app.use((req, res) => {
  // If requesting an API that doesn't exist, return 404 JSON
  if (req.url.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'API endpoint not found' });
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Auto-seed database if empty
const ensureDataPopulated = async () => {
  try {
    const dishCount = await Dish.countDocuments();
    if (dishCount === 0) {
      console.log('[Server Startup] Dish collection is empty. Auto-populating gourmet menu...');
      await Dish.insertMany(sampleDishes);
      console.log(`[Server Startup] Added ${sampleDishes.length} dishes to menu.`);
    }

    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('[Server Startup] User collection is empty. Auto-creating demo accounts...');
      const admin = new User({
        name: 'Executive Chef Vikramaditya',
        email: 'admin@royalflame.com',
        phone: '+91 98765 43210',
        password: 'Admin@123456',
        role: 'admin'
      });
      await admin.save();

      const customer = new User({
        name: 'Lord Arthur Wellesley',
        email: 'customer@royalflame.com',
        phone: '+91 91234 56789',
        password: 'User@123456',
        role: 'user',
        addresses: [
          {
            fullName: 'Lord Arthur Wellesley',
            phone: '+91 91234 56789',
            houseNo: 'Villa 14, Royal Crest Manor',
            street: 'Palace Gardens Road',
            area: 'Lutyens Royal Enclave',
            city: 'New Delhi',
            state: 'Delhi',
            pincode: '110001',
            landmark: 'Near Embassy Gate',
            isDefault: true
          }
        ]
      });
      await customer.save();
      console.log('[Server Startup] Created demo users (admin@royalflame.com & customer@royalflame.com)');
    } else {
      // Ensure customer has default address if missing
      const customer = await User.findOne({ email: 'customer@royalflame.com' });
      if (customer && (!customer.addresses || customer.addresses.length === 0)) {
        customer.addresses = [
          {
            fullName: 'Lord Arthur Wellesley',
            phone: '+91 91234 56789',
            houseNo: 'Villa 14, Royal Crest Manor',
            street: 'Palace Gardens Road',
            area: 'Lutyens Royal Enclave',
            city: 'New Delhi',
            state: 'Delhi',
            pincode: '110001',
            landmark: 'Near Embassy Gate',
            isDefault: true
          }
        ];
        await customer.save();
      }
    }

    const reviewCount = await Review.countDocuments();
    if (reviewCount === 0) {
      const demoUser = await User.findOne({ email: 'customer@royalflame.com' });
      const dishes = await Dish.find().limit(10);
      if (demoUser && dishes.length > 0) {
        const demoReviews = [
          'An absolute triumph of gastronomic excellence! The flavors and presentation were fit for royalty.',
          'Exquisite aroma, fresh ingredients, and cooked to perfection. Highly recommended for gourmet food lovers!',
          'One of the best dishes I have tasted in ages. The texture and balance of spices were sublime.'
        ];
        const reviewsToInsert = [];
        dishes.forEach(dish => {
          demoReviews.forEach((txt, idx) => {
            reviewsToInsert.push({
              user: demoUser._id,
              dish: dish._id,
              rating: 5 - (idx % 2 === 0 ? 0 : 0.5),
              comment: txt,
              createdAt: new Date(Date.now() - (idx * 86400000 * 3))
            });
          });
        });
        await Review.insertMany(reviewsToInsert);
        console.log(`[Server Startup] Populated initial reviews (${reviewsToInsert.length} reviews).`);
      }
    }

    const categoryCount = await Category.countDocuments();
    if (categoryCount === 0) {
      console.log('[Server Startup] Category collection is empty. Auto-seeding categories...');
      await Category.insertMany(initialCategories);
      console.log(`[Server Startup] Seeded ${initialCategories.length} categories.`);
    }

    const notificationCount = await Notification.countDocuments();
    if (notificationCount === 0) {
      const demoUser = await User.findOne({ email: 'customer@royalflame.com' });
      if (demoUser) {
        await Notification.create({
          user: demoUser._id,
          title: 'Welcome to Royal Flame ⚜️',
          message: 'Welcome to the royal sanctuary of fine dining. Savor our signature Biryanis, artisanal pastas, and gold-flaked desserts.',
          type: 'promo',
          read: false
        });
      }
    }
  } catch (err) {
    console.error('[Server Startup] Auto-seeding check warning:', err.message);
  }
};

// Start Server
const startServer = async () => {
  try {
    await connectDB();
    await ensureDataPopulated();

    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`✨ ROYAL FLAME RESTAURANT SERVER RUNNING ✨`);
      console.log(`📍 Port: http://localhost:${PORT}`);
      console.log(`🍽️  Home Page: http://localhost:${PORT}/home.html`);
      console.log(`🔑 Login Page: http://localhost:${PORT}/login.html`);
      console.log(`📡 API Endpoints: http://localhost:${PORT}/api/dishes`);
      console.log(`=======================================================`);
    });
  } catch (err) {
    console.error('Failed to start Royal Flame server:', err);
    process.exit(1);
  }
};

startServer();

module.exports = app;
