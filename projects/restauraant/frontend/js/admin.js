/**
 * ROYAL FLAME - LUXURY ADMIN DASHBOARD JAVASCRIPT (admin.js)
 * Master controller for Admin Authentication, Food Management, Categories,
 * Orders, Users, Reviews, Analytics and Notifications.
 */

const API_BASE_URL = '/api';

// Admin Authentication Guard
async function checkAdminAuth() {
  const token = localStorage.getItem('royal_flame_token');
  const userStr = localStorage.getItem('royal_flame_user');

  if (!token || !userStr) {
    window.location.href = '/login.html?redirect=admin&msg=Please login with an administrator account.';
    return null;
  }

  let user = null;
  try {
    user = JSON.parse(userStr);
  } catch (e) {
    localStorage.removeItem('royal_flame_token');
    localStorage.removeItem('royal_flame_user');
    window.location.href = '/login.html';
    return null;
  }

  // Verify server-side
  try {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!data.success || data.user.role !== 'admin') {
      alert('Access Denied. Only Executive Administrators may enter the Royal Control Chamber.');
      window.location.href = '/home.html';
      return null;
    }
    user = data.user;
    localStorage.setItem('royal_flame_user', JSON.stringify(user));
  } catch (err) {
    console.warn('Admin check offline fallback, using local token credentials');
    if (user.role !== 'admin') {
      window.location.href = '/home.html';
      return null;
    }
  }

  updateAdminUI(user);
  return user;
}

// Update admin avatar & name in sidebar
function updateAdminUI(user) {
  const nameEls = document.querySelectorAll('.admin-name');
  nameEls.forEach(el => el.textContent = user.name || 'Executive Admin');
  
  const avatarEls = document.querySelectorAll('.admin-avatar');
  avatarEls.forEach(el => {
    const initials = (user.name || 'A').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    el.textContent = initials;
  });

  // Start real-time clock
  const clockEl = document.getElementById('adminClock');
  if (clockEl) {
    const updateTime = () => {
      const now = new Date();
      clockEl.textContent = now.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };
    updateTime();
    setInterval(updateTime, 30000);
  }
}

// Admin Logout
function handleAdminLogout() {
  if (confirm('Are you sure you wish to exit the Royal Flame Admin Dashboard?')) {
    localStorage.removeItem('royal_flame_token');
    localStorage.removeItem('royal_flame_user');
    window.location.href = '/login.html';
  }
}

