<a id="registration-e2e"></a>
### End-to-End

<a id="reg-e2e-001"></a>
#### REG-E2E-001: successful registration flow
Source: Added
Conditions:
- User navigates to the register page and submits valid credentials.
- The browser issues POST /api/register with JSON payload.
- A success message appears and a redirect occurs after ~600ms.
- The user lands on /account through SPA navigation.

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

