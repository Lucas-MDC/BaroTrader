const loginButton = document.querySelector('#login-button');

console.log('home.js carregado');

loginButton?.addEventListener('click', (event) => {
  event.preventDefault();
  window.location.href = '/private/static/pages/homeInternal.html';
});
