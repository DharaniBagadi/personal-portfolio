/**
 * ROYAL FLAME - LUXURY RESTAURANT AUTHENTICATION SCRIPT (auth.js)
 */

const API_BASE_URL = window.location.origin;

// Toast Notification Helper
function showToast(title, message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const iconMap = {
    success: '✨',
    error: '⚠️',
    info: '⚜️'
  };

  toast.innerHTML = `
    <div class="toast-icon">${iconMap[type] || '⚜️'}</div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
  `;

  container.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

document.addEventListener('DOMContentLoaded', () => {
  // Check if user already has an active token
  const existingToken = localStorage.getItem('royal_flame_token');
  if (existingToken) {
    // Verify token validity
    fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${existingToken}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          // If valid session, auto-redirect to home.html
          window.location.href = 'home.html';
        } else {
          localStorage.removeItem('royal_flame_token');
          localStorage.removeItem('royal_flame_user');
        }
      })
      .catch(() => {
        // Continue on auth page if error
      });
  }

  // Element Selectors
  const tabSignin = document.getElementById('tab-signin');
  const tabSignup = document.getElementById('tab-signup');
  const formSignin = document.getElementById('form-signin');
  const formSignup = document.getElementById('form-signup');
  const authTitle = document.getElementById('auth-card-title');
  const authSubtitle = document.getElementById('auth-card-subtitle');

  // Tab Switcher
  if (tabSignin && tabSignup) {
    tabSignin.addEventListener('click', () => {
      tabSignin.classList.add('active');
      tabSignup.classList.remove('active');
      formSignin.classList.add('active');
      formSignup.classList.remove('active');
      authTitle.innerHTML = 'Sign <span class="gold-text">In</span>';
      authSubtitle.textContent = 'Welcome back to your royal culinary experience';
    });

    tabSignup.addEventListener('click', () => {
      tabSignup.classList.add('active');
      tabSignin.classList.remove('active');
      formSignup.classList.add('active');
      formSignin.classList.remove('active');
      authTitle.innerHTML = 'Create <span class="gold-text">Account</span>';
      authSubtitle.textContent = 'Join Royal Flame to enjoy bespoke dining & delicacies';
    });
  }

  // Switch to Signup from Signin link
  const switchToSignup = document.getElementById('switch-to-signup');
  if (switchToSignup) {
    switchToSignup.addEventListener('click', (e) => {
      e.preventDefault();
      tabSignup.click();
    });
  }

  // Password visibility toggle
  document.querySelectorAll('.toggle-password').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.previousElementSibling;
      if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '👁️';
      } else {
        input.type = 'password';
        btn.textContent = '👁️‍🗨️';
      }
    });
  });

  

  // Quick Demo Account Buttons
  const demoCustomerBtn = document.getElementById('demo-customer-btn');
  const demoAdminBtn = document.getElementById('demo-admin-btn');

  if (demoCustomerBtn) {
    demoCustomerBtn.addEventListener('click', () => {
      tabSignin.click();
      document.getElementById('signin-email').value = 'customer@royalflame.com';
      document.getElementById('signin-password').value = 'User@123456';
      showToast('Demo Credentials Filled', 'Customer account details loaded. Click Sign In to enter.', 'info');
    });
  }

  if (demoAdminBtn) {
    demoAdminBtn.addEventListener('click', () => {
      tabSignin.click();
      document.getElementById('signin-email').value = 'admin@royalflame.com';
      document.getElementById('signin-password').value = 'Admin@123456';
      showToast('Demo Credentials Filled', 'Executive Chef Admin account loaded. Click Sign In.', 'info');
    });
  }

  // Handle Sign In Submission
  if (formSignin) {
    formSignin.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('signin-email').value.trim();
      const password = document.getElementById('signin-password').value;
      const submitBtn = formSignin.querySelector('button[type="submit"]');

      if (!email || !password) {
        showToast('Validation Error', 'Please enter both your Email ID and Password.', 'error');
        return;
      }

      try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Authenticating...</span>';

        const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (data.success) {
          localStorage.setItem('royal_flame_token', data.token);
          localStorage.setItem('royal_flame_user', JSON.stringify(data.user));

          showToast('Welcome to Royal Flame', `Welcome back, ${data.user.name}! Redirecting to dining hall...`, 'success');

          setTimeout(() => {
            window.location.href = 'home.html';
          }, 1000);
        } else {
          showToast('Sign In Failed', data.message || 'Invalid email or password.', 'error');
        }
      } catch (err) {
        showToast('Server Connection Error', 'Unable to connect to Royal Flame server. Please ensure backend is running.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Sign In to Experience</span> ➔';
      }
    });
  }

  // Handle Sign Up Submission
  if (formSignup) {
    formSignup.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('signup-name').value.trim();
      const email = document.getElementById('signup-email').value.trim();
      const phone = document.getElementById('signup-phone').value.trim();
      const password = document.getElementById('signup-password').value;
      const confirmPassword = document.getElementById('signup-confirm-password').value;
      const submitBtn = formSignup.querySelector('button[type="submit"]');

      // Validations
      if (!name || !email || !phone || !password || !confirmPassword) {
        showToast('Validation Error', 'Please complete all required registration fields.', 'error');
        return;
      }

      if (name.length < 2) {
        showToast('Validation Error', 'Full name must contain at least 2 characters.', 'error');
        return;
      }

      const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/;
      if (!emailRegex.test(email)) {
        showToast('Validation Error', 'Please enter a valid email address.', 'error');
        return;
      }

      const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;
      if (!phoneRegex.test(phone)) {
        showToast('Validation Error', 'Please enter a valid phone number with digits.', 'error');
        return;
      }

      const passwordRegex =
        /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,72}$/;

      if (!passwordRegex.test(password)) {
        showToast(
          'Weak Password',
          'Password must be at least 8 characters and contain a letter, number, and special character.',
          'error'
        );
        return;
      }

      if (password !== confirmPassword) {
        showToast('Validation Error', 'Password and Confirm Password do not match.', 'error');
        return;
      }

      try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Creating Royal Account...</span>';

        const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
          name,
          email,
          phone,
          password,
          confirmPassword
          })
        });

        const data = await res.json();

        if (data.success) {
          localStorage.setItem('royal_flame_token', data.token);
          localStorage.setItem('royal_flame_user', JSON.stringify(data.user));

          showToast('Account Created!', 'Welcome to Royal Flame! Your royal table is ready.', 'success');

          setTimeout(() => {
            window.location.href = 'home.html';
          }, 1200);
        } else {
          showToast('Registration Error', data.message || 'Unable to register account.', 'error');
        }
      } catch (err) {
        showToast('Server Connection Error', 'Unable to connect to Royal Flame server.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Complete Registration</span> ➔';
      }
    });
  }

  // Forgot Password
  const forgotBtn =
  document.getElementById('forgot-password-link');

  if (forgotBtn) {

    forgotBtn.addEventListener('click', async (e) => {

      e.preventDefault();

      const emailInput =
      document.getElementById('signin-email');

      const email =
      emailInput.value.trim();

      if (!email) {

        showToast(
        'Email Required',
        'Please enter your registered email address first.',
        'error'
        );

        emailInput.focus();

        return;
      }

      try {

        forgotBtn.textContent = 'Sending...';
        forgotBtn.style.pointerEvents = 'none';

        const response = await fetch(
        `${API_BASE_URL}/api/auth/forgot-password`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json'
          },

          body: JSON.stringify({
            email
          })
        }
        );

        const data = await response.json();

        showToast(
        'Password Reset',
        data.message ||
          'If an account exists, a reset link has been sent.',
        data.success ? 'success' : 'error'
        );

      } 
      catch (error) {

        console.error(error);

        showToast(
        'Server Error',
        'Unable to process password reset request.',
        'error'
        );

      } 
      finally {

        forgotBtn.textContent = 'Forgot Password?';
        forgotBtn.style.pointerEvents = 'auto';

      }

    });

  }
});
