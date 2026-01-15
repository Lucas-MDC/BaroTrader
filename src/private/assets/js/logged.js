/*
Client-side navigation for the private home page.
*/

const logoutButton = window.document.querySelector('#logout-button');

logoutButton?.addEventListener('click', (event) => {

  /*
  Redirect back to the public landing page on logout.
  */

  event.preventDefault();
  window.location.href = '/';
});
