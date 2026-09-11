import { test as base, expect } from '@playwright/test';

const E2E_PASSWORD = 'Pass1234!';

function createUniqueUser(testInfo) {
  const suffix = `${Date.now()}${testInfo.workerIndex}${Math.floor(Math.random() * 10000)}`;
  return {
    username: `e2e${suffix}`.slice(0, 32),
    password: E2E_PASSWORD
  };
}

const test = base.extend({
  uniqueUser: async ({ request }, use, testInfo) => {
    void request;
    await use(createUniqueUser(testInfo));
  },
  seedUser: async ({ request, uniqueUser }, use) => {
    const response = await request.post('/api/register', { data: uniqueUser });
    if (response.status() !== 201) {
      throw new Error(
        `Unable to seed E2E user: ${response.status()} ${await response.text()}`
      );
    }

    await use(uniqueUser);
  }
});

export { expect, test };
