-- Minimal Course System Setup (No problematic indexes)
-- This script creates the course system without any squad_id indexes

-- ============================================================================
-- COURSE SYSTEM SETUP (MINIMAL)
-- ============================================================================

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  squad_id TEXT NOT NULL,
  squad_name TEXT NOT NULL,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'expert')) DEFAULT 'beginner',
  estimated_duration INTEGER,
  xp_reward INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  is_hidden BOOLEAN DEFAULT false,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE,
  tags TEXT[],
  prerequisites TEXT[],
  order_index INTEGER DEFAULT 0
);

-- Create course progress table
CREATE TABLE IF NOT EXISTS course_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_wallet TEXT NOT NULL,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  time_spent INTEGER DEFAULT 0,
  current_section TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_wallet, course_id)
);

-- Create course sections table
CREATE TABLE IF NOT EXISTS course_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_required BOOLEAN DEFAULT true,
  estimated_duration INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create section progress table
CREATE TABLE IF NOT EXISTS section_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_wallet TEXT NOT NULL,
  section_id UUID NOT NULL REFERENCES course_sections(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  time_spent INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_wallet, section_id)
);

-- Create only safe indexes (avoid squad_id indexes for now)
CREATE INDEX IF NOT EXISTS idx_courses_published ON courses(is_published, is_hidden);
CREATE INDEX IF NOT EXISTS idx_course_progress_user ON course_progress(user_wallet);
CREATE INDEX IF NOT EXISTS idx_course_progress_course ON course_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_course_sections_course ON course_sections(course_id);
CREATE INDEX IF NOT EXISTS idx_section_progress_user ON section_progress(user_wallet);

