<a id="registration-security"></a>
### Security

<a id="reg-sec-001"></a>
#### REG-SEC-001: SQL injection safeguards (username)
Source: API-REG-006
Conditions:
- Usernames like "' OR 1=1 --" result in 400 due to validation.

<a id="reg-sec-002"></a>
#### REG-SEC-002: SQL injection safeguards (password)
Source: API-REG-006
Conditions:
- Password inputs intended as SQL injection are allowed if they pass validation and do not compromise the query.

<a id="reg-sec-003"></a>
#### REG-SEC-003: XSS safety in feedback rendering
Source: FE-SH-001
Conditions:
- Messages that contain HTML remain text-only and do not execute.

<a id="reg-sec-004"></a>
#### REG-SEC-004: sensitive data exposure
Source: Added
Conditions:
- API responses never return passwordHash or passwordSalt.
- Server logs do not contain the raw password.

