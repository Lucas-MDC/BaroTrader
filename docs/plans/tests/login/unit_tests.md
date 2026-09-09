<a id="login-unit"></a>
### Unit

<a id="login-unit-001"></a>
#### LOGIN-UNIT-001: missing bindings (client-side)
Source: Added
Conditions:
- Missing #login-form does not crash the component.
- Missing username/password inputs prevent the request and show "Login form is unavailable.".

<a id="login-unit-002"></a>
#### LOGIN-UNIT-002: loginUser request construction
Source: Added
Conditions:
- loginUser sends POST /api/login.
- The request includes Content-Type: application/json.
- The payload contains the supplied username and password.
- The response JSON is returned with the original Response object.

<a id="login-unit-003"></a>
#### LOGIN-UNIT-003: loginUser response parsing
Source: Added
Conditions:
- A JSON response body is returned as data.
- A response without a JSON body does not throw and returns an empty data object.

<a id="login-unit-004"></a>
#### LOGIN-UNIT-004: getLoginErrorMessage
Source: Added
Conditions:
- A 401 response returns "Invalid username or password.".
- A non-ok response uses data.error when present.
- A non-ok response without data.error returns "Unable to login.".
- An ok response returns an empty error message.

<a id="login-unit-005"></a>
#### LOGIN-UNIT-005: login service normalization and validation
Source: Added
Conditions:
- Username is trimmed before lookup.
- Password is trimmed before hashing.
- Non-string or empty username/password inputs become invalid credentials.
- Invalid credentials use status code 401 and the public message "Invalid username or password.".

<a id="login-unit-006"></a>
#### LOGIN-UNIT-006: login service password verification
Source: Added
Conditions:
- findByUsername is called with the normalized username.
- The candidate password is hashed with the persisted password salt.
- A matching hash returns only id, username, and createdAt.
- A non-matching hash returns invalid credentials.

<a id="login-unit-007"></a>
#### LOGIN-UNIT-007: login service unknown-user handling
Source: Added
Conditions:
- Unknown users still execute password hashing with the dummy salt/password path.
- Unknown users receive the same invalid credentials error as known users with a wrong password.
- The user model is not exposed in the error response.

<a id="login-unit-008"></a>
#### LOGIN-UNIT-008: login service error propagation
Source: Added
Conditions:
- Errors from findByUsername bubble up.
- Errors from hashPassword bubble up.
- The minimum login response deadline is enforced for successful and unsuccessful attempts.
- A zero loginResponseDeadlineMs adds no extra wait.

<a id="login-unit-009"></a>
#### LOGIN-UNIT-009: SessionError shape
Source: Added
Conditions:
- name is "SessionError".
- statusCode defaults to 401 when omitted.
- message is preserved as provided.

<a id="login-unit-010"></a>
#### LOGIN-UNIT-010: session cookie issuance
Source: Added
Conditions:
- issueSessionCookie signs a token with the configured algorithm, secret, and user id subject.
- The cookie uses the configured name, HttpOnly, Secure, SameSite, path, and max-age options.
- The token payload does not contain passwordHash or passwordSalt.

<a id="login-unit-011"></a>
#### LOGIN-UNIT-011: session cookie clearing
Source: Added
Conditions:
- clearSessionCookie uses the configured cookie name and path.
- The clearing options preserve the configured HttpOnly, Secure, and SameSite attributes.

<a id="login-unit-012"></a>
#### LOGIN-UNIT-012: local and JWT passport strategies
Source: Added
Conditions:
- The local strategy delegates to login and maps SessionError to authentication info.
- The JWT strategy rejects invalid or unknown user ids.
- A valid JWT user is mapped to public fields without password data.
