-- Create exam_progress table
CREATE TABLE IF NOT EXISTS exam_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  course_id TEXT NOT NULL,
  exam_type TEXT NOT NULL DEFAULT 'final',
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'started', 'in_progress', 'completed', 'failed')),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  score INTEGER,
  max_score INTEGER DEFAULT 100,
  attempts INTEGER DEFAULT 0,
  time_spent_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Add unique constraint to prevent duplicate entries
  CONSTRAINT unique_exam_progress 
    UNIQUE (wallet_address, course_id, exam_type)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_exam_progress_wallet_address ON exam_progress(wallet_address);
CREATE INDEX IF NOT EXISTS idx_exam_progress_course_id ON exam_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_exam_progress_status ON exam_progress(status);
CREATE INDEX IF NOT EXISTS idx_exam_progress_started_at ON exam_progress(started_at);

-- Insert some sample data (optional)
-- INSERT INTO exam_progress (wallet_address, course_id, exam_type, status) VALUES
--   ('0x1234567890abcdef', 'wallet-wizardry', 'final', 'started'),
--   ('0xabcdef1234567890', 'technical-analysis', 'final', 'completed'); 