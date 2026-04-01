<a id="registration-contract"></a>
### Contract

<a id="reg-con-001"></a>
#### REG-CON-001: HTML attributes vs backend rules
Source: FE-REG-002
Conditions:
- The username pattern matches the backend regex.
- The password pattern matches the backend regex.
- minlength and maxlength align with backend limits.

<a id="registration-unit"></a>
### Unit

<a id="reg-unit-003"></a>
#### REG-UNIT-003: missing bindings (client-side)
Source: FE-REG-009
Conditions:
- Missing #register-form does not crash the script.
- Missing username/password inputs prevent submission and show "Registration form is unavailable."

<a id="reg-unit-004"></a>
#### REG-UNIT-004: showMessage
Source: FE-SH-001
Conditions:
- A null or undefined target is a no-op and does not throw.
- isError=false sets the text and applies the success color (#047857).
- isError=true sets the text and applies the error color (#b91c1c).
- Messages that contain HTML remain text-only (no XSS).
- An empty message clears any previous text.

<a id="reg-unit-005"></a>
#### REG-UNIT-005: getCredentialsFromInputs
Source: FE-SH-002
Conditions:
- Valid inputs return a trimmed username and the raw password.
- Usernames with whitespace are trimmed.
- Passwords keep leading/trailing whitespace (raw).
- Undefined/null inputs return empty strings.
- Non-string values for username (numbers, objects) do not crash and result in an empty username.

<a id="reg-unit-007"></a>
#### REG-UNIT-007: register service normalization and validation
Source: REG-SVC-001
Conditions:
- Username is trimmed before validation.
- Password is trimmed before validation.
- Non-string username/password inputs are treated as invalid.
- Minimum and maximum length limits are enforced.
- Regex patterns are applied correctly to both fields.

<a id="reg-unit-008"></a>
#### REG-UNIT-008: register service duplicate prevention
Source: REG-SVC-002
Conditions:
- findByUsername returning a user throws RegistrationError 409.
- createUser is not invoked when a duplicate exists.

<a id="reg-unit-009"></a>
#### REG-UNIT-009: register service hashing and persistence
Source: REG-SVC-003
Conditions:
- createPasswordSalt is called.
- hashPassword receives the trimmed password and the generated salt.
- createUser is invoked with { username, passwordHash, passwordSalt }.

<a id="reg-unit-010"></a>
#### REG-UNIT-010: register service error propagation
Source: REG-SVC-004
Conditions:
- Errors from findByUsername bubble up.
- Errors from hashPassword bubble up.
- Unique constraint errors from createUser become RegistrationError 409; other errors bubble up.
- The finally block always enforces the minimum delay even on errors.

<a id="reg-unit-011"></a>
#### REG-UNIT-011: register service minimum delay
Source: REG-SVC-005
Conditions:
- The response is never sent before registerMinDelayMs elapses.
- Errors (validation or duplicates) still respect the delay.
- A zero registerMinDelayMs leads to no extra wait.

<a id="reg-unit-012"></a>
#### REG-UNIT-012: RegistrationError shape
Source: Added
Conditions:
- name is "RegistrationError".
- statusCode defaults to 400 when omitted.
- message is preserved as provided.

<a id="reg-unit-013"></a>
#### REG-UNIT-013: createPasswordSalt
Source: PWD-SVC-001
Conditions:
- Calling without arguments returns a hex string of 32 characters (16 bytes).
- Passing a byte count returns a hex string twice as long.
- Subsequent calls produce different salts.
- Invalid byte counts (negative, NaN) propagate crypto errors.

<a id="reg-unit-014"></a>
#### REG-UNIT-014: hashPassword validation
Source: PWD-SVC-002
Conditions:
- Empty or whitespace-only passwords throw.
- Missing or non-string salt throws.
- Missing HASH_PEPPER causes an error.

<a id="reg-unit-016"></a>
#### REG-UNIT-016: scrypt error handling
Source: PWD-SVC-004
Conditions:
- Errors from crypto.scrypt are propagated to the caller.

<a id="reg-unit-017"></a>
#### REG-UNIT-017: hashPassword output format
Source: Added
Conditions:
- Returns a hex string length of 128 characters (64 bytes).
- Output does not include the raw password.
- Different peppers yield different hashes.

<a id="registration-integration"></a>
### Integration

Current files:
- `tests/integration/registerApi.http-contract.test.js` (`_new_`)
- `tests/integration/registerClient.jsdom.test.js` (`_new_`)
- `tests/integration/registerService.db-integration.test.js` (`_new_`)
- `tests/integration/registerApi.backend-smoke.test.js` (`_new_`)

Deprecated files:
- `tests/integration/registerApi.test.js` (`_deprecated_`)
- `tests/integration/registerClient.test.js` (`_deprecated_`)
- `tests/integration/registerHtml.test.js` (`_deprecated_`)

Mock classification report:
- `docs/plans/register_integration_mocks_report.md`

<a id="reg-int-001"></a>
#### REG-INT-001: register.html basic rendering
Source: FE-REG-001
Conditions:
- The page loads with <form id="register-form">.
- Inputs #username-email and #password-register are present.
- The submit button #register-button exists.
- #register-feedback is present and has aria-live="polite".
- Attributes required, pattern, minlength, and maxlength are defined for both inputs.

<a id="reg-int-002"></a>
#### REG-INT-002: submit with invalid inputs
Source: FE-REG-005
Conditions:
- Invalid username or password is blocked by browser constraint validation.
- The form does not call fetch when validation fails.
- Missing #register-feedback should not break the script.

<a id="reg-int-003"></a>
#### REG-INT-003: successful submit
Source: FE-REG-006
Conditions:
- Valid inputs trigger fetch POST /api/register.
- The request includes Content-Type: application/json.
- The payload contains the trimmed username and the raw password.
- A 201 response shows a success message and redirects after ~600ms.
- Feedback uses the success color (#047857).
- If #register-feedback is absent, the redirect still happens without errors.

<a id="reg-int-004"></a>
#### REG-INT-004: API error responses (client-side handling)
Source: FE-REG-007
Conditions:
- 409 responses display "User already exists." in error color and do not redirect.
- 400 responses display "Username or password is invalid." in error color and do not redirect.
- 500 or other non-ok responses show data.error if present, otherwise a generic message.
- Responses without JSON bodies do not crash the script and show the generic message.

<a id="reg-int-005"></a>
#### REG-INT-005: network failure (client-side handling)
Source: FE-REG-008
Conditions:
- fetch rejecting shows "Network error while attempting to register." in error color.
- No redirect occurs on network failure.

<a id="reg-int-006"></a>
#### REG-INT-006: non-201 success responses
Source: Added
Conditions:
- Any 2xx response (e.g., 200 or 204) is treated as success by response.ok.
- A 2xx response still shows the success message and redirects after ~600ms.

<a id="reg-int-007"></a>
#### REG-INT-007: whitespace-only password path
Source: Added
Conditions:
- A whitespace-only password fails the HTML pattern validation.
- fetch is not called when password is only whitespace.

<a id="reg-int-008"></a>
#### REG-INT-008: API success (201) (`_deprecated_`)
Source: API-REG-001
Conditions:
- Legacy coverage from `tests/integration/registerApi.test.js`.
- Replaced by REG-INT-016 (`_new_`) and REG-INT-017 (`_new_`).

<a id="reg-int-009"></a>
#### REG-INT-009: API invalidation (400) (`_deprecated_`)
Source: API-REG-002
Conditions:
- Legacy coverage from `tests/integration/registerApi.test.js`.
- Replaced by REG-INT-016 (`_new_`) and REG-INT-018 (`_new_`).

<a id="reg-int-010"></a>
#### REG-INT-010: API duplicate user (409) (`_deprecated_`)
Source: API-REG-003
Conditions:
- Legacy coverage from `tests/integration/registerApi.test.js`.
- Replaced by REG-INT-016 (`_new_`) and REG-INT-018 (`_new_`).

<a id="reg-int-011"></a>
#### REG-INT-011: API generic server error (500) (`_deprecated_`)
Source: API-REG-004
Conditions:
- Legacy coverage from `tests/integration/registerApi.test.js`.
- Replaced by REG-INT-016 (`_new_`).

<a id="reg-int-012"></a>
#### REG-INT-012: API payload parsing (`_deprecated_`)
Source: API-REG-005
Conditions:
- Legacy coverage from `tests/integration/registerApi.test.js`.
- Replaced by REG-INT-016 (`_new_`).

<a id="reg-int-013"></a>
#### REG-INT-013: RegistrationError without statusCode (`_deprecated_`)
Source: Added
Conditions:
- Legacy coverage from `tests/integration/registerApi.test.js`.
- Replaced by REG-INT-016 (`_new_`).

<a id="reg-int-014"></a>
#### REG-INT-014: API response headers and body shape (`_deprecated_`)
Source: Added
Conditions:
- Legacy coverage from `tests/integration/registerApi.test.js`.
- Replaced by REG-INT-016 (`_new_`) and REG-INT-017 (`_new_`).

<a id="reg-int-015"></a>
#### REG-INT-015: UI copy matches current implementation
Source: Added
Conditions:
- 409 responses show "User already exists.".
- 400 responses show "Username or password is invalid.".
- Generic non-ok responses show "Unable to create your account." when data.error is absent.
- Network failures show "Network error while attempting to register.".

<a id="reg-int-016"></a>
#### REG-INT-016: register API HTTP contract (`_new_`)
Source: API-REG-001 to API-REG-005
Conditions:
- Uses `tests/integration/registerApi.http-contract.test.js`.
- Validates HTTP contract behavior for 201, 400, 409, 500, payload parsing, and response shape.
- Uses service mocking intentionally for route contract isolation.

<a id="reg-int-017"></a>
#### REG-INT-017: register API backend smoke with real DB (`_new_`)
Source: API-REG-001 and API-REG-003
Conditions:
- Uses `tests/integration/registerApi.backend-smoke.test.js`.
- Executes full backend path (route -> service -> model -> PostgreSQL).
- Success responses never expose `passwordHash` or `passwordSalt`.

<a id="reg-int-018"></a>
#### REG-INT-018: register API invalid payload on real backend (`_new_`)
Source: API-REG-002
Conditions:
- Uses `tests/integration/registerApi.backend-smoke.test.js`.
- Invalid username/password payloads return HTTP 400 on the real backend stack.

<a id="reg-int-019"></a>
#### REG-INT-019: register service persistence with real DB (`_new_`)
Source: REG-SVC-003
Conditions:
- Uses `tests/integration/registerService.db-integration.test.js`.
- `registerUser` persists user data and generated hash/salt in PostgreSQL.

<a id="reg-int-020"></a>
#### REG-INT-020: register service duplicate handling with real DB (`_new_`)
Source: REG-SVC-002
Conditions:
- Uses `tests/integration/registerService.db-integration.test.js`.
- Duplicate usernames raise `RegistrationError` with status 409.

<a id="reg-int-021"></a>
#### REG-INT-021: register service validation with real DB (`_new_`)
Source: REG-SVC-001
Conditions:
- Uses `tests/integration/registerService.db-integration.test.js`.
- Invalid payloads raise `RegistrationError` with status 400.

<a id="registration-e2e"></a>
### End-to-End

<a id="reg-e2e-001"></a>
#### REG-E2E-001: successful registration flow
Source: Added
Conditions:
- User navigates to the register page and submits valid credentials.
- The browser issues POST /api/register with JSON payload.
- A success message appears and a redirect occurs after ~600ms.
- The user lands on /private/static/pages/homeInternal.html.

<a id="reg-e2e-002"></a>
#### REG-E2E-002: client-side invalid input prevents submission
Source: Added
Conditions:
- Invalid username or password shows validation feedback.
- No network request is sent.

<a id="reg-e2e-003"></a>
#### REG-E2E-003: duplicate user response
Source: Added
Conditions:
- A duplicate username produces an error message.
- No redirect occurs.

<a id="reg-e2e-004"></a>
#### REG-E2E-004: network failure response
Source: Added
Conditions:
- A simulated network failure shows the network error message.
- No redirect occurs.

<a id="registration-security"></a>
### Security

<a id="reg-sec-001"></a>
#### REG-SEC-001: SQL injection safeguards (username)
Source: API-REG-006
Conditions:
- Usernames like "' OR 1=1 --" result in 400 due to validation.

<a id="reg-sec-002"></a>
#### REG-SEC-002: SQL injection safeguards (password)
Source: API-REG-006
Conditions:
- Password inputs intended as SQL injection are allowed if they pass validation and do not compromise the query.

<a id="reg-sec-003"></a>
#### REG-SEC-003: XSS safety in feedback rendering
Source: FE-SH-001
Conditions:
- Messages that contain HTML remain text-only and do not execute.

<a id="reg-sec-004"></a>
#### REG-SEC-004: sensitive data exposure
Source: Added
Conditions:
- API responses never return passwordHash or passwordSalt.
- Server logs do not contain the raw password.

<a id="registration-performance"></a>
### Performance and Resilience

<a id="reg-perf-001"></a>
#### REG-PERF-001: concurrency
Source: API-REG-007
Conditions:
- Two simultaneous requests for the same username should yield one 201 and one 409.
- The database remains consistent with no stray inserts.

<a id="reg-perf-002"></a>
#### REG-PERF-002: minimum delay enforcement (integration)
Source: Added
Conditions:
- API responses are not sent before registerMinDelayMs elapses.
- Validation or duplicate errors still respect the delay.

<a id="reg-perf-003"></a>
#### REG-PERF-003: zero delay configuration
Source: Added
Conditions:
- registerMinDelayMs=0 results in no extra wait in responses.

<a id="registration-accessibility"></a>
### Accessibility

<a id="reg-a11y-001"></a>
#### REG-A11Y-001: feedback aria-live
Source: FE-REG-001
Conditions:
- #register-feedback uses aria-live="polite".

<a id="reg-a11y-002"></a>
#### REG-A11Y-002: accessible form labels
Source: Added
Conditions:
- Username and password inputs have accessible labels or aria-label values.
- The submit button has a descriptive accessible name.

<a id="reg-a11y-003"></a>
#### REG-A11Y-003: keyboard navigation
Source: Added
Conditions:
- Inputs and the submit button are reachable via keyboard tab order.
- Focus is visible on interactive elements.

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

- `KEEP_DB=1`: skips teardown cleanup and keeps the test database.
- Use serial execution (`--runInBand`) when debugging integration database state locally.

PowerShell example:

```powershell
$env:KEEP_DB='1'
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

