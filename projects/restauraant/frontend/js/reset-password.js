const API_BASE_URL = window.location.origin;

function showMessage(message, type = 'info') {
  const container =
    document.getElementById('toast-container');

  if (container) {
    container.innerHTML = `
      <div class="toast ${type} show">
        <div class="toast-content">
          <div class="toast-message">
            ${message}
          </div>
        </div>
      </div>
    `;
  } else {
    alert(message);
  }
}

document.addEventListener('DOMContentLoaded', () => {

  const form =
    document.getElementById('reset-password-form');

  const params =
    new URLSearchParams(window.location.search);

  const token = params.get('token');

  if (!token) {
    showMessage(
      'Invalid or missing password reset link.',
      'error'
    );

    form.style.display = 'none';
    return;
  }

  form.addEventListener('submit', async (event) => {

    event.preventDefault();

    const password =
      document.getElementById('new-password').value;

    const confirmPassword =
      document.getElementById('confirm-password').value;

    const passwordRegex =
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,72}$/;

    if (!passwordRegex.test(password)) {
      showMessage(
        'Password must contain at least 8 characters, a letter, a number and a special character.',
        'error'
      );
      return;
    }

    if (password !== confirmPassword) {
      showMessage(
        'Passwords do not match.',
        'error'
      );
      return;
    }

    try {

      const response = await fetch(
        `${API_BASE_URL}/api/auth/reset-password`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json'
          },

          body: JSON.stringify({
            token,
            password,
            confirmPassword
          })
        }
      );

      const data = await response.json();

      if (!data.success) {
        showMessage(
          data.message || 'Password reset failed.',
          'error'
        );
        return;
      }

      showMessage(
        'Password reset successfully. Redirecting to login...',
        'success'
      );

      setTimeout(() => {
        window.location.href = '/login.html';
      }, 2000);

    } catch (error) {

      console.error(error);

      showMessage(
        'Unable to connect to the server.',
        'error'
      );
    }
  });
});