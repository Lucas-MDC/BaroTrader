<a id="login-e2e"></a>
### End-to-End

<a id="login-e2e-001"></a>
#### LOGIN-E2E-001: successful login flow
Source: Added
Conditions:
- User navigates to the home page and submits valid credentials.
- The browser issues POST /api/login with a JSON payload.
- The response establishes the session cookie.
- The user is navigated to /account through SPA navigation.

<a id="login-e2e-002"></a>
#### LOGIN-E2E-002: client-side invalid input prevents submission
Source: Added
Conditions:
- Empty username or password shows browser validation feedback.
- No network request is sent.
- The user remains on the home page.

<a id="login-e2e-003"></a>
#### LOGIN-E2E-003: invalid credentials response
Source: Added
Conditions:
- Invalid credentials show "Invalid username or password.".
- No redirect occurs.
- The error does not reveal whether the username exists.

<a id="login-e2e-004"></a>
#### LOGIN-E2E-004: network failure response
Source: Added
Conditions:
- A simulated network failure shows "Network error while attempting to login.".
- No redirect occurs.

<a id="login-e2e-005"></a>
#### LOGIN-E2E-005: authenticated session reaches account flow
Source: Added
Conditions:
- After a successful login, the browser retains the session cookie.
- Navigation to /account completes through the SPA route.
- The session cookie is not readable through client-side JavaScript.
