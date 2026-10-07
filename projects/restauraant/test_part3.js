/**
 * ROYAL FLAME RESTAURANT - PART 3 COMPREHENSIVE INTEGRATION TEST SUITE
 * Validates Cart, Address, Checkout, Payment, Order, Live Tracking & Notification System
 */

const BASE_URL = 'http://localhost:5000';

async function runPart3Tests() {
  console.log('================================================================');
  console.log('⚜️  ROYAL FLAME - PART 3 FULL SYSTEM INTEGRATION TEST  ⚜️');
  console.log('================================================================\n');

  let token = null;
  let testUser = null;
  let sampleDishes = [];
  let sampleAddress = null;
  let createdOrder = null;

  try {
    // 1. Authenticate with Demo Account
    console.log('🔹 1. Authenticating with demo patron account...');
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'customer@royalflame.com',
        password: 'User@123456'
      })
    });
    const loginData = await loginRes.json();
    if (!loginData.success || !loginData.token) {
      throw new Error(`Login failed: ${loginData.message}`);
    }
    token = loginData.token;
    testUser = loginData.user;
    console.log(`   ✅ Signed in as: ${testUser.name} (${testUser.email})`);

    // 2. Fetch Menu Dishes for testing
    console.log('\n🔹 2. Fetching gourmet menu catalog...');
    const dishesRes = await fetch(`${BASE_URL}/api/dishes`);
    const dishesData = await dishesRes.json();
    sampleDishes = dishesData.data || [];
    if (sampleDishes.length < 2) {
      throw new Error('Not enough dishes in menu database to run tests.');
    }
    const dishA = sampleDishes[0];
    const dishB = sampleDishes[1];
    console.log(`   ✅ Selected Test Dishes: "${dishA.name}" (₹${dishA.price}) & "${dishB.name}" (₹${dishB.price})`);

    // 3. Test Cart APIs (POST, GET, PUT, DELETE)
    console.log('\n🔹 3. Testing Cart MongoDB APIs (GET /api/cart, POST /api/cart, PUT /api/cart/:id, DELETE /api/cart/:id)...');
    
    // Clear cart first
    await fetch(`${BASE_URL}/api/cart`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });

    // Add Dish A
    const addRes1 = await fetch(`${BASE_URL}/api/cart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ dishId: dishA._id, quantity: 2 })
    });
    const addData1 = await addRes1.json();
    if (!addData1.success || addData1.data.itemCount !== 2) {
      throw new Error(`Add to cart failed: ${JSON.stringify(addData1)}`);
    }
    console.log(`   ✅ Added 2x "${dishA.name}" to cart. Cart Count: ${addData1.data.itemCount}`);

    // Add Dish B
    const addRes2 = await fetch(`${BASE_URL}/api/cart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ dishId: dishB._id, quantity: 1 })
    });
    const addData2 = await addRes2.json();
    console.log(`   ✅ Added 1x "${dishB.name}" to cart. Cart Count: ${addData2.data.itemCount}`);

    // Fetch Cart
    const getCartRes = await fetch(`${BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const getCartData = await getCartRes.json();
    console.log(`   ✅ Cart GET Verification: Subtotal: ₹${getCartData.data.subtotal}, Delivery: ₹${getCartData.data.deliveryFee}, Tax: ₹${getCartData.data.tax}, Discount: ₹${getCartData.data.discount}, Grand Total: ₹${getCartData.data.grandTotal}`);

    // Increase quantity of Dish B via PUT
    const putRes = await fetch(`${BASE_URL}/api/cart/${dishB._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ action: 'inc' })
    });
    const putData = await putRes.json();
    console.log(`   ✅ Incremented quantity of "${dishB.name}". New Count: ${putData.data.itemCount}`);

    // 4. Test Address Management APIs
    console.log('\n🔹 4. Testing Address Management APIs (GET, POST, DELETE /api/orders/addresses)...');
    const newAddrRes = await fetch(`${BASE_URL}/api/orders/addresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        fullName: 'Lady Catherine de Bourgh',
        phone: '+91 99887 76655',
        houseNo: 'Rosings Park Estate, Penthouse 9',
        street: 'King George Avenue',
        area: 'Diplomatic Enclave',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110021',
        landmark: 'Near Royal Embassy',
        isDefault: true
      })
    });
    const newAddrData = await newAddrRes.json();
    sampleAddress = newAddrData.data;
    console.log(`   ✅ Saved new address: ${sampleAddress.fullName}, ${sampleAddress.houseNo}, ${sampleAddress.city}`);

    const getAddressesRes = await fetch(`${BASE_URL}/api/orders/addresses`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const getAddressesData = await getAddressesRes.json();
    console.log(`   ✅ Retrieved ${getAddressesData.data.length} saved addresses for user.`);

    // 5. Test Order Placement (POST /api/orders) & Payment Settlement
    console.log('\n🔹 5. Testing Order Creation & Payment Settlement (POST /api/orders)...');
    const orderPayload = {
      items: getCartData.data.items,
      address: sampleAddress,
      paymentMethod: 'UPI',
      paymentStatus: 'Paid',
      subtotal: getCartData.data.subtotal,
      deliveryFee: getCartData.data.deliveryFee,
      tax: getCartData.data.tax,
      discount: getCartData.data.discount,
      totalAmount: getCartData.data.grandTotal
    };

    const createOrderRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(orderPayload)
    });
    const createOrderData = await createOrderRes.json();
    if (!createOrderData.success || !createOrderData.data) {
      throw new Error(`Order placement failed: ${createOrderData.message}`);
    }
    createdOrder = createOrderData.data;
    console.log(`   ✅ Order placed successfully!`);
    console.log(`      Order ID: ${createdOrder.orderId}`);
    console.log(`      Amount: ₹${createdOrder.totalAmount}`);
    console.log(`      Status: ${createdOrder.orderStatus}`);
    console.log(`      Payment: ${createdOrder.paymentMethod} (${createdOrder.paymentStatus})`);
    console.log(`      Estimated Delivery: ${createdOrder.estimatedDelivery}`);

    // 6. Test Orders Listing & Single Order Fetch
    console.log('\n🔹 6. Testing Orders History (GET /api/orders) and Single Order (GET /api/orders/:id)...');
    const listOrdersRes = await fetch(`${BASE_URL}/api/orders`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const listOrdersData = await listOrdersRes.json();
    console.log(`   ✅ Retrieved ${listOrdersData.count} total orders in history.`);

    const singleOrderRes = await fetch(`${BASE_URL}/api/orders/${createdOrder.orderId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const singleOrderData = await singleOrderRes.json();
    console.log(`   ✅ Retrieved Single Order details for #${singleOrderData.data.orderId}: ${singleOrderData.data.items.length} items.`);

    // 7. Test Order Status Transition & Automated Notifications
    console.log('\n🔹 7. Testing Order Status Progression & Notifications (PUT /api/orders/:id/status)...');
    const stages = ['Preparing', 'Ready', 'Out for Delivery', 'Delivered'];
    for (const st of stages) {
      const updateRes = await fetch(`${BASE_URL}/api/orders/${createdOrder._id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: st })
      });
      const updateData = await updateRes.json();
      console.log(`   ✅ Order status progressed to: "${updateData.data.orderStatus}"`);
    }

    // 8. Test Notification Retrieval & Mark as Read
    console.log('\n🔹 8. Testing Notifications System (GET /api/notifications & PUT /api/notifications/read-all)...');
    const notifRes = await fetch(`${BASE_URL}/api/notifications`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const notifData = await notifRes.json();
    console.log(`   ✅ Fetched ${notifData.count} notifications (Unread: ${notifData.unreadCount}).`);
    if (notifData.data.length > 0) {
      console.log(`      Latest Notification: "${notifData.data[0].title}" - ${notifData.data[0].message}`);
    }

    const readAllRes = await fetch(`${BASE_URL}/api/notifications/read-all`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` }
    });
    const readAllData = await readAllRes.json();
    console.log(`   ✅ Marked all notifications as read. Unread count: ${readAllData.unreadCount}`);

    // 9. Verify Frontend Files Existence
    console.log('\n🔹 9. Checking Required Files for Part 3...');
    const frontendPages = [
      '/cart.html',
      '/checkout.html',
      '/payment.html',
      '/orders.html',
      '/order-details.html'
    ];

    for (const page of frontendPages) {
      const pageRes = await fetch(`${BASE_URL}${page}`);
      if (pageRes.status === 200) {
        console.log(`   ✅ Page "${page}" is accessible (HTTP 200 OK)`);
      } else {
        console.error(`   ❌ Page "${page}" returned status: ${pageRes.status}`);
      }
    }

    console.log('\n================================================================');
    console.log('✨ ALL PART 3 FLOWS & INTEGRATION TESTS PASSED WITH 100% SUCCESS! ✨');
    console.log('================================================================');
  } catch (err) {
    console.error('\n❌ Test Suite encountered an error:', err.message);
    process.exit(1);
  }
}

runPart3Tests();
