CREATE TABLE "team_tags" (
	"tag_id" integer NOT NULL,
	"team_id" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "team_tags_tag_id_team_id_pk" PRIMARY KEY("tag_id","team_id")
);
--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "abbreviation" varchar(10) NOT NULL;--> statement-breakpoint
ALTER TABLE "team_tags" ADD CONSTRAINT "team_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_tags" ADD CONSTRAINT "team_tags_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;