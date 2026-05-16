export const HOME_ROUTE = '/';
export const REGISTER_ROUTE = '/public/static/pages/noSession/register.html';
export const ACCOUNT_ROUTE = '/private/static/pages/homeInternal.html';

export const FRONTEND_ROUTES = [
  HOME_ROUTE,
  REGISTER_ROUTE,
  ACCOUNT_ROUTE
];

export function navigateTo(url) {
  if (window.location.pathname === url) {
    return;
  }

  window.history.pushState({}, '', url);
  window.dispatchEvent(new Event('popstate'));
}

export function redirectTo(url) {
  window.location.href = url;
}
