/**
 * ROYAL FLAME - WISHLIST CLIENT SCRIPT (wishlist.js)
 */

const API_BASE_URL = window.location.origin;

// State
let currentUser = null;
let wishlistDishes = [];
let cartItems = JSON.parse(localStorage.getItem('royal_cart') || '[]');

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

  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

// Check Authentication Session
async function checkAuthSession() {
  const token = localStorage.getItem('royal_flame_token');
  if (!token) {
    showToast('Guest Mode', 'Sign in to save your wishlist permanently in the Royal Cloud.', 'info');
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
}

// Load User Wishlist (from MongoDB / fallback to local cache)
async function loadWishlist() {
  const token = localStorage.getItem('royal_flame_token');

  if (token) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/wishlist`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.success && Array.isArray(data.data)) {
        wishlistDishes = data.data;
        // Update local storage set
        const ids = wishlistDishes.map(d => d._id);
        localStorage.setItem('royal_wishlist', JSON.stringify(ids));
        renderWishlist();
        return;
      }
    } catch (err) {
      console.warn('Error fetching wishlist from DB:', err);
    }
  }

  // Fallback to local storage ids
  const localIds = JSON.parse(localStorage.getItem('royal_wishlist') || '[]');
  if (localIds.length > 0) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/dishes`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        wishlistDishes = data.data.filter(d => localIds.includes(d._id));
      }
    } catch (e) {}
  } else {
    wishlistDishes = [];
  }

  renderWishlist();
}

// Render Wishlist Page
function renderWishlist() {
  const grid = document.getElementById('wishlist-grid');
  const countDisplay = document.getElementById('wishlist-count-display');
  const batchActions = document.getElementById('wishlist-batch-actions');

  updateWishlistBadge(wishlistDishes.length);

  if (countDisplay) {
    countDisplay.textContent = wishlistDishes.length;
  }

  if (batchActions) {
    batchActions.style.display = wishlistDishes.length > 0 ? 'flex' : 'none';
  }

  if (!grid) return;

  if (wishlistDishes.length === 0) {
    grid.innerHTML = `
      <div class="wishlist-empty-box">
        <span class="wishlist-empty-icon">⚜️</span>
        <h3 class="wishlist-empty-title">Your Royal Wishlist is Empty</h3>
        <p class="wishlist-empty-desc">
          Explore our prestigious Gourmet Menu Book and save your favorite fine dining delicacies to savor on your next royal visit.
        </p>
        <a href="menu.html" class="btn btn-primary" style="padding: 0.85rem 2rem;">
          📖 Explore Gourmet Menu
        </a>
      </div>
    `;
    return;
  }

  grid.innerHTML = wishlistDishes.map(dish => createWishlistCardHTML(dish)).join('');
}

function createWishlistCardHTML(dish) {
  const finalPrice = dish.discount > 0 ? Math.round(dish.price * (1 - dish.discount / 100)) : dish.price;
  const isVeg = dish.foodType === 'veg';

  return `
    <div class="dish-card" id="wishlist-card-${dish._id}" data-id="${dish._id}">
      <div class="dish-image-wrapper">
        <img 
          src="${dish.image}" 
          alt="${dish.name}" 
          class="dish-img" 
          loading="lazy" 
          onclick="window.location.href='dish-details.html?id=${dish._id}'" 
          style="cursor: pointer;"
          onerror="this.src='https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80'"
        >
        
        ${dish.discount > 0 ? `<div class="dish-discount-tag">${dish.discount}% OFF</div>` : ''}
        
        <button 
          class="wishlist-remove-btn" 
          onclick="removeFromWishlist('${dish._id}', event)" 
          title="Remove from Wishlist"
        >
          🗑️
        </button>

        <div class="dish-meta-overlay">
          <span class="dish-time-badge">⏱️ ${dish.preparationTime || '20 mins'}</span>
          <span class="dish-time-badge">🔥 ${dish.calories || '450'} kcal</span>
        </div>
      </div>

      <div class="dish-details">
        <div class="dish-header-row">
          <span class="dish-category-label">${dish.category}</span>
          <span class="${isVeg ? 'veg-indicator' : 'non-veg-indicator'}" title="${isVeg ? 'Vegetarian' : 'Non-Vegetarian'}"></span>
        </div>

        <h3 class="dish-name" style="cursor: pointer;" onclick="window.location.href='dish-details.html?id=${dish._id}'">${dish.name}</h3>
        <p class="dish-description">${dish.description}</p>

        <div class="dish-rating-price-row">
          <div class="dish-rating-pill">
            <span>⭐ ${dish.rating.toFixed(1)}</span>
            <span class="dish-reviews-count">(${dish.numReviews})</span>
          </div>

          <div class="dish-pricing">
            <span class="dish-current-price">₹${finalPrice}</span>
            ${dish.discount > 0 ? `<span class="dish-original-price">₹${dish.price}</span>` : ''}
          </div>
        </div>

        <div class="dish-actions" onclick="event.stopPropagation()">
          <button class="btn btn-outline dish-btn" onclick="addToCart('${dish._id}', event)">
            🛒 Add to Cart
          </button>
          <button class="btn btn-primary dish-btn" onclick="buyNow('${dish._id}', event)">
            ⚡ Buy Now
          </button>
        </div>
      </div>
    </div>
  `;
}

