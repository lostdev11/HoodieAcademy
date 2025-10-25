-- =====================================================
-- Hoodie Academy - Social Feed System
-- Posts, Comments, Reactions (Likes/Dislikes)
-- =====================================================

-- =====================================================
-- 1. SOCIAL POSTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL REFERENCES users(wallet_address) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 5000),
  post_type TEXT DEFAULT 'text' CHECK (post_type IN ('text', 'image', 'link', 'poll')),
  
  -- Media attachments
  image_url TEXT,
  link_url TEXT,
  link_title TEXT,
  link_description TEXT,
  
  -- Engagement metrics (denormalized for performance)
  likes_count INTEGER DEFAULT 0,
  dislikes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  
  -- Moderation
  is_pinned BOOLEAN DEFAULT false,
  is_hidden BOOLEAN DEFAULT false,
  is_reported BOOLEAN DEFAULT false,
  moderation_status TEXT DEFAULT 'approved' CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'flagged')),
  moderated_by TEXT,
  moderated_at TIMESTAMPTZ,
  moderation_reason TEXT,
  
  -- Metadata
  squad TEXT,
  tags TEXT[], -- Array of tags like ['web3', 'nfts', 'trading']
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  edited_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_social_posts_wallet ON social_posts(wallet_address);
CREATE INDEX IF NOT EXISTS idx_social_posts_created ON social_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_posts_moderation ON social_posts(moderation_status);
CREATE INDEX IF NOT EXISTS idx_social_posts_squad ON social_posts(squad);
CREATE INDEX IF NOT EXISTS idx_social_posts_pinned ON social_posts(is_pinned, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_posts_tags ON social_posts USING GIN(tags);

-- =====================================================
-- 2. SOCIAL COMMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS social_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES social_comments(id) ON DELETE CASCADE, -- For nested replies
  wallet_address TEXT NOT NULL REFERENCES users(wallet_address) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 2000),
  
  -- Engagement metrics
  likes_count INTEGER DEFAULT 0,
  dislikes_count INTEGER DEFAULT 0,
  
  -- Moderation
  is_hidden BOOLEAN DEFAULT false,
  is_reported BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  edited_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_social_comments_post ON social_comments(post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_social_comments_wallet ON social_comments(wallet_address);
CREATE INDEX IF NOT EXISTS idx_social_comments_parent ON social_comments(parent_comment_id);

-- =====================================================
-- 3. SOCIAL REACTIONS TABLE (Likes/Dislikes)
-- =====================================================
CREATE TABLE IF NOT EXISTS social_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL REFERENCES users(wallet_address) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment')),
  target_id UUID NOT NULL, -- References either social_posts.id or social_comments.id
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'dislike', 'love', 'fire', 'rocket')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one reaction per user per target
  UNIQUE(wallet_address, target_type, target_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_social_reactions_target ON social_reactions(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_social_reactions_wallet ON social_reactions(wallet_address);

-- =====================================================
-- 4. SOCIAL POST VIEWS TABLE (Track who viewed what)
-- =====================================================
CREATE TABLE IF NOT EXISTS social_post_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL REFERENCES users(wallet_address) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One view per user per post (can update timestamp)
  UNIQUE(post_id, wallet_address)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_social_post_views_post ON social_post_views(post_id);
CREATE INDEX IF NOT EXISTS idx_social_post_views_wallet ON social_post_views(wallet_address, viewed_at DESC);

-- =====================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_post_views ENABLE ROW LEVEL SECURITY;

-- Posts: Anyone can view approved posts, only author can edit/delete
CREATE POLICY "Anyone can view approved posts"
  ON social_posts FOR SELECT
  USING (moderation_status = 'approved' AND is_hidden = false);

CREATE POLICY "Users can create posts"
  ON social_posts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own posts"
  ON social_posts FOR UPDATE
  USING (wallet_address = current_setting('app.current_user', true));

CREATE POLICY "Users can delete their own posts"
  ON social_posts FOR DELETE
  USING (wallet_address = current_setting('app.current_user', true));

-- Comments: Anyone can view, only author can edit/delete
CREATE POLICY "Anyone can view comments"
  ON social_comments FOR SELECT
  USING (is_hidden = false);

CREATE POLICY "Users can create comments"
  ON social_comments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own comments"
  ON social_comments FOR UPDATE
  USING (wallet_address = current_setting('app.current_user', true));

CREATE POLICY "Users can delete their own comments"
  ON social_comments FOR DELETE
  USING (wallet_address = current_setting('app.current_user', true));

-- Reactions: Anyone can create, only owner can delete
CREATE POLICY "Anyone can view reactions"
  ON social_reactions FOR SELECT
  USING (true);

CREATE POLICY "Users can create reactions"
  ON social_reactions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can delete their own reactions"
  ON social_reactions FOR DELETE
  USING (wallet_address = current_setting('app.current_user', true));

-- Views: Anyone can create
CREATE POLICY "Anyone can view post views"
  ON social_post_views FOR SELECT
  USING (true);

CREATE POLICY "Users can create views"
  ON social_post_views FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- 6. FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update comment count on posts
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE social_posts
    SET comments_count = comments_count + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE social_posts
    SET comments_count = GREATEST(0, comments_count - 1)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_post_comment_count ON social_comments;
CREATE TRIGGER trigger_update_post_comment_count
  AFTER INSERT OR DELETE ON social_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comment_count();

-- Function to update reaction counts (likes/dislikes)
CREATE OR REPLACE FUNCTION update_reaction_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update post or comment reaction count
    IF NEW.target_type = 'post' THEN
      IF NEW.reaction_type = 'like' OR NEW.reaction_type = 'love' OR NEW.reaction_type = 'fire' OR NEW.reaction_type = 'rocket' THEN
        UPDATE social_posts SET likes_count = likes_count + 1 WHERE id = NEW.target_id;
      ELSIF NEW.reaction_type = 'dislike' THEN
        UPDATE social_posts SET dislikes_count = dislikes_count + 1 WHERE id = NEW.target_id;
      END IF;
    ELSIF NEW.target_type = 'comment' THEN
      IF NEW.reaction_type = 'like' OR NEW.reaction_type = 'love' OR NEW.reaction_type = 'fire' OR NEW.reaction_type = 'rocket' THEN
        UPDATE social_comments SET likes_count = likes_count + 1 WHERE id = NEW.target_id;
      ELSIF NEW.reaction_type = 'dislike' THEN
        UPDATE social_comments SET dislikes_count = dislikes_count + 1 WHERE id = NEW.target_id;
      END IF;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrease counts
    IF OLD.target_type = 'post' THEN
      IF OLD.reaction_type = 'like' OR OLD.reaction_type = 'love' OR OLD.reaction_type = 'fire' OR OLD.reaction_type = 'rocket' THEN
        UPDATE social_posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.target_id;
      ELSIF OLD.reaction_type = 'dislike' THEN
        UPDATE social_posts SET dislikes_count = GREATEST(0, dislikes_count - 1) WHERE id = OLD.target_id;
      END IF;
    ELSIF OLD.target_type = 'comment' THEN
      IF OLD.reaction_type = 'like' OR OLD.reaction_type = 'love' OR OLD.reaction_type = 'fire' OR OLD.reaction_type = 'rocket' THEN
        UPDATE social_comments SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.target_id;
      ELSIF OLD.reaction_type = 'dislike' THEN
        UPDATE social_comments SET dislikes_count = GREATEST(0, dislikes_count - 1) WHERE id = OLD.target_id;
      END IF;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_reaction_counts ON social_reactions;
CREATE TRIGGER trigger_update_reaction_counts
  AFTER INSERT OR DELETE ON social_reactions
  FOR EACH ROW
  EXECUTE FUNCTION update_reaction_counts();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_social_posts_updated_at ON social_posts;
CREATE TRIGGER trigger_social_posts_updated_at
  BEFORE UPDATE ON social_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_social_comments_updated_at ON social_comments;
CREATE TRIGGER trigger_social_comments_updated_at
  BEFORE UPDATE ON social_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Sample posts
INSERT INTO social_posts (wallet_address, content, post_type, tags, squad, moderation_status) VALUES
  ('demo_wallet_1', 'Just completed my first Web3 course! 🚀 The journey from zero to hero begins here.', 'text', ARRAY['web3', 'learning', 'milestone'], 'Decoders', 'approved'),
  ('demo_wallet_2', 'Hot take: NFTs are more than just profile pictures. They''re the future of digital ownership.', 'text', ARRAY['nfts', 'opinion'], 'Speakers', 'approved'),
  ('demo_wallet_3', 'Check out this amazing Solana tutorial I found 👉 https://solana.com/docs', 'link', ARRAY['solana', 'resources'], 'Rangers', 'approved');

COMMENT ON TABLE social_posts IS 'User-generated posts for the social feed';
COMMENT ON TABLE social_comments IS 'Comments and replies to social posts';
COMMENT ON TABLE social_reactions IS 'Likes, dislikes, and other reactions to posts and comments';
COMMENT ON TABLE social_post_views IS 'Track which users have viewed which posts';

