<a id="data-access-unit"></a>
### Unit

<a id="dal-unit-001"></a>
#### DAL-UNIT-001: createUserModel requires db client
Source: Added
Conditions:
- Missing db throws an error.
- Missing query or execute functions throws an error.

<a id="dal-unit-002"></a>
#### DAL-UNIT-002: mapUser behavior
Source: Added
Conditions:
- Null/undefined rows return null.
- Row fields map to id, username, passwordHash, passwordSalt, createdAt.

<a id="dal-unit-003"></a>
#### DAL-UNIT-003: createUser input validation
Source: Added
Conditions:
- Missing username throws.
- Missing passwordHash throws.
- Missing passwordSalt throws.

<a id="dal-unit-004"></a>
#### DAL-UNIT-004: findByUsername null input
Source: Added
Conditions:
- Falsy usernames return null without querying.

<a id="dal-unit-005"></a>
#### DAL-UNIT-005: findById null input
Source: Added
Conditions:
- Falsy ids return null without querying.

<a id="dal-unit-006"></a>
#### DAL-UNIT-006: getUserModel caching
Source: Added
Conditions:
- The user model instance is cached after the first call.
- Subsequent calls return the same instance.

<a id="dal-unit-007"></a>
#### DAL-UNIT-007: closeUserModel behavior
Source: Added
Conditions:
- db.close is invoked.
- Cached model is cleared.

<a id="dal-unit-008"></a>
#### DAL-UNIT-008: runtime pool wrapper
Source: Added
Conditions:
- query delegates to conn.any.
- execute delegates to conn.result.
- close ends the pool when available.

<a id="dal-unit-009"></a>
#### DAL-UNIT-009: ensureTable deprecated
Source: Added
Conditions:
- ensureTable throws a deprecation error directing to migrations.

