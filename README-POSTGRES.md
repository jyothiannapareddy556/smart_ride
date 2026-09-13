# RideBack PostgreSQL migration

The backend has been migrated from `mysql2` to PostgreSQL using `pg`, while keeping the existing API paths used by the React frontend.

## Setup

```bash
sudo -u postgres psql
```

Then create the database:

```sql
CREATE DATABASE rideback;
\q
```

Copy `.env.example` to `.env` and set your PostgreSQL password plus your existing application secrets. Then run:

```bash
npm install
psql -U postgres -d rideback -f database/schema.sql
psql -U postgres -d rideback -f database/seed.sql
npm run dev
```

The React frontend does not need API path changes.

## PostgreSQL changes

- `mysql2` removed; `pg` added.
- `?` placeholders converted to `$1`, `$2`, etc.
- MySQL result destructuring converted to PostgreSQL `result.rows` / `result.rowCount`.
- Generated IDs use `RETURNING id`.
- `NOW()` converted to `CURRENT_TIMESTAMP`.
- MySQL ENUMs/AUTO_INCREMENT converted to PostgreSQL-compatible identity columns and CHECK constraints.
- Rider accept/complete operations use PostgreSQL transactions with `BEGIN`, `COMMIT`, `ROLLBACK`, and connection release.
- The current RideBack application uses `bookings` as the ride-request table. The supplied MySQL dump has no populated `rides` table.
