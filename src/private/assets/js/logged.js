const logoutButton = document.querySelector('#logout-button');

logoutButton?.addEventListener('click', (event) => {
  event.preventDefault();
  window.location.href = '/';
});
