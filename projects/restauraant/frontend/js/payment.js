/**
 * ROYAL FLAME - PAYMENT & ORDER PLACEMENT CLIENT SCRIPT (payment.js)
 */

const API_BASE_URL = window.location.origin;

// State
let currentUser = null;
let checkoutPayload = null;
let selectedPaymentMethod = 'UPI';

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
    window.location.href = 'login.html?redirect=payment.html';
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

  // Set cardholder name default
  const cardHolderInput = document.getElementById('card-holder-input');
  if (cardHolderInput) {
    cardHolderInput.value = user.name || 'LORD ARTHUR WELLESLEY';
    updateCardPreview();
  }
}

// 1. Load Checkout Payload
function loadCheckoutState() {
  const stored = sessionStorage.getItem('royal_checkout_payload');
  if (!stored) {
    showToast('Session Expired', 'Redirecting to your dining cart...', 'info');
    setTimeout(() => { window.location.href = 'cart.html'; }, 1200);
    return;
  }

  checkoutPayload = JSON.parse(stored);
  renderPaymentSummary();
}

function renderPaymentSummary() {
  const subtotalElem = document.getElementById('pay-subtotal');
  const deliveryElem = document.getElementById('pay-delivery');
  const taxElem = document.getElementById('pay-tax');
  const discountElem = document.getElementById('pay-discount');
  const totalElem = document.getElementById('pay-total');
  const addressPreview = document.getElementById('pay-address-preview');
  const itemsCountElem = document.getElementById('pay-items-count');

  if (!checkoutPayload) return;

  if (subtotalElem) subtotalElem.textContent = `₹${checkoutPayload.subtotal}`;
  if (deliveryElem) deliveryElem.textContent = checkoutPayload.deliveryFee === 0 ? 'FREE' : `₹${checkoutPayload.deliveryFee}`;
  if (taxElem) taxElem.textContent = `₹${checkoutPayload.tax}`;
  if (discountElem) discountElem.textContent = `-₹${checkoutPayload.discount}`;
  if (totalElem) totalElem.textContent = `₹${checkoutPayload.totalAmount}`;
  if (itemsCountElem) itemsCountElem.textContent = `${checkoutPayload.items.length} Dishes`;

  if (addressPreview && checkoutPayload.address) {
    const a = checkoutPayload.address;
    addressPreview.innerHTML = `
      <strong>${a.fullName}</strong> (${a.phone})<br>
      ${a.houseNo}, ${a.street}, ${a.area}, ${a.city} - ${a.pincode}
    `;
  }
}

// 2. Tab Navigation
function setupPaymentTabs() {
  const tabs = document.querySelectorAll('.payment-tab-btn');
  const panels = document.querySelectorAll('.payment-tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      selectedPaymentMethod = tab.dataset.method;

      const targetPanel = document.getElementById(`tab-${tab.dataset.target}`);
      if (targetPanel) targetPanel.classList.add('active');

      const payBtnText = document.getElementById('pay-button-text');
      if (payBtnText) {
        payBtnText.textContent = selectedPaymentMethod === 'Cash on Delivery'
          ? `Confirm Order (Cash on Delivery: ₹${checkoutPayload ? checkoutPayload.totalAmount : 0})`
          : `Pay ₹${checkoutPayload ? checkoutPayload.totalAmount : 0} & Place Order`;
      }
    });
  });
}

// 3. Card Preview Live Sync
function setupCardInputs() {
  const numInput = document.getElementById('card-num-input');
  const holderInput = document.getElementById('card-holder-input');
  const expInput = document.getElementById('card-exp-input');

  if (numInput) {
    numInput.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '').substring(0, 16);
      val = val.replace(/(\d{4})(?=\d)/g, '$1 ');
      e.target.value = val;
      updateCardPreview();
    });
  }

  if (holderInput) {
    holderInput.addEventListener('input', updateCardPreview);
  }

  if (expInput) {
    expInput.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '').substring(0, 4);
      if (val.length >= 2) val = val.substring(0, 2) + '/' + val.substring(2);
      e.target.value = val;
      updateCardPreview();
    });
  }
}

