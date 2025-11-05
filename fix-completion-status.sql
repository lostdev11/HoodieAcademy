-- Fix Completion Status: Make "approved" = 100% instead of 60%
-- This assumes "approved" means the work is completed

-- Update the function to make approved = 100%
CREATE OR REPLACE FUNCTION update_feedback_completion_status()
RETURNS TRIGGER AS $$
BEGIN
  CASE NEW.status
    WHEN 'pending' THEN
      NEW.completion_status := 10;
    WHEN 'reviewing' THEN
      NEW.completion_status := 30;
    WHEN 'approved' THEN
      NEW.completion_status := 100;  -- Changed from 60 to 100
    WHEN 'implemented' THEN
      NEW.completion_status := 100;  -- Keep as 100
    WHEN 'rejected' THEN
      NEW.completion_status := 0;
    ELSE
      NEW.completion_status := 0;
  END CASE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update all existing "approved" records to 100%
UPDATE user_feedback_submissions
SET completion_status = 100
WHERE status = 'approved';

-- Verify the update
SELECT 
  status,
  COUNT(*) as count,
  AVG(completion_status) as avg_completion,
  MIN(completion_status) as min_completion,
  MAX(completion_status) as max_completion
FROM user_feedback_submissions
GROUP BY status
ORDER BY status;

-- Show before/after for approved items
SELECT 
  id,
  title,
  status,
  completion_status
FROM user_feedback_submissions
WHERE status = 'approved'
ORDER BY created_at DESC;

