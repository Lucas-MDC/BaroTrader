<a id="login-performance"></a>
### Performance and Resilience

<a id="login-perf-001"></a>
#### LOGIN-PERF-001: minimum response deadline
Source: Added
Conditions:
- Successful, invalid, unknown-user, and dependency-error attempts respect loginResponseDeadlineMs.
- The response is not sent before the configured deadline.

<a id="login-perf-002"></a>
#### LOGIN-PERF-002: concurrent login attempts
Source: Added
Conditions:
- Concurrent authentication attempts complete independently.
- A successful attempt does not change the result of another invalid attempt.
- No session is issued for a failed attempt.

<a id="login-perf-003"></a>
#### LOGIN-PERF-003: password verification resilience
Source: Added
Conditions:
- Malformed stored hashes and salts produce a controlled authentication failure or propagated service error according to the error contract.
- Verification does not crash the process or expose password data.