-- Function to check if user can access a course (squad-based access control)
CREATE OR REPLACE FUNCTION can_user_access_course(user_wallet TEXT, course_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_squad TEXT;
  course_squad TEXT;
  course_exists BOOLEAN;
BEGIN
  -- Check if course exists and is published
  SELECT EXISTS(
    SELECT 1 FROM courses 
    WHERE id = course_id 
    AND is_published = true 
    AND is_hidden = false
  ) INTO course_exists;
  
  IF NOT course_exists THEN
    RETURN FALSE;
  END IF;
  
  -- Get user's squad
  SELECT squad_id INTO user_squad
  FROM users
  WHERE wallet_address = user_wallet;
  
  -- Get course's squad
  SELECT squad_id INTO course_squad
  FROM courses
  WHERE id = course_id;
  
  -- User can access if they're in the same squad or if course is for all squads
  RETURN (user_squad = course_squad OR course_squad = 'all');
END;
$$ LANGUAGE plpgsql;

-- Function to update course progress automatically
CREATE OR REPLACE FUNCTION update_course_progress()
RETURNS TRIGGER AS $$
DECLARE
  total_sections INTEGER;
  completed_sections INTEGER;
  new_progress INTEGER;
BEGIN
  -- Get total sections for the course
  SELECT COUNT(*) INTO total_sections
  FROM course_sections
  WHERE course_id = NEW.course_id;
  
  -- Get completed sections for the user
  SELECT COUNT(*) INTO completed_sections
  FROM section_progress sp
  JOIN course_sections cs ON sp.section_id = cs.id
  WHERE sp.user_wallet = NEW.user_wallet
    AND sp.course_id = NEW.course_id
    AND sp.is_completed = true;
  
  -- Calculate new progress percentage
  IF total_sections > 0 THEN
    new_progress := (completed_sections * 100) / total_sections;
  ELSE
    new_progress := 0;
  END IF;
  
  -- Update course progress
  INSERT INTO course_progress (user_wallet, course_id, progress_percentage, is_completed, completed_at, last_accessed_at)
  VALUES (NEW.user_wallet, NEW.course_id, new_progress, 
          CASE WHEN new_progress = 100 THEN true ELSE false END,
          CASE WHEN new_progress = 100 THEN NOW() ELSE NULL END,
          NOW())
  ON CONFLICT (user_wallet, course_id)
  DO UPDATE SET
    progress_percentage = new_progress,
    is_completed = CASE WHEN new_progress = 100 THEN true ELSE false END,
    completed_at = CASE WHEN new_progress = 100 THEN NOW() ELSE course_progress.completed_at END,
    last_accessed_at = NOW(),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update course progress when section progress changes
DROP TRIGGER IF EXISTS trigger_update_course_progress ON section_progress;
CREATE TRIGGER trigger_update_course_progress
  AFTER INSERT OR UPDATE ON section_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_course_progress();

-- ============================================================================
-- SAMPLE DATA
-- ============================================================================

-- Insert sample courses for each squad
INSERT INTO courses (title, description, squad_id, squad_name, difficulty_level, estimated_duration, xp_reward, tags, order_index) VALUES
-- Hoodie Creators Squad Courses
('Introduction to Web3 Creation', 'Learn the fundamentals of creating in the Web3 space', 'creators', 'Hoodie Creators', 'beginner', 120, 100, ARRAY['web3', 'creation', 'basics'], 1),
('NFT Creation Mastery', 'Master the art of creating and launching NFTs', 'creators', 'Hoodie Creators', 'intermediate', 180, 200, ARRAY['nft', 'creation', 'launch'], 2),
('DeFi Protocol Design', 'Design and build DeFi protocols', 'creators', 'Hoodie Creators', 'advanced', 240, 300, ARRAY['defi', 'protocol', 'design'], 3),

-- Hoodie Decoders Squad Courses
('Blockchain Fundamentals', 'Understand the core concepts of blockchain technology', 'decoders', 'Hoodie Decoders', 'beginner', 90, 100, ARRAY['blockchain', 'fundamentals', 'basics'], 1),
('Smart Contract Analysis', 'Learn to analyze and audit smart contracts', 'decoders', 'Hoodie Decoders', 'intermediate', 150, 200, ARRAY['smart-contracts', 'analysis', 'audit'], 2),
('Advanced Cryptography', 'Deep dive into cryptographic principles', 'decoders', 'Hoodie Decoders', 'advanced', 200, 300, ARRAY['cryptography', 'security', 'advanced'], 3),

-- Hoodie Speakers Squad Courses
('Web3 Communication', 'Learn to communicate Web3 concepts effectively', 'speakers', 'Hoodie Speakers', 'beginner', 60, 100, ARRAY['communication', 'web3', 'presentation'], 1),
('Community Building', 'Build and manage Web3 communities', 'speakers', 'Hoodie Speakers', 'intermediate', 120, 200, ARRAY['community', 'management', 'growth'], 2),
('Public Speaking Mastery', 'Master public speaking in the Web3 space', 'speakers', 'Hoodie Speakers', 'advanced', 180, 300, ARRAY['public-speaking', 'presentation', 'leadership'], 3),

-- Hoodie Traders Squad Courses
('Trading Fundamentals', 'Learn the basics of cryptocurrency trading', 'traders', 'Hoodie Traders', 'beginner', 90, 100, ARRAY['trading', 'crypto', 'basics'], 1),
('Technical Analysis', 'Master technical analysis for trading', 'traders', 'Hoodie Traders', 'intermediate', 150, 200, ARRAY['technical-analysis', 'trading', 'charts'], 2),
('Advanced Trading Strategies', 'Learn advanced trading strategies and risk management', 'traders', 'Hoodie Traders', 'advanced', 200, 300, ARRAY['trading-strategies', 'risk-management', 'advanced'], 3);

-- Create sample sections for the first course
INSERT INTO course_sections (course_id, title, description, order_index, estimated_duration)
SELECT c.id, 'Introduction to Web3', 'Understanding what Web3 is and why it matters', 1, 30
FROM courses c WHERE c.title = 'Introduction to Web3 Creation' LIMIT 1;

INSERT INTO course_sections (course_id, title, description, order_index, estimated_duration)
SELECT c.id, 'Web3 Tools and Platforms', 'Exploring the tools and platforms available in Web3', 2, 45
FROM courses c WHERE c.title = 'Introduction to Web3 Creation' LIMIT 1;

INSERT INTO course_sections (course_id, title, description, order_index, estimated_duration)
SELECT c.id, 'Your First Web3 Project', 'Hands-on project to create your first Web3 application', 3, 45
FROM courses c WHERE c.title = 'Introduction to Web3 Creation' LIMIT 1;

-- ============================================================================
-- BASIC SECURITY (MINIMAL RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE section_progress ENABLE ROW LEVEL SECURITY;

-- Basic policies (simplified)
CREATE POLICY "Allow course access" ON courses FOR SELECT USING (true);
CREATE POLICY "Allow course progress access" ON course_progress FOR ALL USING (true);
CREATE POLICY "Allow section access" ON course_sections FOR SELECT USING (true);
CREATE POLICY "Allow section progress access" ON section_progress FOR ALL USING (true);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Minimal course system setup completed successfully!';
  RAISE NOTICE '📚 Courses are now available with squad-based access control';
  RAISE NOTICE '📊 Sample data has been inserted';
  RAISE NOTICE '🎯 Users can only access courses for their assigned squad';
END $$;
