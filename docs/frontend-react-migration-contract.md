# Frontend React SPA Contract

This document defines the current contract between the React frontend, Express
HTTP routing, public files, and application services. The former individual
HTML pages and their `/public/static/pages/*` and `/private/static/pages/*`
paths are no longer part of the contract.

## Responsibilities

### React

- Renders the application pages.
- Handles internal navigation after the shell has loaded.
- Updates the URL and browser history through `react-router-dom`.
- Uses `Link` for internal links and `useNavigate` for navigation after login,
  registration, and logout.

### Express

- Serves the same `src/frontend/index.html` shell for valid SPA routes.
- Serves fixed public assets through `express.static`.
- Serves only the exact bundle used to start the SPA, without mounting the
  build directory as a public directory.
- Processes services under `/api` before the SPA routes.
- Returns 404 for unknown paths and never uses the shell as a fallback response
  for `/api/*`.

## Canonical SPA routes

| Page | Route | Component |
| --- | --- | --- |
| Home and login | `/` | `Home` |
| Registration | `/register` | `Register` |
| Account | `/account` | `Account` |

During internal navigation, these page changes do not generate a new document
request to Express. Opening a route directly, refreshing the page, or opening a
link in another tab requires an initial GET; in that case, Express serves the
shell and React renders the corresponding route.

`/account` is a public UI route. Its shell can be rendered without a session.
Private data displayed on this page in the future must come from
authentication-protected services, which form the actual security boundary.

## HTTP routing order

The Express router must maintain this precedence:

1. Fixed assets under `/static/assets`.
2. Exact bundle at `/spa/app.js`.
3. Services under `/api`.
4. Shell for `/`, `/register`, and `/account`.
5. 404 response.
6. Error handling.

## Fixed public assets

Versioned public files are stored under `src/public/assets`:

```text
src/public/assets/
  css/
  images/
  icons/
  fonts/
```

Only the `css`, `images`, `icons`, and `fonts` subdirectories are mounted by
Express under `/static/assets`. Other directories inside `assets`, including a
potential `assets/build`, are not public. Examples:

| File | URL |
| --- | --- |
| `src/public/assets/css/style.css` | `/static/assets/css/style.css` |
| `src/public/assets/images/logo.png` | `/static/assets/images/logo.png` |
| `src/public/assets/icons/favicon.svg` | `/static/assets/icons/favicon.svg` |
| `src/public/assets/fonts/inter.woff2` | `/static/assets/fonts/inter.woff2` |

Directories must not provide listings. Private files, protected uploads,
configuration, and secrets must not be placed in this tree.

## SPA bundle

esbuild generates only:

```text
src/public/build/app.js
```

The `src/public/build` directory is ignored by Git and is not mounted by
`express.static`. Express serves the exact file at:

```text
GET /spa/app.js
```

This URL must exist because the browser needs to download the JavaScript that
starts the SPA. It can be opened directly like any HTTP resource, but it does
not allow access to other filenames or browsing the build directory.

## Services

The operations below remain backend requests because they create, retrieve, or
remove resources:

| Method and path | Responsibility |
| --- | --- |
| `POST /api/register` | Create a user and start their session |
| `POST /api/login` | Authenticate a user and start their session |
| `DELETE /api/logout` | End the current session |

Future protected services must use JWT authentication before returning account
information.

## Session created by registration

A successful registration must:

1. Create the user.
2. Issue a JWT with the same policy used by login.
3. Store the JWT in the same `HttpOnly`, `Secure`, and `SameSite=Strict` cookie.
4. Return status 201 and only the user's public data.
5. Allow React to navigate to `/account` without a second call to `/api/login`
   and without reloading the document.

## Home

UI contract:

- `title`: `Home`
- CSS global: `/static/assets/css/style.css`
- `header > h1`: `Home`
- `main > div.container`
- `section#login-area`
- `section#register-area`

IDs and text:

- `#username-login`, `type="text"`, `placeholder="Username"`
- `#password-login`, `type="password"`, `placeholder="Password"`
- `#login-button`, text `Login`
- `Create an account` link targeting `/register`

Flow:

- Submission calls `POST /api/login`.
- Success navigates to `/account` through React Router.
- Errors remain on the page and display feedback.

## Register

UI contract:

- `title`: `Register`
- CSS global: `/static/assets/css/style.css`
- `header > h1`: `Register`
- `header .header-right > a`: `Back`, targeting `/`
- `main > div.container`
- `section#register-area`
- `form#register-form`

IDs and validation:

- `#username-email`
  - `type="text"`
  - `name="username"`
  - `placeholder="Username"`
  - `autocomplete="username"`
  - `required`
  - `pattern="^[a-z0-9](?:[a-z0-9._-]{1,30}[a-z0-9])?$"`
  - `minlength="1"`
  - `maxlength="32"`
- `#password-register`
  - `type="password"`
  - `name="password"`
  - `placeholder="Password"`
  - `autocomplete="new-password"`
  - `required`
  - `pattern="^(?=.*[A-Za-z])(?=.*\d)[\x21-\x7E]{8,64}$"`
  - `minlength="8"`
  - `maxlength="64"`
- `#register-button`, text `Register`
- `#register-feedback`, `aria-live="polite"`

Flow:

- Submission calls `POST /api/register` exactly once.
- `username` is normalized and `password` preserves the entered value.
- `409`: `User already exists.`
- `400`: `Username or password is invalid.`
- Other errors: `data.error || 'Unable to create your account.'`
- Success: `Registration complete! Redirecting...`
- The visual delay remains 600 ms.
- Navigation to `/account` uses React Router.

## Account

UI contract:

- `title`: `Account`
- CSS global: `/static/assets/css/style.css`
- `header > h1`: `Account`
- `#logout-button`, text `Logout`
- Navigation items: `Inventory`, `Market`, `Settings`

Flow:

- The page can render its shell without authentication.
- Logout calls `DELETE /api/logout`.
- When complete, React Router navigates to `/` without reloading the document.

## Preserved global CSS

The global CSS is stored in `src/public/assets/css/style.css`. The React markup
preserves the `header`, `header h1`, `.header-right`, `div.container`,
`div.container input`, `div.container button`, `section`, `nav ul`, and
`nav ul li` selectors.
