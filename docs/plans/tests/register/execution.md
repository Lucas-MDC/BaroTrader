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
