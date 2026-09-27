import { expect, test } from './support/e2eTest.js';

test.describe('registration flow', () => {
  test('registers a unique user and navigates to the account page', async ({
    page,
    uniqueUser
  }) => {
    // REG-E2E-001: successful registration flow
    await page.goto('/register');
    const requestPromise = page.waitForRequest(
      (request) => request.url().endsWith('/api/register')
    );

    await page.locator('#username-email').fill(uniqueUser.username);
    await page.locator('#password-register').fill(uniqueUser.password);
    await page.locator('#register-button').click();

    const request = await requestPromise;
    expect(request.method()).toBe('POST');
    expect(request.postDataJSON()).toEqual(uniqueUser);
    await expect(page.locator('#register-feedback')).toHaveText(
      'Registration complete! Redirecting...'
    );
    await expect(page).toHaveURL(/\/account$/);
  });

  test('blocks invalid registration input without a network request', async ({ page }) => {
    // REG-E2E-002: client-side invalid input prevents submission
    let apiRequestCount = 0;
    page.on('request', (request) => {
      if (request.url().endsWith('/api/register')) {
        apiRequestCount += 1;
      }
    });

    await page.goto('/register');
    await page.locator('#username-email').fill('.invalid');
    await page.locator('#password-register').fill('invalid');
    await page.locator('#register-button').click();

    expect(
      await page.locator('#username-email').evaluate((input) => input.validity.valid)
    ).toBe(false);
    expect(
      await page.locator('#password-register').evaluate((input) => input.validity.valid)
    ).toBe(false);
    expect(apiRequestCount).toBe(0);
    await expect(page).toHaveURL(/\/register$/);
  });

  test('shows a duplicate-user error without redirecting', async ({
    page,
    seedUser
  }) => {
    // REG-E2E-003: duplicate user response
    await page.goto('/register');
    await page.locator('#username-email').fill(seedUser.username);
    await page.locator('#password-register').fill(seedUser.password);
    await page.locator('#register-button').click();

    await expect(page.locator('#register-feedback')).toHaveText('User already exists.');
    await expect(page).toHaveURL(/\/register$/);
  });

  test('shows a network error when registration cannot reach the API', async ({
    page,
    uniqueUser
  }) => {
    // REG-E2E-004: network failure response
    await page.route('**/api/register', (route) => route.abort('failed'));
    await page.goto('/register');
    await page.locator('#username-email').fill(uniqueUser.username);
    await page.locator('#password-register').fill(uniqueUser.password);
    await page.locator('#register-button').click();

    await expect(page.locator('#register-feedback')).toHaveText(
      'Network error while attempting to register.'
    );
    await expect(page).toHaveURL(/\/register$/);
  });
});
