const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Dish = require('./models/Dish');
const User = require('./models/User');
const Review = require('./models/Review');

dotenv.config({ path: __dirname + '/../.env' });

const sampleDishes = [
  // 1. STARTERS
  {
    name: 'Royal Paneer Tikka',
    category: 'Starters',
    cuisine: 'North Indian / Tandoor',
    description: 'Fresh malai cottage cheese cubes marinated in saffron, hung curd, and aromatic royal spices, char-grilled to golden perfection in our clay tandoor with edible gold leaf garnish.',
    ingredients: ['Cottage Cheese (Paneer)', 'Kashmiri Saffron', 'Hung Curd', 'Royal Garam Masala', 'Edible 24k Gold Leaf', 'Mint Chutney'],
    image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=800&q=80',
    price: 480,
    discount: 10,
    rating: 4.9,
    numReviews: 248,
    foodType: 'veg',
    availability: true,
    isChefsSpecial: true,
    isPopular: true,
    isMostOrdered: false,
    isRecommended: true,
    isNewArrival: false,
    preparationTime: '20 mins',
    calories: 420
  },
  {
    name: 'Flamed Tandoori Chicken',
    category: 'Starters',
    cuisine: 'Mughlai / Tandoor',
    description: 'Whole spring chicken rubbed with freshly ground Kashmiri chilies, mustard oil, yogurt, and house garam masala, fired in a red-hot clay oven.',
    ingredients: ['Spring Chicken', 'Kashmiri Degi Mirch', 'Mustard Oil', 'Greek Yogurt', 'Kasuri Methi', 'Lemon Infusion'],
    image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80',
    price: 520,
    discount: 8,
    rating: 4.82,
    numReviews: 210,
    foodType: 'non-veg',
    availability: true,
    isChefsSpecial: true,
    isPopular: true,
    isMostOrdered: false,
    isRecommended: false,
    isNewArrival: false,
    preparationTime: '25 mins',
    calories: 490
  },
  {
    name: 'Truffle & Edamame Dim Sum',
    category: 'Starters',
    cuisine: 'Asian / Dim Sum',
    description: 'Translucent crystal dumplings filled with crushed green edamame beans and wild morel mushrooms, perfumed with white truffle oil.',
    ingredients: ['Fresh Edamame', 'Wild Morel Mushrooms', 'White Truffle Oil', 'Wheat Starch', 'Chili Garlic Dip'],
    image: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=800&q=80',
    price: 460,
    discount: 0,
    rating: 4.88,
    numReviews: 135,
    foodType: 'veg',
    availability: true,
    isChefsSpecial: false,
    isPopular: true,
    isMostOrdered: false,
    isRecommended: true,
    isNewArrival: true,
    preparationTime: '18 mins',
    calories: 280
  },
  {
    name: 'Chicken 65 Royal Crunch',
    category: 'Starters',
    cuisine: 'South Indian / Fusion',
    description: 'Tender chicken bites tossed with tempered curry leaves, crushed peppercorns, South Indian spices, and caramelized shallots.',
    ingredients: ['Boneless Chicken', 'Curry Leaves', 'Guntur Red Chilies', 'Black Pepper', 'Shallots', 'Ginger Garlic'],
    image: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=800&q=80',
    price: 490,
    discount: 12,
    rating: 4.86,
    numReviews: 180,
    foodType: 'non-veg',
    availability: true,
    isChefsSpecial: false,
    isPopular: true,
    isMostOrdered: true,
    isRecommended: false,
    isNewArrival: false,
    preparationTime: '20 mins',
    calories: 440
  },

  // 2. BIRYANI
  {
    name: 'Hyderabadi Dum Biryani',
    category: 'Biryani',
    cuisine: 'Hyderabadi / Royal Nizami',
    description: 'Slow-cooked fragrant long-grain aged Basmati rice layered with succulent tender spiced mutton, infused with saffron, kewra water, and caramelized onions, sealed with dough in a royal handi.',
    ingredients: ['Aged Long-Grain Basmati Rice', 'Prime Tender Mutton', 'Kashmiri Saffron', 'Kewra Water', 'Caramelized Crispy Onions', 'Fresh Mint & Coriander', 'Clarified Butter (Desi Ghee)'],
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
    price: 680,
    discount: 15,
    rating: 4.95,
    numReviews: 412,
    foodType: 'non-veg',
    availability: true,
    isChefsSpecial: true,
    isPopular: true,
    isMostOrdered: true,
    isRecommended: true,
    isNewArrival: false,
    preparationTime: '30 mins',
    calories: 680
  },
  {
    name: 'Signature Chicken Biryani',
    category: 'Biryani',
    cuisine: 'Mughlai / Biryani',
    description: 'Prime cut chicken pieces marinated overnight in freshly pounded spices, layered with saffron rice and slow-cooked over gentle embers.',
    ingredients: ['Farm-Fresh Chicken', 'Aged Basmati Rice', 'Whole Spices', 'Saffron Milk', 'Ghee', 'Rose Water'],
    image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80',
    price: 540,
    discount: 10,
    rating: 4.89,
    numReviews: 320,
    foodType: 'non-veg',
    availability: true,
    isChefsSpecial: false,
    isPopular: true,
    isMostOrdered: true,
    isRecommended: true,
    isNewArrival: false,
    preparationTime: '25 mins',
    calories: 610
  },
  {
    name: 'Awadhi Mutton Biryani',
    category: 'Biryani',
    cuisine: 'Lucknowi / Awadhi',
    description: 'Delicate Lucknowi dum biryani prepared with tender goat meat simmered in yakhni stock, fragranced with ittar and mace.',
    ingredients: ['Tender Goat Meat', 'Yakhni Broth', 'Basmati Rice', 'Mace & Nutmeg', 'Meetha Ittar', 'Desi Ghee'],
    image: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=800&q=80',
    price: 720,
    discount: 10,
    rating: 4.93,
    numReviews: 230,
    foodType: 'non-veg',
    availability: true,
    isChefsSpecial: true,
    isPopular: true,
    isMostOrdered: false,
    isRecommended: true,
    isNewArrival: false,
    preparationTime: '30 mins',
    calories: 710
  },
  {
    name: 'Royal Shahi Veg Dum Biryani',
    category: 'Biryani',
    cuisine: 'Mughlai / Vegetarian',
    description: 'Garden fresh seasonal vegetables, marinated paneer, baby potatoes, and dry fruits layered with scented saffron basmati rice.',
    ingredients: ['Fresh Paneer', 'Baby Potatoes', 'French Beans', 'Cashews & Raisins', 'Saffron Rice', 'Biryani Masala'],
    image: 'https://images.unsplash.com/photo-1642821373181-696a54913e93?auto=format&fit=crop&w=800&q=80',
    price: 460,
    discount: 5,
    rating: 4.84,
    numReviews: 195,
    foodType: 'veg',
    availability: true,
    isChefsSpecial: false,
    isPopular: true,
    isMostOrdered: false,
    isRecommended: true,
    isNewArrival: false,
    preparationTime: '25 mins',
    calories: 520
  },

  // 3. INDIAN & MAIN COURSE
  {
    name: 'Royal Murgh Makhani (Butter Chicken)',
    category: 'Indian',
    cuisine: 'North Indian / Punjabi',
    description: 'Tender tandoor-roasted chicken simmered in a velvety, satin-smooth reduction of San Marzano tomatoes, organic butter, cashew paste, and dried fenugreek leaves.',
    ingredients: ['Tandoori Chicken', 'San Marzano Tomatoes', 'Fresh White Butter', 'Cashew Cream', 'Kasuri Methi', 'Honey Infusion'],
    image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=800&q=80',
    price: 620,
    discount: 12,
    rating: 4.94,
    numReviews: 530,
    foodType: 'non-veg',
    availability: true,
    isChefsSpecial: true,
    isPopular: true,
    isMostOrdered: true,
    isRecommended: true,
    isNewArrival: false,
    preparationTime: '25 mins',
    calories: 590
  },
  {
    name: 'Dal Bukhara Royale',
    category: 'Main Course',
    cuisine: 'North Indian / Heritage',
    description: 'Whole black lentils slow-cooked overnight for 18 hours over charcoal embers, finished with churned butter and fresh cream.',
    ingredients: ['Urad Dal', 'San Marzano Tomato Puree', 'Cream', 'Cultured White Butter', 'Garlic', 'Kashmiri Chili'],
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=800&q=80',
    price: 460,
    discount: 0,
    rating: 4.91,
    numReviews: 310,
    foodType: 'veg',
    availability: true,
    isChefsSpecial: true,
    isPopular: true,
    isMostOrdered: true,
    isRecommended: true,
    isNewArrival: false,
    preparationTime: '15 mins',
    calories: 450
  },
  {
    name: 'Kashmiri Rogan Josh',
    category: 'Indian',
    cuisine: 'Kashmiri / Royal',
    description: 'Prime lamb shank slow-cooked in aromatic Kashmiri chili oil, rattan jot root, fennel powder, and dried ginger gravy.',
    ingredients: ['Tender Lamb Shank', 'Kashmiri Chili', 'Rattan Jot', 'Fennel Powder', 'Dry Ginger (Sonth)', 'Whole Cardamom'],
    image: 'https://images.unsplash.com/photo-1545247181-516773cae754?auto=format&fit=crop&w=800&q=80',
    price: 740,
    discount: 10,
    rating: 4.89,
    numReviews: 165,
    foodType: 'non-veg',
    availability: true,
    isChefsSpecial: true,
    isPopular: true,
    isMostOrdered: false,
    isRecommended: true,
    isNewArrival: false,
    preparationTime: '30 mins',
    calories: 640
  },
  {
    name: 'Paneer Lababdar Imperial',
    category: 'Main Course',
    cuisine: 'North Indian / Mughlai',
    description: 'Succulent malai paneer and grated paneer cooked in a rich, chunky tomato-onion gravy flavored with melon seeds and cardamom.',
    ingredients: ['Fresh Malai Paneer', 'Magaz Seeds', 'Tomatoes & Onions', 'Cream', 'Cardamom', 'Coriander'],
    image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80',
    price: 510,
    discount: 8,
    rating: 4.87,
    numReviews: 240,
    foodType: 'veg',
    availability: true,
    isChefsSpecial: false,
    isPopular: true,
    isMostOrdered: false,
    isRecommended: true,
    isNewArrival: false,
    preparationTime: '20 mins',
    calories: 480
  },

  // 4. ITALIAN
  {
    name: 'Handcrafted Truffle Pasta',
    category: 'Italian',
    cuisine: 'Italian / Fine Dining',
    description: 'Artisanal tagliatelle tossed in imported Umbrian black truffle butter, 24-month aged Parmigiano Reggiano, wild forest mushrooms, and micro-herbs.',
    ingredients: ['Tagliatelle Pasta', 'Umbrian Black Truffle', 'Parmigiano Reggiano 24M', 'Wild Morel Mushrooms', 'French Butter'],
    image: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281081?auto=format&fit=crop&w=800&q=80',
    price: 790,
    discount: 5,
    rating: 4.92,
    numReviews: 184,
    foodType: 'veg',
    availability: true,
    isChefsSpecial: true,
    isPopular: true,
    isMostOrdered: false,
    isRecommended: true,
    isNewArrival: true,
    preparationTime: '22 mins',
    calories: 520
  },
  {
    name: 'Fettuccine Alfredo con Pollo',
    category: 'Italian',
    cuisine: 'Italian / Roman',
    description: 'Velvety ribbon fettuccine with roasted tender chicken breast in a rich butter, garlic, and aged Pecorino Romano cream reduction.',
    ingredients: ['Fettuccine', 'Grilled Chicken Breast', 'Pecorino Romano', 'Heavy Cream', 'Roasted Garlic', 'Fresh Parsley'],
    image: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?auto=format&fit=crop&w=800&q=80',
    price: 640,
    discount: 10,
    rating: 4.85,
    numReviews: 142,
    foodType: 'non-veg',
    availability: true,
    isChefsSpecial: false,
    isPopular: true,
    isMostOrdered: false,
    isRecommended: false,
    isNewArrival: false,
    preparationTime: '20 mins',
    calories: 610
  },

  // 5. PIZZA
  {
    name: 'Woodfired Burrata & Truffle Pizza',
    category: 'Pizza',
    cuisine: 'Italian / Neapolitan',
    description: '48-hour fermented sourdough crust baked at 450°C, topped with whole Pugliese burrata, black truffle glaze, and fresh basil.',
    ingredients: ['48h Sourdough Dough', 'Pugliese Fresh Burrata', 'Truffle Glaze', 'San Marzano Sauce', 'Extra Virgin Olive Oil'],
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
    price: 750,
    discount: 15,
    rating: 4.94,
    numReviews: 290,
    foodType: 'veg',
    availability: true,
    isChefsSpecial: true,
    isPopular: true,
    isMostOrdered: true,
    isRecommended: true,
    isNewArrival: false,
    preparationTime: '18 mins',
    calories: 680
  },
  {
    name: 'Flame Smoked Chicken Pizza',
    category: 'Pizza',
    cuisine: 'Italian / Neapolitan',
    description: 'Charred crust layered with smoked chicken chunks, sun-dried tomatoes, Fior di Latte mozzarella, and jalapeño crisps.',
    ingredients: ['Sourdough Base', 'Smoked Chicken', 'Fior di Latte Mozzarella', 'Sun-Dried Tomatoes', 'Pickled Jalapeños'],
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80',
    price: 690,
    discount: 10,
    rating: 4.88,
    numReviews: 215,
    foodType: 'non-veg',
    availability: true,
    isChefsSpecial: false,
    isPopular: true,
    isMostOrdered: false,
    isRecommended: true,
    isNewArrival: false,
    preparationTime: '20 mins',
    calories: 720
  },

  // 6. BURGERS
  {
    name: 'The Sovereign Gourmet Burger',
    category: 'Burgers',
    cuisine: 'American Gourmet',
    description: 'Flame-grilled prime patty glazed with red wine onion jam, aged sharp cheddar, crispy bacon, and truffle aioli on a toasted brioche bun.',
    ingredients: ['Prime Tender Patty', 'Red Wine Onion Jam', 'Aged Sharp Cheddar', 'Truffle Aioli', 'Toasted Brioche Bun'],
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
    price: 580,
    discount: 10,
    rating: 4.9,
    numReviews: 198,
    foodType: 'non-veg',
    availability: true,
    isChefsSpecial: true,
    isPopular: true,
    isMostOrdered: false,
    isRecommended: true,
    isNewArrival: false,
    preparationTime: '18 mins',
    calories: 740
  },
  {
    name: 'Crispy Herb Paneer Burger',
    category: 'Burgers',
    cuisine: 'Continental / Fusion',
    description: 'Panko-crusted spiced paneer patty topped with avocado guacamole, pickled red onions, and smoky chipotle mayo.',
    ingredients: ['Panko Crusted Paneer', 'Avocado Guacamole', 'Pickled Red Onions', 'Smoky Chipotle Mayo', 'Artisanal Brioche'],
    image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80',
    price: 420,
    discount: 0,
    rating: 4.82,
    numReviews: 120,
    foodType: 'veg',
    availability: true,
    isChefsSpecial: false,
    isPopular: false,
    isMostOrdered: false,
    isRecommended: true,
    isNewArrival: true,
    preparationTime: '15 mins',
    calories: 560
  },

  // 7. CHINESE
  {
    name: 'Szechuan Dragon Chilli Chicken',
    category: 'Chinese',
    cuisine: 'Indo-Chinese / Szechuan',
    description: 'Crispy wok-tossed chicken cubes with spicy Szechuan peppercorns, scallions, bird’s eye chilies, and dark toasted sesame sauce.',
    ingredients: ['Diced Chicken', 'Szechuan Peppercorns', 'Scallions', 'Bird’s Eye Chili', 'Dark Soy Reduction', 'Toasted Sesame'],
    image: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=800&q=80',
    price: 520,
    discount: 8,
    rating: 4.87,
    numReviews: 210,
    foodType: 'non-veg',
    availability: true,
    isChefsSpecial: false,
    isPopular: true,
    isMostOrdered: true,
    isRecommended: true,
    isNewArrival: false,
    preparationTime: '18 mins',
    calories: 460
  },
  {
    name: 'Crispy Lotus Stem & Water Chestnut',
    category: 'Chinese',
    cuisine: 'Asian / Cantonese',
    description: 'Honey-chili glazed crispy lotus root chips and crunchy water chestnuts tossed with kaffir lime and toasted sesame seeds.',
    ingredients: ['Lotus Stem Root', 'Water Chestnuts', 'Wild Organic Honey', 'Kaffir Lime Leaves', 'Sesame Glaze'],
    image: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&w=800&q=80',
    price: 440,
    discount: 5,
    rating: 4.83,
    numReviews: 110,
    foodType: 'veg',
    availability: true,
    isChefsSpecial: false,
    isPopular: false,
    isMostOrdered: false,
    isRecommended: true,
    isNewArrival: true,
    preparationTime: '15 mins',
    calories: 320
  },

  // 8. DESSERTS
  {
    name: 'Belgian Chocolate Lava Cake',
    category: 'Desserts',
    cuisine: 'French Patisserie',
    description: 'Decadent 70% dark Valrhona Belgian chocolate sponge with a warm molten core, paired with Madagascar Bourbon vanilla bean gelato.',
    ingredients: ['70% Valrhona Dark Chocolate', 'Madagascar Vanilla Bean Gelato', 'Organic Farm Butter', 'Cocoa Dust', 'Fresh Raspberries'],
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80',
    price: 360,
    discount: 0,
    rating: 4.96,
    numReviews: 295,
    foodType: 'veg',
    availability: true,
    isChefsSpecial: true,
    isPopular: true,
    isMostOrdered: true,
    isRecommended: true,
    isNewArrival: false,
    preparationTime: '15 mins',
    calories: 460
  },
  {
    name: 'New York Baked Gold Cheesecake',
    category: 'Desserts',
    cuisine: 'American / Bakery',
    description: 'Classic creamy Philadelphia cream cheese cake on a golden Graham cracker crust, crowned with fresh berries and 24k gold leaf.',
    ingredients: ['Philadelphia Cream Cheese', 'Graham Cracker Crust', 'Organic Wild Berries', '24k Edible Gold Leaf', 'Tahitian Vanilla'],
    image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80',
    price: 390,
    discount: 5,
    rating: 4.89,
    numReviews: 175,
    foodType: 'veg',
    availability: true,
    isChefsSpecial: true,
    isPopular: false,
    isMostOrdered: false,
    isRecommended: true,
    isNewArrival: true,
    preparationTime: '10 mins',
    calories: 410
  },
  {
    name: 'Royal Shahi Tukda Flambé',
    category: 'Desserts',
    cuisine: 'Awadhi / Royal Sweet',
    description: 'Ghee-fried golden brioche soaked in saffron cardamom syrup, layered with thick rabri, pistachio slivers, and flambéed at your table.',
    ingredients: ['Brioche Bread', 'Desi Ghee', 'Saffron Syrup', 'Slow-Reduced Rabri', 'Pistachio & Almond Slivers', 'Edible Silver Vark'],
    image: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=800&q=80',
    price: 340,
    discount: 0,
    rating: 4.92,
    numReviews: 215,
    foodType: 'veg',
    availability: true,
    isChefsSpecial: true,
    isPopular: true,
    isMostOrdered: false,
    isRecommended: true,
    isNewArrival: false,
    preparationTime: '12 mins',
    calories: 480
  },

  // 9. BEVERAGES
  {
    name: 'Smoked Velvet Cold Brew',
    category: 'Beverages',
    cuisine: 'Artisanal Coffee',
    description: 'Single-origin Arabica 24-hour steep infused with hickory smoke, condensed sweet cream, and hazelnut essence.',
    ingredients: ['Aged Single-Origin Arabica', 'Hickory Wood Smoke', 'Sweet Condensed Cream', 'Hazelnut Essence'],
    image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=80',
    price: 250,
    discount: 0,
    rating: 4.85,
    numReviews: 145,
    foodType: 'veg',
    availability: true,
    isChefsSpecial: false,
    isPopular: true,
    isMostOrdered: false,
    isRecommended: false,
    isNewArrival: true,
    preparationTime: '5 mins',
    calories: 120
  },
  {
    name: 'Saffron Gold Royal Elixir Mocktail',
    category: 'Beverages',
    cuisine: 'Mixology & Mocktails',
    description: 'Sparkling tonic with crushed wild mint, pomegranate pearls, saffron syrup, edible gold shimmer, and gold sugar rim.',
    ingredients: ['Sparkling Tonic Water', 'Saffron Syrup', 'Fresh Wild Mint', 'Pomegranate Pearls', 'Edible Gold Shimmer Dust'],
    image: 'https://images.unsplash.com/photo-1536935338788-846bb9981813?auto=format&fit=crop&w=800&q=80',
    price: 290,
    discount: 0,
    rating: 4.91,
    numReviews: 168,
    foodType: 'veg',
    availability: true,
    isChefsSpecial: true,
    isPopular: true,
    isMostOrdered: false,
    isRecommended: true,
    isNewArrival: true,
    preparationTime: '5 mins',
    calories: 110
  }
];

