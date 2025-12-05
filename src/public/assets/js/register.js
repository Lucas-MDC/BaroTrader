const registerButton = document.querySelector('#register-button');

registerButton?.addEventListener('click', (event) => {
  event.preventDefault();
  window.location.href = '/app/pages/homeInternal.html';
});
