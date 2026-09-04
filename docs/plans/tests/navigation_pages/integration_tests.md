<a id="navigation-integration"></a>
### Integration

<a id="nav-int-001"></a>
#### NAV-INT-001: Home component base rendering
Source: Added
Conditions:
- The page renders a header with an h1.
- #login-area contains #username-login, #password-login, and #login-button.
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

