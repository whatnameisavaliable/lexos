-- M0-B B1: extensions (database.md §7.3.1; audit hash chain needs pgcrypto)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
