-- Shorten team abbreviation to match API and activity displayId prefix policy (max 5 chars).
ALTER TABLE "teams" ALTER COLUMN "abbreviation" SET DATA TYPE varchar(5);
