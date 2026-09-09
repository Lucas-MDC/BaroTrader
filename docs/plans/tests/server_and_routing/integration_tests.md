<a id="server-integration"></a>
### Integration

<a id="srv-int-001"></a>
#### SRV-INT-001: root entrypoint
Source: Added
Conditions:
- GET / returns the SPA shell with status 200.
- The response body includes the React root element.

<a id="srv-int-002"></a>
#### SRV-INT-002: shared static assets
Source: Added
Conditions:
- GET /static/assets/css/style.css returns 200.

<a id="srv-int-003"></a>
#### SRV-INT-003: SPA bundle and public entry points
Source: Added
Conditions:
- GET /spa/app.js returns the compiled SPA bundle.
- The build directory is not exposed through express.static.
- GET / and GET /register return the SPA shell.

<a id="srv-int-004"></a>
#### SRV-INT-004: account SPA entrypoint
Source: Added
Conditions:
- GET /account returns the SPA shell without page-level authentication.

<a id="srv-int-005"></a>
#### SRV-INT-005: API router mount
Source: Added
Conditions:
- POST /api/register reaches the register router.
- Unsupported API paths under /api return 404.

<a id="srv-int-006"></a>
#### SRV-INT-006: 404 handler
Source: Added
Conditions:
- Unknown routes return status 404 with "Page not found".

<a id="srv-int-007"></a>
#### SRV-INT-007: error handler
Source: Added
Conditions:
- Errors thrown from a route return status 500 with "Internal server error".

<a id="srv-int-008"></a>
#### SRV-INT-008: body parsing middleware
Source: Added
Conditions:
- application/json requests populate req.body.
- application/x-www-form-urlencoded requests populate req.body.

<a id="srv-int-009"></a>
#### SRV-INT-009: server startup
Source: Added
Conditions:
- The server listens on port 3000.
- Startup logs include the listening port message.

