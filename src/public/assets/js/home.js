const loginButton = document.querySelector('#login-button');

// navigation functionality
loginButton?.addEventListener('click', (event) => {
  event.preventDefault();
  window.location.href = '/private/static/pages/homeInternal.html';
});
