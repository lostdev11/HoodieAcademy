-- User Feedback Submissions Table
-- This stores user-submitted feedback, bug reports, and feature requests

CREATE TABLE IF NOT EXISTS user_feedback_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('bug_report', 'feature_request', 'improvement', 'ui_ux', 'performance')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'implemented', 'rejected')),
  wallet_address TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_feedback_status ON user_feedback_submissions(status);
CREATE INDEX IF NOT EXISTS idx_user_feedback_category ON user_feedback_submissions(category);
CREATE INDEX IF NOT EXISTS idx_user_feedback_wallet ON user_feedback_submissions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_feedback_created_at ON user_feedback_submissions(created_at DESC);

-- Auto-update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_feedback_updated_at_trigger ON user_feedback_submissions;
CREATE TRIGGER user_feedback_updated_at_trigger
  BEFORE UPDATE ON user_feedback_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_feedback_updated_at();

-- Row Level Security (RLS) Policies
ALTER TABLE user_feedback_submissions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert feedback (even anonymous users)
CREATE POLICY "Anyone can submit feedback"
  ON user_feedback_submissions
  FOR INSERT
  WITH CHECK (true);

-- Allow anyone to read feedback (for public display)
CREATE POLICY "Anyone can view feedback"
  ON user_feedback_submissions
  FOR SELECT
  USING (true);

-- Only admins can update feedback (you'll need to adjust this based on your admin system)
-- For now, we'll allow service role to handle updates via API
CREATE POLICY "Admins can update feedback"
  ON user_feedback_submissions
  FOR UPDATE
  USING (true);

-- Comments
COMMENT ON TABLE user_feedback_submissions IS 'User-submitted feedback, bug reports, and feature requests';
COMMENT ON COLUMN user_feedback_submissions.title IS 'Brief title of the feedback (max 100 chars)';
COMMENT ON COLUMN user_feedback_submissions.description IS 'Detailed description (max 1000 chars)';
COMMENT ON COLUMN user_feedback_submissions.category IS 'Type of feedback: bug_report, feature_request, improvement, ui_ux, or performance';
COMMENT ON COLUMN user_feedback_submissions.status IS 'Current status: pending, reviewing, approved, implemented, or rejected';
COMMENT ON COLUMN user_feedback_submissions.wallet_address IS 'Wallet address of submitter (or "anonymous")';
COMMENT ON COLUMN user_feedback_submissions.upvotes IS 'Number of upvotes from other users';
COMMENT ON COLUMN user_feedback_submissions.admin_notes IS 'Internal notes from admin team';

-- Sample data (optional - for testing)
INSERT INTO user_feedback_submissions (title, description, category, status, wallet_address) VALUES
  ('Leaderboard loading slowly', 'The leaderboard page takes 5+ seconds to load when there are many users. Could this be optimized?', 'performance', 'pending', '0x1234...5678'),
  ('Add dark mode toggle', 'Would love to have a dark mode option in the settings. The current theme is great but sometimes I prefer darker colors at night.', 'feature_request', 'reviewing', '0xabcd...efgh'),
  ('Course progress bar glitch', 'When I complete a lesson, the progress bar sometimes doesn''t update until I refresh the page.', 'bug_report', 'approved', '0x9876...4321'),
  ('Mobile navigation improvements', 'On mobile, the navigation menu overlaps with content sometimes. Maybe add more padding?', 'ui_ux', 'pending', 'anonymous'),
  ('Export certificate feature', 'It would be awesome if we could export our completion certificates as PDF files to share on LinkedIn!', 'feature_request', 'pending', '0xfedc...ba98');

-- Grant necessary permissions (adjust based on your setup)
-- GRANT ALL ON user_feedback_submissions TO authenticated;
-- GRANT ALL ON user_feedback_submissions TO service_role;

