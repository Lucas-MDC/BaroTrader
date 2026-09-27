### Running the login tests

Run the unit and integration suites from the repository root:

```bash
npm run test:unit
npm run test:integration
```

Install the Playwright Chromium browser once on a new machine or CI runner:

```bash
npx playwright install --with-deps chromium
```

Run the login and registration browser suites:

```bash
npm run test:e2e
```

The E2E runner validates the test environment, provisions the logical test
database, builds the frontend, starts the application through Playwright's web
server, and cleans up the database and server after the run. In CI, the
workflow-provided PostgreSQL service is used instead of starting Docker.
