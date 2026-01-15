/*
Client-side navigation for the public home page.
*/

const loginButton = document.querySelector('#login-button');

loginButton?.addEventListener('click', (event) => {

  /*
  Redirect to the private landing page when the button is used.
  */

  event.preventDefault();
  window.location.href = '/private/static/pages/homeInternal.html';
});
