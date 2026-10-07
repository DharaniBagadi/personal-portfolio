/**
 * ROYAL FLAME - ORDERS & LIVE TRACKING SCRIPT (orders.js)
 */

const API_BASE_URL = window.location.origin;

// State
let currentUser = null;
let allOrders = [];
let currentOrder = null;
let activeFilter = 'all';

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
    window.location.href = `login.html?redirect=${encodeURIComponent(window.location.pathname)}`;
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

// ==========================================================================
// 1. ORDERS LISTING (orders.html)
// ==========================================================================
async function loadOrdersList() {
  const token = localStorage.getItem('royal_flame_token');
  if (!token) return;

  try {
    const res = await fetch(`${API_BASE_URL}/api/orders`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();

    if (data.success && Array.isArray(data.data)) {
      allOrders = data.data;
      renderOrdersList();
    }
  } catch (err) {
    console.error('Error fetching orders:', err);
  }
}

function renderOrdersList() {
  const container = document.getElementById('orders-list-container');
  const emptyState = document.getElementById('orders-empty-state');
  if (!container) return;

  let filtered = [...allOrders];
  if (activeFilter === 'active') {
    filtered = filtered.filter(o => !['Delivered', 'Cancelled'].includes(o.orderStatus));
  } else if (activeFilter === 'delivered') {
    filtered = filtered.filter(o => o.orderStatus === 'Delivered');
  } else if (activeFilter === 'cancelled') {
    filtered = filtered.filter(o => o.orderStatus === 'Cancelled');
  }

  if (filtered.length === 0) {
    container.innerHTML = '';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';

  container.innerHTML = filtered.map(order => {
    const statusClass = (order.orderStatus || 'confirmed').toLowerCase().replace(/\s+/g, '-');
    const dateFormatted = new Date(order.createdAt).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const thumbnailsHTML = (order.items || []).slice(0, 4).map(item => `
      <div class="order-thumb-wrap" title="${item.name} (${item.quantity}x)">
        <img src="${item.image}" alt="${item.name}" onerror="this.src='https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=200&q=80'">
        <span class="order-thumb-qty">${item.quantity}x</span>
      </div>
    `).join('');

    const remainingCount = order.items && order.items.length > 4 ? `+${order.items.length - 4} more` : '';

    return `
      <div class="order-summary-card">
        <div class="order-card-header">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span class="order-id-badge">#${order.orderId}</span>
            <span class="order-status-pill ${statusClass}">
              ● ${order.orderStatus}
            </span>
          </div>
          <span class="order-card-date">🕒 ${dateFormatted}</span>
        </div>

        <div class="order-card-body">
          <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
            <div class="order-items-thumbnails">${thumbnailsHTML}</div>
            ${remainingCount ? `<span style="font-size:0.8rem; color:var(--text-muted);">${remainingCount}</span>` : ''}
          </div>

          <div class="order-card-meta">
            <span class="order-card-total">₹${order.totalAmount}</span>
            <span style="font-size: 0.8rem; color: var(--gold-300);">${order.paymentMethod} &bull; ${order.paymentStatus}</span>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1.2rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.06); flex-wrap: wrap; gap: 10px;">
          <div style="font-size: 0.84rem; color: var(--text-secondary);">
            📍 Delivering to: <strong style="color: #fff;">${order.address ? order.address.city : 'Your Residence'}</strong>
          </div>
          <div style="display: flex; gap: 10px;">
            <button type="button" class="btn btn-outline" style="padding: 6px 14px; font-size: 0.8rem;" onclick="reorderItems('${order._id}')">
              🔁 Reorder
            </button>
            <a href="order-details.html?id=${order.orderId || order._id}" class="btn btn-primary" style="padding: 6px 16px; font-size: 0.8rem;">
              View Order Details ➔
            </a>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function setupOrderFilters() {
  const buttons = document.querySelectorAll('.orders-filter-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter || 'all';
      renderOrdersList();
    });
  });
}

// Reorder helper: adds all items of past order to cart
window.reorderItems = async function(orderId) {
  const token = localStorage.getItem('royal_flame_token');
  const order = allOrders.find(o => o._id === orderId || o.orderId === orderId);
  if (!order || !token) return;

  for (const item of order.items) {
    try {
      await fetch(`${API_BASE_URL}/api/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          dishId: item.dish,
          quantity: item.quantity
        })
      });
    } catch (e) {}
  }

  showToast('Reordered! 🛒', 'Items added to your dining cart.', 'success');
  setTimeout(() => { window.location.href = 'cart.html'; }, 800);
};

