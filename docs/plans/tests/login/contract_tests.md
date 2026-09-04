<a id="login-contract"></a>
### Contract

<a id="login-con-001"></a>
#### LOGIN-CON-001: login form and session endpoint contract
Source: Added
Conditions:
- The home page provides #login-form with #username-login, #password-login, #login-button, and #login-feedback.
- The client sends username and password as a JSON POST request to /api/login.
- A successful response returns the authenticated public user and establishes the configured session cookie.
- Authentication failures use the same public error contract for unknown users and incorrect passwords.