// Toast Notifications
function showToast(message, type = 'success') {
  const existing = document.querySelector('.admin-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `admin-toast ${type}`;
  const icon = type === 'success' ? '✨' : type === 'error' ? '⚠️' : 'ℹ️';
  toast.innerHTML = `<span>${icon}</span> <div>${message}</div>`;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Mobile Sidebar Toggle
function toggleAdminSidebar() {
  const sidebar = document.querySelector('.admin-sidebar');
  if (sidebar) sidebar.classList.toggle('open');
}

// =========================================================================
// 1. DASHBOARD CONTROLLER (dashboard.html)
// =========================================================================
let monthlyChartInstance = null;
let dailyChartInstance = null;
let categoryChartInstance = null;
let orderStatusChartInstance = null;

async function initAdminDashboard() {
  const user = await checkAdminAuth();
  if (!user) return;

  try {
    const token = localStorage.getItem('royal_flame_token');
    const res = await fetch(`${API_BASE_URL}/admin/analytics`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const result = await res.json();

    if (!result.success) {
      showToast(result.message || 'Failed to fetch analytics', 'error');
      return;
    }

    const { stats, charts } = result;

    // Populate KPI Cards
    document.getElementById('statTotalUsers').textContent = (stats.totalUsers || 0).toLocaleString();
    document.getElementById('statTotalOrders').textContent = (stats.totalOrders || 0).toLocaleString();
    document.getElementById('statTodayOrders').textContent = (stats.todayOrders || 0).toLocaleString();
    document.getElementById('statTotalRevenue').textContent = `₹${(stats.totalRevenue || 0).toLocaleString()}`;
    document.getElementById('statTotalDishes').textContent = (stats.totalDishes || 0).toLocaleString();
    document.getElementById('statPendingOrders').textContent = (stats.pendingOrders || 0).toLocaleString();

    // Render Charts if Chart.js is loaded
    if (window.Chart) {
      renderDashboardCharts(charts);
    }

    // Load recent orders table
    loadDashboardRecentOrders();
  } catch (err) {
    console.error('Error initializing dashboard:', err);
    showToast('Failed to load dashboard metrics', 'error');
  }
}

function renderDashboardCharts(charts) {
  // 1. Monthly Revenue Chart
  const monthlyCtx = document.getElementById('monthlyRevenueChart')?.getContext('2d');
  if (monthlyCtx) {
    if (monthlyChartInstance) monthlyChartInstance.destroy();
    monthlyChartInstance = new Chart(monthlyCtx, {
      type: 'line',
      data: {
        labels: charts.monthlyData.map(d => d.month),
        datasets: [{
          label: 'Revenue (₹)',
          data: charts.monthlyData.map(d => d.revenue),
          borderColor: '#d4af37',
          backgroundColor: 'rgba(212, 175, 55, 0.12)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#f5e7a9',
          pointBorderColor: '#d4af37',
          pointRadius: 5,
          pointHoverRadius: 7
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#f5f5f7', font: { family: 'Outfit' } } }
        },
        scales: {
          x: { ticks: { color: '#9c9ca8' }, grid: { color: 'rgba(255, 255, 255, 0.05)' } },
          y: { ticks: { color: '#9c9ca8', callback: v => '₹' + v.toLocaleString() }, grid: { color: 'rgba(255, 255, 255, 0.05)' } }
        }
      }
    });
  }

  // 2. Daily Sales Chart
  const dailyCtx = document.getElementById('dailySalesChart')?.getContext('2d');
  if (dailyCtx) {
    if (dailyChartInstance) dailyChartInstance.destroy();
    dailyChartInstance = new Chart(dailyCtx, {
      type: 'bar',
      data: {
        labels: charts.dailyData.map(d => d.day),
        datasets: [{
          label: 'Daily Sales (₹)',
          data: charts.dailyData.map(d => d.sales),
          backgroundColor: 'rgba(212, 175, 55, 0.75)',
          borderColor: '#d4af37',
          borderWidth: 1,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#f5f5f7', font: { family: 'Outfit' } } }
        },
        scales: {
          x: { ticks: { color: '#9c9ca8' }, grid: { display: false } },
          y: { ticks: { color: '#9c9ca8', callback: v => '₹' + v }, grid: { color: 'rgba(255, 255, 255, 0.05)' } }
        }
      }
    });
  }

  // 3. Category Breakdown Chart
  const catCtx = document.getElementById('categoryPieChart')?.getContext('2d');
  if (catCtx && charts.categoryStats) {
    if (categoryChartInstance) categoryChartInstance.destroy();
    categoryChartInstance = new Chart(catCtx, {
      type: 'doughnut',
      data: {
        labels: charts.categoryStats.slice(0, 6).map(c => c._id || 'Special'),
        datasets: [{
          data: charts.categoryStats.slice(0, 6).map(c => c.count),
          backgroundColor: [
            '#d4af37', '#f5e7a9', '#996515', '#4caf50', '#2196f3', '#ab47bc'
          ],
          borderColor: '#0f0f15',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#f5f5f7', font: { family: 'Outfit' } } }
        }
      }
    });
  }

  // 4. Order Status Breakdown
  const statusCtx = document.getElementById('orderStatusPieChart')?.getContext('2d');
  if (statusCtx && charts.orderStatusCounts) {
    if (orderStatusChartInstance) orderStatusChartInstance.destroy();
    const stLabels = Object.keys(charts.orderStatusCounts);
    const stValues = Object.values(charts.orderStatusCounts);
    orderStatusChartInstance = new Chart(statusCtx, {
      type: 'polarArea',
      data: {
        labels: stLabels,
        datasets: [{
          data: stValues,
          backgroundColor: [
            'rgba(255, 152, 0, 0.6)',
            'rgba(33, 150, 243, 0.6)',
            'rgba(156, 39, 176, 0.6)',
            'rgba(0, 188, 212, 0.6)',
            'rgba(255, 193, 7, 0.6)',
            'rgba(76, 175, 80, 0.6)',
            'rgba(244, 67, 54, 0.6)'
          ],
          borderColor: '#0f0f15'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#f5f5f7', font: { family: 'Outfit' } } }
        },
        scales: {
          r: { ticks: { display: false }, grid: { color: 'rgba(255,255,255,0.08)' } }
        }
      }
    });
  }
}

async function loadDashboardRecentOrders() {
  const tbody = document.getElementById('recentOrdersTableBody');
  if (!tbody) return;

  try {
    const token = localStorage.getItem('royal_flame_token');
    const res = await fetch(`${API_BASE_URL}/admin/orders`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const result = await res.json();
    if (!result.success || !result.data) return;

    const recent = result.data.slice(0, 5);
    if (recent.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--admin-text-muted); padding: 30px;">No royal orders recorded yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = recent.map(o => {
      const statusClass = `badge-${(o.orderStatus || 'pending').toLowerCase().replace(/\s+/g, '-')}`;
      const customerName = o.user?.name || o.shippingAddress?.fullName || 'Distinguished Patron';
      return `
        <tr>
          <td><strong style="color: var(--admin-gold-light);">#${o.orderId || o._id.substring(0, 8)}</strong></td>
          <td>${customerName}</td>
          <td>${o.items?.length || 1} delicacy</td>
          <td style="color: #fff; font-weight: 600;">₹${(o.totalAmount || 0).toLocaleString()}</td>
          <td><span class="badge ${statusClass}">${o.orderStatus}</span></td>
          <td>
            <a href="/admin/orders.html?id=${o._id}" class="btn-action-icon" title="Inspect Order">
              <i class="fas fa-eye"></i>
            </a>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('Error loading recent orders:', err);
  }
}

// =========================================================================
// 2. DISHES MANAGEMENT CONTROLLER (dishes.html)
// =========================================================================
let allDishesCache = [];

async function initAdminDishes() {
  const user = await checkAdminAuth();
  if (!user) return;

  await loadCategoryOptions();
  await loadAllDishes();

  // Search input handler
  const searchInput = document.getElementById('dishSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => filterDishesList(e.target.value));
  }

  // Category filter handler
  const catFilter = document.getElementById('dishCategoryFilter');
  if (catFilter) {
    catFilter.addEventListener('change', (e) => filterDishesList(searchInput?.value || '', e.target.value));
  }
}

async function loadCategoryOptions() {
  try {
    const res = await fetch(`${API_BASE_URL}/categories`);
    const result = await res.json();
    if (result.success && result.data) {
      const selects = [document.getElementById('dishCategoryFilter'), document.getElementById('modalDishCategory')];
      selects.forEach(select => {
        if (!select) return;
        const currentVal = select.value;
        const isFilter = select.id === 'dishCategoryFilter';
        select.innerHTML = isFilter ? `<option value="all">All Categories</option>` : `<option value="">Select Culinary Category</option>`;
        result.data.forEach(c => {
          select.innerHTML += `<option value="${c.name}">${c.icon || '🍽️'} ${c.name}</option>`;
        });
        if (currentVal) select.value = currentVal;
      });
    }
  } catch (err) {
    console.error('Error loading category options:', err);
  }
}

async function loadAllDishes() {
  const tbody = document.getElementById('dishesTableBody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 40px; color: var(--admin-text-muted);"><i class="fas fa-spinner fa-spin"></i> Fetching Royal Dishes...</td></tr>`;

  try {
    const res = await fetch(`${API_BASE_URL}/dishes?limit=200`);
    const result = await res.json();
    if (result.success && result.data) {
      allDishesCache = result.data;
      renderDishesTable(allDishesCache);
    }
  } catch (err) {
    console.error('Error fetching dishes:', err);
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color: #f44336; padding: 30px;">Failed to load dishes.</td></tr>`;
  }
}

function renderDishesTable(dishes) {
  const tbody = document.getElementById('dishesTableBody');
  if (!tbody) return;

  if (dishes.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 40px; color: var(--admin-text-muted);">No dishes matched your search criteria.</td></tr>`;
    return;
  }

  tbody.innerHTML = dishes.map(dish => {
    const isVeg = dish.foodType === 'veg';
    const typeBadge = isVeg ? '<span class="badge badge-veg"><i class="fas fa-leaf"></i> Veg</span>' : '<span class="badge badge-non-veg"><i class="fas fa-drumstick-bite"></i> Non-Veg</span>';
    const isAvail = dish.availability !== false;
    const availBadge = isAvail ? '<span class="badge badge-active">Available</span>' : '<span class="badge badge-inactive">Out of Stock</span>';
    
    return `
      <tr>
        <td>
          <div class="dish-cell">
            <img src="${dish.image}" alt="${dish.name}" class="dish-cell-img" onerror="this.src='https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=100&q=80'">
            <div class="dish-cell-info">
              <h4>${dish.name}</h4>
              <span>${dish.cuisine || 'Royal Heritage'} • ⭐ ${dish.rating || 5.0} (${dish.numReviews || 0})</span>
            </div>
          </div>
        </td>
        <td><strong style="color: var(--admin-gold);">${dish.category}</strong></td>
        <td>${typeBadge}</td>
        <td>
          <strong style="color: #fff;">₹${dish.price}</strong>
          ${dish.discount ? `<span style="font-size:0.75rem; color:#4caf50; display:block;">-${dish.discount}% off</span>` : ''}
        </td>
        <td>${availBadge}</td>
        <td>
          <div class="action-btn-group">
            <button class="btn-action-icon" onclick="openEditDishModal('${dish._id}')" title="Edit Dish">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn-action-icon btn-danger" onclick="confirmDeleteDish('${dish._id}', '${escapeHtml(dish.name)}')" title="Delete Dish">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function filterDishesList(query = '', category = 'all') {
  let filtered = allDishesCache;
  if (category && category !== 'all') {
    filtered = filtered.filter(d => d.category.toLowerCase() === category.toLowerCase());
  }
  if (query.trim()) {
    const q = query.toLowerCase().trim();
    filtered = filtered.filter(d => 
      d.name.toLowerCase().includes(q) || 
      (d.description && d.description.toLowerCase().includes(q)) ||
      (d.cuisine && d.cuisine.toLowerCase().includes(q))
    );
  }
  renderDishesTable(filtered);
}

// Add/Edit Dish Modal
function openAddDishModal() {
  document.getElementById('dishModalTitle').textContent = '✨ Add New Royal Dish';
  document.getElementById('dishForm').reset();
  document.getElementById('modalDishId').value = '';
  document.getElementById('modalDishRating').value = '5.0';
  document.getElementById('modalDishAvail').value = 'true';
  document.getElementById('modalDishType').value = 'veg';
  document.getElementById('dishModalBackdrop').classList.add('active');
}

function openEditDishModal(dishId) {
  const dish = allDishesCache.find(d => d._id === dishId);
  if (!dish) return;

  document.getElementById('dishModalTitle').textContent = `✨ Edit Dish: ${dish.name}`;
  document.getElementById('modalDishId').value = dish._id;
  document.getElementById('modalDishName').value = dish.name;
  document.getElementById('modalDishCategory').value = dish.category;
  document.getElementById('modalDishPrice').value = dish.price;
  document.getElementById('modalDishDiscount').value = dish.discount || 0;
  document.getElementById('modalDishType').value = dish.foodType || 'veg';
  document.getElementById('modalDishRating').value = dish.rating || 5.0;
  document.getElementById('modalDishAvail').value = (dish.availability !== false).toString();
  document.getElementById('modalDishImage').value = dish.image || '';
  document.getElementById('modalDishPrep').value = dish.preparationTime || '20 mins';
  document.getElementById('modalDishCalories').value = dish.calories || 450;
  document.getElementById('modalDishCuisine').value = dish.cuisine || 'Royal Heritage';
  document.getElementById('modalDishIngredients').value = Array.isArray(dish.ingredients) ? dish.ingredients.join(', ') : (dish.ingredients || '');
  document.getElementById('modalDishDesc').value = dish.description || '';

  document.getElementById('dishModalBackdrop').classList.add('active');
}

function closeDishModal() {
  document.getElementById('dishModalBackdrop').classList.remove('active');
}

async function handleDishFormSubmit(e) {
  e.preventDefault();
  const token = localStorage.getItem('royal_flame_token');
  const dishId = document.getElementById('modalDishId').value;
  const isEdit = !!dishId;

  const payload = {
    name: document.getElementById('modalDishName').value.trim(),
    category: document.getElementById('modalDishCategory').value.trim(),
    price: Number(document.getElementById('modalDishPrice').value),
    discount: Number(document.getElementById('modalDishDiscount').value) || 0,
    foodType: document.getElementById('modalDishType').value,
    rating: Number(document.getElementById('modalDishRating').value) || 5.0,
    availability: document.getElementById('modalDishAvail').value === 'true',
    image: document.getElementById('modalDishImage').value.trim(),
    preparationTime: document.getElementById('modalDishPrep').value.trim(),
    calories: Number(document.getElementById('modalDishCalories').value) || 450,
    cuisine: document.getElementById('modalDishCuisine').value.trim(),
    ingredients: document.getElementById('modalDishIngredients').value,
    description: document.getElementById('modalDishDesc').value.trim()
  };

  try {
    const url = isEdit ? `${API_BASE_URL}/admin/dishes/${dishId}` : `${API_BASE_URL}/admin/dishes`;
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const result = await res.json();
    if (result.success) {
      showToast(result.message || 'Dish updated successfully!', 'success');
      closeDishModal();
      await loadAllDishes();
    } else {
      showToast(result.message || 'Operation failed', 'error');
    }
  } catch (err) {
    console.error('Error saving dish:', err);
    showToast('Failed to save dish changes', 'error');
  }
}

async function confirmDeleteDish(dishId, dishName) {
  if (confirm(`Are you certain you wish to remove "${dishName}" from the royal menu? This action cannot be undone.`)) {
    const token = localStorage.getItem('royal_flame_token');
    try {
      const res = await fetch(`${API_BASE_URL}/admin/dishes/${dishId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success) {
        showToast(result.message || 'Dish deleted', 'success');
        await loadAllDishes();
      } else {
        showToast(result.message || 'Delete failed', 'error');
      }
    } catch (err) {
      console.error('Error deleting dish:', err);
      showToast('Failed to delete dish', 'error');
    }
  }
}

// =========================================================================
// 3. CATEGORIES CONTROLLER (categories.html)
// =========================================================================
let allCategoriesCache = [];

async function initAdminCategories() {
  const user = await checkAdminAuth();
  if (!user) return;
  await loadCategoriesView();
}

async function loadCategoriesView() {
  const grid = document.getElementById('categoriesGrid');
  if (!grid) return;

  grid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding: 50px; color: var(--admin-text-muted);"><i class="fas fa-spinner fa-spin"></i> Loading Royal Categories...</div>`;

  try {
    const res = await fetch(`${API_BASE_URL}/categories`);
    const result = await res.json();
    if (result.success && result.data) {
      allCategoriesCache = result.data;
      renderCategoriesGrid(allCategoriesCache);
    }
  } catch (err) {
    console.error('Error loading categories:', err);
    grid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; color: #f44336; padding: 40px;">Failed to load categories.</div>`;
  }
}

function renderCategoriesGrid(categories) {
  const grid = document.getElementById('categoriesGrid');
  if (!grid) return;

  grid.innerHTML = categories.map(cat => `
    <div class="cat-admin-card">
      <div class="cat-card-cover">
        <img src="${cat.image || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80'}" alt="${cat.name}" onerror="this.src='https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80'">
        <div class="cat-card-icon-badge">${cat.icon || '🍽️'}</div>
      </div>
      <div class="cat-card-body">
        <h3>${cat.name}</h3>
        <p>${cat.description || 'Gourmet selections prepared with utmost culinary craftsmanship.'}</p>
      </div>
      <div class="cat-card-footer">
        <span class="cat-dish-count"><i class="fas fa-utensils"></i> ${cat.dishCount || 0} Dishes</span>
        <div class="action-btn-group">
          <button class="btn-action-icon" onclick="openEditCategoryModal('${cat._id}')" title="Edit Category">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-action-icon btn-danger" onclick="confirmDeleteCategory('${cat._id}', '${escapeHtml(cat.name)}')" title="Delete Category">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function openAddCategoryModal() {
  document.getElementById('catModalTitle').textContent = '✨ Add Culinary Category';
  document.getElementById('categoryForm').reset();
  document.getElementById('modalCatId').value = '';
  document.getElementById('modalCatIcon').value = '🍽️';
  document.getElementById('categoryModalBackdrop').classList.add('active');
}

function openEditCategoryModal(catId) {
  const cat = allCategoriesCache.find(c => c._id === catId);
  if (!cat) return;

  document.getElementById('catModalTitle').textContent = `✨ Edit Category: ${cat.name}`;
  document.getElementById('modalCatId').value = cat._id;
  document.getElementById('modalCatName').value = cat.name;
  document.getElementById('modalCatIcon').value = cat.icon || '🍽️';
  document.getElementById('modalCatImage').value = cat.image || '';
  document.getElementById('modalCatDesc').value = cat.description || '';

  document.getElementById('categoryModalBackdrop').classList.add('active');
}

function closeCategoryModal() {
  document.getElementById('categoryModalBackdrop').classList.remove('active');
}

async function handleCategoryFormSubmit(e) {
  e.preventDefault();
  const token = localStorage.getItem('royal_flame_token');
  const catId = document.getElementById('modalCatId').value;
  const isEdit = !!catId;

  const payload = {
    name: document.getElementById('modalCatName').value.trim(),
    icon: document.getElementById('modalCatIcon').value.trim(),
    image: document.getElementById('modalCatImage').value.trim(),
    description: document.getElementById('modalCatDesc').value.trim()
  };

  try {
    const url = isEdit ? `${API_BASE_URL}/admin/categories/${catId}` : `${API_BASE_URL}/admin/categories`;
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const result = await res.json();
    if (result.success) {
      showToast(result.message || 'Category saved successfully!', 'success');
      closeCategoryModal();
      await loadCategoriesView();
    } else {
      showToast(result.message || 'Operation failed', 'error');
    }
  } catch (err) {
    console.error('Error saving category:', err);
    showToast('Failed to save category', 'error');
  }
}

async function confirmDeleteCategory(catId, catName) {
  if (confirm(`Are you sure you want to delete category "${catName}"?`)) {
    const token = localStorage.getItem('royal_flame_token');
    try {
      const res = await fetch(`${API_BASE_URL}/admin/categories/${catId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success) {
        showToast(result.message || 'Category deleted', 'success');
        await loadCategoriesView();
      } else {
        showToast(result.message || 'Delete failed', 'error');
      }
    } catch (err) {
      showToast('Failed to delete category', 'error');
    }
  }
}

// =========================================================================
// 4. ORDERS CONTROLLER (orders.html)
// =========================================================================
let allOrdersCache = [];

async function initAdminOrders() {
  const user = await checkAdminAuth();
  if (!user) return;

  await loadAllOrders();

  const searchInput = document.getElementById('orderSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => filterOrdersList(e.target.value));
  }

  const statusFilter = document.getElementById('orderStatusFilter');
  if (statusFilter) {
    statusFilter.addEventListener('change', (e) => filterOrdersList(searchInput?.value || '', e.target.value));
  }

  // Check URL params for specific order view
  const urlParams = new URLSearchParams(window.location.search);
  const targetId = urlParams.get('id');
  if (targetId) {
    setTimeout(() => openOrderDetailsModal(targetId), 500);
  }
}

async function loadAllOrders() {
  const tbody = document.getElementById('ordersTableBody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding: 40px; color: var(--admin-text-muted);"><i class="fas fa-spinner fa-spin"></i> Retrieving Royal Banquets & Orders...</td></tr>`;

  try {
    const token = localStorage.getItem('royal_flame_token');
    const res = await fetch(`${API_BASE_URL}/admin/orders`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const result = await res.json();
    if (result.success && result.data) {
      allOrdersCache = result.data;
      renderOrdersTable(allOrdersCache);
    }
  } catch (err) {
    console.error('Error fetching admin orders:', err);
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color: #f44336; padding: 30px;">Failed to load orders.</td></tr>`;
  }
}

function renderOrdersTable(orders) {
  const tbody = document.getElementById('ordersTableBody');
  if (!tbody) return;

  if (orders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding: 40px; color: var(--admin-text-muted);">No orders found.</td></tr>`;
    return;
  }

  tbody.innerHTML = orders.map(o => {
    const statusClass = `badge-${(o.orderStatus || 'pending').toLowerCase().replace(/\s+/g, '-')}`;
    const customerName = o.user?.name || o.shippingAddress?.fullName || 'Distinguished Patron';
    const customerPhone = o.user?.phone || o.shippingAddress?.phone || 'N/A';
    const dateStr = new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    return `
      <tr>
        <td><strong style="color: var(--admin-gold-light);">#${o.orderId || o._id.substring(0, 8)}</strong></td>
        <td>
          <div class="user-cell-info">
            <h4 style="font-size:0.9rem; color:#fff;">${customerName}</h4>
            <span style="font-size:0.75rem; color:var(--admin-text-muted);">${customerPhone}</span>
          </div>
        </td>
        <td>${o.items?.length || 1} items</td>
        <td><strong style="color: #fff;">₹${(o.totalAmount || 0).toLocaleString()}</strong></td>
        <td><span style="text-transform: uppercase; font-size: 0.8rem; color: var(--admin-gold);">${o.paymentMethod || 'COD'}</span></td>
        <td><span class="badge ${o.paymentStatus === 'Paid' ? 'badge-delivered' : 'badge-pending'}">${o.paymentStatus || 'Pending'}</span></td>
        <td>
          <select class="admin-select" style="padding: 4px 8px; font-size: 0.8rem;" onchange="updateOrderStatusQuick('${o._id}', this.value)">
            <option value="Pending" ${o.orderStatus === 'Pending' ? 'selected' : ''}>Pending</option>
            <option value="Confirmed" ${o.orderStatus === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
            <option value="Preparing" ${o.orderStatus === 'Preparing' ? 'selected' : ''}>Preparing</option>
            <option value="Ready" ${o.orderStatus === 'Ready' ? 'selected' : ''}>Ready</option>
            <option value="Out for Delivery" ${o.orderStatus === 'Out for Delivery' ? 'selected' : ''}>Out for Delivery</option>
            <option value="Delivered" ${o.orderStatus === 'Delivered' ? 'selected' : ''}>Delivered</option>
            <option value="Cancelled" ${o.orderStatus === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </td>
        <td style="font-size:0.78rem; color:var(--admin-text-dim);">${dateStr}</td>
        <td>
          <button class="btn-action-icon" onclick="openOrderDetailsModal('${o._id}')" title="View Details">
            <i class="fas fa-eye"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function filterOrdersList(query = '', status = 'all') {
  let filtered = allOrdersCache;
  if (status && status !== 'all') {
    filtered = filtered.filter(o => o.orderStatus === status);
  }
  if (query.trim()) {
    const q = query.toLowerCase().trim();
    filtered = filtered.filter(o => {
      const name = (o.user?.name || o.shippingAddress?.fullName || '').toLowerCase();
      const phone = (o.user?.phone || o.shippingAddress?.phone || '').toLowerCase();
      const id = (o.orderId || o._id || '').toLowerCase();
      return name.includes(q) || phone.includes(q) || id.includes(q);
    });
  }
  renderOrdersTable(filtered);
}

async function updateOrderStatusQuick(orderId, newStatus) {
  const token = localStorage.getItem('royal_flame_token');
  try {
    const res = await fetch(`${API_BASE_URL}/admin/orders/${orderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status: newStatus })
    });
    const result = await res.json();
    if (result.success) {
      showToast(`Order status updated to "${newStatus}". Customer notified! ✨`, 'success');
      await loadAllOrders();
    } else {
      showToast(result.message || 'Status update failed', 'error');
    }
  } catch (err) {
    console.error('Error updating order:', err);
    showToast('Failed to update status', 'error');
  }
}

function openOrderDetailsModal(orderId) {
  const order = allOrdersCache.find(o => o._id === orderId);
  if (!order) return;

  document.getElementById('modalOrderIdTitle').textContent = `Order #${order.orderId || order._id.substring(0, 8)}`;
  
  const content = document.getElementById('modalOrderContent');
  const itemsHtml = (order.items || []).map(item => `
    <div style="display:flex; justify-content:space-between; align-items:center; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.06);">
      <div style="display:flex; align-items:center; gap:12px;">
        <img src="${item.image || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=80&q=80'}" style="width:40px; height:40px; border-radius:6px; object-fit:cover;">
        <div>
          <div style="font-weight:600; color:#fff;">${item.name}</div>
          <div style="font-size:0.75rem; color:var(--admin-text-muted);">₹${item.price} × ${item.quantity}</div>
        </div>
      </div>
      <div style="font-weight:600; color:var(--admin-gold-light);">₹${(item.price * item.quantity).toLocaleString()}</div>
    </div>
  `).join('');

  const addr = order.shippingAddress || {};
  const addrText = `${addr.fullName || 'Patron'}, ${addr.houseNo || ''} ${addr.street || ''}, ${addr.area || ''}, ${addr.city || ''}, ${addr.state || ''} - ${addr.pincode || ''}. Phone: ${addr.phone || 'N/A'}`;

  content.innerHTML = `
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px;">
      <div style="background:rgba(0,0,0,0.3); padding:14px; border-radius:8px; border:1px solid var(--admin-border);">
        <div style="font-size:0.75rem; color:var(--admin-gold); text-transform:uppercase;">Customer Details</div>
        <div style="font-weight:600; color:#fff; margin-top:4px;">${order.user?.name || addr.fullName || 'N/A'}</div>
        <div style="font-size:0.8rem; color:var(--admin-text-muted);">${order.user?.email || 'N/A'}</div>
        <div style="font-size:0.8rem; color:var(--admin-text-muted);">${order.user?.phone || addr.phone || 'N/A'}</div>
      </div>
      <div style="background:rgba(0,0,0,0.3); padding:14px; border-radius:8px; border:1px solid var(--admin-border);">
        <div style="font-size:0.75rem; color:var(--admin-gold); text-transform:uppercase;">Order Summary</div>
        <div style="font-size:0.85rem; color:#fff; margin-top:4px;">Payment: <strong>${order.paymentMethod}</strong> (${order.paymentStatus})</div>
        <div style="font-size:0.85rem; color:#fff;">Status: <strong>${order.orderStatus}</strong></div>
        <div style="font-size:0.85rem; color:var(--admin-gold-light); font-weight:700;">Grand Total: ₹${(order.totalAmount || 0).toLocaleString()}</div>
      </div>
    </div>

    <div style="background:rgba(0,0,0,0.3); padding:14px; border-radius:8px; border:1px solid var(--admin-border); margin-bottom:16px;">
      <div style="font-size:0.75rem; color:var(--admin-gold); text-transform:uppercase; margin-bottom:4px;">Delivery Destination</div>
      <div style="font-size:0.85rem; color:#fff;">${addrText}</div>
    </div>

    <div style="font-size:0.8rem; color:var(--admin-gold-light); text-transform:uppercase; margin-bottom:8px;">Banquet Dishes Ordered</div>
    <div style="max-height:180px; overflow-y:auto;">
      ${itemsHtml}
    </div>
  `;

  document.getElementById('orderDetailsModalBackdrop').classList.add('active');
}

function closeOrderDetailsModal() {
  document.getElementById('orderDetailsModalBackdrop').classList.remove('active');
}

// =========================================================================
// 5. USERS CONTROLLER (users.html)
// =========================================================================
let allUsersCache = [];

async function initAdminUsers() {
  const user = await checkAdminAuth();
  if (!user) return;

  await loadAllUsers();

  const searchInput = document.getElementById('userSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => filterUsersList(e.target.value));
  }
}

async function loadAllUsers() {
  const tbody = document.getElementById('usersTableBody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 40px; color: var(--admin-text-muted);"><i class="fas fa-spinner fa-spin"></i> Loading Registered Patrons...</td></tr>`;

  try {
    const token = localStorage.getItem('royal_flame_token');
    const res = await fetch(`${API_BASE_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const result = await res.json();
    if (result.success && result.data) {
      allUsersCache = result.data;
      renderUsersTable(allUsersCache);
    }
  } catch (err) {
    console.error('Error fetching users:', err);
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color: #f44336; padding: 30px;">Failed to load user records.</td></tr>`;
  }
}

function renderUsersTable(users) {
  const tbody = document.getElementById('usersTableBody');
  if (!tbody) return;

  if (users.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 40px; color: var(--admin-text-muted);">No users found.</td></tr>`;
    return;
  }

  tbody.innerHTML = users.map(u => {
    const roleBadge = u.role === 'admin' ? '<span class="badge badge-admin"><i class="fas fa-shield-alt"></i> Admin</span>' : '<span class="badge badge-user"><i class="fas fa-user"></i> Patron</span>';
    const statusBadge = u.isActive !== false ? '<span class="badge badge-active">Active</span>' : '<span class="badge badge-inactive">Deactivated</span>';
    const regDate = new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const initials = (u.name || 'P').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    return `
      <tr>
        <td>
          <div class="user-cell">
            <div class="admin-avatar" style="width:36px; height:36px; font-size:0.8rem;">${initials}</div>
            <div class="user-cell-info">
              <h4>${u.name}</h4>
              <span>${u.email}</span>
            </div>
          </div>
        </td>
        <td>${u.phone || 'N/A'}</td>
        <td>${regDate}</td>
        <td><strong style="color: var(--admin-gold);">${u.orderCount || 0}</strong> Orders</td>
        <td>${roleBadge}</td>
        <td>${statusBadge}</td>
        <td>
          <div class="action-btn-group">
            <button class="btn-action-icon ${u.isActive !== false ? 'btn-danger' : 'btn-success'}" onclick="toggleUserStatus('${u._id}', ${u.isActive !== false})" title="${u.isActive !== false ? 'Deactivate User' : 'Activate User'}">
              <i class="fas ${u.isActive !== false ? 'fa-user-slash' : 'fa-user-check'}"></i>
            </button>
            <button class="btn-action-icon" onclick="toggleUserRole('${u._id}', '${u.role}')" title="Toggle Role (Admin/Patron)">
              <i class="fas fa-user-tag"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function filterUsersList(query = '') {
  let filtered = allUsersCache;
  if (query.trim()) {
    const q = query.toLowerCase().trim();
    filtered = filtered.filter(u => 
      u.name.toLowerCase().includes(q) || 
      u.email.toLowerCase().includes(q) ||
      (u.phone && u.phone.includes(q))
    );
  }
  renderUsersTable(filtered);
}

async function toggleUserStatus(userId, currentActive) {
  const newActive = !currentActive;
  const actionText = newActive ? 'activate' : 'deactivate';
  if (confirm(`Are you sure you wish to ${actionText} this user's account?`)) {
    const token = localStorage.getItem('royal_flame_token');
    try {
      const res = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: newActive })
      });
      const result = await res.json();
      if (result.success) {
        showToast(`User successfully ${newActive ? 'activated' : 'deactivated'}.`, 'success');
        await loadAllUsers();
      } else {
        showToast(result.message || 'Action failed', 'error');
      }
    } catch (err) {
      showToast('Failed to update user status', 'error');
    }
  }
}

async function toggleUserRole(userId, currentRole) {
  const newRole = currentRole === 'admin' ? 'user' : 'admin';
  if (confirm(`Change user role from "${currentRole}" to "${newRole}"?`)) {
    const token = localStorage.getItem('royal_flame_token');
    try {
      const res = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      const result = await res.json();
      if (result.success) {
        showToast(`Role updated to ${newRole.toUpperCase()}!`, 'success');
        await loadAllUsers();
      } else {
        showToast(result.message || 'Role change failed', 'error');
      }
    } catch (err) {
      showToast('Failed to update role', 'error');
    }
  }
}

// =========================================================================
// 6. REVIEWS CONTROLLER (reviews.html)
// =========================================================================
let allReviewsCache = [];

async function initAdminReviews() {
  const user = await checkAdminAuth();
  if (!user) return;
  await loadAllReviews();
}

async function loadAllReviews() {
  const tbody = document.getElementById('reviewsTableBody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 40px; color: var(--admin-text-muted);"><i class="fas fa-spinner fa-spin"></i> Loading Patron Reviews...</td></tr>`;

  try {
    const token = localStorage.getItem('royal_flame_token');
    const res = await fetch(`${API_BASE_URL}/admin/reviews`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const result = await res.json();
    if (result.success && result.data) {
      allReviewsCache = result.data;
      renderReviewsTable(allReviewsCache);
    }
  } catch (err) {
    console.error('Error fetching reviews:', err);
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: #f44336; padding: 30px;">Failed to load reviews.</td></tr>`;
  }
}

function renderReviewsTable(reviews) {
  const tbody = document.getElementById('reviewsTableBody');
  if (!tbody) return;

  if (reviews.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 40px; color: var(--admin-text-muted);">No reviews found.</td></tr>`;
    return;
  }

  tbody.innerHTML = reviews.map(r => {
    const dishName = r.dish?.name || 'Gourmet Dish';
    const customerName = r.user?.name || 'Royal Guest';
    const stars = '⭐'.repeat(Math.round(r.rating || 5));
    const dateStr = new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    return `
      <tr>
        <td>
          <div class="user-cell-info">
            <h4 style="font-size:0.9rem; color:#fff;">${customerName}</h4>
            <span style="font-size:0.75rem; color:var(--admin-text-muted);">${r.user?.email || ''}</span>
          </div>
        </td>
        <td><strong style="color: var(--admin-gold);">${dishName}</strong></td>
        <td><span style="color:#f5e7a9; font-size:0.9rem;">${stars}</span> <small>(${r.rating})</small></td>
        <td style="max-width:300px; color:#ddd; font-size:0.85rem; line-height:1.4;">${r.comment || ''}</td>
        <td style="font-size:0.78rem; color:var(--admin-text-dim);">${dateStr}</td>
        <td>
          <button class="btn-action-icon btn-danger" onclick="confirmDeleteReview('${r._id}')" title="Delete Review">
            <i class="fas fa-trash-alt"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

async function confirmDeleteReview(reviewId) {
  if (confirm('Are you certain you wish to remove this customer review? The dish rating will be automatically recalculated.')) {
    const token = localStorage.getItem('royal_flame_token');
    try {
      const res = await fetch(`${API_BASE_URL}/admin/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success) {
        showToast(result.message || 'Review deleted successfully', 'success');
        await loadAllReviews();
      } else {
        showToast(result.message || 'Delete failed', 'error');
      }
    } catch (err) {
      showToast('Failed to delete review', 'error');
    }
  }
}

// =========================================================================
// 7. ANALYTICS CONTROLLER (analytics.html)
// =========================================================================
async function initAdminAnalytics() {
  const user = await checkAdminAuth();
  if (!user) return;

  try {
    const token = localStorage.getItem('royal_flame_token');
    const res = await fetch(`${API_BASE_URL}/admin/analytics`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const result = await res.json();
    if (!result.success) return;

    const { stats, charts } = result;

    document.getElementById('analyticsTotalRevenue').textContent = `₹${(stats.totalRevenue || 0).toLocaleString()}`;
    document.getElementById('analyticsTodayRevenue').textContent = `₹${(stats.todayRevenue || 0).toLocaleString()}`;
    document.getElementById('analyticsTotalOrders').textContent = (stats.totalOrders || 0).toLocaleString();
    document.getElementById('analyticsAOV').textContent = `₹${(stats.avgOrderValue || 0).toLocaleString()}`;

    // Most popular dish
    if (charts.popularDishes && charts.popularDishes.length > 0) {
      document.getElementById('analyticsTopDish').textContent = charts.popularDishes[0].name;
    }

    // Most popular category
    if (charts.categoryStats && charts.categoryStats.length > 0) {
      document.getElementById('analyticsTopCategory').textContent = charts.categoryStats[0]._id;
    }

    if (window.Chart) {
      renderAnalyticsCharts(charts);
    }
  } catch (err) {
    console.error('Error initializing analytics page:', err);
  }
}

function renderAnalyticsCharts(charts) {
  // Monthly Revenue Line Chart
  const mCtx = document.getElementById('analyticsMonthlyChart')?.getContext('2d');
  if (mCtx) {
    new Chart(mCtx, {
      type: 'line',
      data: {
        labels: charts.monthlyData.map(d => d.month),
        datasets: [{
          label: 'Monthly Revenue (₹)',
          data: charts.monthlyData.map(d => d.revenue),
          borderColor: '#d4af37',
          backgroundColor: 'rgba(212, 175, 55, 0.15)',
          fill: true,
          tension: 0.35,
          borderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#fff' } } },
        scales: {
          x: { ticks: { color: '#9c9ca8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
          y: { ticks: { color: '#9c9ca8', callback: v => '₹' + v.toLocaleString() }, grid: { color: 'rgba(255,255,255,0.05)' } }
        }
      }
    });
  }

  // Daily Revenue Bar Chart
  const dCtx = document.getElementById('analyticsDailyChart')?.getContext('2d');
  if (dCtx) {
    new Chart(dCtx, {
      type: 'bar',
      data: {
        labels: charts.dailyData.map(d => d.day),
        datasets: [{
          label: 'Daily Sales (₹)',
          data: charts.dailyData.map(d => d.sales),
          backgroundColor: '#d4af37',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#fff' } } },
        scales: {
          x: { ticks: { color: '#9c9ca8' }, grid: { display: false } },
          y: { ticks: { color: '#9c9ca8', callback: v => '₹' + v }, grid: { color: 'rgba(255,255,255,0.05)' } }
        }
      }
    });
  }
}

// Utility helper
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}
