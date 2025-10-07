-- =====================================================
-- VERIFY IMAGE MODERATION SYSTEM IS READY
-- =====================================================
-- Run this to confirm everything is set up correctly

-- Check 1: Verify tables exist
SELECT 
  'Tables Exist' as check_name,
  CASE 
    WHEN COUNT(*) = 2 THEN '✅ PASS' 
    ELSE '❌ FAIL' 
  END as status,
  CASE 
    WHEN COUNT(*) = 2 THEN 'Both tables created successfully' 
    ELSE 'Missing tables - rerun setup script' 
  END as message
FROM information_schema.tables 
WHERE table_name IN ('moderated_images', 'moderation_logs')

UNION ALL

-- Check 2: Verify RLS is enabled
SELECT 
  'RLS Enabled' as check_name,
  CASE 
    WHEN COUNT(*) = 2 THEN '✅ PASS' 
    ELSE '❌ FAIL' 
  END as status,
  COUNT(*)::text || ' tables have RLS enabled' as message
FROM pg_tables 
WHERE tablename IN ('moderated_images', 'moderation_logs') 
AND rowsecurity = true

UNION ALL

-- Check 3: Verify policies exist
SELECT 
  'Policies Created' as check_name,
  CASE 
    WHEN COUNT(*) >= 3 THEN '✅ PASS' 
    ELSE '❌ FAIL' 
  END as status,
  COUNT(*)::text || ' RLS policies created' as message
FROM pg_policies 
WHERE tablename IN ('moderated_images', 'moderation_logs')

UNION ALL

-- Check 4: Verify indexes exist
SELECT 
  'Indexes Created' as check_name,
  CASE 
    WHEN COUNT(*) >= 5 THEN '✅ PASS' 
    ELSE '⚠️ WARNING' 
  END as status,
  COUNT(*)::text || ' indexes created for performance' as message
FROM pg_indexes 
WHERE tablename IN ('moderated_images', 'moderation_logs')

UNION ALL

-- Check 5: Verify triggers exist
SELECT 
  'Triggers Created' as check_name,
  CASE 
    WHEN COUNT(*) >= 1 THEN '✅ PASS' 
    ELSE '❌ FAIL' 
  END as status,
  COUNT(*)::text || ' trigger(s) created for auto-updates' as message
FROM information_schema.triggers 
WHERE event_object_table = 'moderated_images';

-- Display table structure
SELECT '---' as separator, 'TABLE STRUCTURE: moderated_images' as info;

SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'moderated_images'
ORDER BY ordinal_position;

SELECT '---' as separator, 'TABLE STRUCTURE: moderation_logs' as info;

SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'moderation_logs'
ORDER BY ordinal_position;

