CREATE TABLE "edit_locks" (
	"id" serial PRIMARY KEY NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"username" varchar(100) NOT NULL,
	"session_id" varchar(100),
	"acquired_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"last_renewed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "edit_locks" ADD CONSTRAINT "edit_locks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "edit_locks_entity_type_entity_id_unique" ON "edit_locks" USING btree ("entity_type","entity_id");
--> statement-breakpoint
CREATE INDEX "edit_locks_expires_at_idx" ON "edit_locks" USING btree ("expires_at");
--> statement-breakpoint
CREATE INDEX "edit_locks_user_id_idx" ON "edit_locks" USING btree ("user_id");
