<a id="registration-unit"></a>
### Unit

Implemented suites:
- [registerClient.test.js](../../../../tests/unity/register/registerClient.test.js)
- [registerUtils.test.js](../../../../tests/unity/register/registerUtils.test.js)
- [registerService.test.js](../../../../tests/unity/register/registerService.test.js)
- [passwordService.test.js](../../../../tests/unity/register/passwordService.test.js)

<a id="reg-unit-003"></a>
#### ✅ REG-UNIT-003: missing bindings (client-side)
Source: FE-REG-009
Conditions:
- Missing #register-form does not crash the script.
- Missing username/password inputs prevent submission and show "Registration form is unavailable."

<a id="reg-unit-004"></a>
#### ✅ REG-UNIT-004: registration validation patterns and safe feedback
Source: FE-SH-001
Conditions:
- Username and password patterns match the current React form constraints.
- Server feedback that contains HTML remains text-only when rendered by the component.
- Feedback remains safe without restoring the deprecated standalone showMessage DOM API.

<a id="reg-unit-005"></a>
#### ✅ REG-UNIT-005: getCredentialsFromInputs
Source: FE-SH-002
Conditions:
- Valid inputs return a trimmed username and the raw password.
- Usernames with whitespace are trimmed.
- Passwords keep leading/trailing whitespace (raw).
- Undefined/null inputs return empty strings.
- Non-string values for username (numbers, objects) do not crash and result in an empty username.

<a id="reg-unit-007"></a>
#### ✅ REG-UNIT-007: register service normalization and validation
Source: REG-SVC-001
Conditions:
- Username is trimmed before validation.
- Password is trimmed before validation.
- Non-string username/password inputs are treated as invalid.
- Minimum and maximum length limits are enforced.
- Regex patterns are applied correctly to both fields.

<a id="reg-unit-008"></a>
#### ✅ REG-UNIT-008: register service duplicate prevention
Source: REG-SVC-002
Conditions:
- findByUsername returning a user throws RegistrationError 409.
- createUser is not invoked when a duplicate exists.

<a id="reg-unit-009"></a>
#### ✅ REG-UNIT-009: register service hashing and persistence
Source: REG-SVC-003
Conditions:
- createPasswordSalt is called.
- hashPassword receives the trimmed password and the generated salt.
- createUser is invoked with { username, passwordHash, passwordSalt }.

<a id="reg-unit-010"></a>
#### ✅ REG-UNIT-010: register service error propagation
Source: REG-SVC-004
Conditions:
- Errors from findByUsername bubble up.
- Errors from hashPassword bubble up.
- Unique constraint errors from createUser become RegistrationError 409; other errors bubble up.
- The finally block always enforces the minimum delay even on errors.

<a id="reg-unit-011"></a>
#### ✅ REG-UNIT-011: register service minimum delay
Source: REG-SVC-005
Conditions:
- The response is never sent before registerMinDelayMs elapses.
- Errors (validation or duplicates) still respect the delay.
- A zero registerMinDelayMs leads to no extra wait.

<a id="reg-unit-012"></a>
#### ✅ REG-UNIT-012: RegistrationError shape
Source: Added
Conditions:
- name is "RegistrationError".
- statusCode defaults to 400 when omitted.
- message is preserved as provided.

<a id="reg-unit-013"></a>
#### ✅ REG-UNIT-013: createPasswordSalt
Source: PWD-SVC-001
Conditions:
- Calling without arguments returns a hex string of 32 characters (16 bytes).
- Passing a byte count returns a hex string twice as long.
- Subsequent calls produce different salts.
- Invalid byte counts (negative, NaN) propagate crypto errors.

<a id="reg-unit-014"></a>
#### ✅ REG-UNIT-014: hashPassword validation
Source: PWD-SVC-002
Conditions:
- Empty or whitespace-only passwords throw.
- Missing or non-string salt throws.
- Missing HASH_PEPPER causes an error.

<a id="reg-unit-016"></a>
#### ✅ REG-UNIT-016: scrypt error handling
Source: PWD-SVC-004
Conditions:
- Errors from crypto.scrypt are propagated to the caller.

<a id="reg-unit-017"></a>
#### ✅ REG-UNIT-017: hashPassword output format
Source: Added
Conditions:
- Returns a hex string length of 128 characters (64 bytes).
- Output does not include the raw password.
- Different peppers yield different hashes.
