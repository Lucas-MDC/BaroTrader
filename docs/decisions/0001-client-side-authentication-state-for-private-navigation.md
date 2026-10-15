# Client-Side Authentication State for Private Navigation

* Status: accepted
* Deciders: BaroTrader maintainers
* Date: 2026-10-13

## Context and Problem Statement

The front end needs to know whether a user is authenticated before allowing
navigation to private pages. The session JWT is stored in an `HttpOnly` cookie,
so browser JavaScript cannot inspect its expiration claim. The server can read
the cookie and validate the token, including whether the session remains
valid.

[Issue #40](https://github.com/Lucas-MDC/BaroTrader/issues/40) describes the
navigation problem and three ways to determine whether the user is logged in.
The current front end does not yet guard the Account route or check the session
when that route is opened. The `requireApiAuth` middleware can reject an
invalid or missing JWT with HTTP 401, but no current route uses it to protect a
private API endpoint.

The current session implementation is stateless: logout clears the browser's
cookie, but the server does not record a destroyed or revoked session. A copied
JWT can therefore remain valid until it expires, as long as its user still
exists. The server cannot yet enforce the issue's full definition of a valid
token as one whose session has not been destroyed.

The server-side check in Option 1 can produce additional requests. Repeated
requests with invalid authentication context could also consume server
resources. The project currently has no dedicated mechanism in the
authentication request path to detect or mitigate a high volume of such
requests. That protection was assumed in the original choice, but it has not
been implemented. A front-end expiration check can reduce requests caused by
ordinary navigation through the application, but it cannot detect or prevent
direct or hostile requests to the API.

## Decision Drivers

* Keep the main authentication token inaccessible to browser JavaScript.
* Keep the server authoritative for token validity, session state, and access
  to protected data.
* Redirect unauthenticated users to the login page when they try to access a
  private page.
* Avoid routine private API requests when an ordinary user has no session or
  the session expiration time has passed.
* Distinguish front-end request suppression from server-side abuse detection.

## Considered Options

* Option 1: Check the Session on the Server — The front end asks the server to
  authenticate the session before entering a private page. If the server
  rejects the session, the front end redirects to the login page. The main
  token stays in the `HttpOnly` cookie. This approach may generate extra
  requests, including requests that only determine whether the session is
  still valid.

* Option 2A: Store a Client-Readable Expiration Copy — Keep the main
  authentication token in its `HttpOnly` cookie and store only a copy of its
  expiration time in a separate, JavaScript-readable value, such as a parallel
  cookie. Before navigating to a private page or making its API request, the
  front end checks whether that time is present and still in the future. If the
  value is missing or expired, it redirects to login without sending the
  private request. This is a local time check only: the front end does not
  validate the authenticity of the auxiliary value, and that value does not
  attest to the authenticity of the main token. It is not a credential and
  must never authorize access. It can reduce avoidable requests
  from ordinary navigation, but it does not stop a client from calling the API
  directly or prevent hostile requests. It also cannot reveal that the server
  revoked a session before the copied expiration time. The value should be
  cleared on logout and when the server rejects the main token.
* Option 2B: Make the Main Token Readable by the Front End — Remove the
  `HttpOnly` attribute from the main token cookie so the front end can read its
  expiration claim directly. This exposes the authentication token to
  JavaScript running in the page. A cross-site scripting (XSS) vulnerability
  could then allow an attacker to read and reuse the session token.

## Decision Outcome

Chosen option: "Option 1: Check the Session on the Server", because the server
remains the source of truth for whether a token and its session are valid,
while the main authentication token remains protected by `HttpOnly`.

The intended navigation flow is to check the session with the server before
rendering private content, redirect to the login page when the check fails, and
continue validating every protected API request on the server. A successful
front-end check is not authorization and must not bypass server-side checks.
To meet the full validity definition in issue #40, the server-side
authentication design also needs a way to invalidate a session before its JWT
expires. The current cookie-clearing logout does not provide that capability.

This decision was made with the assumption that the project would detect or
mitigate repeated requests carrying invalid authentication context. That
server-side mechanism is not implemented today, so this is an unresolved
operational risk, not a completed safeguard. Option 2A addresses a different,
narrower case: it can suppress requests caused by ordinary users navigating
the front end when no session marker exists or its expiration time has passed.
If that routine request volume becomes undesirable, Option 2A can be selected
without validating the auxiliary value's authenticity. If direct or hostile
requests are the concern, Option 2A is not a substitute for server-side
detection or mitigation. The main token must continue to be validated by the
server for every protected API request.

### Consequences

* Good, because the main session token stays `HttpOnly` and is not exposed to
  page scripts.
* Good, because token expiry and server-side session destruction are checked
  by the server, rather than inferred only from a client-readable expiration
  value.
* Bad, because session checks can add server requests before private
  navigation.
* Bad, because until invalid-context detection or mitigation is implemented,
  repeated invalid requests may consume server resources without being
  detected by a dedicated control.
* Bad, because the current stateless logout does not revoke a copied JWT before
  its expiration time.
* Neutral, because the current front end still needs a route guard and a
  server-backed session check, and the API needs protected routes, to implement
  this decision.

## Pros and Cons of the Options

### Option 1: Check the Session on the Server

* Good, because the server validates token authenticity and current session
  state.
* Good, because the main token remains inaccessible to browser JavaScript.
* Bad, because a session check can add a request before private navigation.
* Bad, because repeated invalid-context requests need a separate detection or
  mitigation control.

### Option 2A: Store a Client-Readable Expiration Copy

* Good, because the front end can redirect ordinary users with no session
  marker or an expired marker before sending a private API request.
* Good, because only the expiration time is readable by JavaScript; the main
  authentication token remains `HttpOnly`.
* Bad, because the expiration copy does not prove that the main token is
  authentic or that its session has not been destroyed. A stale but
  unexpired marker may allow navigation until the server rejects the main
  token.
* Bad, because a hostile client can bypass or alter the front-end check and
  call the API directly. The server still needs its own abuse controls.
* Bad, because the auxiliary value must be kept in sync with login, logout,
  and the main token's expiration time.

### Option 2B: Make the Main Token Readable by the Front End

* Good, because the front end can inspect the token's expiration claim without
  an additional session check.
* Bad, because removing `HttpOnly` exposes the authentication token to XSS.

## More Information

* [Issue #40: Login frontend](https://github.com/Lucas-MDC/BaroTrader/issues/40)
* [Current route configuration](../../src/frontend/App.jsx)
* [Current Account page](../../src/frontend/pages/Account.jsx)
* [API authentication middleware](../../src/auth/authMiddleware.js)
* [Current stateless session implementation](../../src/services/session/sessionService.js)
