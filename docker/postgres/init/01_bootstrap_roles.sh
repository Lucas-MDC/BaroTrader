#!/bin/sh
set -e

get_env() {
    eval "printf '%s' \"\${$1}\""
}

require_env() {
    name="$1"
    value="$(get_env "$name")"
    if [ -z "$value" ]; then
        echo "Missing required env $name." >&2
        exit 1
    fi
    printf '%s' "$value"
}

read_secret() {
    name="$1"
    value="$(get_env "$name")"
    file_path="$(get_env "${name}_FILE")"

    if [ -z "$value" ] && [ -n "$file_path" ]; then
        if [ ! -f "$file_path" ]; then
            echo "Secret file not found: $file_path" >&2
            exit 1
        fi
        value="$(cat "$file_path")"
    fi

    value="$(printf '%s' "$value" | tr -d '\r\n')"
    if [ -z "$value" ]; then
        echo "Missing required env $name or ${name}_FILE." >&2
        exit 1
    fi

    printf '%s' "$value"
}

DB_DBNAME="$(require_env DB_DBNAME)"
DB_USER="$(require_env DB_USER)"
MIGRATION_USER="$(require_env MIGRATION_USER)"
DB_PASS="$(read_secret DB_PASS)"
MIGRATION_PASS="$(read_secret MIGRATION_PASS)"

echo "Bootstrapping BaroTrader roles and database..."

psql -v ON_ERROR_STOP=1 \
    -v runtime_user="$DB_USER" \
    -v runtime_pass="$DB_PASS" \
    -v migrator_user="$MIGRATION_USER" \
    -v migrator_pass="$MIGRATION_PASS" \
    -v app_db="$DB_DBNAME" \
    --username "$POSTGRES_USER" \
    --dbname "$POSTGRES_DB" <<'EOSQL'
SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', :'runtime_user', :'runtime_pass')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'runtime_user') \gexec

SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', :'migrator_user', :'migrator_pass')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'migrator_user') \gexec

SELECT format('ALTER ROLE %I CREATEROLE', :'migrator_user')
WHERE EXISTS (
    SELECT 1
    FROM pg_roles
    WHERE rolname = :'migrator_user' AND NOT rolcreaterole
) \gexec

SELECT format('ALTER DATABASE %I OWNER TO %I', :'app_db', :'migrator_user')
WHERE EXISTS (SELECT 1 FROM pg_database WHERE datname = :'app_db') \gexec

SELECT format('CREATE DATABASE %I OWNER %I', :'app_db', :'migrator_user')
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = :'app_db') \gexec
EOSQL

echo "BaroTrader bootstrap complete."
