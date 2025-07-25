-- Complete setup for exam tracking tables
-- This script creates both exam_approvals and exam_progress tables

-- Step 1: Create exam_approvals table
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

-- Create indexes for exam_approvals
CREATE INDEX IF NOT EXISTS idx_exam_approvals_wallet_address ON exam_approvals(wallet_address);
CREATE INDEX IF NOT EXISTS idx_exam_approvals_course_id ON exam_approvals(course_id);
CREATE INDEX IF NOT EXISTS idx_exam_approvals_status ON exam_approvals(status);
CREATE INDEX IF NOT EXISTS idx_exam_approvals_submitted_at ON exam_approvals(submitted_at);

-- Step 2: Create exam_progress table
CREATE TABLE IF NOT EXISTS exam_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  course_id TEXT NOT NULL,
  exam_type TEXT NOT NULL DEFAULT 'final',
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'started', 'in_progress', 'completed', 'failed', 'submitted')),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  submitted_for_approval_at TIMESTAMP WITH TIME ZONE,
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

-- Create indexes for exam_progress
CREATE INDEX IF NOT EXISTS idx_exam_progress_wallet_address ON exam_progress(wallet_address);
CREATE INDEX IF NOT EXISTS idx_exam_progress_course_id ON exam_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_exam_progress_status ON exam_progress(status);
CREATE INDEX IF NOT EXISTS idx_exam_progress_started_at ON exam_progress(started_at);
CREATE INDEX IF NOT EXISTS idx_exam_progress_submitted_at ON exam_progress(submitted_for_approval_at);

-- Step 3: Update existing exam_progress table if it exists (add missing columns)
DO $$ 
BEGIN
  -- Add submitted_for_approval_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'exam_progress' 
    AND column_name = 'submitted_for_approval_at'
  ) THEN
    ALTER TABLE exam_progress ADD COLUMN submitted_for_approval_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  -- Update status check constraint to include 'submitted'
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'exam_progress' 
    AND constraint_name = 'exam_progress_status_check'
  ) THEN
    ALTER TABLE exam_progress DROP CONSTRAINT exam_progress_status_check;
  END IF;
  
  ALTER TABLE exam_progress 
  ADD CONSTRAINT exam_progress_status_check 
  CHECK (status IN ('not_started', 'started', 'in_progress', 'completed', 'failed', 'submitted'));
  
  -- Create index for submitted_for_approval_at if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'exam_progress' 
    AND indexname = 'idx_exam_progress_submitted_at'
  ) THEN
    CREATE INDEX idx_exam_progress_submitted_at ON exam_progress(submitted_for_approval_at);
  END IF;
  
END $$;

-- Step 4: Verify tables were created successfully
SELECT 
  'exam_approvals' as table_name,
  COUNT(*) as row_count
FROM exam_approvals
UNION ALL
SELECT 
  'exam_progress' as table_name,
  COUNT(*) as row_count
FROM exam_progress;

-- Step 5: Show table structure
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('exam_approvals', 'exam_progress')
ORDER BY table_name, ordinal_position; 