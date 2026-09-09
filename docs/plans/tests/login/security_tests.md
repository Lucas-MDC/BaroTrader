<a id="login-security"></a>
### Security

<a id="login-sec-001"></a>
#### LOGIN-SEC-001: uniform invalid credentials response
Source: Added
Conditions:
- Unknown usernames and wrong passwords both return HTTP 401.
- Both cases use "Invalid username or password.".
- Neither case exposes whether the username exists.

<a id="login-sec-002"></a>
#### LOGIN-SEC-002: SQL injection safeguards
Source: Added
Conditions:
- Username inputs containing SQL injection attempts do not alter the query.
- Invalid or unknown inputs return the normal authentication failure response.

<a id="login-sec-003"></a>
#### LOGIN-SEC-003: sensitive data exposure
Source: Added
Conditions:
- Login responses never return passwordHash or passwordSalt.
- Server logs do not contain the raw password.
- Session tokens do not contain password data.

<a id="login-sec-004"></a>
#### LOGIN-SEC-004: session cookie security
Source: Added
Conditions:
- The session cookie is HttpOnly.
- The session cookie uses Secure and SameSite=Strict in the configured environment.
- The cookie path is / and its max-age matches the configured JWT lifetime.

<a id="login-sec-005"></a>
#### LOGIN-SEC-005: XSS safety in feedback rendering
Source: Added
Conditions:
- API error messages rendered by the login form remain text-only and do not execute HTML.
