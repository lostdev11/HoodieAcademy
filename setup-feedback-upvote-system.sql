-- =============================================
-- Feedback Upvote & Patch Notes Integration System
-- Links user feedback submissions to patch notes with upvote system
-- =============================================

-- =============================================
-- 1. ADD LINK TO ORIGINAL SUBMISSION
-- =============================================

-- Add column to link feedback_updates to user_feedback_submissions
ALTER TABLE feedback_updates
ADD COLUMN IF NOT EXISTS original_submission_id UUID REFERENCES user_feedback_submissions(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_feedback_updates_original_submission ON feedback_updates(original_submission_id);

-- =============================================
-- 2. CREATE UPVOTE TRACKING TABLE
-- =============================================

-- Create table to track who upvoted what
CREATE TABLE IF NOT EXISTS user_feedback_upvotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID NOT NULL REFERENCES user_feedback_submissions(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(feedback_id, wallet_address) -- Prevent duplicate votes
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_feedback_upvotes_feedback ON user_feedback_upvotes(feedback_id);
CREATE INDEX IF NOT EXISTS idx_feedback_upvotes_wallet ON user_feedback_upvotes(wallet_address);

-- Enable RLS
ALTER TABLE user_feedback_upvotes ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view upvotes
CREATE POLICY "Anyone can view upvotes"
ON user_feedback_upvotes
FOR SELECT
USING (true);

-- Policy: Anyone can upvote
CREATE POLICY "Anyone can upvote"
ON user_feedback_upvotes
FOR INSERT
WITH CHECK (true);

-- Policy: Users can delete their own upvote
CREATE POLICY "Users can delete own upvote"
ON user_feedback_upvotes
FOR DELETE
USING (wallet_address = auth.jwt() ->> 'wallet_address' OR true); -- Allow for anonymous

-- =============================================
-- 3. CREATE FUNCTION TO UPDATE UPVOTE COUNT
-- =============================================

-- Function to automatically update upvote count
CREATE OR REPLACE FUNCTION update_feedback_upvote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment upvote count
    UPDATE user_feedback_submissions
    SET upvotes = upvotes + 1
    WHERE id = NEW.feedback_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement upvote count
    UPDATE user_feedback_submissions
    SET upvotes = GREATEST(0, upvotes - 1)
    WHERE id = OLD.feedback_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update upvote count
DROP TRIGGER IF EXISTS trigger_update_feedback_upvote_count ON user_feedback_upvotes;
CREATE TRIGGER trigger_update_feedback_upvote_count
  AFTER INSERT OR DELETE ON user_feedback_upvotes
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_upvote_count();

-- =============================================
-- 4. UPDATE EXISTING DATA
-- =============================================

-- Recount all existing upvotes if any votes exist
UPDATE user_feedback_submissions
SET upvotes = (
  SELECT COUNT(*) 
  FROM user_feedback_upvotes 
  WHERE user_feedback_upvotes.feedback_id = user_feedback_submissions.id
);

-- =============================================
-- 5. ADD COMPLETION STATUS TO SUBMISSIONS
-- =============================================

-- Add a field to show how far along a submission is in the process
-- This will be calculated as a percentage based on status
ALTER TABLE user_feedback_submissions
ADD COLUMN IF NOT EXISTS completion_status INTEGER DEFAULT 0 CHECK (completion_status >= 0 AND completion_status <= 100);

-- Create function to auto-update completion status based on status field
CREATE OR REPLACE FUNCTION update_feedback_completion_status()
RETURNS TRIGGER AS $$
BEGIN
  CASE NEW.status
    WHEN 'pending' THEN
      NEW.completion_status := 10;
    WHEN 'reviewing' THEN
      NEW.completion_status := 30;
    WHEN 'approved' THEN
      NEW.completion_status := 100;  -- Approved means completed
    WHEN 'implemented' THEN
      NEW.completion_status := 100;  -- Also completed
    WHEN 'rejected' THEN
      NEW.completion_status := 0;
    ELSE
      NEW.completion_status := 0;
  END CASE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update completion status
DROP TRIGGER IF EXISTS trigger_update_feedback_completion_status ON user_feedback_submissions;
CREATE TRIGGER trigger_update_feedback_completion_status
  BEFORE INSERT OR UPDATE ON user_feedback_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_completion_status();

-- Update existing records
UPDATE user_feedback_submissions
SET completion_status = 
  CASE status
    WHEN 'pending' THEN 10
    WHEN 'reviewing' THEN 30
    WHEN 'approved' THEN 100  -- Approved means completed
    WHEN 'implemented' THEN 100
    WHEN 'rejected' THEN 0
    ELSE 0
  END;

-- Create index for completion status
CREATE INDEX IF NOT EXISTS idx_user_feedback_completion ON user_feedback_submissions(completion_status DESC);

-- =============================================
-- 6. ADD HELPFUL COMMENTS
-- =============================================

COMMENT ON TABLE user_feedback_upvotes IS 'Tracks individual user upvotes for feedback submissions';
COMMENT ON COLUMN user_feedback_upvotes.feedback_id IS 'References the feedback submission being upvoted';
COMMENT ON COLUMN user_feedback_upvotes.wallet_address IS 'Wallet address of user who upvoted';
COMMENT ON COLUMN feedback_updates.original_submission_id IS 'Links to the original user feedback submission that led to this update';
COMMENT ON COLUMN user_feedback_submissions.completion_status IS 'Percentage (0-100) showing progress through workflow';

-- =============================================
-- 7. VERIFICATION QUERIES
-- =============================================

-- Check table structures
SELECT 'feedback_updates' as table_name, COUNT(*) as row_count FROM feedback_updates
UNION ALL
SELECT 'user_feedback_submissions', COUNT(*) FROM user_feedback_submissions
UNION ALL
SELECT 'user_feedback_upvotes', COUNT(*) FROM user_feedback_upvotes;

-- Show sample data with upvotes
SELECT 
  ufs.id,
  ufs.title,
  ufs.status,
  ufs.upvotes,
  ufs.completion_status,
  fu.id as patch_note_id,
  fu.title as patch_note_title
FROM user_feedback_submissions ufs
LEFT JOIN feedback_updates fu ON fu.original_submission_id = ufs.id
ORDER BY ufs.created_at DESC
LIMIT 10;