// ==========================================================================
// 2. ORDER DETAILS & LIVE TRACKING (order-details.html)
// ==========================================================================
const STATUS_STAGES = ['Order Placed', 'Confirmed', 'Preparing', 'Ready', 'Out for Delivery', 'Delivered'];

async function loadOrderDetails() {
  const token = localStorage.getItem('royal_flame_token');
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('id');

  if (!orderId) {
    window.location.href = 'orders.html';
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();

    if (data.success && data.data) {
      currentOrder = data.data;
      renderOrderDetails(currentOrder);
    } else {
      showToast('Order Not Found', 'Could not retrieve order details.', 'error');
    }
  } catch (err) {
    console.error('Error fetching single order:', err);
  }
}

function renderOrderDetails(order) {
  document.title = `Order #${order.orderId} | Royal Flame Dining`;

  // Header values
  const orderIdDisplay = document.getElementById('details-order-id');
  const orderDateDisplay = document.getElementById('details-order-date');
  const estDeliveryDisplay = document.getElementById('details-est-delivery');
  const statusBadgeDisplay = document.getElementById('details-status-badge');

  if (orderIdDisplay) orderIdDisplay.textContent = `#${order.orderId}`;
  if (orderDateDisplay) {
    orderDateDisplay.textContent = new Date(order.createdAt).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }
  if (estDeliveryDisplay) estDeliveryDisplay.textContent = order.estimatedDelivery || '30-40 mins';
  if (statusBadgeDisplay) {
    const statusClass = (order.orderStatus || 'confirmed').toLowerCase().replace(/\s+/g, '-');
    statusBadgeDisplay.className = `order-status-pill ${statusClass}`;
    statusBadgeDisplay.textContent = `● ${order.orderStatus}`;
  }

  // Visual Timeline
  renderStatusTimeline(order.orderStatus);

  // Itemized List
  const itemsContainer = document.getElementById('details-items-list');
  if (itemsContainer) {
    itemsContainer.innerHTML = (order.items || []).map(item => `
      <div class="cart-item-row" style="margin-bottom: 0.8rem; padding: 0.8rem 1rem;">
        <div class="cart-item-thumbnail" style="width: 70px; height: 60px;">
          <img src="${item.image}" alt="${item.name}" onerror="this.src='https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=200&q=80'">
        </div>
        <div class="cart-item-info">
          <h4 class="cart-item-name" style="font-size: 0.95rem;">${item.name}</h4>
          <span class="cart-item-category">${item.category}</span>
          <span style="font-size: 0.82rem; color: var(--text-muted);">${item.quantity}x @ ₹${item.price}</span>
        </div>
        <div class="cart-item-total-price" style="font-size: 1.1rem;">
          ₹${item.price * item.quantity}
        </div>
      </div>
    `).join('');
  }

  // Price Breakdown
  const subtotalElem = document.getElementById('details-subtotal');
  const deliveryElem = document.getElementById('details-delivery');
  const taxElem = document.getElementById('details-tax');
  const discountElem = document.getElementById('details-discount');
  const grandTotalElem = document.getElementById('details-grand-total');

  if (subtotalElem) subtotalElem.textContent = `₹${order.subtotal}`;
  if (deliveryElem) deliveryElem.textContent = order.deliveryFee === 0 ? 'FREE' : `₹${order.deliveryFee}`;
  if (taxElem) taxElem.textContent = `₹${order.tax}`;
  if (discountElem) discountElem.textContent = `-₹${order.discount}`;
  if (grandTotalElem) grandTotalElem.textContent = `₹${order.totalAmount}`;

  // Address Card
  const addressContainer = document.getElementById('details-address-card');
  if (addressContainer && order.address) {
    const a = order.address;
    addressContainer.innerHTML = `
      <div style="font-weight: 700; color: #fff; font-size: 1.05rem; margin-bottom: 4px;">${a.fullName}</div>
      <p style="color: var(--text-secondary); font-size: 0.88rem; line-height: 1.5; margin-bottom: 8px;">
        ${a.houseNo}, ${a.street}, ${a.area}<br>
        ${a.city}, ${a.state} - ${a.pincode}
        ${a.landmark ? `<br><small style="color:var(--text-muted);">Landmark: ${a.landmark}</small>` : ''}
      </p>
      <div style="color: var(--gold-300); font-size: 0.85rem; font-weight: 600;">📞 ${a.phone}</div>
    `;
  }

  // Payment Details Card
  const paymentContainer = document.getElementById('details-payment-card');
  if (paymentContainer) {
    paymentContainer.innerHTML = `
      <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
        <span style="color: var(--text-muted); font-size: 0.85rem;">Payment Method:</span>
        <span style="color: #fff; font-weight: 700; font-size: 0.88rem;">${order.paymentMethod}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
        <span style="color: var(--text-muted); font-size: 0.85rem;">Transaction Status:</span>
        <span style="color: #10b981; font-weight: 700; font-size: 0.88rem;">${order.paymentStatus}</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span style="color: var(--text-muted); font-size: 0.85rem;">Total Billed:</span>
        <span style="color: var(--gold-300); font-weight: 800; font-size: 1.1rem; font-family: var(--font-serif);">₹${order.totalAmount}</span>
      </div>
    `;
  }

  // Set next status in simulation button
  const simBtn = document.getElementById('advance-status-btn');
  if (simBtn) {
    const currentIndex = STATUS_STAGES.indexOf(order.orderStatus);
    if (currentIndex >= 0 && currentIndex < STATUS_STAGES.length - 1) {
      const nextStatus = STATUS_STAGES[currentIndex + 1];
      simBtn.textContent = `⚡ Advance Stage to: "${nextStatus}" (Demo Live Update)`;
      simBtn.style.display = 'inline-flex';
      simBtn.onclick = () => advanceOrderStatus(order._id, nextStatus);
    } else {
      simBtn.style.display = 'none';
    }
  }
}

