-- Add sort_order column to courses table if it doesn't exist
ALTER TABLE courses ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Update existing courses with default sort_order values
UPDATE courses SET sort_order = 0 WHERE sort_order IS NULL;

-- Set sort_order based on created_at for existing courses
UPDATE courses 
SET sort_order = EXTRACT(EPOCH FROM (created_at - '1970-01-01'::timestamp))::integer 
WHERE sort_order = 0;

-- Make sort_order NOT NULL
ALTER TABLE courses ALTER COLUMN sort_order SET NOT NULL;
ALTER TABLE courses ALTER COLUMN sort_order SET DEFAULT 0;
