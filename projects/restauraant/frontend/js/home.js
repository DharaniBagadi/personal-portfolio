/**
 * ROYAL FLAME - LUXURY RESTAURANT HOMEPAGE CLIENT SCRIPT (home.js)
 */

const API_BASE_URL = window.location.origin;

// State Management
let currentUser = null;
let allDishesData = [];
let wishlistSet = new Set(JSON.parse(localStorage.getItem('royal_wishlist') || '[]'));
let cartItems = JSON.parse(localStorage.getItem('royal_cart') || '[]');
let activeCategory = 'All';

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
    window.location.href = 'login.html';
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
    } else {
      localStorage.removeItem('royal_flame_token');
      localStorage.removeItem('royal_flame_user');
      window.location.href = 'login.html';
    }
  } catch (err) {
    // If backend offline or network glitch, fallback to cached user or stay
    const cached = localStorage.getItem('royal_flame_user');
    if (cached) {
      currentUser = JSON.parse(cached);
      updateUserProfileUI(currentUser);
    }
  }
}

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
      updateWishlistUI();
    }
  } catch (err) {}
}

// Update User Profile Meta in Navbar
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

// Generate Food Card HTML Component
function createDishCard(dish) {
  const isWishlisted = wishlistSet.has(dish._id);
  const finalPrice = dish.discount > 0 ? Math.round(dish.price * (1 - dish.discount / 100)) : dish.price;
  const isVeg = dish.foodType === 'veg';

  return `
    <div class="dish-card dish-card-clickable" data-id="${dish._id}" data-category="${dish.category}" data-foodtype="${dish.foodType}" onclick="openDishDetails('${dish._id}', event)">
      <div class="dish-image-wrapper">
        <img src="${dish.image}" alt="${dish.name}" class="dish-img" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80'">
        
        ${dish.discount > 0 ? `<div class="dish-discount-tag">${dish.discount}% OFF</div>` : ''}
        
        <button class="dish-wishlist-btn ${isWishlisted ? 'active' : ''}" onclick="toggleWishlist('${dish._id}', event)" title="Save to Wishlist">
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
          <span class="${isVeg ? 'veg-indicator' : 'non-veg-indicator'}" title="${isVeg ? 'Vegetarian' : 'Non-Vegetarian'}"></span>
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

window.openDishDetails = function(dishId, event) {
  if (event) {
    const target = event.target;
    if (target.closest('.dish-actions') || target.closest('.dish-wishlist-btn') || target.tagName === 'BUTTON') {
      return;
    }
  }
  window.location.href = `dish-details.html?id=${dishId}`;
};

// Fetch and Populate All Food Sections
async function loadFoodSections() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/dishes/sections/all`);
    const data = await res.json();

    if (data.success && data.sections) {
      const { chefsSpecial, popularToday, mostOrdered, recommended, newArrivals, allDishes } = data.sections;
      allDishesData = allDishes;

      renderGrid('chefs-special-grid', chefsSpecial);
      renderTrack('popular-today-track', popularToday);
      renderTrack('most-ordered-track', mostOrdered);
      renderTrack('recommended-track', recommended);
      renderTrack('new-arrivals-track', newArrivals);
    }
  } catch (err) {
    console.error('Failed to load menu sections:', err);
    showToast('Menu Sync Warning', 'Using cached culinary catalog.', 'info');
  }
}

// Render into standard grid
function renderGrid(containerId, dishes) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!dishes || dishes.length === 0) {
    container.innerHTML = `<div class="cart-empty-state" style="grid-column: 1/-1; padding: 3rem 0;">
      <p style="color: var(--text-muted); font-size: 1.1rem;">No royal dishes found matching your selection.</p>
    </div>`;
    return;
  }

  container.innerHTML = dishes.map(dish => createDishCard(dish)).join('');
}

// Render into horizontal scroll track
function renderTrack(trackId, dishes) {
  const track = document.getElementById(trackId);
  if (!track) return;

  if (!dishes || dishes.length === 0) {
    track.innerHTML = `<p style="color: var(--text-muted); padding: 1rem;">No items available in this section currently.</p>`;
    return;
  }

  track.innerHTML = dishes.map(dish => createDishCard(dish)).join('');
}

// Horizontal Scroll Controls
function setupHorizontalScrollers() {
  document.querySelectorAll('.horizontal-food-section').forEach(section => {
    const track = section.querySelector('.horizontal-scroll-track');
    const prevBtn = section.querySelector('.scroll-prev');
    const nextBtn = section.querySelector('.scroll-next');

    if (track && prevBtn && nextBtn) {
      prevBtn.addEventListener('click', () => {
        track.scrollBy({ left: -320, behavior: 'smooth' });
      });

      nextBtn.addEventListener('click', () => {
        track.scrollBy({ left: 320, behavior: 'smooth' });
      });
    }
  });
}

// Category Filter Handling
function setupCategoryFilters() {
  const pills = document.querySelectorAll('.category-pill');
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      const category = pill.dataset.category || 'All';
      activeCategory = category;
      filterDishesByCategory(category);
    });
  });
}

