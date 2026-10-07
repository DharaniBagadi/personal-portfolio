/**
 * ROYAL FLAME - DISH DETAILS & REVIEWS SCRIPT (product.js)
 */

const API_BASE_URL = window.location.origin;

// State
let currentDish = null;
let currentDishId = null;
let dishReviews = [];
let selectedRating = 5;
let orderQuantity = 1;
let currentUser = null;
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

// Check Authentication Session
async function checkAuthSession() {
  const token = localStorage.getItem('royal_flame_token');
  if (!token) return;

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
  } catch (err) {}
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

  // Show user name in review form
  const reviewerNameDisplay = document.getElementById('review-form-author-name');
  if (reviewerNameDisplay) {
    reviewerNameDisplay.textContent = user.name;
  }
}

// 1. Fetch & Render Dish Details
async function loadDishDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  currentDishId = urlParams.get('id');

  if (!currentDishId) {
    showToast('Invalid Selection', 'Redirecting to Menu Book...', 'error');
    setTimeout(() => { window.location.href = 'menu.html'; }, 1500);
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/dishes/${currentDishId}`);
    const data = await res.json();

    if (!data.success || !data.data) {
      document.getElementById('dish-details-container').innerHTML = `
        <div class="menu-empty-state" style="padding: 4rem 1rem;">
          <span style="font-size: 3rem;">⚠️</span>
          <h2 style="font-family: var(--font-serif); color: var(--gold-300);">Dish Not Found</h2>
          <p style="color: var(--text-muted); margin-bottom: 1.5rem;">The requested culinary item may have been rotated or is unavailable.</p>
          <a href="menu.html" class="btn btn-primary">Return to Menu Book</a>
        </div>
      `;
      return;
    }

    currentDish = data.data;
    renderDishDetails(currentDish);
    await loadReviews(currentDish._id);
    await loadRelatedDishes(currentDish._id);
  } catch (err) {
    console.error('Error fetching dish details:', err);
    showToast('Loading Error', 'Unable to fetch dish specifications.', 'error');
  }
}

function renderDishDetails(dish) {
  // Update document title & breadcrumbs
  document.title = `${dish.name} | Royal Flame Luxury Dining`;

  const breadcrumbCategory = document.getElementById('breadcrumb-category');
  const breadcrumbDish = document.getElementById('breadcrumb-dish');
  if (breadcrumbCategory) {
    breadcrumbCategory.textContent = dish.category;
    breadcrumbCategory.href = `menu.html?category=${encodeURIComponent(dish.category)}`;
  }
  if (breadcrumbDish) {
    breadcrumbDish.textContent = dish.name;
  }

  // Left Column Elements
  const mainImg = document.getElementById('dish-main-image');
  const discountBadge = document.getElementById('dish-floating-discount');
  const wishlistBtn = document.getElementById('dish-floating-wishlist');
  const prepTime = document.getElementById('dish-prep-time');
  const calories = document.getElementById('dish-calories');
  const foodType = document.getElementById('dish-food-type');

  if (mainImg) {
    mainImg.src = dish.image;
    mainImg.alt = dish.name;
  }
  if (discountBadge) {
    discountBadge.style.display = dish.discount > 0 ? 'block' : 'none';
    discountBadge.textContent = `${dish.discount}% OFF`;
  }
  if (wishlistBtn) {
    const isWishlisted = wishlistSet.has(dish._id);
    wishlistBtn.innerHTML = isWishlisted ? '❤️' : '🤍';
    wishlistBtn.classList.toggle('active', isWishlisted);
  }
  if (prepTime) prepTime.textContent = dish.preparationTime || '20 mins';
  if (calories) calories.textContent = `${dish.calories || 450} kcal`;
  if (foodType) foodType.textContent = dish.foodType === 'veg' ? 'Pure Veg' : 'Non-Veg';

  // Right Column Elements
  const catTag = document.getElementById('dish-category-tag');
  const cuisineTag = document.getElementById('dish-cuisine-tag');
  const titleElem = document.getElementById('dish-title');
  const ratingVal = document.getElementById('dish-rating-val');
  const reviewsCount = document.getElementById('dish-reviews-count');
  const finalPriceElem = document.getElementById('dish-final-price');
  const originalPriceElem = document.getElementById('dish-original-price');
  const savingsElem = document.getElementById('dish-savings-tag');
  const descElem = document.getElementById('dish-desc');
  const ingredientsList = document.getElementById('ingredients-tags-list');
  const availabilityElem = document.getElementById('dish-availability-status');
  const detailWishlistBtn = document.getElementById('detail-wishlist-action-btn');

  const finalPrice = dish.discount > 0 ? Math.round(dish.price * (1 - dish.discount / 100)) : dish.price;
  const savingsAmount = dish.price - finalPrice;

  if (catTag) catTag.textContent = dish.category;
  if (cuisineTag) cuisineTag.textContent = dish.cuisine || 'Royal Heritage';
  if (titleElem) titleElem.textContent = dish.name;
  if (ratingVal) ratingVal.textContent = dish.rating.toFixed(1);
  if (reviewsCount) reviewsCount.textContent = `(${dish.numReviews} Patron Reviews)`;
  if (finalPriceElem) finalPriceElem.textContent = `₹${finalPrice}`;

  if (originalPriceElem) {
    if (dish.discount > 0) {
      originalPriceElem.style.display = 'inline';
      originalPriceElem.textContent = `₹${dish.price}`;
    } else {
      originalPriceElem.style.display = 'none';
    }
  }

  if (savingsElem) {
    if (dish.discount > 0) {
      savingsElem.style.display = 'inline-block';
      savingsElem.textContent = `Save ₹${savingsAmount} (${dish.discount}%)`;
    } else {
      savingsElem.style.display = 'none';
    }
  }

  if (descElem) descElem.textContent = dish.description;

  if (availabilityElem) {
    if (dish.availability) {
      availabilityElem.innerHTML = `🟢 <span style="color: #10b981;">Ready to serve in Royal Kitchen</span>`;
    } else {
      availabilityElem.innerHTML = `🔴 <span style="color: #ef4444;">Temporarily Sold Out</span>`;
    }
  }

  // Ingredients Tags
  if (ingredientsList) {
    const ingredients = Array.isArray(dish.ingredients) && dish.ingredients.length > 0 
      ? dish.ingredients 
      : ['Fresh Royal Herbs', 'Cold-Pressed Oils', 'Aromatic Hand-Ground Spices', 'Artisanal Seasoning'];

    ingredientsList.innerHTML = ingredients.map(ing => `
      <span class="ingredient-tag">✨ ${ing}</span>
    `).join('');
  }

  // Update Detail Wishlist Button Text & Icon
  if (detailWishlistBtn) {
    const isWishlisted = wishlistSet.has(dish._id);
    detailWishlistBtn.innerHTML = isWishlisted ? `❤️ Saved in Wishlist` : `🤍 Add to Wishlist`;
  }
}

// 2. Quantity Controls
window.changeQuantity = function(delta) {
  orderQuantity = Math.max(1, Math.min(20, orderQuantity + delta));
  const qtyInput = document.getElementById('detail-qty-input');
  if (qtyInput) qtyInput.value = orderQuantity;
};

// 3. Add to Cart & Buy Now from Details (Requirement 1, 2, 4)
window.addCurrentDishToCart = async function() {
  if (!currentDish) return;

  const finalPrice = currentDish.discount > 0 ? Math.round(currentDish.price * (1 - currentDish.discount / 100)) : currentDish.price;
  const existing = cartItems.find(item => item._id === currentDish._id);

  if (existing) {
    existing.quantity += orderQuantity;
  } else {
    cartItems.push({
      _id: currentDish._id,
      name: currentDish.name,
      price: finalPrice,
      image: currentDish.image,
      category: currentDish.category,
      quantity: orderQuantity
    });
  }

  saveCart();
  updateCartBadge();
  showToast('Added to Cart 🛒', `${orderQuantity}x ${currentDish.name} added to your dining order.`, 'success');

  const token = localStorage.getItem('royal_flame_token');
  if (token) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ dishId: currentDish._id, quantity: orderQuantity })
      });
      const data = await res.json();
      if (data.success && data.data) {
        const badge = document.getElementById('cart-count-badge');
        if (badge) badge.textContent = data.data.itemCount;
      }
    } catch (e) {}
  }
};

window.buyCurrentDishNow = function() {
  if (!currentDish) return;
  window.location.href = `checkout.html?buyNow=${currentDish._id}&qty=${orderQuantity}`;
};

window.toggleDetailWishlist = async function() {
  if (!currentDish) return;
  const dishId = currentDish._id;
  const isWishlisted = wishlistSet.has(dishId);
  const token = localStorage.getItem('royal_flame_token');

  if (isWishlisted) {
    wishlistSet.delete(dishId);
    showToast('Removed from Wishlist', `${currentDish.name} removed from your saved list.`, 'info');

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
    showToast('Saved to Wishlist ❤️', `${currentDish.name} added to your wishlist.`, 'success');

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

  // Update UI buttons on page
  const floatingBtn = document.getElementById('dish-floating-wishlist');
  const detailBtn = document.getElementById('detail-wishlist-action-btn');

  const nowWishlisted = wishlistSet.has(dishId);
  if (floatingBtn) {
    floatingBtn.innerHTML = nowWishlisted ? '❤️' : '🤍';
    floatingBtn.classList.toggle('active', nowWishlisted);
  }
  if (detailBtn) {
    detailBtn.innerHTML = nowWishlisted ? `❤️ Saved in Wishlist` : `🤍 Add to Wishlist`;
  }
};

// 4. Customer Reviews Functionality (Requirement 5)
async function loadReviews(dishId) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/reviews/${dishId}`);
    const data = await res.json();

    if (data.success) {
      dishReviews = data.data || [];
      renderReviewsList(dishReviews, data.averageRating, data.count);
    }
  } catch (err) {
    console.error('Error fetching reviews:', err);
  }
}

