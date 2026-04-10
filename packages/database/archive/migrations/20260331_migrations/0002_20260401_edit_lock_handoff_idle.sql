-- Edit lock: pending admin handoff, idle expiry, application settings

-- Global key-value settings (e.g. edit lock idle timeout)
CREATE TABLE IF NOT EXISTS application_settings (
  key varchar(100) PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO application_settings (key, value)
VALUES ('edit_lock_idle_timeout_minutes', '30')
ON CONFLICT (key) DO NOTHING;

-- Pending lock handoff: admin requests taking the lock; grace period before transfer
CREATE TABLE IF NOT EXISTS edit_lock_pending_handoffs (
  id serial PRIMARY KEY,
  activity_id integer NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  from_user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  grace_ends_at timestamptz NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT edit_lock_pending_handoffs_status_check CHECK (
    status IN ('pending', 'processing', 'completed', 'cancelled')
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS edit_lock_pending_handoffs_one_pending_per_activity
  ON edit_lock_pending_handoffs (activity_id)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS edit_lock_pending_handoffs_due_idx
  ON edit_lock_pending_handoffs (grace_ends_at)
  WHERE status = 'pending';

-- Idle session tracking on edit locks
ALTER TABLE edit_locks
  ADD COLUMN IF NOT EXISTS last_activity_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE edit_locks
  ADD COLUMN IF NOT EXISTS idle_expires_at timestamptz;

-- Backfill idle_expires_at for existing rows (30 min from last_renewed or now)
UPDATE edit_locks
SET idle_expires_at = COALESCE(last_renewed_at, acquired_at, now()) + interval '30 minutes'
WHERE idle_expires_at IS NULL;

ALTER TABLE edit_locks
  ALTER COLUMN idle_expires_at SET NOT NULL;

ALTER TABLE edit_locks
  ALTER COLUMN idle_expires_at SET DEFAULT (now() + interval '30 minutes');

CREATE INDEX IF NOT EXISTS edit_locks_idle_expires_at_idx ON edit_locks (idle_expires_at);
