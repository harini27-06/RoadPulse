-- Add complaint_number as auto-increment if it doesn't exist yet
ALTER TABLE "complaints" ADD COLUMN IF NOT EXISTS "complaint_number" SERIAL;
