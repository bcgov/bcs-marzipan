-- Migration: Create activity_history table
-- Generated: 2026-02-02

-- Migration: Create activity_history table (idempotent)
-- Generated: 2026-02-02

-- Create table only if it doesn't exist. If it already exists, ensure required
-- columns and constraints are present using conditional checks below.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'activity_history'
  ) THEN
    CREATE TABLE public.activity_history (
      id serial PRIMARY KEY NOT NULL,
      activity_id integer NOT NULL,
      user_id integer NOT NULL,
      changed_at timestamp with time zone DEFAULT now() NOT NULL,
      changes jsonb NOT NULL,
      notes text
    );
  END IF;

  -- Ensure columns exist (add if missing)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'activity_history' AND column_name = 'changed_at'
  ) THEN
    ALTER TABLE public.activity_history
      ADD COLUMN changed_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'activity_history' AND column_name = 'changes'
  ) THEN
    ALTER TABLE public.activity_history
      ADD COLUMN changes jsonb NOT NULL DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'activity_history' AND column_name = 'notes'
  ) THEN
    ALTER TABLE public.activity_history
      ADD COLUMN notes text;
  END IF;

  -- Add foreign key constraint if missing
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'activity_history_activity_fk'
  ) THEN
    EXECUTE 'ALTER TABLE public.activity_history ADD CONSTRAINT activity_history_activity_fk FOREIGN KEY (activity_id) REFERENCES public.activities(id) ON DELETE CASCADE';
  END IF;
END$$;

-- Indexes to speed lookups by activity and time. CREATE INDEX IF NOT EXISTS is supported
CREATE INDEX IF NOT EXISTS activity_history_activity_id_idx ON public.activity_history (activity_id);
CREATE INDEX IF NOT EXISTS activity_history_changed_at_idx ON public.activity_history (changed_at);
