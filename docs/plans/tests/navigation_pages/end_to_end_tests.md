<a id="navigation-e2e"></a>
### End-to-End

<a id="nav-e2e-001"></a>
#### NAV-E2E-001: home to account navigation
Source: Added
Conditions:
- Visiting / loads the home page.
- Clicking Login navigates to /account through React Router.

<a id="nav-e2e-002"></a>
#### NAV-E2E-002: logout navigation
Source: Added
Conditions:
- Visiting /account shows the Logout button.
- Clicking Logout navigates back to /.

<a id="nav-e2e-003"></a>
#### NAV-E2E-003: home to register navigation
Source: Added
Conditions:
- Clicking the register link navigates to the register page.

<a id="nav-e2e-004"></a>
#### NAV-E2E-004: unauthenticated protected page and return path
Source: Added
Conditions:
- Visiting `/account` without a valid session redirects to `/login`.
- Successful login returns to `/account`.
- The Account page renders after the session is established.

<a id="nav-e2e-005"></a>
#### NAV-E2E-005: authenticated user opening login
Source: Added
Conditions:
- An authenticated user visiting `/login` is redirected to `/account`.

