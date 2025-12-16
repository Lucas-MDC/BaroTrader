const registerButton = window.document.querySelector('#register-button');

registerButton?.addEventListener('click', (event) => {
  event.preventDefault();
  window.location.href = '/private/static/pages/homeInternal.html';
});
