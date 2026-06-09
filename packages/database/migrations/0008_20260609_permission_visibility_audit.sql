-- Create audit table for permission visibility changes
CREATE TABLE IF NOT EXISTS public.permission_visibility_audit (
  id serial PRIMARY KEY,
  permission_id integer NOT NULL REFERENCES public.permissions(id),
  changed_by integer NULL REFERENCES public.users(id),
  old_value boolean NOT NULL,
  new_value boolean NOT NULL,
  note text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS permission_visibility_audit_permission_id_idx
  ON public.permission_visibility_audit(permission_id);