function filterDishesByCategory(category) {
  let filtered = [];

  if (category === 'All') {
    filtered = allDishesData;
  } else if (category === 'Vegetarian') {
    filtered = allDishesData.filter(d => d.foodType === 'veg');
  } else if (category === 'Non-Vegetarian') {
    filtered = allDishesData.filter(d => d.foodType === 'non-veg');
  } else {
    filtered = allDishesData.filter(d => d.category.toLowerCase() === category.toLowerCase());
  }

  renderGrid('chefs-special-grid', filtered);

  const chefsTitle = document.getElementById('chefs-special-title');
  if (chefsTitle) {
    chefsTitle.textContent = category === 'All' ? "Chef's Special & Signature Menu" : `${category} Menu Collection`;
  }

  // Smooth scroll to results
  const chefsSection = document.getElementById('chefs-special-section');
  if (chefsSection) {
    chefsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// Live Search Functionality
function setupSearch() {
  const searchInput = document.getElementById('nav-search-input');
  const clearBtn = document.getElementById('search-clear-btn');
  let searchTimeout = null;

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const val = e.target.value.trim();

      if (clearBtn) {
        clearBtn.style.display = val.length > 0 ? 'block' : 'none';
      }

      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        performSearch(val);
      }, 300);
    });

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        clearBtn.style.display = 'none';
        performSearch('');
      });
    }
  }
}

function performSearch(keyword) {
  if (!keyword || keyword.trim() === '') {
    filterDishesByCategory(activeCategory);
    return;
  }

  const q = keyword.toLowerCase().trim();
  const matches = allDishesData.filter(d => {
    const matchName = d.name && d.name.toLowerCase().includes(q);
    const matchDesc = d.description && d.description.toLowerCase().includes(q);
    const matchCat = d.category && d.category.toLowerCase().includes(q);
    const matchCuisine = d.cuisine && d.cuisine.toLowerCase().includes(q);
    const matchIngr = Array.isArray(d.ingredients) && d.ingredients.some(i => i.toLowerCase().includes(q));
    return matchName || matchDesc || matchCat || matchCuisine || matchIngr;
  });

  const container = document.getElementById('chefs-special-grid');
  const chefsTitle = document.getElementById('chefs-special-title');

  if (matches.length === 0) {
    if (chefsTitle) {
      chefsTitle.textContent = `Search Results for "${keyword}" (0)`;
    }
    if (container) {
      container.innerHTML = `
        <div class="cart-empty-state" style="grid-column: 1/-1; padding: 3rem 1rem; text-align: center;">
          <span style="font-size: 3rem;">🔍</span>
          <h3 style="font-family: var(--font-serif); color: var(--gold-300); margin: 0.8rem 0 0.4rem;">No dishes found</h3>
          <p style="color: var(--text-muted); font-size: 0.92rem; margin-bottom: 1.5rem;">We couldn't find any dishes with "${keyword}". Try searching for biryani, chicken, paneer, truffle or pasta.</p>
          <a href="menu.html" class="btn btn-primary">Open Full Menu Book ➔</a>
        </div>
      `;
    }
  } else {
    renderGrid('chefs-special-grid', matches);
    if (chefsTitle) {
      chefsTitle.textContent = `Search Results for "${keyword}" (${matches.length})`;
    }
  }

  const chefsSection = document.getElementById('chefs-special-section');
  if (chefsSection) {
    chefsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// Wishlist Functionality
window.toggleWishlist = async function(dishId, event) {
  if (event) event.stopPropagation();

  const dish = allDishesData.find(d => d._id === dishId);
  if (!dish) return;

  const token = localStorage.getItem('royal_flame_token');
  const isWishlisted = wishlistSet.has(dishId);

  if (isWishlisted) {
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
    showToast('Saved to Wishlist ❤️', `${dish.name} has been added to your royal wishlist.`, 'success');

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
  updateWishlistUI();
};

function updateWishlistUI() {
  const badge = document.getElementById('wishlist-count-badge');
  if (badge) {
    badge.textContent = wishlistSet.size;
  }

  // Update heart states on cards
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

// Cart Management (Requirement 1, 2)
window.addToCart = async function(dishId, event) {
  if (event) event.stopPropagation();

  const dish = allDishesData.find(d => d._id === dishId);
  if (!dish) return;

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
        <p style="font-size: 0.85rem; color: var(--text-muted); max-width: 250px;">Explore our signature culinary creations and select delicacies for your order.</p>
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

// Setup Event Listeners
document.addEventListener('DOMContentLoaded', async () => {
  await checkAuthSession();
  await loadFoodSections();
  setupHorizontalScrollers();
  setupCategoryFilters();
  setupSearch();
  updateWishlistUI();
  updateCartBadge();

  // Cart Drawer Events
  const cartBtn = document.getElementById('nav-cart-btn');
  const cartClose = document.getElementById('cart-close-btn');
  const cartOverlay = document.getElementById('cart-drawer-overlay');

  if (cartBtn) cartBtn.addEventListener('click', openCartDrawer);
  if (cartClose) cartClose.addEventListener('click', closeCartDrawer);
  if (cartOverlay) cartOverlay.addEventListener('click', closeCartDrawer);

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

  // Load notifications
  const token = localStorage.getItem('royal_flame_token');
  if (token) {
    loadNotifications(token);
  }

  // Profile Dropdown Toggle
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

  // Checkout Simulation Button
  const checkoutBtn = document.getElementById('cart-checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      if (cartItems.length === 0) {
        showToast('Empty Cart', 'Please add dishes to your cart before proceeding to checkout.', 'error');
        return;
      }

      showToast('Order Placed! 👑', 'Your royal feast order has been confirmed and forwarded to the Executive Chef.', 'success');
      cartItems = [];
      saveCart();
      updateCartBadge();
      closeCartDrawer();
    });
  }

  // Hero CTA Buttons
  const exploreMenuBtn = document.getElementById('hero-explore-menu');
  const orderNowBtn = document.getElementById('hero-order-now');

  if (exploreMenuBtn) {
    exploreMenuBtn.addEventListener('click', () => {
      window.location.href = 'menu.html';
    });
  }

  if (orderNowBtn) {
    orderNowBtn.addEventListener('click', () => {
      document.getElementById('chefs-special-section').scrollIntoView({ behavior: 'smooth' });
    });
  }
});
