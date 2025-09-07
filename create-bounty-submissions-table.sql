-- Create bounty_submissions table
CREATE TABLE IF NOT EXISTS bounty_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bounty_id UUID NOT NULL REFERENCES bounties(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  submission_content TEXT NOT NULL,
  submission_type VARCHAR(20) DEFAULT 'text' CHECK (submission_type IN ('text', 'link', 'image', 'file')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bounty_submissions_bounty_id ON bounty_submissions(bounty_id);
CREATE INDEX IF NOT EXISTS idx_bounty_submissions_wallet_address ON bounty_submissions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_bounty_submissions_status ON bounty_submissions(status);
CREATE INDEX IF NOT EXISTS idx_bounty_submissions_created_at ON bounty_submissions(created_at);

-- Create unique constraint to prevent duplicate submissions
CREATE UNIQUE INDEX IF NOT EXISTS idx_bounty_submissions_unique 
ON bounty_submissions(bounty_id, wallet_address);

-- Insert some sample submissions for testing
INSERT INTO bounty_submissions (bounty_id, wallet_address, submission_content, submission_type, status) VALUES
(
  (SELECT id FROM bounties LIMIT 1),
  'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU',
  'I completed the welcome bounty by finishing my first course!',
  'text',
  'approved'
),
(
  (SELECT id FROM bounties LIMIT 1 OFFSET 1),
  'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU',
  'https://example.com/my-community-engagement-post',
  'link',
  'pending'
);
