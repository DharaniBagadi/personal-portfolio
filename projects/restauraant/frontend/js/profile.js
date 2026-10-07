/**
 * ROYAL FLAME - PATRON PROFILE & NOTIFICATIONS CONTROLLER (profile.js)
 */

async function initProfilePage() {
  const token = localStorage.getItem('royal_flame_token');
  if (!token) {
    window.location.href = '/login.html?redirect=profile';
    return;
  }

  try {
    const res = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const result = await res.json();

    if (!result.success || !result.user) {
      localStorage.removeItem('royal_flame_token');
      localStorage.removeItem('royal_flame_user');
      window.location.href = '/login.html';
      return;
    }

    const user = result.user;
    localStorage.setItem('royal_flame_user', JSON.stringify(user));

    // Populate user profile info
    document.getElementById('profileFullName').textContent = user.name || 'Distinguished Patron';
    document.getElementById('profileEmail').textContent = user.email || '';
    document.getElementById('profilePhone').textContent = user.phone || 'Phone not set';
    
    const initials = (user.name || 'P').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    document.getElementById('profileAvatarInitials').textContent = initials;

    if (user.role === 'admin') {
      const adminLink = document.getElementById('adminSuiteLink');
      if (adminLink) adminLink.style.display = 'flex';
      const roleBadge = document.getElementById('profileRoleBadge');
      if (roleBadge) roleBadge.textContent = 'Admin';
    }

    // Populate profile edit form inputs
    if (document.getElementById('editNameInput')) {
      document.getElementById('editNameInput').value = user.name || '';
      document.getElementById('editPhoneInput').value = user.phone || '';
      document.getElementById('editEmailInput').value = user.email || '';
    }

    // Fetch user order statistics
    await loadUserOrderStats(token);

    // Render addresses
    renderAddressesList(user.addresses || []);

  } catch (err) {
    console.error('Error loading profile:', err);
  }
}

async function loadUserOrderStats(token) {
  try {
    const res = await fetch('/api/orders/my-orders', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const result = await res.json();
    if (result.success && result.data) {
      const orders = result.data;
      const countEl = document.getElementById('profileTotalOrders');
      if (countEl) countEl.textContent = orders.length;

      const spent = orders.reduce((sum, o) => sum + (o.orderStatus !== 'Cancelled' ? o.totalAmount : 0), 0);
      const spentEl = document.getElementById('profileTotalSpent');
      if (spentEl) spentEl.textContent = `₹${spent.toLocaleString()}`;
    }
  } catch (err) {
    console.error('Error loading order stats:', err);
  }
}

function renderAddressesList(addresses) {
  const container = document.getElementById('profileAddressesContainer');
  if (!container) return;

  if (addresses.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align:center; padding: 30px; color: var(--text-muted); background: rgba(0,0,0,0.3); border-radius: 8px; border: 1px dashed var(--border-gold-subtle);">
        <i class="fas fa-map-marker-alt" style="font-size: 1.8rem; color: var(--gold); margin-bottom: 10px; display:block;"></i>
        No saved addresses found. Add a delivery destination below.
      </div>
    `;
    return;
  }

  container.innerHTML = addresses.map((addr, idx) => `
    <div class="patron-address-card ${addr.isDefault ? 'default' : ''}">
      <span class="address-tag-badge">${addr.isDefault ? '⭐ Default Residence' : 'Address #' + (idx + 1)}</span>
      <h4>${addr.fullName || 'Patron'}</h4>
      <p>
        ${addr.houseNo ? addr.houseNo + ', ' : ''}${addr.street ? addr.street + ', ' : ''}
        ${addr.area ? addr.area + ', ' : ''}${addr.city || ''}, ${addr.state || ''} - ${addr.pincode || ''}<br>
        <strong>Phone:</strong> ${addr.phone || 'N/A'}
      </p>
      <div class="address-card-actions">
        ${!addr.isDefault ? `<button class="btn-mini-action" onclick="setDefaultAddress('${addr._id}')">Set Default</button>` : ''}
        <button class="btn-mini-action" style="color:#f44336;" onclick="deleteAddress('${addr._id}')"><i class="fas fa-trash-alt"></i> Delete</button>
      </div>
    </div>
  `).join('');
}

async function handleProfileUpdate(e) {
  e.preventDefault();
  const token = localStorage.getItem('royal_flame_token');
  const name = document.getElementById('editNameInput').value.trim();
  const phone = document.getElementById('editPhoneInput').value.trim();

  try {
    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ name, phone })
    });
    const result = await res.json();
    if (result.success) {
      alert('✨ Profile updated successfully!');
      window.location.reload();
    } else {
      alert(result.message || 'Profile update failed.');
    }
  } catch (err) {
    alert('Failed to update profile.');
  }
}

// Open Address Modal
function openAddAddressModal() {
  const modal = document.getElementById('addressModalBackdrop');
  if (modal) modal.classList.add('active');
}

function closeAddAddressModal() {
  const modal = document.getElementById('addressModalBackdrop');
  if (modal) modal.classList.remove('active');
}

async function handleSaveNewAddress(e) {
  e.preventDefault();
  const token = localStorage.getItem('royal_flame_token');
  
  const payload = {
    fullName: document.getElementById('addrFullName').value.trim(),
    phone: document.getElementById('addrPhone').value.trim(),
    houseNo: document.getElementById('addrHouse').value.trim(),
    street: document.getElementById('addrStreet').value.trim(),
    area: document.getElementById('addrArea').value.trim(),
    city: document.getElementById('addrCity').value.trim(),
    state: document.getElementById('addrState').value.trim(),
    pincode: document.getElementById('addrPincode').value.trim(),
    landmark: document.getElementById('addrLandmark')?.value.trim() || '',
    isDefault: document.getElementById('addrIsDefault')?.checked || false
  };

  try {
    const res = await fetch('/api/auth/addresses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (result.success) {
      closeAddAddressModal();
      await initProfilePage();
    } else {
      alert(result.message || 'Failed to save address.');
    }
  } catch (err) {
    alert('Error saving address');
  }
}

async function setDefaultAddress(addressId) {
  const token = localStorage.getItem('royal_flame_token');
  try {
    const res = await fetch(`/api/auth/addresses/${addressId}/default`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` }
    });
    const result = await res.json();
    if (result.success) {
      await initProfilePage();
    }
  } catch (err) {
    console.error('Error setting default address:', err);
  }
}

