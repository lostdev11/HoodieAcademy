-- =============================================
-- Feedback Tracker System
-- "You Asked, We Fixed" Feature
-- =============================================

-- Create feedback_updates table
CREATE TABLE IF NOT EXISTS feedback_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('bug_fix', 'feature', 'improvement', 'ui_ux', 'performance')),
  status TEXT NOT NULL DEFAULT 'fixed' CHECK (status IN ('fixed', 'in_progress', 'planned')),
  requested_by TEXT, -- Wallet address or username of person who requested it
  fixed_date TIMESTAMPTZ DEFAULT NOW(),
  upvotes INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true, -- To show/hide from widget
  priority INTEGER DEFAULT 0, -- Higher number = higher priority in display
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_feedback_updates_status ON feedback_updates(status);
CREATE INDEX IF NOT EXISTS idx_feedback_updates_category ON feedback_updates(category);
CREATE INDEX IF NOT EXISTS idx_feedback_updates_active ON feedback_updates(is_active);
CREATE INDEX IF NOT EXISTS idx_feedback_updates_priority ON feedback_updates(priority DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_updates_fixed_date ON feedback_updates(fixed_date DESC);

-- Enable RLS
ALTER TABLE feedback_updates ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active feedback updates
CREATE POLICY "Anyone can read active feedback updates"
ON feedback_updates
FOR SELECT
USING (is_active = true);

-- Policy: Only admins can insert/update/delete feedback updates
CREATE POLICY "Admins can manage feedback updates"
ON feedback_updates
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.wallet_address = auth.jwt() ->> 'wallet_address'
    AND users.is_admin = true
  )
);

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_update_feedback_updated_at ON feedback_updates;
CREATE TRIGGER trigger_update_feedback_updated_at
  BEFORE UPDATE ON feedback_updates
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_updated_at();

-- =============================================
-- Sample Data (Recent Fixes)
-- =============================================

INSERT INTO feedback_updates (title, description, category, status, priority, fixed_date) VALUES
('XP System Cache Fix', 'Fixed issue where XP awards showed success but didn''t reflect in dashboard. Implemented cache-busting and auto-refresh.', 'bug_fix', 'fixed', 10, NOW() - INTERVAL '1 hour'),
('Admin XP Award Interface', 'Added comprehensive XP management interface for admins with user search and award tracking.', 'feature', 'fixed', 9, NOW() - INTERVAL '2 hours'),
('Dashboard Auto-Refresh', 'Implemented 30-second auto-refresh for all user stats to keep data up-to-date without page refresh.', 'improvement', 'fixed', 8, NOW() - INTERVAL '3 hours'),
('Activity Logging Schema Fix', 'Corrected metadata field mismatch in user activity logging system.', 'bug_fix', 'fixed', 7, NOW() - INTERVAL '4 hours'),
('React Hooks Stability', 'Fixed "Rendered more hooks" error in UserDashboard component for better stability.', 'bug_fix', 'fixed', 6, NOW() - INTERVAL '5 hours');

-- =============================================
-- Verification Query
-- =============================================

-- Check if table was created successfully
SELECT 
  COUNT(*) as total_updates,
  COUNT(CASE WHEN status = 'fixed' THEN 1 END) as fixed_count,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_count
FROM feedback_updates;

-- Show recent updates
SELECT 
  title,
  category,
  status,
  fixed_date,
  priority
FROM feedback_updates
WHERE is_active = true
ORDER BY priority DESC, fixed_date DESC
LIMIT 5;

