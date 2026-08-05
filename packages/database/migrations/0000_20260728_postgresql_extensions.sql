-- PostgreSQL extensions setup: Drizzle cannot express in schema.

-- Required when public was dropped (e.g. DROP SCHEMA public CASCADE) without recreating it.
CREATE SCHEMA IF NOT EXISTS public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

CREATE EXTENSION IF NOT EXISTS pg_trgm;
