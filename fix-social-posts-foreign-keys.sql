-- =====================================================
-- Fix Social Posts Foreign Keys
-- Run this in your Supabase SQL Editor to add foreign key constraints
-- =====================================================

-- Add foreign key constraint to social_posts
ALTER TABLE social_posts
  DROP CONSTRAINT IF EXISTS social_posts_wallet_address_fkey;

ALTER TABLE social_posts
  ADD CONSTRAINT social_posts_wallet_address_fkey
  FOREIGN KEY (wallet_address)
  REFERENCES users(wallet_address)
  ON DELETE CASCADE;

-- Add foreign key constraint to social_comments
ALTER TABLE social_comments
  DROP CONSTRAINT IF EXISTS social_comments_wallet_address_fkey;

ALTER TABLE social_comments
  ADD CONSTRAINT social_comments_wallet_address_fkey
  FOREIGN KEY (wallet_address)
  REFERENCES users(wallet_address)
  ON DELETE CASCADE;

-- Add foreign key constraint to social_reactions
ALTER TABLE social_reactions
  DROP CONSTRAINT IF EXISTS social_reactions_wallet_address_fkey;

ALTER TABLE social_reactions
  ADD CONSTRAINT social_reactions_wallet_address_fkey
  FOREIGN KEY (wallet_address)
  REFERENCES users(wallet_address)
  ON DELETE CASCADE;

-- Add foreign key constraint to social_post_views
ALTER TABLE social_post_views
  DROP CONSTRAINT IF EXISTS social_post_views_wallet_address_fkey;

ALTER TABLE social_post_views
  ADD CONSTRAINT social_post_views_wallet_address_fkey
  FOREIGN KEY (wallet_address)
  REFERENCES users(wallet_address)
  ON DELETE CASCADE;

-- Verify constraints were added
SELECT
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('social_posts', 'social_comments', 'social_reactions', 'social_post_views')
ORDER BY tc.table_name, tc.constraint_name;
