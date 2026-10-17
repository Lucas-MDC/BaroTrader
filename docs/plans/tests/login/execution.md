### Running the login tests

Run the unit and integration suites from the repository root:

```bash
npm run test:unit
npm run test:integration
```

Run the login and registration browser suites. The npm script installs the
selected Playwright browser when it is missing; Chromium is the default.

```bash
npm run test:e2e
```

To run the suite in another supported browser, pass Playwright's browser option:

```bash
npm run test:e2e -- --browser=firefox
```

The E2E runner validates the test environment, provisions the logical test
database, builds the frontend, starts the application through Playwright's web
server, and cleans up the database and server after the run. In CI, the
workflow-provided PostgreSQL service is used instead of starting Docker.
