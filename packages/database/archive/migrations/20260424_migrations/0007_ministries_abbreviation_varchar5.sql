-- Align with API and team abbreviation policy: activity displayId uses ministry prefix + id suffix.
ALTER TABLE "ministries" ALTER COLUMN "abbreviation" SET DATA TYPE varchar(5);
