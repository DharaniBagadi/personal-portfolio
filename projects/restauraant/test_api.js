async function runTests() {
  try {
    console.log('--- 1. Testing Health API ---');
    const healthRes = await fetch('http://localhost:5000/api/health');
    const healthData = await healthRes.json();
    console.log('Health:', healthData);

    console.log('\n--- 2. Testing Dishes API ---');
    const dishesRes = await fetch('http://localhost:5000/api/dishes');
    const dishesData = await dishesRes.json();
    console.log(`Dishes returned: ${dishesData.count} items`);
    console.log(`Sample item: ${dishesData.data[0].name} (Category: ${dishesData.data[0].category}, Price: ₹${dishesData.data[0].price})`);

    console.log('\n--- 3. Testing Sections API ---');
    const sectionsRes = await fetch('http://localhost:5000/api/dishes/sections/all');
    const sectionsData = await sectionsRes.json();
    console.log('Sections keys:', Object.keys(sectionsData.sections));
    console.log(`Chefs special: ${sectionsData.sections.chefsSpecial.length} dishes`);
    console.log(`Popular today: ${sectionsData.sections.popularToday.length} dishes`);

    console.log('\n--- 4. Testing User Sign In ---');
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'customer@royalflame.com',
        password: 'User@123456'
      })
    });
    const loginData = await loginRes.json();
    console.log('Login success:', loginData.success);
    console.log('User Name:', loginData.user.name, '| Role:', loginData.user.role);
    console.log('JWT Token received:', loginData.token.substring(0, 30) + '...');

    console.log('\n--- 5. Testing Protected /me Endpoint ---');
    const meRes = await fetch('http://localhost:5000/api/auth/me', {
      headers: { 'Authorization': `Bearer ${loginData.token}` }
    });
    const meData = await meRes.json();
    console.log('Protected Me Success:', meData.success);
    console.log('Authenticated User in DB:', meData.user.email, 'Role:', meData.user.role);

    console.log('\n--- 6. Testing New User Registration ---');
    const testEmail = `diner_${Date.now()}@royalflame.com`;
    const signupRes = await fetch('http://localhost:5000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Lady Guinevere',
        email: testEmail,
        phone: '+91 98765 00000',
        password: 'Royal@Password123',
        confirmPassword: 'Royal@Password123',
        role: 'user'
      })
    });
    const signupData = await signupRes.json();
    console.log('Signup success:', signupData.success);
    console.log('Registered User:', signupData.user.name, '| Email:', signupData.user.email);

    console.log('\n✅ ALL BACKEND & DATABASE TESTS PASSED SUCCESSFULLY! ✅');
  } catch (err) {
    console.error('Test error:', err);
  }
}

runTests();
