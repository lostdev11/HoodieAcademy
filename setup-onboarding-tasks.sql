-- Onboarding Tasks System
-- Tracks individual onboarding tasks and awards XP when completed

-- =====================================================
-- ONBOARDING TASKS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS onboarding_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT NOT NULL,
  task_id TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  xp_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(wallet_address, task_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_wallet ON onboarding_tasks(wallet_address);
CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_task_id ON onboarding_tasks(task_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_completed ON onboarding_tasks(completed);

-- Auto-update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_onboarding_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS onboarding_tasks_updated_at_trigger ON onboarding_tasks;
CREATE TRIGGER onboarding_tasks_updated_at_trigger
  BEFORE UPDATE ON onboarding_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_onboarding_tasks_updated_at();

-- =====================================================
-- ONBOARDING TASK DEFINITIONS
-- =====================================================
-- These are the default tasks that will be created for new users

COMMENT ON TABLE onboarding_tasks IS 'Tracks individual onboarding tasks completion for users. Tasks are created automatically when a user first logs in.';

