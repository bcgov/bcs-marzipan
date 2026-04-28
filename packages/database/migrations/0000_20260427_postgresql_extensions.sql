-- PostgreSQL instance setup: extensions and other DDL that Drizzle cannot express in schema.
-- Keep this migration first so later migrations can depend on installed extensions (e.g. pg_trgm for GIN indexes).
-- Safe to append additional CREATE EXTENSION or similar setup statements here.

CREATE EXTENSION IF NOT EXISTS pg_trgm;
