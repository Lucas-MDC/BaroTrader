REVOKE {{baseRole}} FROM {{runtimeUser}};
DROP OWNED BY {{baseRole}};
DROP ROLE IF EXISTS {{baseRole}};
