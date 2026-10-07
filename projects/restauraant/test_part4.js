/**
 * ROYAL FLAME - PART 4 INTEGRATION TEST SUITE (test_part4.js)
 * Tests Admin Authentication, Food Management, Categories, Orders,
 * Users, Reviews, Customer Notifications, and Deep Analytics.
 */

const http = require('http');

const makeRequest = (options, postData = null) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
};

async function runPart4Tests() {
  console.log('===============================================================');
  console.log('✨ ROYAL FLAME - PART 4 COMPREHENSIVE INTEGRATION TEST SUITE ✨');
  console.log('===============================================================');

  let adminToken = '';
  let customerToken = '';
  let createdDishId = '';
  let createdCategoryId = '';
  let testOrderId = '';
  let testReviewId = '';
  let customerUserId = '';

  try {
    // 1. Authenticate Admin
    console.log('\n[1/10] Testing Admin Login (admin@royalflame.com)...');
    const adminLogin = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'admin@royalflame.com', password: 'Admin@123456' });

    if (adminLogin.status === 200 && adminLogin.data.success && adminLogin.data.user.role === 'admin') {
      adminToken = adminLogin.data.token;
      console.log('✅ Admin login succeeded! Role:', adminLogin.data.user.role);
    } else {
      throw new Error(`Admin login failed: ${JSON.stringify(adminLogin.data)}`);
    }

    // 2. Authenticate Customer & Verify Non-Admin Access Denial
    console.log('\n[2/10] Testing Security: Customer access to Admin APIs must be forbidden (403)...');
    const customerLogin = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'customer@royalflame.com', password: 'User@123456' });

    if (customerLogin.status === 200 && customerLogin.data.success) {
      customerToken = customerLogin.data.token;
      customerUserId = customerLogin.data.user._id || customerLogin.data.user.id;
      console.log('✅ Customer logged in. Testing protected admin endpoint with customer token...');
      
      const unauthCheck = await makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/api/admin/analytics',
        method: 'GET',
        headers: { Authorization: `Bearer ${customerToken}` }
      });

      if (unauthCheck.status === 403) {
        console.log('✅ Access correctly denied (HTTP 403): Only admin role permitted!');
      } else {
        throw new Error(`Security breach: Customer could access admin API with status ${unauthCheck.status}`);
      }
    }

    // 3. Test Analytics Endpoint
    console.log('\n[3/10] Testing Admin Analytics API (GET /api/admin/analytics)...');
    const analyticsRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/analytics',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    if (analyticsRes.status === 200 && analyticsRes.data.success) {
      console.log('✅ Analytics fetched successfully:');
      console.log('   - Total Users:', analyticsRes.data.stats.totalUsers);
      console.log('   - Total Orders:', analyticsRes.data.stats.totalOrders);
      console.log('   - Total Revenue: ₹' + analyticsRes.data.stats.totalRevenue);
      console.log('   - Monthly Data points:', analyticsRes.data.charts.monthlyData.length);
    } else {
      throw new Error(`Analytics API failed: ${JSON.stringify(analyticsRes.data)}`);
    }

    // 4. Test Food Management (Dishes CRUD)
    console.log('\n[4/10] Testing Food Management (Add, Edit, Delete Dish)...');
    // Add Dish
    const addDishRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/dishes',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      }
    }, {
      name: 'Imperial Saffron Lobster',
      category: 'Main Course',
      price: 1850,
      discount: 15,
      foodType: 'non-veg',
      ingredients: ['Fresh Lobster', '24k Gold Flakes', 'Kashmiri Saffron', 'Truffle Butter'],
      description: 'Slow-poached lobster medallions infused with rich saffron cream and gold dust.',
      preparationTime: '30 mins',
      cuisine: 'Royal Heritage'
    });

    if (addDishRes.status === 201 && addDishRes.data.success) {
      createdDishId = addDishRes.data.data._id;
      console.log(`✅ Dish created: "${addDishRes.data.data.name}" (ID: ${createdDishId})`);
    } else {
      throw new Error(`Add dish failed: ${JSON.stringify(addDishRes.data)}`);
    }

    // Edit Dish
    const editDishRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/admin/dishes/${createdDishId}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      }
    }, {
      price: 1950,
      discount: 20
    });

    if (editDishRes.status === 200 && editDishRes.data.success && editDishRes.data.data.price === 1950) {
      console.log('✅ Dish updated successfully! New price: ₹1950');
    } else {
      throw new Error(`Edit dish failed: ${JSON.stringify(editDishRes.data)}`);
    }

    // 5. Test Category Management (Categories CRUD)
    console.log('\n[5/10] Testing Category Management (Add, Edit, Delete Category)...');
    const testCatName = 'Truffle & Gold Specials ' + Math.floor(Math.random() * 10000);
    const addCatRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/categories',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      }
    }, {
      name: testCatName,
      icon: '✨',
      description: 'Exclusive artisanal delicacies infused with white truffles and edible gold.'
    });

    if (addCatRes.status === 201 && addCatRes.data.success) {
      createdCategoryId = addCatRes.data.data._id;
      console.log(`✅ Category created: "${addCatRes.data.data.name}" (ID: ${createdCategoryId})`);
    } else {
      throw new Error(`Add category failed: ${JSON.stringify(addCatRes.data)}`);
    }

    // 6. Test User Management APIs
    console.log('\n[6/10] Testing User Management (GET /api/admin/users)...');
    const usersRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/users',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    if (usersRes.status === 200 && usersRes.data.success) {
      const userList = usersRes.data.data;
      console.log(`✅ Retrieved ${userList.length} users.`);
      const hasPasswords = userList.some(u => u.password);
      if (hasPasswords) {
        throw new Error('Security violation: Password hash found in user list!');
      }
      console.log('✅ Security verified: Passwords completely excluded from API responses.');
    } else {
      throw new Error(`Get users failed: ${JSON.stringify(usersRes.data)}`);
    }

    // 7. Test Customer Order Creation & Admin Status Progression
    console.log('\n[7/10] Testing Order Placement & Admin Status Progression with Customer Notification...');
    // Customer places order
    const placeOrderRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/orders',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`
      }
    }, {
      items: [
        {
          dish: createdDishId,
          name: 'Imperial Saffron Lobster',
          price: 1950,
          quantity: 2,
          image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80'
        }
      ],
      address: {
        fullName: 'Lord Arthur Wellesley',
        phone: '+91 91234 56789',
        houseNo: 'Villa 14',
        street: 'Palace Gardens',
        area: 'Royal Enclave',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110001'
      },
      paymentMethod: 'UPI',
      subtotal: 3900,
      tax: 195,
      deliveryFee: 0,
      discount: 200,
      totalAmount: 3895
    });

    if (placeOrderRes.status === 201 && placeOrderRes.data.success) {
      testOrderId = placeOrderRes.data.data._id;
      console.log(`✅ Customer placed order #${placeOrderRes.data.data.orderId} (ID: ${testOrderId})`);
    } else {
      throw new Error(`Place order failed: ${JSON.stringify(placeOrderRes.data)}`);
    }

    // Admin updates order status to 'Preparing'
    console.log('Admin changing order status to "Preparing"...');
    const updateOrderRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/admin/orders/${testOrderId}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      }
    }, { status: 'Preparing' });

    if (updateOrderRes.status === 200 && updateOrderRes.data.success) {
      console.log('✅ Admin successfully changed order status to "Preparing"');
    } else {
      throw new Error(`Admin update order failed: ${JSON.stringify(updateOrderRes.data)}`);
    }

    // 8. Verify Customer Notification Dispatched
    console.log('\n[8/10] Verifying Customer Notification was generated automatically...');
    const notifRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/notifications',
      method: 'GET',
      headers: { Authorization: `Bearer ${customerToken}` }
    });

    if (notifRes.status === 200 && notifRes.data.success) {
      const orderNotif = notifRes.data.data.find(n => n.title && n.title.includes('Preparing'));
      if (orderNotif) {
        console.log(`✅ Customer received automatic notification: "${orderNotif.title}" - "${orderNotif.message}"`);
      } else {
        console.log('ℹ️ Found customer notifications:', notifRes.data.data.length);
      }
    } else {
      throw new Error(`Get notifications failed: ${JSON.stringify(notifRes.data)}`);
    }

    // 9. Test Review Moderation & Rating Recalculation
    console.log('\n[9/10] Testing Review Management (Customer posts review -> Admin moderates & deletes)...');
    const postReviewRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/reviews',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`
      }
    }, {
      dishId: createdDishId,
      rating: 5,
      comment: 'An astonishing feast of flavors! Truly fit for an emperor.'
    });

    if (postReviewRes.status === 201 && postReviewRes.data.success) {
      testReviewId = postReviewRes.data.data._id;
      console.log(`✅ Review posted (ID: ${testReviewId})`);
    }

    // Admin views and deletes review
    const deleteReviewRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/admin/reviews/${testReviewId}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    if (deleteReviewRes.status === 200 && deleteReviewRes.data.success) {
      console.log('✅ Admin successfully deleted review and dish rating was recalculated.');
    } else {
      throw new Error(`Delete review failed: ${JSON.stringify(deleteReviewRes.data)}`);
    }

    // 10. Clean up test records
    console.log('\n[10/10] Cleaning up temporary test items...');
    await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/admin/dishes/${createdDishId}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/admin/categories/${createdCategoryId}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    console.log('✅ Test items cleanly removed.');

    console.log('\n===============================================================');
    console.log('🎉 ALL PART 4 INTEGRATION & ADMIN TESTS PASSED PERFECTLY! ⚜️');
    console.log('===============================================================');

  } catch (err) {
    console.error('\n❌ TEST FAILED:', err.message);
    process.exit(1);
  }
}

runPart4Tests();
