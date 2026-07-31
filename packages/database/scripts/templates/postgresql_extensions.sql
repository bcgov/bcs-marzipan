-- PostgreSQL instance setup: extensions and other DDL that Drizzle cannot express in schema.
-- Keep this migration first so later migrations can depend on installed extensions (e.g. pg_trgm for GIN indexes).
-- Safe to append additional CREATE EXTENSION or similar setup statements here.

-- Required when public was dropped (e.g. DROP SCHEMA public CASCADE) without recreating it.
CREATE SCHEMA IF NOT EXISTS public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

CREATE EXTENSION IF NOT EXISTS pg_trgm;
