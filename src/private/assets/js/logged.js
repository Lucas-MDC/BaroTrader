const logoutButton = window.document.querySelector('#logout-button');

// navigation functionality
logoutButton?.addEventListener('click', (event) => {
  event.preventDefault();
  window.location.href = '/';
});
