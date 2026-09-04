<a id="data-access-integration"></a>
### Integration

<a id="dal-int-001"></a>
#### DAL-INT-001: createUser inserts a row
Source: Added
Conditions:
- createUser inserts username, passwordHash, and passwordSalt.
- The returned object includes id and createdAt.

<a id="dal-int-002"></a>
#### DAL-INT-002: findByUsername and findById
Source: Added
Conditions:
- findByUsername returns the inserted user.
- findById returns the same user by id.

<a id="dal-int-003"></a>
#### DAL-INT-003: username uniqueness
Source: Added
Conditions:
- Inserting the same username twice fails due to the unique constraint.

<a id="dal-int-004"></a>
#### DAL-INT-004: password_salt requirement
Source: Added
Conditions:
- Inserting without password_salt fails due to NOT NULL constraint.

<a id="dal-int-005"></a>
#### DAL-INT-005: created_at default
Source: Added
Conditions:
- created_at is set by the database when not explicitly provided.

