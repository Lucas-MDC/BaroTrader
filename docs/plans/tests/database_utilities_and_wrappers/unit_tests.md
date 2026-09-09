<a id="db-utils-unit"></a>
### Unit

<a id="dbu-unit-001"></a>
#### DBU-UNIT-001: loadSql caching
Source: Added
Conditions:
- First call reads the SQL file.
- Subsequent calls return the cached value.

<a id="dbu-unit-002"></a>
#### DBU-UNIT-002: loadSql missing file
Source: Added
Conditions:
- Missing SQL files throw an error.

<a id="dbu-unit-003"></a>
#### DBU-UNIT-003: sleep behavior
Source: Added
Conditions:
- sleep resolves after at least the requested delay.

<a id="dbu-unit-004"></a>
#### DBU-UNIT-004: connectWithRetries success path
Source: Added
Conditions:
- dbDriver is invoked until it succeeds.
- Successful connection is returned.

<a id="dbu-unit-005"></a>
#### DBU-UNIT-005: connectWithRetries failure path
Source: Added
Conditions:
- After the final retry, the error is thrown.
- Retry delays follow exponential backoff.

<a id="dbu-unit-006"></a>
#### DBU-UNIT-006: PostgreSQL wrapper config validation
Source: Added
Conditions:
- Missing dbConfig throws an error.
- Missing required keys (host, port, database, user, password) throw.

<a id="dbu-unit-007"></a>
#### DBU-UNIT-007: PostgreSQL wrapper query execution
Source: Added
Conditions:
- execute returns the pg-promise result object.
- query returns rows.
- Errors are wrapped with helpful messages.

<a id="dbu-unit-008"></a>
#### DBU-UNIT-008: PostgreSQL wrapper close
Source: Added
Conditions:
- close ends the pool when available.
- close does not throw on shutdown.

