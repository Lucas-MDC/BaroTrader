<a id="server-resilience"></a>
### Resilience

<a id="srv-res-001"></a>
#### SRV-RES-001: headersSent behavior
Source: Added
Conditions:
- If a middleware sends a response and throws after, the error handler calls next(err).

