-- Allow legacy 6-character team abbreviations.
ALTER TABLE "teams" ALTER COLUMN "abbreviation" SET DATA TYPE varchar(6);
