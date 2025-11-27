# BaroTrader

BaroTrader application with Express.js and PostgreSQL database.

## Prerequisites

- Node.js (v18+)
- PostgreSQL (v14+) or Docker with PostgreSQL container

## Installation

```bash
npm install
```

## Configuration

Copy the `.env.example` file to `.env` and configure the database connection:

```bash
cp .env.example .env
```

Edit the `.env` file with your PostgreSQL credentials.

## Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start the application |
| `npm run dev` | Start the application in development mode with hot reload |
| `npm run lint` | Run ESLint to check code quality |
| `npm run lint:fix` | Run ESLint and fix auto-fixable issues |
| `npm run db:setup` | Run the PostgreSQL database setup script |
| `npm run db:cleanup` | Clean up (drop) the database, user and roles |
| `npm run db:test` | Test database read/write operations |
| `npm run db:test-sqlite` | Test SQLite database operations |

## Database Setup

The project includes scripts to set up and test database connectivity.

### PostgreSQL Setup

1. Ensure PostgreSQL is running
2. Configure the `.env` file with your credentials
3. Run the database setup script:

```bash
npm run db:setup
```

This script will:
- Create the application user and role
- Create the application database
- Set up permissions
- Create the initial schema (users table)
- Test read/write operations

### SQLite (for development)

For quick local testing without PostgreSQL, you can use SQLite:

```bash
npm run db:test-sqlite
```

## Project Structure

```
src/
├── index.js              # Express server entry point
├── routes/               # Route handlers
├── public/               # Static files (CSS, JS, HTML)
├── sql/                  # SQL scripts for database operations
└── utils/
    ├── database_postgresql.js  # PostgreSQL setup and operations
    ├── database_sqlite.js      # SQLite setup and operations
    ├── database_utils.js       # Shared database utilities
    └── databaseWrappers/       # Database abstraction layers
        ├── postgresql_wrapper.js
        └── sqlite_wrapper.js
```

## License

ISC