function updateCardPreview() {
  const numInput = document.getElementById('card-num-input');
  const holderInput = document.getElementById('card-holder-input');
  const expInput = document.getElementById('card-exp-input');

  const cardNumDisplay = document.getElementById('preview-card-num');
  const cardHolderDisplay = document.getElementById('preview-card-holder');
  const cardExpDisplay = document.getElementById('preview-card-exp');

  if (cardNumDisplay) {
    cardNumDisplay.textContent = numInput && numInput.value ? numInput.value : '•••• •••• •••• 4242';
  }
  if (cardHolderDisplay) {
    cardHolderDisplay.textContent = holderInput && holderInput.value ? holderInput.value.toUpperCase() : 'ROYAL PATRON';
  }
  if (cardExpDisplay) {
    cardExpDisplay.textContent = expInput && expInput.value ? expInput.value : '12/28';
  }
}

// 4. Process Payment & Submit Order to MongoDB
window.processPayment = async function() {
  const token = localStorage.getItem('royal_flame_token');
  if (!token || !checkoutPayload) return;

  const btn = document.getElementById('authorize-pay-btn');
  const btnText = document.getElementById('pay-button-text');
  const originalText = btnText ? btnText.textContent : 'Pay & Place Order';

  if (btn) btn.disabled = true;
  if (btnText) btnText.textContent = 'Verifying Royal Transaction... 🔒';

  // Mock luxury transaction delay (1.2 seconds)
  setTimeout(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          items: checkoutPayload.items,
          address: checkoutPayload.address,
          paymentMethod: selectedPaymentMethod,
          paymentStatus: selectedPaymentMethod === 'Cash on Delivery' ? 'Pending' : 'Paid',
          subtotal: checkoutPayload.subtotal,
          deliveryFee: checkoutPayload.deliveryFee,
          tax: checkoutPayload.tax,
          discount: checkoutPayload.discount,
          totalAmount: checkoutPayload.totalAmount
        })
      });

      const data = await res.json();

      if (data.success && data.data) {
        const createdOrder = data.data;

        // Clear local storage cart state
        localStorage.removeItem('royal_cart');
        localStorage.setItem('royal_cart_count', '0');
        sessionStorage.removeItem('royal_checkout_payload');

        // Display Success Modal
        showOrderSuccessModal(createdOrder);
      } else {
        showToast('Payment Failure', data.message || 'Could not place order.', 'error');
        if (btn) btn.disabled = false;
        if (btnText) btnText.textContent = originalText;
      }
    } catch (err) {
      console.error('Payment execution error:', err);
      showToast('Transaction Glitch', 'Server communication interrupted. Please retry.', 'error');
      if (btn) btn.disabled = false;
      if (btnText) btnText.textContent = originalText;
    }
  }, 1200);
};

// 5. Display Order Success Confirmation Modal
function showOrderSuccessModal(order) {
  const modal = document.getElementById('order-success-modal-overlay');
  if (!modal) {
    window.location.href = `order-details.html?id=${order.orderId || order._id}`;
    return;
  }

  document.getElementById('success-order-id').textContent = order.orderId;
  document.getElementById('success-order-date').textContent = new Date(order.createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
  document.getElementById('success-order-amount').textContent = `₹${order.totalAmount}`;
  document.getElementById('success-payment-method').textContent = `${order.paymentMethod} (${order.paymentStatus})`;
  document.getElementById('success-estimated-time').textContent = order.estimatedDelivery || '30-40 mins';
  document.getElementById('success-address').textContent = `${order.address.fullName}, ${order.address.houseNo}, ${order.address.city}`;

  const viewOrderBtn = document.getElementById('success-view-order-btn');
  if (viewOrderBtn) {
    viewOrderBtn.onclick = () => {
      window.location.href = `order-details.html?id=${order.orderId || order._id}`;
    };
  }

  modal.classList.add('show');
}

// Page Setup
document.addEventListener('DOMContentLoaded', async () => {
  await checkAuthSession();
  loadCheckoutState();
  setupPaymentTabs();
  setupCardInputs();

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
