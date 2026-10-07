/**
 * ROYAL FLAME - MENU BOOK CLIENT SCRIPT (menu.js)
 */

const API_BASE_URL = window.location.origin;

// State
let currentUser = null;
let allDishes = [];
let filteredDishes = [];
let activeCategory = 'All';
let activeDietFilter = 'all'; // 'all', 'veg', 'non-veg'
let activeSort = 'recommended';
let searchQuery = '';
let wishlistSet = new Set(JSON.parse(localStorage.getItem('royal_wishlist') || '[]'));
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

// Check Authentication Session & Sync Wishlist
async function checkAuthSession() {
  const token = localStorage.getItem('royal_flame_token');
  if (!token) {
    // Guest or redirect if required
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
      await syncUserWishlistFromDB(token);
    }
  } catch (err) {
    const cached = localStorage.getItem('royal_flame_user');
    if (cached) {
      currentUser = JSON.parse(cached);
      updateUserProfileUI(currentUser);
    }
  }
}

// Sync Wishlist with MongoDB
async function syncUserWishlistFromDB(token) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/wishlist`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success && Array.isArray(data.data)) {
      data.data.forEach(item => {
        const id = item._id || item;
        wishlistSet.add(id.toString());
      });
      localStorage.setItem('royal_wishlist', JSON.stringify([...wishlistSet]));
      updateWishlistBadge();
    }
  } catch (err) {
    console.warn('Could not sync wishlist with DB:', err);
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

// Fetch Dishes from API
async function loadMenuDishes() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/dishes`);
    const data = await res.json();

    if (data.success && Array.isArray(data.data)) {
      allDishes = data.data;
      applyFiltersAndRender();
    }
  } catch (err) {
    console.error('Failed to load menu dishes:', err);
    showToast('Menu Sync Warning', 'Using offline gourmet catalog.', 'info');
  }
}

// Apply Filters, Search & Sort
function applyFiltersAndRender() {
  let result = [...allDishes];

  // 1. Category Filter
  if (activeCategory && activeCategory !== 'All') {
    if (activeCategory.toLowerCase() === 'vegetarian' || activeCategory.toLowerCase() === 'veg') {
      result = result.filter(d => d.foodType === 'veg');
    } else if (activeCategory.toLowerCase() === 'non-vegetarian' || activeCategory.toLowerCase() === 'non-veg') {
      result = result.filter(d => d.foodType === 'non-veg');
    } else {
      result = result.filter(d => d.category.toLowerCase() === activeCategory.toLowerCase());
    }
  }

  // 2. Dietary Filter (Veg / Non-Veg toggle)
  if (activeDietFilter === 'veg') {
    result = result.filter(d => d.foodType === 'veg');
  } else if (activeDietFilter === 'non-veg') {
    result = result.filter(d => d.foodType === 'non-veg');
  }

  // 3. Search Query (matches name, description, ingredients, cuisine, category)
  if (searchQuery.trim() !== '') {
    const q = searchQuery.toLowerCase().trim();
    result = result.filter(d => {
      const matchName = d.name && d.name.toLowerCase().includes(q);
      const matchDesc = d.description && d.description.toLowerCase().includes(q);
      const matchCat = d.category && d.category.toLowerCase().includes(q);
      const matchCuisine = d.cuisine && d.cuisine.toLowerCase().includes(q);
      const matchIngr = Array.isArray(d.ingredients) && d.ingredients.some(i => i.toLowerCase().includes(q));
      return matchName || matchDesc || matchCat || matchCuisine || matchIngr;
    });
  }

  // 4. Sorting
  if (activeSort === 'price-low') {
    result.sort((a, b) => {
      const pA = a.discount > 0 ? a.price * (1 - a.discount / 100) : a.price;
      const pB = b.discount > 0 ? b.price * (1 - b.discount / 100) : b.price;
      return pA - pB;
    });
  } else if (activeSort === 'price-high') {
    result.sort((a, b) => {
      const pA = a.discount > 0 ? a.price * (1 - a.discount / 100) : a.price;
      const pB = b.discount > 0 ? b.price * (1 - b.discount / 100) : b.price;
      return pB - pA;
    });
  } else if (activeSort === 'rating') {
    result.sort((a, b) => b.rating - a.rating);
  } else if (activeSort === 'newest') {
    result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  } else {
    // Recommended / Chef's special first
    result.sort((a, b) => (b.isChefsSpecial ? 1 : 0) - (a.isChefsSpecial ? 1 : 0));
  }

  filteredDishes = result;
  renderDishesGrid(filteredDishes);
  updateCountBadge(filteredDishes.length);
}