const sampleReviewsData = [
  {
    rating: 5,
    comment: 'An absolute masterpiece of culinary art! The saffron aroma and tender succulent meat made this the finest dining experience in years.'
  },
  {
    rating: 5,
    comment: 'The flavors are extraordinarily well-balanced. Service and packaging were royal and pristine.'
  },
  {
    rating: 4,
    comment: 'Incredible texture and taste. Highly recommended for special celebratory dinners!'
  },
  {
    rating: 5,
    comment: 'The edible gold garnish and exquisite spices were breathtaking. Worth every rupee!'
  }
];

const seedDatabase = async () => {
  try {
    const { connectDB, disconnectDB } = require('./config/database');
    await connectDB();

    console.log('[Seed] Cleaning old records...');
    await Dish.deleteMany({});
    await Review.deleteMany({});

    console.log('[Seed] Inserting luxury restaurant dishes...');
    const insertedDishes = await Dish.insertMany(sampleDishes);
    console.log(`[Seed] Successfully inserted ${insertedDishes.length} gourmet dishes.`);

    // Seed Demo Users if not existing
    const adminEmail = 'admin@royalflame.com';
    const customerEmail = 'customer@royalflame.com';

    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      admin = new User({
        name: 'Executive Chef Vikramaditya',
        email: adminEmail,
        phone: '+91 98765 43210',
        password: 'Admin@123456',
        role: 'admin'
      });
      await admin.save();
      console.log('[Seed] Created default Admin user: admin@royalflame.com');
    }

    let customer = await User.findOne({ email: customerEmail });
    if (!customer) {
      customer = new User({
        name: 'Lord Arthur Wellesley',
        email: customerEmail,
        phone: '+91 91234 56789',
        password: 'User@123456',
        role: 'user'
      });
      await customer.save();
      console.log('[Seed] Created demo Customer user: customer@royalflame.com');
    }

    // Seed initial reviews for key dishes
    console.log('[Seed] Generating initial customer reviews for dishes...');
    const reviewsToInsert = [];
    for (const dish of insertedDishes) {
      // Pick 2-3 reviews per dish
      const count = 3;
      for (let i = 0; i < count; i++) {
        const rev = sampleReviewsData[i % sampleReviewsData.length];
        reviewsToInsert.push({
          user: customer._id,
          dish: dish._id,
          rating: rev.rating,
          comment: `${rev.comment} (${dish.name})`,
          createdAt: new Date(Date.now() - (i * 86400000 * 2))
        });
      }
    }
    await Review.insertMany(reviewsToInsert);
    console.log(`[Seed] Successfully created ${reviewsToInsert.length} initial verified reviews.`);

    console.log('[Seed] Database initialization complete!');
    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error('[Seed Error] Database seeding failed:', err);
    process.exit(1);
  }
};

if (require.main === module) {
  seedDatabase();
}

module.exports = { sampleDishes, seedDatabase };
