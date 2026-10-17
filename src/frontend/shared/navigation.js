export const HOME_ROUTE = '/';
export const LOGIN_ROUTE = '/login';
export const REGISTER_ROUTE = '/register';
export const ACCOUNT_ROUTE = '/account';

export function getSafeReturnLocation(location) {
  const pathname = location?.pathname;

  if (
    typeof pathname !== 'string' ||
    !pathname.startsWith('/') ||
    pathname.startsWith('//') ||
    pathname.includes('\\') ||
    pathname === LOGIN_ROUTE
  ) {
    return ACCOUNT_ROUTE;
  }

  return {
    pathname,
    search: typeof location.search === 'string' ? location.search : '',
    hash: typeof location.hash === 'string' ? location.hash : ''
  };
}
