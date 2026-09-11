import { expect, test } from './support/e2eTest.js';

const sessionCookieName =
  process.env.BAROTRADER_JWT_COOKIE_NAME || '__Host-bt_session';

test.describe('login flow', () => {
  test('logs in a seeded user and retains an HttpOnly session cookie', async ({
    page,
    seedUser
  }) => {
    // LOGIN-E2E-001 and LOGIN-E2E-005: successful login and authenticated session flow
    await page.goto('/');
    const requestPromise = page.waitForRequest(
      (request) => request.url().endsWith('/api/login')
    );

    await page.locator('#username-login').fill(`  ${seedUser.username}  `);
    await page.locator('#password-login').fill(seedUser.password);
    await page.locator('#login-button').click();

    const request = await requestPromise;
    expect(request.method()).toBe('POST');
    expect(request.postDataJSON()).toEqual(seedUser);
    await expect(page).toHaveURL(/\/account$/);

    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(({ name }) => name === sessionCookieName);
    expect(sessionCookie).toMatchObject({
      name: sessionCookieName,
      httpOnly: true,
      secure: true,
      sameSite: 'Strict',
      path: '/'
    });
  });

  test('blocks empty login input without a network request', async ({ page }) => {
    // LOGIN-E2E-002: client-side invalid input prevents submission
    let apiRequestCount = 0;
    page.on('request', (request) => {
      if (request.url().endsWith('/api/login')) {
        apiRequestCount += 1;
      }
    });

    await page.goto('/');
    await page.locator('#login-button').click();

    expect(
      await page.locator('#username-login').evaluate((input) => input.validity.valid)
    ).toBe(false);
    expect(
      await page.locator('#password-login').evaluate((input) => input.validity.valid)
    ).toBe(false);
    expect(apiRequestCount).toBe(0);
    await expect(page).toHaveURL(/\/$/);
  });

  test('shows the public invalid-credentials message', async ({ page, uniqueUser }) => {
    // LOGIN-E2E-003: invalid credentials response
    await page.goto('/');
    await page.locator('#username-login').fill(uniqueUser.username);
    await page.locator('#password-login').fill(uniqueUser.password);
    await page.locator('#login-button').click();

    await expect(page.locator('#login-feedback')).toHaveText(
      'Invalid username or password.'
    );
    await expect(page).toHaveURL(/\/$/);
  });

  test('shows a network error when login cannot reach the API', async ({
    page,
    uniqueUser
  }) => {
    // LOGIN-E2E-004: network failure response
    await page.route('**/api/login', (route) => route.abort('failed'));
    await page.goto('/');
    await page.locator('#username-login').fill(uniqueUser.username);
    await page.locator('#password-login').fill(uniqueUser.password);
    await page.locator('#login-button').click();

    await expect(page.locator('#login-feedback')).toHaveText(
      'Network error while attempting to login.'
    );
    await expect(page).toHaveURL(/\/$/);
  });
});
