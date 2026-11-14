### Running the tests

From the repository root:

```bash
npm install
npm run test
```

Run only integration tests:

```bash
npm run test:integration
```

Debugging real DB integration tests (development only):

- `TEST_KEEP_DB=1`: skips teardown cleanup and keeps the test database.
- Use serial execution (`--runInBand`) when debugging integration database state locally.

PowerShell example:

```powershell
$env:TEST_KEEP_DB='1'
npm run test:integration -- --runInBand
```

To calculate coverage:

```bash
npm run test:coverage
```

### Browser E2E tests

Run the registration and login browser suites. The npm script installs the
selected Playwright browser when it is missing; Chromium is the default.

```bash
npm run test:e2e
```

To run the suite in another supported browser, pass Playwright's browser option:

```bash
npm run test:e2e -- --browser=firefox
```

The E2E runner validates the test environment, starts the local PostgreSQL base
when running outside CI, provisions and migrates the logical test database,
builds the frontend, starts the application through Playwright's web server,
and cleans up the database and server after the run. GitHub Actions supplies
PostgreSQL as a service and runs the same command after installing Chromium.

### Coverage exclusions

Coverage is controlled by `collectCoverageFrom` and `coveragePathIgnorePatterns` in
`jest.config.cjs`. The current config uses:

```js
collectCoverageFrom: ['<rootDir>/src/**/*.js'],
coveragePathIgnorePatterns: [
  '<rootDir>/node_modules/',
  '<rootDir>/tests/'
]
```
