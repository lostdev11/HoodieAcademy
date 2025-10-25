-- =====================================================
-- Create RPC Function to Fix Global Settings RLS
-- =====================================================

-- Create a function that can fix global_settings RLS policies
CREATE OR REPLACE FUNCTION fix_global_settings_rls()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  -- Enable RLS on global_settings
  ALTER TABLE global_settings ENABLE ROW LEVEL SECURITY;
  
  -- Drop existing policies
  DROP POLICY IF EXISTS "read_global_settings" ON global_settings;
  DROP POLICY IF EXISTS "Allow public read access" ON global_settings;
  DROP POLICY IF EXISTS "Anyone can read global settings" ON global_settings;
  
  -- Create new policy for public read access
  CREATE POLICY "read_global_settings" ON global_settings
    FOR SELECT 
    USING (true);
  
  -- Insert default settings if missing
  INSERT INTO global_settings (
    site_maintenance, 
    registration_enabled, 
    course_submissions_enabled, 
    bounty_submissions_enabled, 
    chat_enabled, 
    leaderboard_enabled
  )
  VALUES (false, true, true, true, true, true)
  ON CONFLICT DO NOTHING;
  
  -- Test the fix
  PERFORM COUNT(*) FROM global_settings;
  
  result := json_build_object(
    'success', true,
    'message', 'Global settings RLS policies fixed successfully',
    'timestamp', NOW()
  );
  
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
    result := json_build_object(
      'success', false,
      'error', SQLERRM,
      'timestamp', NOW()
    );
    RETURN result;
END;
$$;

-- Test the function
SELECT fix_global_settings_rls();
