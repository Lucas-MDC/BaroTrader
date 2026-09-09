<a id="server-security"></a>
### Security

<a id="srv-sec-001"></a>
#### SRV-SEC-001: path traversal protection
Source: Added
Conditions:
- Requests with ../ segments do not escape the static directories.
- Responses do not expose filesystem contents outside allowed roots.

<a id="srv-sec-002"></a>
#### SRV-SEC-002: sensitive file access
Source: Added
Conditions:
- Requests for /.env or /config are not served from static routes.

<a id="srv-sec-003"></a>
#### SRV-SEC-003: directory listing
Source: Added
Conditions:
- Static directories do not return directory listings.

