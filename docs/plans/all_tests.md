# Test Plan

This document consolidates the current test plan for BaroTrader.
Source tags indicate origin: "Source: FE-REG-001" etc come from the original
registration plan; "Source: Added" marks new coverage gaps or expansions.

<a id="index"></a>
## Index
| Feature | Link |
| --- | --- |
| Registration | [Registration](#feature-registration) |
| Navigation and Pages | [Navigation and Pages](#feature-navigation-pages) |
| Server and Routing | [Server and Routing](#feature-server-routing) |
| Configuration and Environment | [Configuration and Environment](#feature-config-env) |
| Data Access (User Model and Pools) | [Data Access](#feature-data-access) |
| Database Tooling and Safety | [Database Tooling and Safety](#feature-db-tooling) |
| Migrations and Schema | [Migrations and Schema](#feature-migrations-schema) |
| Database Utilities and Wrappers | [Database Utilities and Wrappers](#feature-db-utils) |
| Misc Utilities | [Misc Utilities](#feature-misc-utils) |

<a id="feature-registration"></a>
## Registration

| Test Type | Link |
| --- | --- |
| Contract | [Contract](#registration-contract) |
| Unit | [Unit](#registration-unit) |
| Integration | [Integration](#registration-integration) |
| End-to-End | [End-to-End](#registration-e2e) |
| Security | [Security](#registration-security) |
| Performance and Resilience | [Performance and Resilience](#registration-performance) |
| Accessibility | [Accessibility](#registration-accessibility) |

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
#### REG-INT-008: API success (201)
Source: API-REG-001
Conditions:
- registerUser resolving returns status 201.
- The JSON body contains only {id, username, createdAt}.
- id and createdAt align with the model's return values.

<a id="reg-int-009"></a>
#### REG-INT-009: API invalidation (400)
Source: API-REG-002
Conditions:
- Empty body returns 400.
- Empty or invalid username returns 400.
- Empty or invalid password returns 400.
- Response body carries {error: "Username or password is invalid."}.

<a id="reg-int-010"></a>
#### REG-INT-010: API duplicate user (409)
Source: API-REG-003
Conditions:
- registerUser throwing RegistrationError with status 409 yields status 409.
- Response JSON contains {error: "User already exists."}.

<a id="reg-int-011"></a>
#### REG-INT-011: API generic server error (500)
Source: API-REG-004
Conditions:
- Unknown errors (not RegistrationError) log a failure and respond with {error: "Failed to register user."}.

<a id="reg-int-012"></a>
#### REG-INT-012: API payload parsing
Source: API-REG-005
Conditions:
- Valid Content-Type: application/json parses correctly.
- application/x-www-form-urlencoded requests are handled via express.urlencoded.
- Invalid JSON returns a 400 from express.json before the route is invoked.
- Extra fields in the body are ignored.

<a id="reg-int-013"></a>
#### REG-INT-013: RegistrationError without statusCode
Source: Added
Conditions:
- RegistrationError without a statusCode yields status 400.
- The error message is returned in {error: "..."}.

<a id="reg-int-014"></a>
#### REG-INT-014: API response headers and body shape
Source: Added
Conditions:
- Responses use application/json for JSON bodies.
- Success responses never include passwordHash or passwordSalt.

<a id="reg-int-015"></a>
#### REG-INT-015: UI copy matches current implementation
Source: Added
Conditions:
- 409 responses show "User already exists.".
- 400 responses show "Username or password is invalid.".
- Generic non-ok responses show "Unable to create your account." when data.error is absent.
- Network failures show "Network error while attempting to register.".

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

<a id="feature-navigation-pages"></a>
## Navigation and Pages

| Test Type | Link |
| --- | --- |
| Unit | [Unit](#navigation-unit) |
| Integration | [Integration](#navigation-integration) |
| End-to-End | [End-to-End](#navigation-e2e) |
| Accessibility | [Accessibility](#navigation-accessibility) |
| Visual | [Visual](#navigation-visual) |

<a id="navigation-unit"></a>
### Unit

<a id="nav-unit-001"></a>
#### NAV-UNIT-001: home.js login redirect
Source: Added
Conditions:
- Clicking #login-button prevents default behavior.
- window.location.href is set to /private/static/pages/homeInternal.html.

<a id="nav-unit-002"></a>
#### NAV-UNIT-002: home.js missing button
Source: Added
Conditions:
- Missing #login-button does not throw.

<a id="nav-unit-003"></a>
#### NAV-UNIT-003: logged.js logout redirect
Source: Added
Conditions:
- Clicking #logout-button prevents default behavior.
- window.location.href is set to /.

<a id="nav-unit-004"></a>
#### NAV-UNIT-004: logged.js missing button
Source: Added
Conditions:
- Missing #logout-button does not throw.

<a id="navigation-integration"></a>
### Integration

<a id="nav-int-001"></a>
#### NAV-INT-001: home.html base rendering
Source: Added
Conditions:
- The page renders a header with an h1.
- #login-area contains #username-login, #password-login, and #login-button.
- #register-area contains a link to create an account.
- The stylesheet /static/shared/css/style.css is referenced.
- The script /public/static/assets/js/home.js is referenced as a module.

<a id="nav-int-002"></a>
#### NAV-INT-002: register link target
Source: Added
Conditions:
- The register link points to /public/static/pages/noSession/register.html.

<a id="nav-int-003"></a>
#### NAV-INT-003: homeInternal.html base rendering
Source: Added
Conditions:
- The page renders a header with an h1.
- #logout-button is present.
- The nav contains list items for Inventory, Market, and Settings.
- The script /private/static/assets/js/logged.js is referenced as a module.

<a id="nav-int-004"></a>
#### NAV-INT-004: shared styles applied
Source: Added
Conditions:
- Pages include /static/shared/css/style.css.
- Body background and header styles match the CSS rules.

<a id="navigation-e2e"></a>
### End-to-End

<a id="nav-e2e-001"></a>
#### NAV-E2E-001: home to private navigation
Source: Added
Conditions:
- Visiting / loads the home page.
- Clicking Login navigates to /private/static/pages/homeInternal.html.

<a id="nav-e2e-002"></a>
#### NAV-E2E-002: logout navigation
Source: Added
Conditions:
- Visiting the private home page shows the Logout button.
- Clicking Logout navigates back to /.

<a id="nav-e2e-003"></a>
#### NAV-E2E-003: home to register navigation
Source: Added
Conditions:
- Clicking the register link navigates to the register page.

<a id="navigation-accessibility"></a>
### Accessibility

<a id="nav-a11y-001"></a>
#### NAV-A11Y-001: language attribute
Source: Added
Conditions:
- Home and internal pages include lang="en" on the html element.

<a id="nav-a11y-002"></a>
#### NAV-A11Y-002: button accessible names
Source: Added
Conditions:
- Login and Logout buttons have visible text labels.
- Buttons are focusable via keyboard.

<a id="nav-a11y-003"></a>
#### NAV-A11Y-003: navigation semantics
Source: Added
Conditions:
- Navigation items live inside a <nav> element with a list structure.

<a id="navigation-visual"></a>
### Visual

<a id="nav-vis-001"></a>
#### NAV-VIS-001: home page visual regression
Source: Added
Conditions:
- Header, container, and form blocks match baseline layout and colors.

<a id="nav-vis-002"></a>
#### NAV-VIS-002: private page visual regression
Source: Added
Conditions:
- Header and nav layout match baseline styling.

<a id="feature-server-routing"></a>
## Server and Routing

| Test Type | Link |
| --- | --- |
| Integration | [Integration](#server-integration) |
| Security | [Security](#server-security) |
| Resilience | [Resilience](#server-resilience) |

<a id="server-integration"></a>
### Integration

<a id="srv-int-001"></a>
#### SRV-INT-001: root entrypoint
Source: Added
Conditions:
- GET / returns home.html with status 200.
- The response body includes the Home page markup.

<a id="srv-int-002"></a>
#### SRV-INT-002: shared static assets
Source: Added
Conditions:
- GET /static/shared/css/style.css returns 200.
- GET /static/shared/js/utils.js returns 200.

<a id="srv-int-003"></a>
#### SRV-INT-003: public static assets and pages
Source: Added
Conditions:
- GET /public/static/assets/js/home.js returns 200.
- GET /public/static/assets/js/register.js returns 200.
- GET /public/static/pages/home.html returns 200.
- GET /public/static/pages/noSession/register.html returns 200.

<a id="srv-int-004"></a>
#### SRV-INT-004: private static assets and pages
Source: Added
Conditions:
- GET /private/static/assets/js/logged.js returns 200.
- GET /private/static/pages/homeInternal.html returns 200.

<a id="srv-int-005"></a>
#### SRV-INT-005: API router mount
Source: Added
Conditions:
- POST /api/register reaches the register router.
- Unsupported API paths under /api return 404.

<a id="srv-int-006"></a>
#### SRV-INT-006: 404 handler
Source: Added
Conditions:
- Unknown routes return status 404 with "Page not found".

<a id="srv-int-007"></a>
#### SRV-INT-007: error handler
Source: Added
Conditions:
- Errors thrown from a route return status 500 with "Internal server error".

<a id="srv-int-008"></a>
#### SRV-INT-008: body parsing middleware
Source: Added
Conditions:
- application/json requests populate req.body.
- application/x-www-form-urlencoded requests populate req.body.

<a id="srv-int-009"></a>
#### SRV-INT-009: server startup
Source: Added
Conditions:
- The server listens on port 3000.
- Startup logs include the listening port message.

<a id="server-security"></a>
### Security

<a id="srv-sec-001"></a>
#### SRV-SEC-001: path traversal protection
Source: Added
Conditions:
- Requests with ../ segments do not escape the static directories.
- Responses do not expose filesystem contents outside allowed roots.

<a id="srv-sec-002"></a>
#### SRV-SEC-002: sensitive file access
Source: Added
Conditions:
- Requests for /.env or /config are not served from static routes.

<a id="srv-sec-003"></a>
#### SRV-SEC-003: directory listing
Source: Added
Conditions:
- Static directories do not return directory listings.

<a id="server-resilience"></a>
### Resilience

<a id="srv-res-001"></a>
#### SRV-RES-001: headersSent behavior
Source: Added
Conditions:
- If a middleware sends a response and throws after, the error handler calls next(err).

<a id="feature-config-env"></a>
## Configuration and Environment

| Test Type | Link |
| --- | --- |
| Unit | [Unit](#config-unit) |

<a id="config-unit"></a>
### Unit

<a id="cfg-unit-001"></a>
#### CFG-UNIT-001: loadEnv idempotency
Source: Added
Conditions:
- loadEnv loads .env only once.
- Subsequent calls do not re-expand or override values.

<a id="cfg-unit-002"></a>
#### CFG-UNIT-002: admin env preservation
Source: Added
Conditions:
- BAROTRADER_DB_ADMIN_* values set in process.env are preserved after loadEnv.
- When admin values are absent, loadEnv removes any injected values from .env.

<a id="cfg-unit-003"></a>
#### CFG-UNIT-003: parseDatabaseUrl empty input
Source: Added
Conditions:
- parseDatabaseUrl returns null for empty or undefined values.

<a id="cfg-unit-004"></a>
#### CFG-UNIT-004: parseDatabaseUrl parsing
Source: Added
Conditions:
- Host, port, database, user, and password are extracted correctly.
- Port defaults to 5432 when missing.
- Username and password are URL-decoded.

<a id="cfg-unit-005"></a>
#### CFG-UNIT-005: buildDatabaseUrl required parts
Source: Added
Conditions:
- Missing host, port, database, or user returns null.
- Missing password returns a URL with user only.

<a id="cfg-unit-006"></a>
#### CFG-UNIT-006: buildDatabaseUrl encoding
Source: Added
Conditions:
- User and password are URL-encoded when building the URL.

<a id="cfg-unit-007"></a>
#### CFG-UNIT-007: getBaseConnectionConfig defaults
Source: Added
Conditions:
- HOST defaults to localhost when missing.
- PORT defaults to 5432 when missing.

<a id="cfg-unit-008"></a>
#### CFG-UNIT-008: assertRequired behavior
Source: Added
Conditions:
- Missing values throw with the provided label.
- Non-empty values are returned unchanged.

<a id="cfg-unit-009"></a>
#### CFG-UNIT-009: getRuntimeDbConfig from DATABASE_URL
Source: Added
Conditions:
- DATABASE_URL is parsed and returned when set.
- Missing database or user in the parsed URL throws.

<a id="cfg-unit-010"></a>
#### CFG-UNIT-010: getRuntimeDbConfig from DB_*
Source: Added
Conditions:
- DB_DBNAME and DB_USER build a derived DATABASE_URL when missing.
- process.env.DATABASE_URL is set when derived.
- Missing DB_DBNAME or DB_USER throws.

<a id="cfg-unit-011"></a>
#### CFG-UNIT-011: getMigrationsDbConfig from URL
Source: Added
Conditions:
- MIGRATIONS_DATABASE_URL or MIGRATION_DATABASE_URL is parsed when set.
- Missing database or user in the parsed URL throws.

<a id="cfg-unit-012"></a>
#### CFG-UNIT-012: getMigrationsDbConfig required=false
Source: Added
Conditions:
- When required=false and no config is available, null is returned.

<a id="cfg-unit-013"></a>
#### CFG-UNIT-013: getMigrationsDbConfig from MIGRATION_*
Source: Added
Conditions:
- MIGRATION_DB defaults to DB_DBNAME when missing.
- MIGRATIONS_DATABASE_URL is derived and set when possible.

<a id="cfg-unit-014"></a>
#### CFG-UNIT-014: getAdminDbConfig requirements
Source: Added
Conditions:
- BAROTRADER_DB_ADMIN_DBNAME and BAROTRADER_DB_ADMIN_USER are required.
- BAROTRADER_DB_ADMIN_PASS defaults to an empty string.

<a id="cfg-unit-015"></a>
#### CFG-UNIT-015: getBaseRole default
Source: Added
Conditions:
- DB_BASE_ROLE overrides the default base role.
- Default base role is base_role_op.

<a id="cfg-unit-016"></a>
#### CFG-UNIT-016: getHashConfig requirements
Source: Added
Conditions:
- Missing HASH_PEPPER throws an error.
- HASH_PEPPER returns as hashPepper.

<a id="cfg-unit-017"></a>
#### CFG-UNIT-017: getRegisterConfig parsing
Source: Added
Conditions:
- REGISTER_MIN_DELAY_MS parses as an integer.
- Invalid or negative values fall back to the default delay.
- Regex and length constants are returned as configured.

<a id="cfg-unit-018"></a>
#### CFG-UNIT-018: dotenv-expand compatibility
Source: Added
Conditions:
- loadEnv supports dotenvExpand.expand when available.
- loadEnv supports dotenvExpand as a direct function when expand is missing.

<a id="feature-data-access"></a>
## Data Access (User Model and Pools)

| Test Type | Link |
| --- | --- |
| Unit | [Unit](#data-access-unit) |
| Integration | [Integration](#data-access-integration) |

<a id="data-access-unit"></a>
### Unit

<a id="dal-unit-001"></a>
#### DAL-UNIT-001: createUserModel requires db client
Source: Added
Conditions:
- Missing db throws an error.
- Missing query or execute functions throws an error.

<a id="dal-unit-002"></a>
#### DAL-UNIT-002: mapUser behavior
Source: Added
Conditions:
- Null/undefined rows return null.
- Row fields map to id, username, passwordHash, passwordSalt, createdAt.

<a id="dal-unit-003"></a>
#### DAL-UNIT-003: createUser input validation
Source: Added
Conditions:
- Missing username throws.
- Missing passwordHash throws.
- Missing passwordSalt throws.

<a id="dal-unit-004"></a>
#### DAL-UNIT-004: findByUsername null input
Source: Added
Conditions:
- Falsy usernames return null without querying.

<a id="dal-unit-005"></a>
#### DAL-UNIT-005: findById null input
Source: Added
Conditions:
- Falsy ids return null without querying.

<a id="dal-unit-006"></a>
#### DAL-UNIT-006: getUserModel caching
Source: Added
Conditions:
- The user model instance is cached after the first call.
- Subsequent calls return the same instance.

<a id="dal-unit-007"></a>
#### DAL-UNIT-007: closeUserModel behavior
Source: Added
Conditions:
- db.close is invoked.
- Cached model is cleared.

<a id="dal-unit-008"></a>
#### DAL-UNIT-008: runtime pool wrapper
Source: Added
Conditions:
- query delegates to conn.any.
- execute delegates to conn.result.
- close ends the pool when available.

<a id="dal-unit-009"></a>
#### DAL-UNIT-009: ensureTable deprecated
Source: Added
Conditions:
- ensureTable throws a deprecation error directing to migrations.

<a id="data-access-integration"></a>
### Integration

<a id="dal-int-001"></a>
#### DAL-INT-001: createUser inserts a row
Source: Added
Conditions:
- createUser inserts username, passwordHash, and passwordSalt.
- The returned object includes id and createdAt.

<a id="dal-int-002"></a>
#### DAL-INT-002: findByUsername and findById
Source: Added
Conditions:
- findByUsername returns the inserted user.
- findById returns the same user by id.

<a id="dal-int-003"></a>
#### DAL-INT-003: username uniqueness
Source: Added
Conditions:
- Inserting the same username twice fails due to the unique constraint.

<a id="dal-int-004"></a>
#### DAL-INT-004: password_salt requirement
Source: Added
Conditions:
- Inserting without password_salt fails due to NOT NULL constraint.

<a id="dal-int-005"></a>
#### DAL-INT-005: created_at default
Source: Added
Conditions:
- created_at is set by the database when not explicitly provided.

<a id="feature-db-tooling"></a>
## Database Tooling and Safety

| Test Type | Link |
| --- | --- |
| Unit | [Unit](#db-tooling-unit) |
| Integration | [Integration](#db-tooling-integration) |
| End-to-End | [End-to-End](#db-tooling-e2e) |
| Security | [Security](#db-tooling-security) |

<a id="db-tooling-unit"></a>
### Unit

<a id="dbt-unit-001"></a>
#### DBT-UNIT-001: destructive guard requires targetDatabase
Source: Added
Conditions:
- Missing targetDatabase throws an error.

<a id="dbt-unit-002"></a>
#### DBT-UNIT-002: destructive guard requires APP_ENV or NODE_ENV
Source: Added
Conditions:
- Missing APP_ENV and NODE_ENV throws an error.

<a id="dbt-unit-003"></a>
#### DBT-UNIT-003: destructive guard blocks non-dev/test
Source: Added
Conditions:
- APP_ENV values outside development/test throw an error.

<a id="dbt-unit-004"></a>
#### DBT-UNIT-004: destructive guard requires allow flag
Source: Added
Conditions:
- DB_ALLOW_DESTRUCTIVE not set to YES throws an error.

<a id="dbt-unit-005"></a>
#### DBT-UNIT-005: destructive guard requires confirm match
Source: Added
Conditions:
- Missing DB_DESTRUCTIVE_CONFIRM throws an error.
- Mismatched DB_DESTRUCTIVE_CONFIRM throws an error.

<a id="dbt-unit-006"></a>
#### DBT-UNIT-006: destructive guard success path
Source: Added
Conditions:
- Correct APP_ENV, DB_ALLOW_DESTRUCTIVE, and DB_DESTRUCTIVE_CONFIRM allow execution.

<a id="dbt-unit-007"></a>
#### DBT-UNIT-007: getNpmArgs parsing
Source: Added
Conditions:
- npm_config_argv is parsed to extract args after a script name.
- Invalid JSON returns an empty list and logs a warning.

<a id="dbt-unit-008"></a>
#### DBT-UNIT-008: resolveMigrateArgs precedence
Source: Added
Conditions:
- CLI args are used when provided.
- npm args are used when CLI args are absent.

<a id="dbt-unit-009"></a>
#### DBT-UNIT-009: migrateFlow unknown subcommand
Source: Added
Conditions:
- Unknown migrate commands throw with a helpful message.

<a id="dbt-unit-010"></a>
#### DBT-UNIT-010: ensureDatabaseUser behavior
Source: Added
Conditions:
- Existing runtime role skips creation.
- Missing runtime password throws when creation is needed.

<a id="dbt-unit-011"></a>
#### DBT-UNIT-011: ensureMigratorUser identity rules
Source: Added
Conditions:
- Migrator user cannot match admin user.
- Migrator user cannot match runtime user.

<a id="dbt-unit-012"></a>
#### DBT-UNIT-012: ensureMigratorUser creation and grants
Source: Added
Conditions:
- Missing migrator user is created with a password.
- Missing CREATEROLE privilege is granted.

<a id="dbt-unit-013"></a>
#### DBT-UNIT-013: ensureDatabase rules
Source: Added
Conditions:
- Runtime and migrator DB names must match.
- Database is created when missing.

<a id="dbt-unit-014"></a>
#### DBT-UNIT-014: cleanup flow
Source: Added
Conditions:
- Cleanup resolves the database name from runtime and migrator configs.
- Database, users, and base role are dropped in order.

<a id="dbt-unit-015"></a>
#### DBT-UNIT-015: tooling pools lifecycle
Source: Added
Conditions:
- getAdminDb/getOwnerDb/getRuntimeDb are lazy.
- closeAll does not throw when pgp.end fails.

<a id="dbt-unit-016"></a>
#### DBT-UNIT-016: printUsage on unknown command
Source: Added
Conditions:
- Unknown CLI modes print usage and exit with code 1.

<a id="db-tooling-integration"></a>
### Integration

<a id="dbt-int-001"></a>
#### DBT-INT-001: db:setup idempotency
Source: Added
Conditions:
- db:setup creates runtime and migrator users and the database.
- Re-running db:setup does not error when they already exist.

<a id="dbt-int-002"></a>
#### DBT-INT-002: db:cleanup safety gates
Source: Added
Conditions:
- db:cleanup fails when safety gates are not satisfied.
- db:cleanup succeeds when gates are satisfied.

<a id="dbt-int-003"></a>
#### DBT-INT-003: db:seed smoke test
Source: Added
Conditions:
- runAsUser creates a user and can fetch it by username and id.
- The smoke test logs the created user summary.

<a id="dbt-int-004"></a>
#### DBT-INT-004: db:seed schema alignment
Source: Added
Conditions:
- runAsUser supplies passwordSalt to createUser.
- The smoke test fails when required fields are missing (document current behavior).

<a id="dbt-int-005"></a>
#### DBT-INT-005: db main error path
Source: Added
Conditions:
- Errors in a flow set process.exitCode to 1.
- closeAll is invoked in the finally block.

<a id="db-tooling-e2e"></a>
### End-to-End

<a id="dbt-e2e-001"></a>
#### DBT-E2E-001: full DB lifecycle
Source: Added
Conditions:
- setup -> migrate up -> seed -> cleanup completes in order.

<a id="dbt-e2e-002"></a>
#### DBT-E2E-002: migration lifecycle commands
Source: Added
Conditions:
- db:migrate status reports current state.
- db:migrate up applies pending migrations.
- db:migrate down and redo behave as expected.

<a id="db-tooling-security"></a>
### Security

<a id="dbt-sec-001"></a>
#### DBT-SEC-001: destructive guard in production
Source: Added
Conditions:
- APP_ENV values outside development/test block cleanup.

<a id="dbt-sec-002"></a>
#### DBT-SEC-002: destructive confirmation match
Source: Added
Conditions:
- DB_DESTRUCTIVE_CONFIRM must exactly match the target database name.

<a id="feature-migrations-schema"></a>
## Migrations and Schema

| Test Type | Link |
| --- | --- |
| Unit | [Unit](#migrations-unit) |
| Integration | [Integration](#migrations-integration) |
| Contract | [Contract](#migrations-contract) |

<a id="migrations-unit"></a>
### Unit

<a id="mig-unit-001"></a>
#### MIG-UNIT-001: escapeIdentifier
Source: Added
Conditions:
- Empty identifiers throw.
- Double quotes are escaped properly.

<a id="mig-unit-002"></a>
#### MIG-UNIT-002: escapeLiteral
Source: Added
Conditions:
- Non-string values throw.
- Single quotes are escaped properly.

<a id="mig-unit-003"></a>
#### MIG-UNIT-003: applyReplacements behavior
Source: Added
Conditions:
- Tokens are replaced with provided values.
- Missing tokens cause an error listing missing keys.

<a id="mig-unit-004"></a>
#### MIG-UNIT-004: loadMigrationSql
Source: Added
Conditions:
- SQL files are loaded from db/sql/migrations.
- Missing files throw an error.

<a id="mig-unit-005"></a>
#### MIG-UNIT-005: stripFlagWithValue
Source: Added
Conditions:
- Flags and their values are removed from arg lists.
- Flags passed as --flag=value are removed.

<a id="mig-unit-006"></a>
#### MIG-UNIT-006: migration name sorting
Source: Added
Conditions:
- Numeric prefixes sort in numeric order.
- Non-numeric prefixes sort lexicographically.

<a id="mig-unit-007"></a>
#### MIG-UNIT-007: listMigrationNames filters
Source: Added
Conditions:
- Only .js files in db/migrations/ are returned.
- Hidden files are ignored.

<a id="mig-unit-008"></a>
#### MIG-UNIT-008: formatRunOn behavior
Source: Added
Conditions:
- Dates format as ISO strings.
- Non-date values are returned as-is.

<a id="migrations-integration"></a>
### Integration

<a id="mig-int-001"></a>
#### MIG-INT-001: runMigrations dependency check
Source: Added
Conditions:
- Missing node-pg-migrate yields a helpful error.

<a id="mig-int-002"></a>
#### MIG-INT-002: runMigrations argument sanitization
Source: Added
Conditions:
- --migrations-dir, --database-url-var, and --envPath args are stripped.
- MIGRATIONS_DATABASE_URL is used as the database url var.
- .env is passed when present.

<a id="mig-int-003"></a>
#### MIG-INT-003: printMigrationStatus without pgmigrations table
Source: Added
Conditions:
- All migrations are reported as pending when pgmigrations is missing.

<a id="mig-int-004"></a>
#### MIG-INT-004: printMigrationStatus with missing files
Source: Added
Conditions:
- Applied migrations missing from the filesystem are listed as missing.

<a id="mig-int-005"></a>
#### MIG-INT-005: apply migrations on clean DB
Source: Added
Conditions:
- All migrations apply without errors.
- The users table exists after applying migrations.

<a id="mig-int-006"></a>
#### MIG-INT-006: down migrations
Source: Added
Conditions:
- 004 down removes password_salt from users.
- 001 down removes the users table.

<a id="mig-int-007"></a>
#### MIG-INT-007: migration wrapper env resolution
Source: Added
Conditions:
- Missing MIGRATIONS_DATABASE_URL/MIGRATION_USER causes migrator grants to fail.
- Missing DATABASE_URL/DB_USER causes base role grants to fail.

<a id="migrations-contract"></a>
### Contract

<a id="mig-con-001"></a>
#### MIG-CON-001: users table schema
Source: Added
Conditions:
- users.id is a primary key.
- users.username is unique and not null.
- users.password_hash is not null.
- users.password_salt is not null.
- users.created_at defaults to current timestamp.

<a id="mig-con-002"></a>
#### MIG-CON-002: migrator and base role grants
Source: Added
Conditions:
- Migrator has schema create and table/sequence privileges in public.
- Base role has DML and sequence privileges.
- Base role is granted to the runtime user.

<a id="mig-con-003"></a>
#### MIG-CON-003: runtime SQL alignment
Source: Added
Conditions:
- Runtime queries reference existing columns in public.users.
- Insert queries include password_hash and password_salt.

<a id="mig-con-004"></a>
#### MIG-CON-004: infra seed SQL alignment
Source: Added
Conditions:
- Seed SQL uses the same column names as the users table schema.
- Mismatches are documented as gaps to fix.

<a id="mig-con-005"></a>
#### MIG-CON-005: SQL registry integrity
Source: Added
Conditions:
- db/sql/index.js exposes QueryFile instances for all expected SQL files.
- QueryFile paths resolve to existing files.

<a id="feature-db-utils"></a>
## Database Utilities and Wrappers

| Test Type | Link |
| --- | --- |
| Unit | [Unit](#db-utils-unit) |
| Integration | [Integration](#db-utils-integration) |

<a id="db-utils-unit"></a>
### Unit

<a id="dbu-unit-001"></a>
#### DBU-UNIT-001: loadSql caching
Source: Added
Conditions:
- First call reads the SQL file.
- Subsequent calls return the cached value.

<a id="dbu-unit-002"></a>
#### DBU-UNIT-002: loadSql missing file
Source: Added
Conditions:
- Missing SQL files throw an error.

<a id="dbu-unit-003"></a>
#### DBU-UNIT-003: sleep behavior
Source: Added
Conditions:
- sleep resolves after at least the requested delay.

<a id="dbu-unit-004"></a>
#### DBU-UNIT-004: connectWithRetries success path
Source: Added
Conditions:
- dbDriver is invoked until it succeeds.
- Successful connection is returned.

<a id="dbu-unit-005"></a>
#### DBU-UNIT-005: connectWithRetries failure path
Source: Added
Conditions:
- After the final retry, the error is thrown.
- Retry delays follow exponential backoff.

<a id="dbu-unit-006"></a>
#### DBU-UNIT-006: PostgreSQL wrapper config validation
Source: Added
Conditions:
- Missing dbConfig throws an error.
- Missing required keys (host, port, database, user, password) throw.

<a id="dbu-unit-007"></a>
#### DBU-UNIT-007: PostgreSQL wrapper query execution
Source: Added
Conditions:
- execute returns the pg-promise result object.
- query returns rows.
- Errors are wrapped with helpful messages.

<a id="dbu-unit-008"></a>
#### DBU-UNIT-008: PostgreSQL wrapper close
Source: Added
Conditions:
- close ends the pool when available.
- close does not throw on shutdown.

<a id="dbu-unit-009"></a>
#### DBU-UNIT-009: SQLite wrapper path creation
Source: Added
Conditions:
- Directories are created for the database path.
- The database file is created if missing.

<a id="dbu-unit-010"></a>
#### DBU-UNIT-010: SQLite wrapper error propagation
Source: Added
Conditions:
- execute errors are logged and re-thrown.
- query errors are logged and re-thrown.

<a id="db-utils-integration"></a>
### Integration

<a id="dbu-int-001"></a>
#### DBU-INT-001: SQLite wrapper CRUD
Source: Added
Conditions:
- execute can create a table and insert a row.
- query returns the inserted row.
- PRAGMA foreign_keys is ON after opening the database.

<a id="dbu-int-002"></a>
#### DBU-INT-002: database_sqlite.js script
Source: Added
Conditions:
- The script creates the SQLite file and table.
- Insert and select operations return expected results.

<a id="dbu-int-003"></a>
#### DBU-INT-003: PostgreSQL wrapper integration
Source: Added
Conditions:
- Wrapper can run a simple query against a test database.

<a id="dbu-int-004"></a>
#### DBU-INT-004: connectWithRetries with real DB
Source: Added
Conditions:
- Connection succeeds after transient failures when dbDriver eventually resolves.

<a id="feature-misc-utils"></a>
## Misc Utilities

| Test Type | Link |
| --- | --- |
| Unit | [Unit](#misc-utils-unit) |

<a id="misc-utils-unit"></a>
### Unit

<a id="misc-unit-001"></a>
#### MISC-UNIT-001: contentTypeFor mapping
Source: Added
Conditions:
- Known extensions map to expected MIME types.
- Unknown extensions return application/octet-stream.