async function deleteAddress(addressId) {
  if (confirm('Delete this delivery address?')) {
    const token = localStorage.getItem('royal_flame_token');
    try {
      const res = await fetch(`/api/auth/addresses/${addressId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success) {
        await initProfilePage();
      }
    } catch (err) {
      console.error('Error deleting address:', err);
    }
  }
}

// Messages / Notifications View
async function initMessagesPage() {
  const token = localStorage.getItem('royal_flame_token');
  if (!token) {
    window.location.href = '/login.html?redirect=messages';
    return;
  }

  const container = document.getElementById('messagesContainer');
  if (!container) return;

  try {
    const res = await fetch('/api/notifications', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const result = await res.json();

    if (!result.success || !result.data || result.data.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding: 60px 20px; color: var(--text-muted);">
          <i class="fas fa-bell-slash" style="font-size: 2.5rem; color: var(--gold); margin-bottom: 14px; display:block;"></i>
          <h3 style="font-family:'Cinzel', serif; color:#fff; margin-bottom:6px;">No Notifications Yet</h3>
          <p>Your banquet dispatch alerts and chef specials will appear here.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = result.data.map(n => {
      const timeStr = new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      const icon = n.type === 'order' ? 'fa-concierge-bell' : n.type === 'promo' ? 'fa-gem' : 'fa-envelope';
      return `
        <div class="notif-card ${!n.read ? 'unread' : ''}">
          <div class="notif-icon"><i class="fas ${icon}"></i></div>
          <div class="notif-content">
            <h4>${n.title}</h4>
            <p>${n.message}</p>
            <span class="notif-time"><i class="fas fa-clock"></i> ${timeStr}</span>
          </div>
          <button class="btn-mini-action" onclick="deleteNotification('${n._id}')" title="Dismiss Notification">
            <i class="fas fa-times"></i>
          </button>
        </div>
      `;
    }).join('');

  } catch (err) {
    console.error('Error loading notifications:', err);
  }
}

async function markAllNotificationsRead() {
  const token = localStorage.getItem('royal_flame_token');
  try {
    await fetch('/api/notifications/read-all', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` }
    });
    await initMessagesPage();
  } catch (err) {
    console.error('Error marking read:', err);
  }
}

async function deleteNotification(notifId) {
  const token = localStorage.getItem('royal_flame_token');
  try {
    await fetch(`/api/notifications/${notifId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    await initMessagesPage();
  } catch (err) {
    console.error('Error deleting notification:', err);
  }
}
