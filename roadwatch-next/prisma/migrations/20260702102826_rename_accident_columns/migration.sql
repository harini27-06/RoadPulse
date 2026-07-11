ALTER TABLE "accidents" RENAME COLUMN "total_accidents" TO "total_accidents_temp";
ALTER TABLE "accidents" RENAME COLUMN "total_deaths" TO "total_accidents";
ALTER TABLE "accidents" RENAME COLUMN "total_accidents_temp" TO "total_deaths";