// Render Food Cards Grid
function renderDishesGrid(dishes) {
  const grid = document.getElementById('menu-dishes-grid');
  if (!grid) return;

  if (dishes.length === 0) {
    grid.innerHTML = `
      <div class="menu-empty-state">
        <span class="menu-empty-icon">🍽️</span>
        <h3 class="menu-empty-title">No Royal Dishes Found</h3>
        <p class="menu-empty-desc">We couldn't find any culinary masterpieces matching your criteria "${searchQuery || activeCategory}". Try resetting your filters.</p>
        <button type="button" class="btn btn-primary" onclick="resetAllFilters()">
          ✨ Reset Filters & View All
        </button>
      </div>
    `;
    return;
  }

  grid.innerHTML = dishes.map(dish => createFoodCardHTML(dish)).join('');
}

// Create Food Card Component (Matching Requirement 2)
function createFoodCardHTML(dish) {
  const isWishlisted = wishlistSet.has(dish._id);
  const finalPrice = dish.discount > 0 ? Math.round(dish.price * (1 - dish.discount / 100)) : dish.price;
  const isVeg = dish.foodType === 'veg';

  return `
    <div class="dish-card dish-card-clickable" data-id="${dish._id}" onclick="openDishDetails('${dish._id}', event)">
      <div class="dish-image-wrapper">
        <img 
          src="${dish.image}" 
          alt="${dish.name}" 
          class="dish-img" 
          loading="lazy" 
          onerror="this.src='https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80'"
        >
        
        ${dish.discount > 0 ? `<div class="dish-discount-tag">${dish.discount}% OFF</div>` : ''}
        
        <button 
          class="dish-wishlist-btn ${isWishlisted ? 'active' : ''}" 
          onclick="toggleWishlist('${dish._id}', event)" 
          title="Save to Wishlist"
        >
          ${isWishlisted ? '❤️' : '🤍'}
        </button>

        <div class="dish-meta-overlay">
          <span class="dish-time-badge">⏱️ ${dish.preparationTime || '20 mins'}</span>
          <span class="dish-time-badge">🔥 ${dish.calories || '450'} kcal</span>
        </div>
      </div>

      <div class="dish-details">
        <div class="dish-header-row">
          <span class="dish-category-label">${dish.category}</span>
          <div style="display: flex; align-items: center; gap: 6px;">
            <span class="dish-availability-badge ${dish.availability ? '' : 'unavailable'}">
              <span class="dish-availability-dot"></span> ${dish.availability ? 'Available' : 'Sold Out'}
            </span>
            <span class="${isVeg ? 'veg-indicator' : 'non-veg-indicator'}" title="${isVeg ? 'Vegetarian' : 'Non-Vegetarian'}"></span>
          </div>
        </div>

        <h3 class="dish-name">${dish.name}</h3>
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

// Open Dish Details Page
window.openDishDetails = function(dishId, event) {
  if (event) {
    const target = event.target;
    if (target.closest('.dish-actions') || target.closest('.dish-wishlist-btn') || target.tagName === 'BUTTON') {
      return;
    }
  }
  window.location.href = `dish-details.html?id=${dishId}`;
};

// Toggle Wishlist Functionality (Syncs with DB if logged in)
window.toggleWishlist = async function(dishId, event) {
  if (event) event.stopPropagation();

  const dish = allDishes.find(d => d._id === dishId);
  if (!dish) return;

  const isCurrentlyWishlisted = wishlistSet.has(dishId);
  const token = localStorage.getItem('royal_flame_token');

  if (isCurrentlyWishlisted) {
    wishlistSet.delete(dishId);
    showToast('Removed from Wishlist', `${dish.name} removed from your saved list.`, 'info');

    if (token) {
      try {
        await fetch(`${API_BASE_URL}/api/wishlist/${dishId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (e) {}
    }
  } else {
    wishlistSet.add(dishId);
    showToast('Saved to Wishlist ❤️', `${dish.name} added to your royal wishlist.`, 'success');

    if (token) {
      try {
        await fetch(`${API_BASE_URL}/api/wishlist`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ dishId })
        });
      } catch (e) {}
    }
  }

  localStorage.setItem('royal_wishlist', JSON.stringify([...wishlistSet]));
  updateWishlistBadge();
  updateWishlistButtonsUI();
};

