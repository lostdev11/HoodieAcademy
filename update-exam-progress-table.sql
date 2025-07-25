-- Update exam_progress table to add submitted_for_approval_at column and update status enum
ALTER TABLE exam_progress 
ADD COLUMN IF NOT EXISTS submitted_for_approval_at TIMESTAMP WITH TIME ZONE;

-- Update the status check constraint to include 'submitted'
ALTER TABLE exam_progress 
DROP CONSTRAINT IF EXISTS exam_progress_status_check;

ALTER TABLE exam_progress 
ADD CONSTRAINT exam_progress_status_check 
CHECK (status IN ('not_started', 'started', 'in_progress', 'completed', 'failed', 'submitted'));

-- Create index for the new column
CREATE INDEX IF NOT EXISTS idx_exam_progress_submitted_at ON exam_progress(submitted_for_approval_at); 