function renderReviewsList(reviews, avgRating, count) {
  const reviewsContainer = document.getElementById('reviews-list-container');
  const avgRatingDisplay = document.getElementById('reviews-avg-rating');
  const totalCountDisplay = document.getElementById('reviews-total-count');
  const starsDisplay = document.getElementById('reviews-stars-visual');

  if (avgRatingDisplay) avgRatingDisplay.textContent = (avgRating || 5.0).toFixed(1);
  if (totalCountDisplay) totalCountDisplay.textContent = `Based on ${count || reviews.length} verified reviews`;
  if (starsDisplay) {
    const filledStars = Math.round(avgRating || 5);
    starsDisplay.textContent = '★'.repeat(filledStars) + '☆'.repeat(5 - filledStars);
  }

  if (!reviewsContainer) return;

  if (reviews.length === 0) {
    reviewsContainer.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
        <p style="font-size: 1.1rem; color: var(--gold-300); margin-bottom: 4px;">No reviews yet for this dish.</p>
        <p style="font-size: 0.85rem;">Be the first royal patron to share your dining impressions!</p>
      </div>
    `;
    return;
  }

  reviewsContainer.innerHTML = reviews.map(rev => {
    const authorName = rev.user ? rev.user.name : 'Royal Diner';
    const initial = authorName.charAt(0).toUpperCase();
    const dateStr = rev.createdAt ? new Date(rev.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent';
    const stars = '★'.repeat(Math.round(rev.rating)) + '☆'.repeat(5 - Math.round(rev.rating));

    return `
      <div class="review-item-card">
        <div class="review-user-row">
          <div class="reviewer-meta">
            <div class="reviewer-avatar">${initial}</div>
            <div>
              <div class="reviewer-name">${authorName}</div>
              <div class="verified-patron-badge">✓ Verified Patron</div>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="color: var(--star-color); font-size: 0.95rem;">${stars}</div>
            <div class="review-date">${dateStr}</div>
          </div>
        </div>
        <p class="review-text">"${rev.comment}"</p>
      </div>
    `;
  }).join('');
}

// Interactive Star Selector for Review Submission
function setupStarRatingSelector() {
  const stars = document.querySelectorAll('.star-rating-btn');
  stars.forEach(star => {
    star.addEventListener('click', () => {
      selectedRating = parseInt(star.dataset.rating, 10);
      updateStarRatingUI(selectedRating);
    });

    star.addEventListener('mouseenter', () => {
      const hoverRating = parseInt(star.dataset.rating, 10);
      updateStarRatingUI(hoverRating);
    });
  });

  const ratingWrap = document.getElementById('star-rating-selector');
  if (ratingWrap) {
    ratingWrap.addEventListener('mouseleave', () => {
      updateStarRatingUI(selectedRating);
    });
  }
}

function updateStarRatingUI(rating) {
  const stars = document.querySelectorAll('.star-rating-btn');
  stars.forEach(star => {
    const val = parseInt(star.dataset.rating, 10);
    star.classList.toggle('active', val <= rating);
    star.textContent = val <= rating ? '★' : '☆';
  });
}

// Submit Review Form Handler
window.submitReview = async function(e) {
  if (e) e.preventDefault();

  const token = localStorage.getItem('royal_flame_token');
  if (!token) {
    showToast('Sign In Required', 'Please sign in to your Royal Flame account to write a review.', 'info');
    setTimeout(() => {
      window.location.href = `login.html?redirect=${encodeURIComponent(window.location.href)}`;
    }, 1200);
    return;
  }

  const commentInput = document.getElementById('review-comment-input');
  if (!commentInput) return;

  const commentText = commentInput.value.trim();
  if (commentText.length < 2) {
    showToast('Review Required', 'Please write a brief comment describing your dining experience.', 'error');
    return;
  }

  const submitBtn = document.getElementById('submit-review-btn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Publishing...';
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        dishId: currentDishId,
        rating: selectedRating,
        comment: commentText
      })
    });

    const data = await res.json();

    if (data.success) {
      showToast('Review Published! ⚜️', 'Your culinary review has been added with honor.', 'success');
      commentInput.value = '';

      // Reload reviews and update dish rating on page
      await loadReviews(currentDishId);

      if (data.updatedDishRating) {
        const ratingVal = document.getElementById('dish-rating-val');
        const reviewsCount = document.getElementById('dish-reviews-count');
        if (ratingVal) ratingVal.textContent = data.updatedDishRating.rating.toFixed(1);
        if (reviewsCount) reviewsCount.textContent = `(${data.updatedDishRating.numReviews} Patron Reviews)`;
      }
    } else {
      showToast('Review Error', data.message || 'Failed to submit review.', 'error');
    }
  } catch (err) {
    console.error('Submit review error:', err);
    showToast('Submission Glitch', 'Could not reach server. Please try again.', 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Royal Review ➔';
    }
  }
};

// 5. Related Dishes (Requirement 6)
async function loadRelatedDishes(dishId) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/dishes/related/${dishId}`);
    const data = await res.json();

    const track = document.getElementById('related-dishes-track');
    if (!track) return;

    if (data.success && Array.isArray(data.data) && data.data.length > 0) {
      track.innerHTML = data.data.map(d => createRelatedCardHTML(d)).join('');
    } else {
      track.innerHTML = `<p style="color: var(--text-muted); padding: 1rem;">No other related items in this category currently.</p>`;
    }
  } catch (err) {
    console.error('Error loading related dishes:', err);
  }
}

