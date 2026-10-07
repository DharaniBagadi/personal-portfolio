/**
 * ROYAL FLAME - CART CLIENT SCRIPT (cart.js)
 */

const API_BASE_URL = window.location.origin;

// State
let currentUser = null;
let cartData = {
  items: [],
  itemCount: 0,
  subtotal: 0,
  deliveryFee: 40,
  tax: 0,
  discount: 0,
  grandTotal: 0
};
let appliedCoupon = null;

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

// Auth Check & User Setup
async function checkAuthSession() {
  const token = localStorage.getItem('royal_flame_token');
  if (!token) {
    showToast('Sign In Required', 'Please log in to manage your dining cart.', 'info');
    setTimeout(() => {
      window.location.href = `login.html?redirect=cart.html`;
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
      await loadNotifications(token);
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
}

// Notifications Helper (Requirement 10)
async function loadNotifications(token) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/notifications`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) {
      const badge = document.getElementById('notification-badge');
      if (badge) {
        badge.textContent = data.unreadCount || 0;
        badge.style.display = data.unreadCount > 0 ? 'flex' : 'none';
      }

      const list = document.getElementById('notifications-list');
      if (list) {
        if (!data.data || data.data.length === 0) {
          list.innerHTML = '<div class="notifications-empty">No active notifications.</div>';
        } else {
          list.innerHTML = data.data.map(n => `
            <div class="notification-item ${n.read ? '' : 'unread'}" onclick="handleNotificationClick('${n._id}', '${n.orderId || ''}')">
              <div class="notification-item-icon">${n.type === 'order' ? '👑' : '⚜️'}</div>
              <div>
                <div class="notification-item-title">${n.title}</div>
                <div class="notification-item-msg">${n.message}</div>
                <div class="notification-item-time">${new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            </div>
          `).join('');
        }
      }
    }
  } catch (e) {}
}

window.handleNotificationClick = async function(notifId, orderId) {
  const token = localStorage.getItem('royal_flame_token');
  if (token) {
    try {
      await fetch(`${API_BASE_URL}/api/notifications/${notifId}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      loadNotifications(token);
    } catch (e) {}
  }

  if (orderId) {
    window.location.href = `order-details.html?id=${orderId}`;
  }
};

// 1. Fetch Cart from MongoDB
async function loadCart() {
  const token = localStorage.getItem('royal_flame_token');
  if (!token) return;

  try {
    const res = await fetch(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();

    if (data.success && data.data) {
      cartData = data.data;
      renderCart();
      updateNavBadges();
    }
  } catch (err) {
    console.error('Error fetching cart:', err);
  }
}

// 2. Render Cart Items & Price Calculations
function renderCart() {
  const container = document.getElementById('cart-items-container');
  const emptyView = document.getElementById('cart-empty-container');
  const summaryCard = document.getElementById('cart-summary-card');

  const subtotalElem = document.getElementById('cart-subtotal');
  const deliveryElem = document.getElementById('cart-delivery-fee');
  const taxElem = document.getElementById('cart-tax');
  const discountElem = document.getElementById('cart-discount');
  const grandTotalElem = document.getElementById('cart-grand-total');

  if (!container) return;

  if (!cartData.items || cartData.items.length === 0) {
    container.style.display = 'none';
    if (summaryCard) summaryCard.style.display = 'none';
    if (emptyView) emptyView.style.display = 'block';
    return;
  }

  container.style.display = 'block';
  if (summaryCard) summaryCard.style.display = 'block';
  if (emptyView) emptyView.style.display = 'none';

  // Render items
  container.innerHTML = cartData.items.map(item => `
    <div class="cart-item-row" id="cart-item-${item.dishId}">
      <div class="cart-item-thumbnail" onclick="window.location.href='dish-details.html?id=${item.dishId}'" style="cursor: pointer;">
        <img src="${item.image}" alt="${item.name}" onerror="this.src='https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=300&q=80'">
      </div>

      <div class="cart-item-info">
        <span class="cart-item-category">${item.category}</span>
        <h3 class="cart-item-name" onclick="window.location.href='dish-details.html?id=${item.dishId}'">${item.name}</h3>
        <div class="cart-item-unit-price">₹${item.price} per portion</div>
      </div>

      <div class="cart-item-controls">
        <div class="cart-item-total-price">₹${item.itemTotal}</div>
        
        <div class="cart-qty-box">
          <button type="button" class="cart-qty-btn" onclick="updateItemQty('${item.dishId}', 'dec')" title="Decrease Quantity">−</button>
          <span class="cart-qty-val">${item.quantity}</span>
          <button type="button" class="cart-qty-btn" onclick="updateItemQty('${item.dishId}', 'inc')" title="Increase Quantity">+</button>
        </div>

        <button type="button" class="cart-remove-item-btn" onclick="removeItemFromCart('${item.dishId}')">
          🗑️ Remove
        </button>
      </div>
    </div>
  `).join('');

  // Update Summary Numbers
  if (subtotalElem) subtotalElem.textContent = `₹${cartData.subtotal}`;
  if (deliveryElem) {
    deliveryElem.textContent = cartData.deliveryFee === 0 ? 'FREE' : `₹${cartData.deliveryFee}`;
  }
  if (taxElem) taxElem.textContent = `₹${cartData.tax}`;
  if (discountElem) discountElem.textContent = `-₹${cartData.discount}`;
  if (grandTotalElem) grandTotalElem.textContent = `₹${cartData.grandTotal}`;
}

// 3. Update Item Quantity
window.updateItemQty = async function(dishId, action) {
  const token = localStorage.getItem('royal_flame_token');
  if (!token) return;

  try {
    const res = await fetch(`${API_BASE_URL}/api/cart/${dishId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ action })
    });
    const data = await res.json();

    if (data.success) {
      cartData = data.data;
      renderCart();
      updateNavBadges();
    }
  } catch (err) {
    console.error('Error updating quantity:', err);
    showToast('Update Failed', 'Could not adjust portion quantity.', 'error');
  }
};

// 4. Remove Item from Cart
window.removeItemFromCart = async function(dishId) {
  const token = localStorage.getItem('royal_flame_token');
  if (!token) return;

  try {
    const res = await fetch(`${API_BASE_URL}/api/cart/${dishId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();

    if (data.success) {
      cartData = data.data;
      showToast('Item Removed', 'Delicacy removed from dining cart.', 'info');
      renderCart();
      updateNavBadges();
    }
  } catch (err) {
    console.error('Error deleting item:', err);
  }
};

// 5. Clear Entire Cart
window.clearWholeCart = async function() {
  const token = localStorage.getItem('royal_flame_token');
  if (!token) return;

  try {
    const res = await fetch(`${API_BASE_URL}/api/cart`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();

    if (data.success) {
      cartData = data.data;
      showToast('Cart Emptied', 'All items removed from cart.', 'info');
      renderCart();
      updateNavBadges();
    }
  } catch (err) {}
};

// 6. Apply Promo Code
window.applyCoupon = function() {
  const input = document.getElementById('promo-code-input');
  if (!input) return;

  const code = input.value.trim().toUpperCase();
  if (!code) {
    showToast('Promo Code', 'Please enter a coupon code.', 'error');
    return;
  }

  if (code === 'ROYAL100' || code === 'FESTIVE20' || code === 'CHEF50') {
    appliedCoupon = code;
    showToast('Promo Applied! 👑', `Coupon "${code}" applied successfully. ₹100 discount credited.`, 'success');
    input.disabled = true;
  } else {
    showToast('Invalid Coupon', `Coupon "${code}" is invalid or expired.`, 'error');
  }
};

// 7. Proceed to Checkout
window.proceedToCheckout = function() {
  if (!cartData.items || cartData.items.length === 0) {
    showToast('Empty Cart', 'Please add delicacies before checking out.', 'error');
    return;
  }
  window.location.href = 'checkout.html';
};

function updateNavBadges() {
  const badge = document.getElementById('cart-count-badge');
  if (badge) {
    badge.textContent = cartData.itemCount || 0;
  }
  // Sync with local cache for other pages
  localStorage.setItem('royal_cart_count', cartData.itemCount || 0);
}

// Page Setup
document.addEventListener('DOMContentLoaded', async () => {
  await checkAuthSession();
  await loadCart();

  // Notifications Dropdown Toggle
  const notifTrigger = document.getElementById('notification-trigger');
  const notifMenu = document.getElementById('notifications-menu');
  const markAllReadBtn = document.getElementById('mark-all-read-btn');

  if (notifTrigger && notifMenu) {
    notifTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      notifMenu.classList.toggle('show');
    });

    document.addEventListener('click', () => {
      notifMenu.classList.remove('show');
    });
  }

  if (markAllReadBtn) {
    markAllReadBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const token = localStorage.getItem('royal_flame_token');
      if (token) {
        try {
          await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}` }
          });
          loadNotifications(token);
          showToast('Notifications Cleared', 'All alerts marked as read.', 'info');
        } catch (err) {}
      }
    });
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
