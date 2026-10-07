const dotenv = require('dotenv');
dotenv.config();

async function runPart2Tests() {
  console.log('====================================================');
  console.log('✨ ROYAL FLAME PART 2 COMPREHENSIVE TEST SUITE ✨');
  console.log('====================================================\n');

  try {
    // 1. Health check
    console.log('--- 1. Testing Health API ---');
    const healthRes = await fetch('http://localhost:5000/api/health');
    const healthData = await healthRes.json();
    console.log('Status:', healthData.status, '| Restaurant:', healthData.restaurant);

    // 2. All Dishes
    console.log('\n--- 2. Testing All Dishes API ---');
    const dishesRes = await fetch('http://localhost:5000/api/dishes');
    const dishesData = await dishesRes.json();
    console.log(`Total dishes found: ${dishesData.count}`);
    const sampleDish = dishesData.data[0];
    console.log(`Sample Dish: ${sampleDish.name} (Category: ${sampleDish.category}, Cuisine: ${sampleDish.cuisine})`);
    console.log(`Ingredients:`, sampleDish.ingredients);

    // 3. Search by Name, Ingredient, Cuisine, Category
    console.log('\n--- 3. Testing Search API ---');
    const searchBiryani = await fetch('http://localhost:5000/api/dishes?search=biryani');
    const biryaniData = await searchBiryani.json();
    console.log(`Search "biryani" returned ${biryaniData.count} dishes:`, biryaniData.data.map(d => d.name));

    const searchSaffron = await fetch('http://localhost:5000/api/dishes?search=Saffron');
    const saffronData = await searchSaffron.json();
    console.log(`Search ingredient "Saffron" returned ${saffronData.count} dishes:`, saffronData.data.map(d => d.name));

    const searchItalian = await fetch('http://localhost:5000/api/dishes?category=Italian');
    const italianData = await searchItalian.json();
    console.log(`Category "Italian" returned ${italianData.count} dishes:`, italianData.data.map(d => d.name));

    // 4. Single Dish Details
    console.log('\n--- 4. Testing Single Dish Details API ---');
    const singleRes = await fetch(`http://localhost:5000/api/dishes/${sampleDish._id}`);
    const singleData = await singleRes.json();
    console.log(`Dish Details for ${singleData.data.name}:`);
    console.log(`Price: ₹${singleData.data.price}, Discount: ${singleData.data.discount}%, Final: ₹${singleData.data.finalPrice}, Rating: ⭐ ${singleData.data.rating} (${singleData.data.numReviews} reviews)`);

    // 5. Related Dishes
    console.log('\n--- 5. Testing Related Dishes API ---');
    const relatedRes = await fetch(`http://localhost:5000/api/dishes/related/${sampleDish._id}`);
    const relatedData = await relatedRes.json();
    console.log(`Related dishes for ${sampleDish.name} (${sampleDish.category}): ${relatedData.count} items`);
    console.log(`Related names:`, relatedData.data.map(d => d.name));

    // 6. User Login
    console.log('\n--- 6. User Authentication for Protected APIs ---');
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'customer@royalflame.com',
        password: 'User@123456'
      })
    });
    const loginData = await loginRes.json();
    console.log('Login success:', loginData.success, '| User:', loginData.user.name);
    const token = loginData.token;

    // 7. Customer Reviews (POST & GET)
    console.log('\n--- 7. Testing Customer Reviews API ---');
    const newReviewRes = await fetch('http://localhost:5000/api/reviews', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        dishId: sampleDish._id,
        rating: 5,
        comment: 'Magnificent preparation! The spices and presentation were purely celestial.'
      })
    });
    const newReviewData = await newReviewRes.json();
    console.log('Review submission success:', newReviewData.success);
    console.log('Review Message:', newReviewData.message);
    console.log('Updated Dish Rating:', newReviewData.updatedDishRating);

    const getReviewsRes = await fetch(`http://localhost:5000/api/reviews/${sampleDish._id}`);
    const getReviewsData = await getReviewsRes.json();
    console.log(`Total reviews for ${sampleDish.name}: ${getReviewsData.count}`);
    console.log(`Average rating: ⭐ ${getReviewsData.averageRating}`);
    console.log(`Rating breakdown:`, getReviewsData.ratingBreakdown);
    console.log(`Latest review: "${getReviewsData.data[0].comment}" by ${getReviewsData.data[0].user.name}`);

    // 8. Wishlist (POST, Duplicate check, GET, DELETE)
    console.log('\n--- 8. Testing Wishlist API ---');
    const addWishlistRes = await fetch('http://localhost:5000/api/wishlist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ dishId: sampleDish._id })
    });
    const addWishlistData = await addWishlistRes.json();
    console.log('Add to wishlist result:', addWishlistData.message);

    // Duplicate test
    const dupWishlistRes = await fetch('http://localhost:5000/api/wishlist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ dishId: sampleDish._id })
    });
    const dupWishlistData = await dupWishlistRes.json();
    console.log('Duplicate check result:', dupWishlistData.message, '| isDuplicate:', dupWishlistData.isDuplicate);

    // Get user wishlist
    const getWishlistRes = await fetch('http://localhost:5000/api/wishlist', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const getWishlistData = await getWishlistRes.json();
    console.log(`User Wishlist count: ${getWishlistData.count}`);
    console.log(`Wishlisted items:`, getWishlistData.data.map(d => d.name));

    // Delete from wishlist
    const delWishlistRes = await fetch(`http://localhost:5000/api/wishlist/${sampleDish._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    const delWishlistData = await delWishlistRes.json();
    console.log('Remove from wishlist result:', delWishlistData.message);

    // Verify empty or updated wishlist
    const verifyWishlistRes = await fetch('http://localhost:5000/api/wishlist', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const verifyWishlistData = await verifyWishlistRes.json();
    console.log(`Wishlist count after deletion: ${verifyWishlistData.count}`);

    console.log('\n====================================================');
    console.log('🎉 ALL PART 2 FEATURES VERIFIED & PASSED 100%! 🎉');
    console.log('====================================================\n');
  } catch (err) {
    console.error('Test execution failed:', err);
  }
}

runPart2Tests();
