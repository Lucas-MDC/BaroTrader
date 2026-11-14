import { ACCOUNT_ROUTE, getSafeReturnLocation } from '../../../src/frontend/shared/navigation.js';

describe('navigation helpers', () => {
  test('preserves the internal path, query, and hash for login return', () => {
    expect(getSafeReturnLocation({
      pathname: '/market',
      search: '?sort=volume',
      hash: '#overview'
    })).toEqual({
      pathname: '/market',
      search: '?sort=volume',
      hash: '#overview'
    });
  });

  test.each([
    undefined,
    { pathname: '//outside.example/path' },
    { pathname: '/\\\\outside.example/path' },
    { pathname: '/login' }
  ])('uses account as fallback for an unsafe or missing return path', (location) => {
    expect(getSafeReturnLocation(location)).toBe(ACCOUNT_ROUTE);
  });
});
