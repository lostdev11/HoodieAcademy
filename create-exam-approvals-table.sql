-- Create exam_approvals table (simplified version)
CREATE TABLE IF NOT EXISTS exam_approvals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  course_id TEXT NOT NULL,
  exam_type TEXT NOT NULL DEFAULT 'final',
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Add unique constraint to prevent duplicate submissions
  CONSTRAINT unique_exam_submission 
    UNIQUE (wallet_address, course_id, exam_type)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_exam_approvals_wallet_address ON exam_approvals(wallet_address);
CREATE INDEX IF NOT EXISTS idx_exam_approvals_course_id ON exam_approvals(course_id);
CREATE INDEX IF NOT EXISTS idx_exam_approvals_status ON exam_approvals(status);
CREATE INDEX IF NOT EXISTS idx_exam_approvals_submitted_at ON exam_approvals(submitted_at);

-- Insert some sample data (optional)
-- INSERT INTO exam_approvals (wallet_address, course_id, exam_type, status) VALUES
--   ('0x1234567890abcdef', 'wallet-wizardry-final-exam', 'final', 'pending'),
--   ('0xabcdef1234567890', 'technical-analysis-final-exam', 'final', 'approved'); 