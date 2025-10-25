-- =====================================================
-- Fix Global Settings Duplicates
-- This script removes duplicate rows from global_settings table
-- =====================================================

-- First, let's see what we have
SELECT 'Current global_settings rows:' as info, COUNT(*) as row_count 
FROM global_settings;

-- Show all rows to see the duplicates
SELECT * FROM global_settings ORDER BY created_at;

-- Keep only the most recent row and delete the rest
WITH ranked_settings AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY created_at DESC, id DESC) as rn
  FROM global_settings
)
DELETE FROM global_settings 
WHERE id IN (
  SELECT id 
  FROM ranked_settings 
  WHERE rn > 1
);

-- Verify we now have only one row
SELECT 'After cleanup:' as info, COUNT(*) as row_count 
FROM global_settings;

-- Show the remaining row
SELECT * FROM global_settings;
