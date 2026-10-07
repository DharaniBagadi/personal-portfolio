/**
 * ROYAL FLAME - CHECKOUT & ADDRESS CLIENT SCRIPT (checkout.js)
 */

const API_BASE_URL = window.location.origin;

// State
let currentUser = null;
let savedAddresses = [];
let selectedAddressId = null;
let checkoutItems = [];
let checkoutTotals = {
  subtotal: 0,
  deliveryFee: 40,
  tax: 0,
  discount: 0,
  grandTotal: 0
};
let isBuyNowMode = false;

// Toast Helper
function showToast(title, message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const iconMap = { success: '✨', error: '⚠️', info: '⚜️' };

  toast.innerHTML = `
    <div class="toast-icon">${iconMap[type] || '⚜️'}</div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
  `;

  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

// Auth Check
async function checkAuthSession() {
  const token = localStorage.getItem('royal_flame_token');
  if (!token) {
    showToast('Sign In Required', 'Please sign in to complete checkout.', 'info');
    setTimeout(() => {
      window.location.href = `login.html?redirect=checkout.html`;
    }, 1200);
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();

    if (data.success && data.user) {
      currentUser = data.user;
      updateUserProfileUI(currentUser);
    }
  } catch (err) {
    const cached = localStorage.getItem('royal_flame_user');
    if (cached) {
      currentUser = JSON.parse(cached);
      updateUserProfileUI(currentUser);
    }
  }
}

function updateUserProfileUI(user) {
  if (!user) return;
  const usernameDisplay = document.getElementById('navbar-username');
  const menuUserName = document.getElementById('menu-user-name');
  const menuUserEmail = document.getElementById('menu-user-email');
  const menuUserRole = document.getElementById('menu-user-role');
  const avatarLetter = document.getElementById('user-avatar-letter');

  if (usernameDisplay) usernameDisplay.textContent = user.name.split(' ')[0];
  if (menuUserName) menuUserName.textContent = user.name;
  if (menuUserEmail) menuUserEmail.textContent = user.email;
  if (menuUserRole) menuUserRole.textContent = user.role.toUpperCase();
  if (avatarLetter) avatarLetter.textContent = user.name.charAt(0).toUpperCase();

  // Prefill new address modal fields with user default info
  const nameInput = document.getElementById('addr-name');
  const phoneInput = document.getElementById('addr-phone');
  if (nameInput && !nameInput.value) nameInput.value = user.name || '';
  if (phoneInput && !phoneInput.value) phoneInput.value = user.phone || '';
}

// 1. Fetch Saved Addresses from MongoDB
async function loadAddresses() {
  const token = localStorage.getItem('royal_flame_token');
  if (!token) return;

  try {
    const res = await fetch(`${API_BASE_URL}/api/orders/addresses`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();

    if (data.success && Array.isArray(data.data)) {
      savedAddresses = data.data;

      // Select default address or first address
      if (savedAddresses.length > 0) {
        const defaultAddr = savedAddresses.find(a => a.isDefault) || savedAddresses[0];
        selectedAddressId = defaultAddr._id;
      }
      renderAddresses();
    }
  } catch (err) {
    console.error('Error loading addresses:', err);
  }
}

// 2. Render Address Cards
function renderAddresses() {
  const container = document.getElementById('saved-addresses-grid');
  const noAddressNotice = document.getElementById('no-address-notice');

  if (!container) return;

  if (savedAddresses.length === 0) {
    container.innerHTML = '';
    if (noAddressNotice) noAddressNotice.style.display = 'block';
    openAddressForm();
    return;
  }

  if (noAddressNotice) noAddressNotice.style.display = 'none';

  container.innerHTML = savedAddresses.map(addr => {
    const isSelected = addr._id === selectedAddressId;
    return `
      <div class="address-card ${isSelected ? 'selected' : ''}" onclick="selectAddress('${addr._id}')">
        <div class="address-header">
          <span class="address-recipient">${addr.fullName}</span>
          ${addr.isDefault ? `<span class="address-default-pill">Default</span>` : ''}
        </div>
        <p class="address-text">
          ${addr.houseNo}, ${addr.street}, ${addr.area}<br>
          ${addr.city}, ${addr.state} - ${addr.pincode}
          ${addr.landmark ? `<br><small style="color:var(--text-muted);">Landmark: ${addr.landmark}</small>` : ''}
        </p>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top: 8px;">
          <span class="address-phone">📞 ${addr.phone}</span>
          <input type="radio" name="selectedAddress" class="address-radio" ${isSelected ? 'checked' : ''} onclick="selectAddress('${addr._id}')">
        </div>
      </div>
    `;
  }).join('');
}

window.selectAddress = function(addrId) {
  selectedAddressId = addrId;
  renderAddresses();
};

// 3. Add New Address Form Handlers
window.openAddressForm = function() {
  const formBox = document.getElementById('add-address-form-box');
  if (formBox) {
    formBox.style.display = 'block';
    formBox.scrollIntoView({ behavior: 'smooth' });
  }
};

window.closeAddressForm = function() {
  const formBox = document.getElementById('add-address-form-box');
  if (formBox) {
    formBox.style.display = 'none';
  }
};

window.saveNewAddress = async function(e) {
  if (e) e.preventDefault();
  const token = localStorage.getItem('royal_flame_token');
  if (!token) return;

  const fullName = document.getElementById('addr-name').value.trim();
  const phone = document.getElementById('addr-phone').value.trim();
  const houseNo = document.getElementById('addr-house').value.trim();
  const street = document.getElementById('addr-street').value.trim();
  const area = document.getElementById('addr-area').value.trim();
  const city = document.getElementById('addr-city').value.trim();
  const state = document.getElementById('addr-state').value.trim();
  const pincode = document.getElementById('addr-pincode').value.trim();
  const landmark = document.getElementById('addr-landmark').value.trim();
  const isDefault = document.getElementById('addr-default').checked;

  if (!fullName || !phone || !houseNo || !street || !area || !city || !state || !pincode) {
    showToast('Missing Fields', 'Please complete all required address details.', 'error');
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/orders/addresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        fullName, phone, houseNo, street, area, city, state, pincode, landmark, isDefault
      })
    });
    const data = await res.json();

    if (data.success) {
      showToast('Address Saved! 📍', 'New delivery address added to your profile.', 'success');
      savedAddresses = data.addresses || [];
      if (data.data && data.data._id) {
        selectedAddressId = data.data._id;
      }
      closeAddressForm();
      renderAddresses();
    } else {
      showToast('Error', data.message || 'Failed to save address.', 'error');
    }
  } catch (err) {
    console.error('Error saving address:', err);
    showToast('Network Glitch', 'Could not save delivery address.', 'error');
  }
};

