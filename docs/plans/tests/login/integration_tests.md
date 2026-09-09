<a id="login-integration"></a>
### Integration

Current files:
- `tests/integration/loginApi.http-contract.test.js` (`_new_`)
- `tests/integration/loginClient.jsdom.test.js` (`_new_`)
- `tests/integration/loginService.db-integration.test.js` (`_new_`)

<a id="login-int-001"></a>
#### LOGIN-INT-001: Login component basic rendering
Source: Added
Conditions:
- The page loads with #login-form.
- Inputs #username-login and #password-login are present and required.
- The submit button #login-button exists.
- #login-feedback is present and has aria-live="polite".
- The username and password inputs use the expected autocomplete values.

<a id="login-int-002"></a>
#### LOGIN-INT-002: submit with invalid inputs
Source: Added
Conditions:
- Empty username or password is blocked by browser constraint validation.
- The form does not call fetch when validation fails.
- Missing #login-feedback does not break the validation flow.

<a id="login-int-003"></a>
#### LOGIN-INT-003: successful submit
Source: Added
Conditions:
- Valid inputs trigger fetch POST /api/login.
- The request includes Content-Type: application/json.
- The payload contains the trimmed username and the raw password.
- A 200 response navigates to /account through SPA navigation.
- Navigation replaces the login history entry.

<a id="login-int-004"></a>
#### LOGIN-INT-004: invalid credentials response
Source: Added
Conditions:
- A 401 response displays "Invalid username or password." in error color.
- No navigation occurs on invalid credentials.
- The response does not expose whether the username exists.

<a id="login-int-005"></a>
#### LOGIN-INT-005: other API error responses
Source: Added
Conditions:
- Non-401 non-ok responses display data.error when present.
- Responses without JSON bodies display "Unable to login.".
- No navigation occurs for an API error.

<a id="login-int-006"></a>
#### LOGIN-INT-006: network failure
Source: Added
Conditions:
- fetch rejecting displays "Network error while attempting to login.".
- No navigation occurs on network failure.

<a id="login-int-007"></a>
#### LOGIN-INT-007: login API HTTP contract
Source: Added
Conditions:
- Uses `tests/integration/loginApi.http-contract.test.js`.
- Valid credentials return HTTP 200 with the public user only.
- Successful responses issue the authenticated session cookie.
- Invalid credentials return HTTP 401 with the public error message.
- Malformed or incomplete payloads do not reach a successful authentication path.

<a id="login-int-008"></a>
#### LOGIN-INT-008: login service with real DB
Source: Added
Conditions:
- Uses `tests/integration/loginService.db-integration.test.js`.
- A user persisted by the registration service can authenticate with the correct password.
- The result contains id, username, and createdAt but no password hash or salt.

<a id="login-int-009"></a>
#### LOGIN-INT-009: wrong password with real DB
Source: Added
Conditions:
- Uses `tests/integration/loginService.db-integration.test.js`.
- A wrong password raises SessionError with status 401.
- The response behavior matches an unknown username.

<a id="login-int-010"></a>
#### LOGIN-INT-010: login minimum response deadline
Source: Added
Conditions:
- Uses `tests/integration/loginService.db-integration.test.js`.
- Successful and unsuccessful responses do not complete before loginResponseDeadlineMs.
- A zero loginResponseDeadlineMs configuration completes without an extra wait.
