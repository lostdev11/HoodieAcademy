-- Add first_name and last_name columns to preview_submissions if they are missing
ALTER TABLE preview_submissions
  ADD COLUMN IF NOT EXISTS first_name TEXT;

ALTER TABLE preview_submissions
  ADD COLUMN IF NOT EXISTS last_name TEXT;


