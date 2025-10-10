-- Add missing columns to bounty_submissions table for image support

-- Add image_url column
ALTER TABLE bounty_submissions 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add title column
ALTER TABLE bounty_submissions 
ADD COLUMN IF NOT EXISTS title TEXT;

-- Add description column
ALTER TABLE bounty_submissions 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add squad column
ALTER TABLE bounty_submissions 
ADD COLUMN IF NOT EXISTS squad VARCHAR(50);

-- Add course_ref column
ALTER TABLE bounty_submissions 
ADD COLUMN IF NOT EXISTS course_ref TEXT;

-- Update submission_type to include 'both' option
ALTER TABLE bounty_submissions 
DROP CONSTRAINT IF EXISTS bounty_submissions_submission_type_check;

ALTER TABLE bounty_submissions 
ADD CONSTRAINT bounty_submissions_submission_type_check 
CHECK (submission_type IN ('text', 'link', 'image', 'file', 'both'));

-- Create index for image_url for faster lookups
CREATE INDEX IF NOT EXISTS idx_bounty_submissions_image_url 
ON bounty_submissions(image_url) 
WHERE image_url IS NOT NULL;

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'bounty_submissions'
ORDER BY ordinal_position;

