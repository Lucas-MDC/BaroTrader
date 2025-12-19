const registerButton = window.document.querySelector('#register-button');

// navigation functionality
registerButton?.addEventListener('click', (event) => {
  event.preventDefault();
  window.location.href = '/private/static/pages/homeInternal.html';
});
