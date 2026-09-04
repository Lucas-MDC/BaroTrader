<a id="registration-performance"></a>
### Performance and Resilience

<a id="reg-perf-001"></a>
#### REG-PERF-001: concurrency
Source: API-REG-007
Conditions:
- Two simultaneous requests for the same username should yield one 201 and one 409.
- The database remains consistent with no stray inserts.

<a id="reg-perf-002"></a>
#### REG-PERF-002: minimum delay enforcement (integration)
Source: Added
Conditions:
- API responses are not sent before registerMinDelayMs elapses.
- Validation or duplicate errors still respect the delay.

<a id="reg-perf-003"></a>
#### REG-PERF-003: zero delay configuration
Source: Added
Conditions:
- registerMinDelayMs=0 results in no extra wait in responses.