// Remove Item from Wishlist
window.removeFromWishlist = async function(dishId, event) {
  if (event) event.stopPropagation();

  const token = localStorage.getItem('royal_flame_token');
  const removedDish = wishlistDishes.find(d => d._id === dishId);

  wishlistDishes = wishlistDishes.filter(d => d._id !== dishId);

  // Update localStorage
  const ids = wishlistDishes.map(d => d._id);
  localStorage.setItem('royal_wishlist', JSON.stringify(ids));

  // Animate and re-render
  const cardElem = document.getElementById(`wishlist-card-${dishId}`);
  if (cardElem) {
    cardElem.style.transition = 'all 0.35s ease';
    cardElem.style.opacity = '0';
    cardElem.style.transform = 'scale(0.9)';
    setTimeout(() => {
      renderWishlist();
    }, 350);
  } else {
    renderWishlist();
  }

  showToast('Removed from Wishlist', `${removedDish ? removedDish.name : 'Delicacy'} removed from wishlist.`, 'info');

  if (token) {
    try {
      await fetch(`${API_BASE_URL}/api/wishlist/${dishId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Error deleting from DB wishlist:', err);
    }
  }
};

// Batch Action: Add All to Cart (Requirement 1, 2)
window.addAllWishlistToCart = async function() {
  if (wishlistDishes.length === 0) return;

  const token = localStorage.getItem('royal_flame_token');

  for (const dish of wishlistDishes) {
    const finalPrice = dish.discount > 0 ? Math.round(dish.price * (1 - dish.discount / 100)) : dish.price;
    const existing = cartItems.find(item => item._id === dish._id);
    if (existing) {
      existing.quantity += 1;
    } else {
      cartItems.push({
        _id: dish._id,
        name: dish.name,
        price: finalPrice,
        image: dish.image,
        category: dish.category,
        quantity: 1
      });
    }

    if (token) {
      try {
        await fetch(`${API_BASE_URL}/api/cart`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ dishId: dish._id, quantity: 1 })
        });
      } catch (e) {}
    }
  }

  saveCart();
  updateCartBadge();
  showToast('Added All to Cart 🛒', `All ${wishlistDishes.length} delicacies moved to your dining order.`, 'success');
  setTimeout(() => { window.location.href = 'cart.html'; }, 800);
};

// Cart Functionality
window.addToCart = async function(dishId, event) {
  if (event) event.stopPropagation();

  const dish = wishlistDishes.find(d => d._id === dishId);
  if (!dish) return;

  const existing = cartItems.find(item => item._id === dishId);
  const finalPrice = dish.discount > 0 ? Math.round(dish.price * (1 - dish.discount / 100)) : dish.price;

  if (existing) {
    existing.quantity += 1;
  } else {
    cartItems.push({
      _id: dish._id,
      name: dish.name,
      price: finalPrice,
      image: dish.image,
      category: dish.category,
      quantity: 1
    });
  }

  saveCart();
  updateCartBadge();
  showToast('Added to Cart 🛒', `${dish.name} added to your dining order.`, 'success');

  const token = localStorage.getItem('royal_flame_token');
  if (token) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ dishId, quantity: 1 })
      });
      const data = await res.json();
      if (data.success && data.data) {
        const badge = document.getElementById('cart-count-badge');
        if (badge) badge.textContent = data.data.itemCount;
      }
    } catch (e) {}
  }
};

window.buyNow = function(dishId, event) {
  if (event) event.stopPropagation();
  window.location.href = `checkout.html?buyNow=${dishId}&qty=1`;
};

// Notifications Support (Requirement 10)
async function loadNotifications(token) {
  if (!token) return;
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

function saveCart() {
  localStorage.setItem('royal_cart', JSON.stringify(cartItems));
  renderCartDrawer();
}

function updateCartBadge() {
  const badge = document.getElementById('cart-count-badge');
  if (badge) {
    const count = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    badge.textContent = count;
  }
}

function updateWishlistBadge(count) {
  const badge = document.getElementById('wishlist-count-badge');
  if (badge) {
    badge.textContent = count !== undefined ? count : wishlistDishes.length;
  }
}

function renderCartDrawer() {
  const container = document.getElementById('cart-items-body');
  const subtotalElem = document.getElementById('cart-subtotal');
  const taxElem = document.getElementById('cart-tax');
  const totalElem = document.getElementById('cart-total');

  if (!container) return;

  if (cartItems.length === 0) {
    container.innerHTML = `
      <div class="cart-empty-state">
        <span style="font-size: 3rem;">🍽️</span>
        <h4 style="font-family: var(--font-serif); color: var(--gold-300); font-size: 1.2rem;">Your Royal Cart is Empty</h4>
        <p style="font-size: 0.85rem; color: var(--text-muted); max-width: 250px;">Select delicacies to place your order.</p>
      </div>
    `;
    if (subtotalElem) subtotalElem.textContent = '₹0';
    if (taxElem) taxElem.textContent = '₹0';
    if (totalElem) totalElem.textContent = '₹0';
    return;
  }

  container.innerHTML = cartItems.map(item => `
    <div class="cart-item">
      <img src="${item.image}" alt="${item.name}" class="cart-item-img" onerror="this.src='https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=200&q=80'">
      <div class="cart-item-info">
        <h4 class="cart-item-title">${item.name}</h4>
        <div class="cart-item-price">₹${item.price * item.quantity}</div>
        <div class="cart-qty-controls">
          <button class="qty-btn" onclick="updateQty('${item._id}', -1)">−</button>
          <span class="qty-num">${item.quantity}</span>
          <button class="qty-btn" onclick="updateQty('${item._id}', 1)">+</button>
          <button class="qty-btn" style="margin-left: auto; color: #f87171; border-color: rgba(239, 68, 68, 0.4);" onclick="removeItem('${item._id}')" title="Remove">🗑️</button>
        </div>
      </div>
    </div>
  `).join('');

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = Math.round(subtotal * 0.05); // 5% GST
  const total = subtotal + tax;

  if (subtotalElem) subtotalElem.textContent = `₹${subtotal}`;
  if (taxElem) taxElem.textContent = `₹${tax}`;
  if (totalElem) totalElem.textContent = `₹${total}`;
}

window.updateQty = function(dishId, change) {
  const item = cartItems.find(i => i._id === dishId);
  if (!item) return;

  item.quantity += change;
  if (item.quantity <= 0) {
    cartItems = cartItems.filter(i => i._id !== dishId);
  }

  saveCart();
  updateCartBadge();
};

window.removeItem = function(dishId) {
  cartItems = cartItems.filter(i => i._id !== dishId);
  saveCart();
  updateCartBadge();
  showToast('Item Removed', 'Delicacy removed from cart.', 'info');
};

function openCartDrawer() {
  const drawer = document.getElementById('cart-drawer');
  const overlay = document.getElementById('cart-drawer-overlay');
  if (drawer && overlay) {
    renderCartDrawer();
    drawer.classList.add('active');
    overlay.classList.add('active');
  }
}

function closeCartDrawer() {
  const drawer = document.getElementById('cart-drawer');
  const overlay = document.getElementById('cart-drawer-overlay');
  if (drawer && overlay) {
    drawer.classList.remove('active');
    overlay.classList.remove('active');
  }
}

// Setup Page
document.addEventListener('DOMContentLoaded', async () => {
  await checkAuthSession();
  updateCartBadge();

  // Cart Drawer Events
  const cartBtn = document.getElementById('nav-cart-btn');
  const cartClose = document.getElementById('cart-close-btn');
  const cartOverlay = document.getElementById('cart-drawer-overlay');

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

  const token = localStorage.getItem('royal_flame_token');
  if (token) {
    loadNotifications(token);
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

  // Checkout Handler
  const checkoutBtn = document.getElementById('cart-checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      if (cartItems.length === 0) {
        showToast('Empty Cart', 'Please select delicacies before checking out.', 'error');
        return;
      }
      showToast('Order Placed! 👑', 'Your royal feast order has been confirmed.', 'success');
      cartItems = [];
      saveCart();
      updateCartBadge();
      closeCartDrawer();
    });
  }

  // Load Wishlist
  await loadWishlist();
});
