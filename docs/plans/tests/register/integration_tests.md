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
#### ✅ REG-INT-001: Register component basic rendering
Source: FE-REG-001
Conditions:
- The page loads with <form id="register-form">.
- Inputs #username-email and #password-register are present.
- The submit button #register-button exists.
- #register-feedback is present and has aria-live="polite".
- Attributes required, pattern, minlength, and maxlength are defined for both inputs.

<a id="reg-int-002"></a>
#### ✅ REG-INT-002: submit with invalid inputs
Source: FE-REG-005
Conditions:
- Invalid username or password is blocked by browser constraint validation.
- The form does not call fetch when validation fails.
- Missing #register-feedback should not break the script.

<a id="reg-int-003"></a>
#### ✅ REG-INT-003: successful submit
Source: FE-REG-006
Conditions:
- Valid inputs trigger fetch POST /api/register.
- The request includes Content-Type: application/json.
- The payload contains the trimmed username and the raw password.
- A 201 response shows a success message and redirects after ~600ms.
- Feedback uses the success color (#047857).
- If #register-feedback is absent, the redirect still happens without errors.

<a id="reg-int-004"></a>
#### ✅ REG-INT-004: API error responses (client-side handling)
Source: FE-REG-007
Conditions:
- 409 responses display "User already exists." in error color and do not redirect.
- 400 responses display "Username or password is invalid." in error color and do not redirect.
- 500 or other non-ok responses show data.error if present, otherwise a generic message.
- Responses without JSON bodies do not crash the script and show the generic message.

<a id="reg-int-005"></a>
#### ✅ REG-INT-005: network failure (client-side handling)
Source: FE-REG-008
Conditions:
- fetch rejecting shows "Network error while attempting to register." in error color.
- No redirect occurs on network failure.

<a id="reg-int-006"></a>
#### ✅ REG-INT-006: non-201 success responses
Source: Added
Conditions:
- Any 2xx response (e.g., 200 or 204) is treated as success by response.ok.
- A 2xx response still shows the success message and redirects after ~600ms.

<a id="reg-int-007"></a>
#### ✅ REG-INT-007: whitespace-only password path
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
#### ✅ REG-INT-016: register API HTTP contract (`_new_`)
Source: API-REG-001 to API-REG-005
Conditions:
- Uses `tests/integration/registerApi.http-contract.test.js`.
- Validates HTTP contract behavior for 201, 400, 409, 500, payload parsing, and response shape.
- A successful 201 response issues the authenticated session cookie.
- Uses service mocking intentionally for route contract isolation.

<a id="reg-int-017"></a>
#### ✅ REG-INT-017: register API backend smoke with real DB (`_new_`)
Source: API-REG-001 and API-REG-003
Conditions:
- Uses `tests/integration/registerApi.backend-smoke.test.js`.
- Executes full backend path (route -> service -> model -> PostgreSQL).
- Success responses never expose `passwordHash` or `passwordSalt`.
- Success responses issue the authenticated session cookie.

<a id="reg-int-018"></a>
#### ✅ REG-INT-018: register API invalid payload on real backend (`_new_`)
Source: API-REG-002
Conditions:
- Uses `tests/integration/registerApi.backend-smoke.test.js`.
- Invalid username/password payloads return HTTP 400 on the real backend stack.

<a id="reg-int-019"></a>
#### ✅ REG-INT-019: register service persistence with real DB (`_new_`)
Source: REG-SVC-003
Conditions:
- Uses `tests/integration/registerService.db-integration.test.js`.
- `registerUser` persists user data and generated hash/salt in PostgreSQL.

<a id="reg-int-020"></a>
#### ✅ REG-INT-020: register service duplicate handling with real DB (`_new_`)
Source: REG-SVC-002
Conditions:
- Uses `tests/integration/registerService.db-integration.test.js`.
- Duplicate usernames raise `RegistrationError` with status 409.

<a id="reg-int-021"></a>
#### ✅ REG-INT-021: register service validation with real DB (`_new_`)
Source: REG-SVC-001
Conditions:
- Uses `tests/integration/registerService.db-integration.test.js`.
- Invalid payloads raise `RegistrationError` with status 400.