function updateWishlistBadge() {
  const badge = document.getElementById('wishlist-count-badge');
  if (badge) {
    badge.textContent = wishlistSet.size;
  }
}

function updateWishlistButtonsUI() {
  document.querySelectorAll('.dish-card').forEach(card => {
    const id = card.dataset.id;
    const btn = card.querySelector('.dish-wishlist-btn');
    if (btn) {
      if (wishlistSet.has(id)) {
        btn.classList.add('active');
        btn.textContent = '❤️';
      } else {
        btn.classList.remove('active');
        btn.textContent = '🤍';
      }
    }
  });
}

// Cart Functionality
window.addToCart = async function(dishId, event) {
  if (event) event.stopPropagation();

  const dish = allDishes.find(d => d._id === dishId);
  if (!dish) return;

  const token = localStorage.getItem('royal_flame_token');
  const finalPrice = dish.discount > 0 ? Math.round(dish.price * (1 - dish.discount / 100)) : dish.price;
  const existing = cartItems.find(item => item._id === dishId);

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
        <p style="font-size: 0.85rem; color: var(--text-muted); max-width: 250px;">Select dishes from the Menu Book to place your order.</p>
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

// Reset Filters Helper
window.resetAllFilters = function() {
  activeCategory = 'All';
  activeDietFilter = 'all';
  activeSort = 'recommended';
  searchQuery = '';

  const searchInput = document.getElementById('menu-search-input');
  if (searchInput) searchInput.value = '';

  const sortSelect = document.getElementById('menu-sort-select');
  if (sortSelect) sortSelect.value = 'recommended';

  document.querySelectorAll('.menu-cat-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.category === 'All');
  });

  document.querySelectorAll('.diet-toggle-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.diet === 'all');
  });

  applyFiltersAndRender();
};

function updateCountBadge(count) {
  const countBadge = document.getElementById('menu-count-badge');
  if (countBadge) {
    countBadge.textContent = `Showing ${count} Royal Dishes`;
  }
}

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

// Setup Page
document.addEventListener('DOMContentLoaded', async () => {
  await checkAuthSession();
  updateWishlistBadge();
  updateCartBadge();

  // Read URL params
  const urlParams = new URLSearchParams(window.location.search);
  const paramCategory = urlParams.get('category');
  const paramSearch = urlParams.get('search');
  const paramFoodType = urlParams.get('foodType');

  if (paramCategory) activeCategory = paramCategory;
  if (paramSearch) searchQuery = paramSearch;
  if (paramFoodType) activeDietFilter = paramFoodType;

  // Initialize Category buttons
  const catButtons = document.querySelectorAll('.menu-cat-btn');
  catButtons.forEach(btn => {
    const cat = btn.dataset.category || 'All';
    if (cat.toLowerCase() === activeCategory.toLowerCase()) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }

    btn.addEventListener('click', () => {
      catButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = cat;
      applyFiltersAndRender();
    });
  });

  // Dietary Toggle Buttons
  const dietButtons = document.querySelectorAll('.diet-toggle-btn');
  dietButtons.forEach(btn => {
    const diet = btn.dataset.diet || 'all';
    btn.classList.toggle('active', diet === activeDietFilter);

    btn.addEventListener('click', () => {
      dietButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeDietFilter = diet;
      applyFiltersAndRender();
    });
  });

  // Search Input in Menu
  const searchInput = document.getElementById('menu-search-input');
  const clearBtn = document.getElementById('menu-search-clear');
  if (searchInput) {
    if (searchQuery) searchInput.value = searchQuery;
    if (clearBtn) clearBtn.style.display = searchQuery ? 'block' : 'none';

    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      if (clearBtn) clearBtn.style.display = searchQuery ? 'block' : 'none';

      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        applyFiltersAndRender();
      }, 250);
    });

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        clearBtn.style.display = 'none';
        applyFiltersAndRender();
      });
    }
  }

  // Top Navbar Search Bar Sync
  const navSearchInput = document.getElementById('nav-search-input');
  if (navSearchInput) {
    navSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = navSearchInput.value.trim();
        if (val) {
          searchQuery = val;
          if (searchInput) searchInput.value = val;
          applyFiltersAndRender();
        }
      }
    });
  }

  // Sort Select
  const sortSelect = document.getElementById('menu-sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      activeSort = e.target.value;
      applyFiltersAndRender();
    });
  }

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

  // Load Dishes
  await loadMenuDishes();
});
