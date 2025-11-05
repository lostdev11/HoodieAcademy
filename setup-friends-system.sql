-- =====================================================
-- Hoodie Academy - Friends/Following System
-- Allows users to follow each other and see their friends
-- =====================================================

-- =====================================================
-- 1. FRIENDS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_wallet TEXT NOT NULL REFERENCES users(wallet_address) ON DELETE CASCADE,
  following_wallet TEXT NOT NULL REFERENCES users(wallet_address) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one follow relationship per pair
  UNIQUE(follower_wallet, following_wallet),
  
  -- Users can't follow themselves
  CHECK (follower_wallet != following_wallet)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_friends_follower ON friends(follower_wallet);
CREATE INDEX IF NOT EXISTS idx_friends_following ON friends(following_wallet);
CREATE INDEX IF NOT EXISTS idx_friends_created ON friends(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_friends_pair ON friends(follower_wallet, following_wallet);

-- Enable Row Level Security
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

-- Policies for friends table
-- Anyone can view friendships
CREATE POLICY "Anyone can view friendships"
  ON friends FOR SELECT
  USING (true);

-- Anyone can create friendships
CREATE POLICY "Anyone can create friendships"
  ON friends FOR INSERT
  WITH CHECK (true);

-- Only the follower can delete their own following
CREATE POLICY "Users can delete their own friendships"
  ON friends FOR DELETE
  USING (true);

COMMENT ON TABLE friends IS 'Friend/following relationships between users';

-- =====================================================
-- 2. CREATE TRIGGER FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp on users when followed
CREATE OR REPLACE FUNCTION update_user_on_follow()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the following user's updated_at
  UPDATE users SET updated_at = NOW() WHERE wallet_address = NEW.following_wallet;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update user timestamps on follow
DROP TRIGGER IF EXISTS trigger_update_user_on_follow ON friends;
CREATE TRIGGER trigger_update_user_on_follow
  AFTER INSERT ON friends
  FOR EACH ROW
  EXECUTE FUNCTION update_user_on_follow();

-- =====================================================
-- 3. HELPER FUNCTIONS
-- =====================================================

-- Function to get friend count for a user
CREATE OR REPLACE FUNCTION get_friend_count(p_wallet_address TEXT)
RETURNS INTEGER AS $$
DECLARE
  friend_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO friend_count
  FROM friends
  WHERE following_wallet = p_wallet_address;
  
  RETURN friend_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get following count for a user
CREATE OR REPLACE FUNCTION get_following_count(p_wallet_address TEXT)
RETURNS INTEGER AS $$
DECLARE
  following_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO following_count
  FROM friends
  WHERE follower_wallet = p_wallet_address;
  
  RETURN following_count;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user A is following user B
CREATE OR REPLACE FUNCTION is_following(p_follower_wallet TEXT, p_following_wallet TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  exists_check BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM friends 
    WHERE follower_wallet = p_follower_wallet 
    AND following_wallet = p_following_wallet
  ) INTO exists_check;
  
  RETURN exists_check;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. SAMPLE DATA (Optional - for testing)
-- =====================================================

-- No sample data - users will create friendships organically

COMMENT ON TABLE friends IS 'Friend/following relationships between users';