// 4. Load Order Items (from Cart or Buy Now)
async function loadCheckoutItems() {
  const token = localStorage.getItem('royal_flame_token');
  const urlParams = new URLSearchParams(window.location.search);
  const buyNowId = urlParams.get('buyNow');
  const buyNowQty = parseInt(urlParams.get('qty') || '1', 10);

  if (buyNowId) {
    isBuyNowMode = true;
    try {
      const res = await fetch(`${API_BASE_URL}/api/dishes/${buyNowId}`);
      const data = await res.json();
      if (data.success && data.data) {
        const dish = data.data;
        const finalPrice = dish.discount > 0 ? Math.round(dish.price * (1 - dish.discount / 100)) : dish.price;
        const itemTotal = finalPrice * buyNowQty;

        checkoutItems = [{
          dishId: dish._id,
          _id: dish._id,
          name: dish.name,
          category: dish.category,
          image: dish.image,
          price: finalPrice,
          quantity: buyNowQty,
          itemTotal
        }];

        const subtotal = itemTotal;
        const deliveryFee = 40;
        const tax = Math.round(subtotal * 0.05);
        const discount = subtotal >= 500 ? 100 : 0;
        const grandTotal = subtotal + deliveryFee + tax - discount;

        checkoutTotals = { subtotal, deliveryFee, tax, discount, grandTotal };
        renderCheckoutReview();
        return;
      }
    } catch (err) {
      console.error('Error loading buy now item:', err);
    }
  }

  // Standard Cart Mode
  if (token) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/cart`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.success && data.data && data.data.items && data.data.items.length > 0) {
        checkoutItems = data.data.items;
        checkoutTotals = {
          subtotal: data.data.subtotal,
          deliveryFee: data.data.deliveryFee,
          tax: data.data.tax,
          discount: data.data.discount,
          grandTotal: data.data.grandTotal
        };
        renderCheckoutReview();
        return;
      }
    } catch (err) {
      console.error('Error loading cart for checkout:', err);
    }
  }

  // If cart is empty
  showToast('Empty Order', 'Please add delicacies before accessing checkout.', 'info');
  setTimeout(() => { window.location.href = 'menu.html'; }, 1500);
}

// 5. Render Order Items Review & Price Details
function renderCheckoutReview() {
  const itemsContainer = document.getElementById('checkout-items-list');
  const subtotalElem = document.getElementById('checkout-subtotal');
  const deliveryElem = document.getElementById('checkout-delivery');
  const taxElem = document.getElementById('checkout-tax');
  const discountElem = document.getElementById('checkout-discount');
  const totalElem = document.getElementById('checkout-total');

  if (itemsContainer) {
    itemsContainer.innerHTML = checkoutItems.map(item => `
      <div class="checkout-item-compact">
        <img src="${item.image}" alt="${item.name}" class="checkout-item-img" onerror="this.src='https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=200&q=80'">
        <div class="checkout-item-details">
          <div class="checkout-item-title">${item.name}</div>
          <div class="checkout-item-meta">Qty: ${item.quantity} &bull; ₹${item.price} each</div>
        </div>
        <div class="checkout-item-price">₹${item.price * item.quantity}</div>
      </div>
    `).join('');
  }

  if (subtotalElem) subtotalElem.textContent = `₹${checkoutTotals.subtotal}`;
  if (deliveryElem) deliveryElem.textContent = checkoutTotals.deliveryFee === 0 ? 'FREE' : `₹${checkoutTotals.deliveryFee}`;
  if (taxElem) taxElem.textContent = `₹${checkoutTotals.tax}`;
  if (discountElem) discountElem.textContent = `-₹${checkoutTotals.discount}`;
  if (totalElem) totalElem.textContent = `₹${checkoutTotals.grandTotal}`;
}

// 6. Continue to Payment
window.continueToPayment = function() {
  if (!selectedAddressId) {
    showToast('Delivery Address Required', 'Please select or add a delivery address to proceed.', 'error');
    openAddressForm();
    return;
  }

  const selectedAddress = savedAddresses.find(a => a._id === selectedAddressId);
  if (!selectedAddress) {
    showToast('Invalid Address', 'Please select a valid delivery address.', 'error');
    return;
  }

  const checkoutPayload = {
    items: checkoutItems,
    address: selectedAddress,
    subtotal: checkoutTotals.subtotal,
    deliveryFee: checkoutTotals.deliveryFee,
    tax: checkoutTotals.tax,
    discount: checkoutTotals.discount,
    totalAmount: checkoutTotals.grandTotal,
    isBuyNow: isBuyNowMode
  };

  sessionStorage.setItem('royal_checkout_payload', JSON.stringify(checkoutPayload));
  window.location.href = 'payment.html';
};

// Page Setup
document.addEventListener('DOMContentLoaded', async () => {
  await checkAuthSession();
  await loadAddresses();
  await loadCheckoutItems();

  const addAddressForm = document.getElementById('add-address-form');
  if (addAddressForm) {
    addAddressForm.addEventListener('submit', window.saveNewAddress);
  }

  // Profile Dropdown
  const profileTrigger = document.getElementById('profile-trigger');
  const profileMenu = document.getElementById('profile-menu');
  if (profileTrigger && profileMenu) {
    profileTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      profileMenu.classList.toggle('show');
    });
    document.addEventListener('click', () => {
      profileMenu.classList.remove('show');
    });
  }

  // Logout Handler
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await fetch(`${API_BASE_URL}/api/auth/logout`, { method: 'POST' });
      } catch (e) {}

      localStorage.removeItem('royal_flame_token');
      localStorage.removeItem('royal_flame_user');
      showToast('Signed Out', 'You have been signed out from Royal Flame.', 'info');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 800);
    });
  }
});