function createRelatedCardHTML(dish) {
  const isWishlisted = wishlistSet.has(dish._id);
  const finalPrice = dish.discount > 0 ? Math.round(dish.price * (1 - dish.discount / 100)) : dish.price;
  const isVeg = dish.foodType === 'veg';

  return `
    <div class="dish-card" style="min-width: 280px; max-width: 280px; flex-shrink: 0;" data-id="${dish._id}" onclick="window.location.href='dish-details.html?id=${dish._id}'">
      <div class="dish-image-wrapper" style="height: 180px;">
        <img src="${dish.image}" alt="${dish.name}" class="dish-img" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80'">
        ${dish.discount > 0 ? `<div class="dish-discount-tag">${dish.discount}% OFF</div>` : ''}
        <button class="dish-wishlist-btn ${isWishlisted ? 'active' : ''}" onclick="toggleWishlist('${dish._id}', event)" title="Wishlist">
          ${isWishlisted ? '❤️' : '🤍'}
        </button>
      </div>

      <div class="dish-details" style="padding: 1.2rem;">
        <div class="dish-header-row">
          <span class="dish-category-label">${dish.category}</span>
          <span class="${isVeg ? 'veg-indicator' : 'non-veg-indicator'}"></span>
        </div>

        <h3 class="dish-name" style="font-size: 1.05rem;">${dish.name}</h3>

        <div class="dish-rating-price-row" style="margin-top: 8px;">
          <div class="dish-rating-pill">⭐ ${dish.rating.toFixed(1)}</div>
          <div class="dish-pricing">
            <span class="dish-current-price">₹${finalPrice}</span>
          </div>
        </div>

        <div class="dish-actions" onclick="event.stopPropagation()" style="margin-top: 10px;">
          <button class="btn btn-primary dish-btn" style="width: 100%;" onclick="window.location.href='dish-details.html?id=${dish._id}'">
            View Delicacy ➔
          </button>
        </div>
      </div>
    </div>
  `;
}

// 6. Global Cart Drawer & Setup
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

function updateWishlistBadge() {
  const badge = document.getElementById('wishlist-count-badge');
  if (badge) {
    badge.textContent = wishlistSet.size;
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

// Related Scroller Controls
function setupRelatedScroller() {
  const track = document.getElementById('related-dishes-track');
  const prevBtn = document.getElementById('related-scroll-prev');
  const nextBtn = document.getElementById('related-scroll-next');

  if (track && prevBtn && nextBtn) {
    prevBtn.addEventListener('click', () => track.scrollBy({ left: -300, behavior: 'smooth' }));
    nextBtn.addEventListener('click', () => track.scrollBy({ left: 300, behavior: 'smooth' }));
  }
}

// Setup Page
document.addEventListener('DOMContentLoaded', async () => {
  await checkAuthSession();
  updateWishlistBadge();
  updateCartBadge();
  setupStarRatingSelector();
  setupRelatedScroller();

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

  // Review Form Submit
  const reviewForm = document.getElementById('write-review-form');
  if (reviewForm) {
    reviewForm.addEventListener('submit', window.submitReview);
  }

  // Load Dish Data
  await loadDishDetails();
});
