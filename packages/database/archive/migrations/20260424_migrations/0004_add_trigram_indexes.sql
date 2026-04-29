-- Enable pg_trgm extension for trigram-based ILIKE searches.
-- This cannot be expressed in Drizzle schema; it must run once per database.
-- All trigram GIN index definitions have been moved into the Drizzle schema files.

CREATE EXTENSION IF NOT EXISTS pg_trgm;
