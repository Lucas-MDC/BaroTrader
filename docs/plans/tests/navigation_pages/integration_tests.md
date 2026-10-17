<a id="navigation-integration"></a>
### Integration

<a id="nav-int-001"></a>
#### NAV-INT-001: Home component base rendering
Source: Added
Conditions:
- The page renders a header with an h1.
- #login-area contains #username-login, #password-login, and #login-button.
- The shared login component is rendered on Home.
- #register-area contains a link to create an account.
- The stylesheet /static/assets/css/style.css is referenced.
- The script /spa/app.js is referenced as a module.

<a id="nav-int-002"></a>
#### NAV-INT-002: register link target
Source: Added
Conditions:
- The register link points to /register.

<a id="nav-int-003"></a>
#### NAV-INT-003: Account component base rendering
Source: Added
Conditions:
- The page renders a header with an h1.
- #logout-button is present.
- The nav contains list items for Inventory, Market, and Settings.
- The SPA shell references /spa/app.js as a module.

<a id="nav-int-004"></a>
#### NAV-INT-004: shared styles applied
Source: Added
Conditions:
- Pages include /static/assets/css/style.css.
- Body background and header styles match the CSS rules.

<a id="nav-int-005"></a>
#### NAV-INT-005: protected account navigation
Source: Added
Conditions:
- A missing or invalid session redirects `/account` to `/login`.
- The requested internal location is kept through login.
- A valid session allows the Account component to render.
- A session check error does not render the Account component.
- A 401 from a protected API clears the client session and returns to `/login`.

<a id="nav-int-006"></a>
#### NAV-INT-006: authenticated login route
Source: Added
Conditions:
- `/login` checks the current session before displaying the login form.
- An authenticated user is redirected to `/account`.
- An unauthenticated user can use the shared login component.

