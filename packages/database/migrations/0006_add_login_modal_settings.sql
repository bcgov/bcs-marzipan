CREATE TABLE IF NOT EXISTS "login_modal_settings" (
  "id" serial PRIMARY KEY,
  "is_active" boolean NOT NULL DEFAULT false,
  "title" varchar(200) NOT NULL DEFAULT 'Notice',
  "content" text NOT NULL,
  "start_date_time" timestamptz,
  "end_date_time" timestamptz,
  "created_date_time" timestamptz NOT NULL DEFAULT now(),
  "created_by" integer NOT NULL REFERENCES "users"("id"),
  "last_updated_date_time" timestamptz NOT NULL DEFAULT now(),
  "last_updated_by" integer NOT NULL REFERENCES "users"("id")
);