// Visual Status Timeline Generator
function renderStatusTimeline(currentStatus) {
  const container = document.getElementById('status-timeline-track');
  const fillElem = document.getElementById('timeline-progress-fill');
  if (!container) return;

  const currentIdx = Math.max(0, STATUS_STAGES.indexOf(currentStatus));
  const fillPercentage = (currentIdx / (STATUS_STAGES.length - 1)) * 90;

  if (fillElem) {
    fillElem.style.width = `${fillPercentage}%`;
  }

  const stageIcons = {
    'Order Placed': '📝',
    'Confirmed': '👑',
    'Preparing': '👨‍🍳',
    'Ready': '🍱',
    'Out for Delivery': '🛵',
    'Delivered': '🎉'
  };

  container.innerHTML = STATUS_STAGES.map((stage, idx) => {
    let nodeClass = '';
    if (idx < currentIdx) nodeClass = 'completed';
    else if (idx === currentIdx) nodeClass = 'active';

    return `
      <div class="timeline-node ${nodeClass}">
        <div class="timeline-node-icon">${stageIcons[stage] || '●'}</div>
        <div class="timeline-node-label">${stage}</div>
      </div>
    `;
  }).join('');
}

// Interactive Live Stage Advancer for Demo & Grading
window.advanceOrderStatus = async function(orderId, nextStatus) {
  const token = localStorage.getItem('royal_flame_token');
  if (!token) return;

  try {
    const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status: nextStatus })
    });
    const data = await res.json();

    if (data.success && data.data) {
      showToast('Status Updated! ⚜️', `Order progressed to: "${nextStatus}"`, 'success');
      currentOrder = data.data;
      renderOrderDetails(currentOrder);
      await loadNotifications(token);
    }
  } catch (err) {
    console.error('Error advancing status:', err);
    showToast('Update Glitch', 'Could not advance status.', 'error');
  }
};

// Page Setup
document.addEventListener('DOMContentLoaded', async () => {
  await checkAuthSession();

  // Detect which page is active
  if (document.getElementById('orders-list-container')) {
    setupOrderFilters();
    await loadOrdersList();
  }

  if (document.getElementById('details-order-id')) {
    await loadOrderDetails();
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
