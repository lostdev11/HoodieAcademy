-- =====================================================
-- COURSE IMPORT SCRIPT FOR HOODIE ACADEMY ADMIN DASHBOARD
-- Generated on: 2025-08-25T21:04:31.579Z
-- Total courses: 39
-- =====================================================

-- First, ensure the courses table has all necessary columns
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS slug TEXT,
ADD COLUMN IF NOT EXISTS cover_url TEXT,
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Create unique index on slug if it doesn't exist
CREATE UNIQUE INDEX IF NOT EXISTS courses_slug_idx ON courses(slug);

-- =====================================================
-- COURSE DATA INSERTS
-- =====================================================

-- 1. AI Vocab (RAG, Few-Shot, Prompt Types) (a120-ai-vocab.json)
INSERT INTO courses (id, slug, title, description, emoji, badge, squad, level, access, category, totalLessons, is_visible, is_published, sort_order) VALUES ('a120-ai-vocab', 'a120-ai-vocab', 'AI Vocab (RAG, Few-Shot, Prompt Types)', 'Master the essential AI vocabulary and concepts needed to interpret and work with large language models. Learn RAG, few-shot learning, and prompt engineering techniques.', '🤖', 'AI Interpreter', 'decoders', 'beginner', 'free', 'llm-interpretation', 4, true, false, 0)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  emoji = EXCLUDED.emoji,
  badge = EXCLUDED.badge,
  squad = EXCLUDED.squad,
  level = EXCLUDED.level,
  access = EXCLUDED.access,
  category = EXCLUDED.category,
  totalLessons = EXCLUDED.totalLessons,
  is_visible = EXCLUDED.is_visible,
  is_published = EXCLUDED.is_published,
  sort_order = EXCLUDED.sort_order,
  cover_url = EXCLUDED.cover_url,
  updated_at = NOW();

-- 2. Prompt Engineering for AI Assistants (a150-prompt-engineering.json)
INSERT INTO courses (id, slug, title, description, emoji, badge, squad, level, access, category, totalLessons, is_visible, is_published, sort_order) VALUES ('a150-prompt-engineering', 'a150-prompt-engineering', 'Prompt Engineering for AI Assistants', 'Master the art of crafting effective prompts for AI assistants to enhance community engagement, automate tasks, and amplify your communication impact.', '🤖', 'AI Amplifier', 'Speakers', 'intermediate', 'free', 'automation-enablement', 4, true, false, 0)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  emoji = EXCLUDED.emoji,
  badge = EXCLUDED.badge,
  squad = EXCLUDED.squad,
  level = EXCLUDED.level,
  access = EXCLUDED.access,
  category = EXCLUDED.category,
  totalLessons = EXCLUDED.totalLessons,
  is_visible = EXCLUDED.is_visible,
  is_published = EXCLUDED.is_published,
  sort_order = EXCLUDED.sort_order,
  cover_url = EXCLUDED.cover_url,
  updated_at = NOW();

-- 3. C120 – Browser Hygiene & Setup (c120-browser-hygiene.json)
INSERT INTO courses (id, slug, title, description, emoji, badge, squad, level, access, category, totalLessons, is_visible, is_published, sort_order) VALUES ('c120-browser-hygiene', 'c120-browser-hygiene-setup', 'C120 – Browser Hygiene & Setup', 'Master browser security for Web3 trading. Learn to segment browsers, manage extensions safely, control permissions, and harden your setup against drainers and scams.', '🛡️', 'Browser Guardian', 'decoders', 'beginner', 'free', 'cybersecurity', 5, true, false, 0)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  emoji = EXCLUDED.emoji,
  badge = EXCLUDED.badge,
  squad = EXCLUDED.squad,
  level = EXCLUDED.level,
  access = EXCLUDED.access,
  category = EXCLUDED.category,
  totalLessons = EXCLUDED.totalLessons,
  is_visible = EXCLUDED.is_visible,
  is_published = EXCLUDED.is_published,
  sort_order = EXCLUDED.sort_order,
  cover_url = EXCLUDED.cover_url,
  updated_at = NOW();

-- 4. Scam Detection (c150-scam-detection.json)
INSERT INTO courses (id, slug, title, description, emoji, badge, squad, level, access, category, totalLessons, is_visible, is_published, sort_order) VALUES ('c150-scam-detection', 'c150-scam-detection', 'Scam Detection', 'Develop your digital defense skills to identify and avoid scams in the Web3 space. Learn to spot red flags, protect your assets, and help others stay safe.', '🛡️', 'Scam Hunter', 'raiders', 'beginner', 'free', 'digital-defense', 4, true, false, 0)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  emoji = EXCLUDED.emoji,
  badge = EXCLUDED.badge,
  squad = EXCLUDED.squad,
  level = EXCLUDED.level,
  access = EXCLUDED.access,
  category = EXCLUDED.category,
  totalLessons = EXCLUDED.totalLessons,
  is_visible = EXCLUDED.is_visible,
  is_published = EXCLUDED.is_published,
  sort_order = EXCLUDED.sort_order,
  cover_url = EXCLUDED.cover_url,
  updated_at = NOW();

-- 5. Introduction to Randomizer Power (hl140-randomizer-power.json)
INSERT INTO courses (id, slug, title, description, emoji, badge, squad, level, access, category, totalLessons, is_visible, is_published, sort_order) VALUES ('hl140-randomizer-power', 'hl140-randomizer-power', 'Introduction to Randomizer Power', 'Master the fundamentals of randomizer mechanics and their influence on NFT markets. Learn to understand, predict, and leverage randomizer behavior for strategic advantage.', '🎲', 'Randomizer Sage', 'raiders', 'beginner', 'free', 'meta-influence', 4, true, false, 0)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  emoji = EXCLUDED.emoji,
  badge = EXCLUDED.badge,
  squad = EXCLUDED.squad,
  level = EXCLUDED.level,
  access = EXCLUDED.access,
  category = EXCLUDED.category,
  totalLessons = EXCLUDED.totalLessons,
  is_visible = EXCLUDED.is_visible,
  is_published = EXCLUDED.is_published,
  sort_order = EXCLUDED.sort_order,
  cover_url = EXCLUDED.cover_url,
  updated_at = NOW();

-- 6. Faceless/No Eyes Lore Symbolism (hl240-faceless-lore.json)
INSERT INTO courses (id, slug, title, description, emoji, badge, squad, level, access, category, totalLessons, is_visible, is_published, sort_order) VALUES ('hl240-faceless-lore', 'hl240-faceless-lore', 'Faceless/No Eyes Lore Symbolism', 'Master the deep symbolism and cultural significance of faceless and no-eyes traits in NFT communities. Learn to interpret, communicate, and amplify the powerful narratives behind these visual elements.', '👁️', 'Lore Interpreter', 'Speakers', 'advanced', 'squad-gated', 'trait-interpretation', 3, true, false, 0)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  emoji = EXCLUDED.emoji,
  badge = EXCLUDED.badge,
  squad = EXCLUDED.squad,
  level = EXCLUDED.level,
  access = EXCLUDED.access,
  category = EXCLUDED.category,
  totalLessons = EXCLUDED.totalLessons,
  is_visible = EXCLUDED.is_visible,
  is_published = EXCLUDED.is_published,
  sort_order = EXCLUDED.sort_order,
  cover_url = EXCLUDED.cover_url,
  updated_at = NOW();

-- 7. Lore as Identity Fuel (l100-lore-identity.json)
INSERT INTO courses (id, slug, title, description, emoji, badge, squad, level, access, category, totalLessons, is_visible, is_published, sort_order) VALUES ('l100-lore-identity', 'l100-lore-identity', 'Lore as Identity Fuel', 'Learn to use lore and storytelling to build powerful personal identity and community influence. Master the art of crafting narratives that drive action and create cultural impact.', '📖', 'Lore Warrior', 'raiders', 'beginner', 'free', 'personal-myth-power', 3, true, false, 0)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  emoji = EXCLUDED.emoji,
  badge = EXCLUDED.badge,
  squad = EXCLUDED.squad,
  level = EXCLUDED.level,
  access = EXCLUDED.access,
  category = EXCLUDED.category,
  totalLessons = EXCLUDED.totalLessons,
  is_visible = EXCLUDED.is_visible,
  is_published = EXCLUDED.is_published,
  sort_order = EXCLUDED.sort_order,
  cover_url = EXCLUDED.cover_url,
  updated_at = NOW();

-- 8. Personal Lore & Character Sheets (l150-personal-lore.json)
INSERT INTO courses (id, slug, title, description, emoji, badge, squad, level, access, category, totalLessons, is_visible, is_published, sort_order) VALUES ('l150-personal-lore', 'l150-personal-lore', 'Personal Lore & Character Sheets', 'Develop your personal brand and character within the Hoodie Academy universe. Create compelling backstories and character sheets that enhance your community presence.', '📜', 'Lore Keeper', 'creators', 'beginner', 'free', 'identity-writing', 3, true, false, 0)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  emoji = EXCLUDED.emoji,
  badge = EXCLUDED.badge,
  squad = EXCLUDED.squad,
  level = EXCLUDED.level,
  access = EXCLUDED.access,
  category = EXCLUDED.category,
  totalLessons = EXCLUDED.totalLessons,
  is_visible = EXCLUDED.is_visible,
  is_published = EXCLUDED.is_published,
  sort_order = EXCLUDED.sort_order,
  cover_url = EXCLUDED.cover_url,
  updated_at = NOW();

-- 9. Conflict & Portal Lore Threads (l220-conflict-portal.json)
INSERT INTO courses (id, slug, title, description, emoji, badge, squad, level, access, category, totalLessons, is_visible, is_published, sort_order) VALUES ('l220-conflict-portal', 'l220-conflict-portal', 'Conflict & Portal Lore Threads', 'Master the art of creating compelling narrative tension through conflict and portal lore. Learn to weave stories that create emotional investment, community engagement, and cultural depth.', '🌌', 'Narrative Weaver', 'Speakers', 'advanced', 'squad-gated', 'narrative-tension', 4, true, false, 0)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  emoji = EXCLUDED.emoji,
  badge = EXCLUDED.badge,
  squad = EXCLUDED.squad,
  level = EXCLUDED.level,
  access = EXCLUDED.access,
  category = EXCLUDED.category,
  totalLessons = EXCLUDED.totalLessons,
  is_visible = EXCLUDED.is_visible,
  is_published = EXCLUDED.is_published,
  sort_order = EXCLUDED.sort_order,
  cover_url = EXCLUDED.cover_url,
  updated_at = NOW();

-- 10. Threadweaving & Meme Lore Fusion (l250-threadweaving.json)
INSERT INTO courses (id, slug, title, description, emoji, badge, squad, level, access, category, totalLessons, is_visible, is_published, sort_order) VALUES ('l250-threadweaving', 'l250-threadweaving', 'Threadweaving & Meme Lore Fusion', 'Master the art of creating viral Twitter threads that weave together memes, lore, and community narratives. Learn to craft compelling stories that spread across platforms.', '🧵', 'Thread Weaver', 'creators', 'advanced', 'hoodie-gated', 'platform-strategy', 4, true, false, 0)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  emoji = EXCLUDED.emoji,
  badge = EXCLUDED.badge,
  squad = EXCLUDED.squad,
  level = EXCLUDED.level,
  access = EXCLUDED.access,
  category = EXCLUDED.category,
  totalLessons = EXCLUDED.totalLessons,
  is_visible = EXCLUDED.is_visible,
  is_published = EXCLUDED.is_published,
  sort_order = EXCLUDED.sort_order,
  cover_url = EXCLUDED.cover_url,
  updated_at = NOW();

-- 11. Meme Coin Mania (meme-coin-mania.json)
INSERT INTO courses (id, slug, title, description, emoji, badge, squad, level, access, category, totalLessons, is_visible, is_published, sort_order) VALUES ('meme-coin-mania', 'meme-coin-mania', 'Meme Coin Mania', 'Analyze meme coin trends via X data, build a mock portfolio, and learn to navigate hype with live price tracking and interactive quizzes.', '💰', 'Moon Merchant', 'raiders', 'beginner', 'free', 'trading', 4, true, false, 0)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  emoji = EXCLUDED.emoji,
  badge = EXCLUDED.badge,
  squad = EXCLUDED.squad,
  level = EXCLUDED.level,
  access = EXCLUDED.access,
  category = EXCLUDED.category,
  totalLessons = EXCLUDED.totalLessons,
  is_visible = EXCLUDED.is_visible,
  is_published = EXCLUDED.is_published,
  sort_order = EXCLUDED.sort_order,
  cover_url = EXCLUDED.cover_url,
  updated_at = NOW();

-- 12. N100 – NFT Marketplaces 101: Where the Magic Happens (n100-nft-marketplaces.json)
INSERT INTO courses (id, slug, title, description, emoji, badge, squad, level, access, category, totalLessons, is_visible, is_published, sort_order) VALUES ('n100-nft-marketplaces', 'n100-nft-marketplaces-101-where-the-magic-happens', 'N100 – NFT Marketplaces 101: Where the Magic Happens', 'Master Solana''s top NFT marketplaces: Magic Eden and Tensor. Learn to navigate interfaces, understand liquidity, and place your first bids.', '🏪', 'Marketplace Navigator', 'decoders', 'beginner', 'free', 'marketplaces', 5, true, false, 0)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  emoji = EXCLUDED.emoji,
  badge = EXCLUDED.badge,
  squad = EXCLUDED.squad,
  level = EXCLUDED.level,
  access = EXCLUDED.access,
  category = EXCLUDED.category,
  totalLessons = EXCLUDED.totalLessons,
  is_visible = EXCLUDED.is_visible,
  is_published = EXCLUDED.is_published,
  sort_order = EXCLUDED.sort_order,
  cover_url = EXCLUDED.cover_url,
  updated_at = NOW();

-- 13. 🧠 NFT Lingo Decoded (n120-nft-lingo-decoded.json)
INSERT INTO courses (id, slug, title, description, emoji, badge, squad, level, access, category, totalLessons, is_visible, is_published, sort_order) VALUES ('n120-nft-lingo-decoded', '-nft-lingo-decoded', '🧠 NFT Lingo Decoded', 'Master the language of NFT Twitter and Web3 culture. Learn to speak like a true degen and decode the hidden meanings behind NFT slang.', '🗣️', 'Lingo Master', 'decoders', 'beginner', 'free', 'culture', 4, true, false, 0)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  emoji = EXCLUDED.emoji,
  badge = EXCLUDED.badge,
  squad = EXCLUDED.squad,
  level = EXCLUDED.level,
  access = EXCLUDED.access,
  category = EXCLUDED.category,
  totalLessons = EXCLUDED.totalLessons,
  is_visible = EXCLUDED.is_visible,
  is_published = EXCLUDED.is_published,
  sort_order = EXCLUDED.sort_order,
  cover_url = EXCLUDED.cover_url,
  updated_at = NOW();

-- 14. Bid Games & Floor Strategy (n150-bid-games.json)
INSERT INTO courses (id, slug, title, description, emoji, badge, squad, level, access, category, totalLessons, is_visible, is_published, sort_order) VALUES ('n150-bid-games', 'n150-bid-games', 'Bid Games & Floor Strategy', 'Master the psychological warfare of NFT bidding and floor manipulation. Learn to read market psychology, time your bids, and execute strategic floor raids.', '🎯', 'Floor Raider', 'raiders', 'intermediate', 'hoodie-gated', 'market-raiding', 5, true, false, 0)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  emoji = EXCLUDED.emoji,
  badge = EXCLUDED.badge,
  squad = EXCLUDED.squad,
  level = EXCLUDED.level,
  access = EXCLUDED.access,
  category = EXCLUDED.category,
  totalLessons = EXCLUDED.totalLessons,
  is_visible = EXCLUDED.is_visible,
  is_published = EXCLUDED.is_published,
  sort_order = EXCLUDED.sort_order,
  cover_url = EXCLUDED.cover_url,
  updated_at = NOW();

-- 15. N150 – Bids, Listings, and Floor Games (n150-floor-games.json)
INSERT INTO courses (id, slug, title, description, emoji, badge, squad, level, access, category, totalLessons, is_visible, is_published, sort_order) VALUES ('n150-floor-games', 'n150-bids-listings-and-floor-games', 'N150 – Bids, Listings, and Floor Games', 'Master the art of floor trading with advanced strategies for bids, listings, and market manipulation tactics.', '🎯', 'Floor Tactician', 'raiders', 'beginner', 'free', 'trading', 5, true, false, 0)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  emoji = EXCLUDED.emoji,
  badge = EXCLUDED.badge,
  squad = EXCLUDED.squad,
  level = EXCLUDED.level,
  access = EXCLUDED.access,
  category = EXCLUDED.category,
  totalLessons = EXCLUDED.totalLessons,
  is_visible = EXCLUDED.is_visible,
  is_published = EXCLUDED.is_published,
  sort_order = EXCLUDED.sort_order,
  cover_url = EXCLUDED.cover_url,
  updated_at = NOW();

-- 16. Trait Meta & Rarity Psychology (n200-trait-meta.json)
INSERT INTO courses (id, slug, title, description, emoji, badge, squad, level, access, category, totalLessons, is_visible, is_published, sort_order) VALUES ('n200-trait-meta', 'n200-trait-meta', 'Trait Meta & Rarity Psychology', 'Master the psychology behind NFT trait rarity and market dynamics. Learn to analyze trait meta shifts and predict floor movements based on rarity psychology.', '🧠', 'Meta Analyst', 'decoders', 'intermediate', 'hoodie-gated', 'nft-data-interpretation', 5, true, false, 0)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  emoji = EXCLUDED.emoji,
  badge = EXCLUDED.badge,
  squad = EXCLUDED.squad,
  level = EXCLUDED.level,
  access = EXCLUDED.access,
  category = EXCLUDED.category,
  totalLessons = EXCLUDED.totalLessons,
  is_visible = EXCLUDED.is_visible,
  is_published = EXCLUDED.is_published,
  sort_order = EXCLUDED.sort_order,
  cover_url = EXCLUDED.cover_url,
  updated_at = NOW();

-- 17. Collector Archetypes (n300-collector-archetypes.json)
INSERT INTO courses (id, slug, title, description, emoji, badge, squad, level, access, category, totalLessons, is_visible, is_published, sort_order) VALUES ('n300-collector-archetypes', 'n300-collector-archetypes', 'Collector Archetypes', 'Master the psychology and behavior patterns of different NFT collector types. Learn to understand, engage, and communicate effectively with various collector archetypes in your community.', '🎭', 'Collector Whisperer', 'Speakers', 'advanced', 'squad-gated', 'audience-understanding', 4, true, false, 0)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  emoji = EXCLUDED.emoji,
  badge = EXCLUDED.badge,
  squad = EXCLUDED.squad,
  level = EXCLUDED.level,
  access = EXCLUDED.access,
  category = EXCLUDED.category,
  totalLessons = EXCLUDED.totalLessons,
  is_visible = EXCLUDED.is_visible,
  is_published = EXCLUDED.is_published,
  sort_order = EXCLUDED.sort_order,
  cover_url = EXCLUDED.cover_url,
  updated_at = NOW();

-- 18. NFT Mastery (nft-mastery.json)
INSERT INTO courses (id, slug, title, description, emoji, badge, squad, level, access, category, totalLessons, is_visible, is_published, sort_order) VALUES ('nft-mastery', 'nft-mastery', 'NFT Mastery', 'Learn the ins and outs of NFTs, from creation to trading and community building, with interactive quizzes and mock minting.', '👾', 'NFT Ninja', 'creators', 'beginner', 'free', 'nft', 4, true, false, 0)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  emoji = EXCLUDED.emoji,
  badge = EXCLUDED.badge,
  squad = EXCLUDED.squad,
  level = EXCLUDED.level,
  access = EXCLUDED.access,
  category = EXCLUDED.category,
  totalLessons = EXCLUDED.totalLessons,
  is_visible = EXCLUDED.is_visible,
  is_published = EXCLUDED.is_published,
  sort_order = EXCLUDED.sort_order,
  cover_url = EXCLUDED.cover_url,
  updated_at = NOW();

-- 19. Raid Psychology 101 (o120-raid-psychology.json)
INSERT INTO courses (id, slug, title, description, emoji, badge, squad, level, access, category, totalLessons, is_visible, is_published, sort_order) VALUES ('o120-raid-psychology', 'o120-raid-psychology', 'Raid Psychology 101', 'Master the psychology behind successful raids and social manipulation. Learn to weaponize timing, mimicry, and memetics to create cultural impact.', '⚔️', 'Raid Master', 'raiders', 'beginner', 'free', 'behavior-social-tactics', 5, true, false, 0)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  emoji = EXCLUDED.emoji,
  badge = EXCLUDED.badge,
  squad = EXCLUDED.squad,
  level = EXCLUDED.level,
  access = EXCLUDED.access,
  category = EXCLUDED.category,
  totalLessons = EXCLUDED.totalLessons,
  is_visible = EXCLUDED.is_visible,
  is_published = EXCLUDED.is_published,
  sort_order = EXCLUDED.sort_order,
  cover_url = EXCLUDED.cover_url,
  updated_at = NOW();

-- 20. Space Hosting Fundamentals (o200-space-hosting.json)
INSERT INTO courses (id, slug, title, description, emoji, badge, squad, level, access, category, totalLessons, is_visible, is_published, sort_order) VALUES ('o200-space-hosting', 'o200-space-hosting', 'Space Hosting Fundamentals', 'Master the art of hosting engaging Twitter Spaces that build community, amplify culture, and drive meaningful conversations. Learn to create memorable experiences that keep people coming back.', '🎤', 'Space Master', 'Speakers', 'beginner', 'free', 'public-communication', 5, true, false, 0)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  emoji = EXCLUDED.emoji,
  badge = EXCLUDED.badge,
  squad = EXCLUDED.squad,
  level = EXCLUDED.level,
  access = EXCLUDED.access,
  category = EXCLUDED.category,
  totalLessons = EXCLUDED.totalLessons,
  is_visible = EXCLUDED.is_visible,
  is_published = EXCLUDED.is_published,
  sort_order = EXCLUDED.sort_order,
  cover_url = EXCLUDED.cover_url,
  updated_at = NOW();

-- 21. Squad Ritual Design (o220-squad-ritual.json)
INSERT INTO courses (id, slug, title, description, emoji, badge, squad, level, access, category, totalLessons, is_visible, is_published, sort_order) VALUES ('o220-squad-ritual', 'o220-squad-ritual', 'Squad Ritual Design', 'Learn to design and facilitate meaningful rituals that activate lore, build community bonds, and create lasting cultural impact. Master the art of turning moments into memories.', '🕯️', 'Ritual Weaver', 'Speakers', 'beginner', 'free', 'lore-activation', 4, true, false, 0)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  emoji = EXCLUDED.emoji,
  badge = EXCLUDED.badge,
  squad = EXCLUDED.squad,
  level = EXCLUDED.level,
  access = EXCLUDED.access,
  category = EXCLUDED.category,
  totalLessons = EXCLUDED.totalLessons,
  is_visible = EXCLUDED.is_visible,
  is_published = EXCLUDED.is_published,
  sort_order = EXCLUDED.sort_order,
  cover_url = EXCLUDED.cover_url,
  updated_at = NOW();

-- 22. Onboarding Like a Wizard (o250-onboarding-wizard.json)
INSERT INTO courses (id, slug, title, description, emoji, badge, squad, level, access, category, totalLessons, is_visible, is_published, sort_order) VALUES ('o250-onboarding-wizard', 'o250-onboarding-wizard', 'Onboarding Like a Wizard', 'Master the art of converting newcomers into active community members. Learn psychological triggers, trust-building techniques, and conversion strategies that turn prospects into raiders.', '🧙‍♂️', 'Conversion Wizard', 'raiders', 'intermediate', 'hoodie-gated', 'conversion-strategy', 6, true, false, 0)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  emoji = EXCLUDED.emoji,
  badge = EXCLUDED.badge,
  squad = EXCLUDED.squad,
  level = EXCLUDED.level,
  access = EXCLUDED.access,
  category = EXCLUDED.category,
  totalLessons = EXCLUDED.totalLessons,
  is_visible = EXCLUDED.is_visible,
  is_published = EXCLUDED.is_published,
  sort_order = EXCLUDED.sort_order,
  cover_url = EXCLUDED.cover_url,
  updated_at = NOW();

-- 23. Scaling Vibes Without Selling Out (o300-scaling-vibes.json)
INSERT INTO courses (id, slug, title, description, emoji, badge, squad, level, access, category, totalLessons, is_visible, is_published, sort_order) VALUES ('o300-scaling-vibes', 'o300-scaling-vibes', 'Scaling Vibes Without Selling Out', 'Master the art of growing community culture while maintaining authenticity and core values. Learn to scale vibes without compromising the soul of your community.', '🌟', 'Vibe Guardian', 'Speakers', 'advanced', 'squad-gated', 'brand-cohesion', 5, true, false, 0)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  emoji = EXCLUDED.emoji,
  badge = EXCLUDED.badge,
  squad = EXCLUDED.squad,
  level = EXCLUDED.level,
  access = EXCLUDED.access,
  category = EXCLUDED.category,
  totalLessons = EXCLUDED.totalLessons,
  is_visible = EXCLUDED.is_visible,
  is_published = EXCLUDED.is_published,
  sort_order = EXCLUDED.sort_order,
  cover_url = EXCLUDED.cover_url,
  updated_at = NOW();

-- 24. S120 – Cold Truths of Self-Custody (s120-cold-truths-self-custody.json)
INSERT INTO courses (id, slug, title, description, emoji, badge, squad, level, access, category, totalLessons, is_visible, is_published, sort_order) VALUES ('s120-cold-truths-self-custody', 's120-cold-truths-of-self-custody', 'S120 – Cold Truths of Self-Custody', 'The brutal reality of self-custody security. Learn why cold wallets aren''t forever, how human error equals finality, the hidden costs of security, recovery planning, and why sovereignty is a skill, not a setting.', '🧊', 'Survival Badge', 'decoders', 'beginner', 'free', 'security', 12, true, false, 0)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  emoji = EXCLUDED.emoji,
  badge = EXCLUDED.badge,
  squad = EXCLUDED.squad,
  level = EXCLUDED.level,
  access = EXCLUDED.access,
  category = EXCLUDED.category,
  totalLessons = EXCLUDED.totalLessons,
  is_visible = EXCLUDED.is_visible,
  is_published = EXCLUDED.is_published,
  sort_order = EXCLUDED.sort_order,
  cover_url = EXCLUDED.cover_url,
  updated_at = NOW();

-- 25. Solana Ecosystem Mastery (solana-ecosystem-mastery.json)
INSERT INTO courses (id, slug, title, description, emoji, badge, squad, level, access, category, totalLessons, is_visible, is_published, sort_order) VALUES ('solana-ecosystem-mastery', 'solana-ecosystem-mastery', 'Solana Ecosystem Mastery', 'Master the most innovative projects in the Solana ecosystem: Portals, Chronos, and Qase. Learn about no-code gaming platforms, DeFi protocols, and cutting-edge blockchain applications.', '☀️', 'Solana Sage', 'raiders', 'intermediate', 'free', 'defi', 6, true, false, 0)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  emoji = EXCLUDED.emoji,
  badge = EXCLUDED.badge,
  squad = EXCLUDED.squad,
  level = EXCLUDED.level,
  access = EXCLUDED.access,
  category = EXCLUDED.category,
  totalLessons = EXCLUDED.totalLessons,
  is_visible = EXCLUDED.is_visible,
  is_published = EXCLUDED.is_published,
  sort_order = EXCLUDED.sort_order,
  cover_url = EXCLUDED.cover_url,
  updated_at = NOW();

-- 26. T100 🎯 Intro to Indicators: RSI, BBands, Fibs + Candle Basics (t100-chart-literacy.json)
INSERT INTO courses (id, slug, title, description, emoji, badge, squad, level, access, category, totalLessons, is_visible, is_published, sort_order) VALUES ('t100-chart-literacy', 't100-intro-to-indicators-rsi-bbands-fibs-candle-basics', 'T100 🎯 Intro to Indicators: RSI, BBands, Fibs + Candle Basics', 'Learn the core tools of technical analysis: RSI, Bollinger Bands, Fibonacci levels, and candlestick theory. Understand how they work, when they lie, and how to combine them for real confluence.', '📊', 'Indicator Initiate', 'All Squads', 'beginner', 'free', 'technical-analysis', 2, true, false, 0)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  emoji = EXCLUDED.emoji,
  badge = EXCLUDED.badge,
  squad = EXCLUDED.squad,
  level = EXCLUDED.level,
  access = EXCLUDED.access,
  category = EXCLUDED.category,
  totalLessons = EXCLUDED.totalLessons,
  is_visible = EXCLUDED.is_visible,
  is_published = EXCLUDED.is_published,
  sort_order = EXCLUDED.sort_order,
  cover_url = EXCLUDED.cover_url,
  updated_at = NOW();

-- 27. Support, Resistance, & Volume Zones (t120-support-resistance.json)
INSERT INTO courses (id, slug, title, description, emoji, badge, squad, level, access, category, totalLessons, is_visible, is_published, sort_order) VALUES ('t120-support-resistance', 't120-support-resistance', 'Support, Resistance, & Volume Zones', 'Master the identification and analysis of key price levels. Learn to spot support, resistance, and volume zones that drive market psychology.', '🎯', 'Level Hunter', 'decoders', 'beginner', 'free', 'price-action-literacy', 6, true, false, 0)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  emoji = EXCLUDED.emoji,
  badge = EXCLUDED.badge,
  squad = EXCLUDED.squad,
  level = EXCLUDED.level,
  access = EXCLUDED.access,
  category = EXCLUDED.category,
  totalLessons = EXCLUDED.totalLessons,
  is_visible = EXCLUDED.is_visible,
  is_published = EXCLUDED.is_published,
  sort_order = EXCLUDED.sort_order,
  cover_url = EXCLUDED.cover_url,
  updated_at = NOW();

-- 28. Confluence & Entry Strategy (t200-confluence-strategy.json)
INSERT INTO courses (id, slug, title, description, emoji, badge, squad, level, access, category, totalLessons, is_visible, is_published, sort_order) VALUES ('t200-confluence-strategy', 't200-confluence-strategy', 'Confluence & Entry Strategy', 'Master the art of finding high-probability trade setups by combining multiple technical signals. Learn to identify confluence zones where multiple indicators align.', '🎯', 'Confluence Hunter', 'decoders', 'intermediate', 'hoodie-gated', 'multi-signal-strategy', 7, true, false, 0)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  emoji = EXCLUDED.emoji,
  badge = EXCLUDED.badge,
  squad = EXCLUDED.squad,
  level = EXCLUDED.level,
  access = EXCLUDED.access,
  category = EXCLUDED.category,
  totalLessons = EXCLUDED.totalLessons,
  is_visible = EXCLUDED.is_visible,
  is_published = EXCLUDED.is_published,
  sort_order = EXCLUDED.sort_order,
  cover_url = EXCLUDED.cover_url,
  updated_at = NOW();

-- 29. Emotional Traps & Tilt Defense (t250-emotional-traps.json)
INSERT INTO courses (id, slug, title, description, emoji, badge, squad, level, access, category, totalLessons, is_visible, is_published, sort_order) VALUES ('t250-emotional-traps', 't250-emotional-traps', 'Emotional Traps & Tilt Defense', 'Master psychological stability in high-pressure trading and raiding situations. Learn to recognize emotional traps, manage tilt, and maintain peak performance under stress.', '🧘', 'Tilt Master', 'raiders', 'intermediate', 'hoodie-gated', 'psychological-stability', 4, true, false, 0)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  emoji = EXCLUDED.emoji,
  badge = EXCLUDED.badge,
  squad = EXCLUDED.squad,
  level = EXCLUDED.level,
  access = EXCLUDED.access,
  category = EXCLUDED.category,
  totalLessons = EXCLUDED.totalLessons,
  is_visible = EXCLUDED.is_visible,
  is_published = EXCLUDED.is_published,
  sort_order = EXCLUDED.sort_order,
  cover_url = EXCLUDED.cover_url,
  updated_at = NOW();

-- 30. Pixel Art Basics (v100-pixel-art-basics.json)
INSERT INTO courses (id, slug, title, description, emoji, badge, squad, level, access, category, totalLessons, is_visible, is_published, sort_order) VALUES ('v100-pixel-art-basics', 'v100-pixel-art-basics', 'Pixel Art Basics', 'Master the fundamentals of pixel art creation for Web3 projects. Learn color theory, composition, and the technical skills needed to create compelling visual assets.', '🎨', 'Pixel Pioneer', 'creators', 'beginner', 'free', 'visual-foundation', 5, true, false, 0)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  emoji = EXCLUDED.emoji,
  badge = EXCLUDED.badge,
  squad = EXCLUDED.squad,
  level = EXCLUDED.level,
  access = EXCLUDED.access,
  category = EXCLUDED.category,
  totalLessons = EXCLUDED.totalLessons,
  is_visible = EXCLUDED.is_visible,
  is_published = EXCLUDED.is_published,
  sort_order = EXCLUDED.sort_order,
  cover_url = EXCLUDED.cover_url,
  updated_at = NOW();

-- 31. Meme Creation + Copywriting Hacks (v120-meme-copywriting.json)
INSERT INTO courses (id, slug, title, description, emoji, badge, squad, level, access, category, totalLessons, is_visible, is_published, sort_order) VALUES ('v120-meme-copywriting', 'v120-meme-copywriting', 'Meme Creation + Copywriting Hacks', 'Master the art of creating viral memes and compelling copy that drives timeline manipulation. Learn to craft payloads that spread and influence cultural narratives.', '💥', 'Timeline Warrior', 'raiders', 'beginner', 'free', 'timeline-payloads', 4, true, false, 0)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  emoji = EXCLUDED.emoji,
  badge = EXCLUDED.badge,
  squad = EXCLUDED.squad,
  level = EXCLUDED.level,
  access = EXCLUDED.access,
  category = EXCLUDED.category,
  totalLessons = EXCLUDED.totalLessons,
  is_visible = EXCLUDED.is_visible,
  is_published = EXCLUDED.is_published,
  sort_order = EXCLUDED.sort_order,
  cover_url = EXCLUDED.cover_url,
  updated_at = NOW();

-- 32. Meme Creation for Lore & Laughs (v120-meme-creation.json)
INSERT INTO courses (id, slug, title, description, emoji, badge, squad, level, access, category, totalLessons, is_visible, is_published, sort_order) VALUES ('v120-meme-creation', 'v120-meme-creation', 'Meme Creation for Lore & Laughs', 'Learn to craft viral memes that spread lore and build community. Master the art of visual storytelling through humor and cultural references.', '😂', 'Meme Master', 'creators', 'beginner', 'free', 'communication-design', 4, true, false, 0)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  emoji = EXCLUDED.emoji,
  badge = EXCLUDED.badge,
  squad = EXCLUDED.squad,
  level = EXCLUDED.level,
  access = EXCLUDED.access,
  category = EXCLUDED.category,
  totalLessons = EXCLUDED.totalLessons,
  is_visible = EXCLUDED.is_visible,
  is_published = EXCLUDED.is_published,
  sort_order = EXCLUDED.sort_order,
  cover_url = EXCLUDED.cover_url,
  updated_at = NOW();

-- 33. Visual Composition & Meme Flow (v150-visual-composition.json)
INSERT INTO courses (id, slug, title, description, emoji, badge, squad, level, access, category, totalLessons, is_visible, is_published, sort_order) VALUES ('v150-visual-composition', 'v150-visual-composition', 'Visual Composition & Meme Flow', 'Master the principles of visual composition to create memes that capture attention and guide the viewer''s eye through your narrative.', '🎯', 'Flow Master', 'creators', 'intermediate', 'free', 'attention-mechanics', 6, true, false, 0)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  emoji = EXCLUDED.emoji,
  badge = EXCLUDED.badge,
  squad = EXCLUDED.squad,
  level = EXCLUDED.level,
  access = EXCLUDED.access,
  category = EXCLUDED.category,
  totalLessons = EXCLUDED.totalLessons,
  is_visible = EXCLUDED.is_visible,
  is_published = EXCLUDED.is_published,
  sort_order = EXCLUDED.sort_order,
  cover_url = EXCLUDED.cover_url,
  updated_at = NOW();

-- 34. Custom Trait Creation (v200-custom-trait-creation.json)
INSERT INTO courses (id, slug, title, description, emoji, badge, squad, level, access, category, totalLessons, is_visible, is_published, sort_order) VALUES ('v200-custom-trait-creation', 'v200-custom-trait-creation', 'Custom Trait Creation', 'Learn to design and create custom traits for NFT collections. Master the art of trait design that enhances rarity, aesthetics, and community value.', '⚡', 'Trait Architect', 'creators', 'intermediate', 'hoodie-gated', 'artistic-strategy', 5, true, false, 0)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  emoji = EXCLUDED.emoji,
  badge = EXCLUDED.badge,
  squad = EXCLUDED.squad,
  level = EXCLUDED.level,
  access = EXCLUDED.access,
  category = EXCLUDED.category,
  totalLessons = EXCLUDED.totalLessons,
  is_visible = EXCLUDED.is_visible,
  is_published = EXCLUDED.is_published,
  sort_order = EXCLUDED.sort_order,
  cover_url = EXCLUDED.cover_url,
  updated_at = NOW();

-- 35. Comics & Sequential Storytelling (v220-comics-sequential.json)
INSERT INTO courses (id, slug, title, description, emoji, badge, squad, level, access, category, totalLessons, is_visible, is_published, sort_order) VALUES ('v220-comics-sequential', 'v220-comics-sequential', 'Comics & Sequential Storytelling', 'Master the art of sequential storytelling through comics and visual narratives. Learn to create compelling stories that engage and build community lore.', '📖', 'Story Weaver', 'creators', 'intermediate', 'hoodie-gated', 'narrative-design', 4, true, false, 0)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  emoji = EXCLUDED.emoji,
  badge = EXCLUDED.badge,
  squad = EXCLUDED.squad,
  level = EXCLUDED.level,
  access = EXCLUDED.access,
  category = EXCLUDED.category,
  totalLessons = EXCLUDED.totalLessons,
  is_visible = EXCLUDED.is_visible,
  is_published = EXCLUDED.is_published,
  sort_order = EXCLUDED.sort_order,
  cover_url = EXCLUDED.cover_url,
  updated_at = NOW();

-- 36. Micro-Animation & Emote Delivery (v250-micro-animation.json)
INSERT INTO courses (id, slug, title, description, emoji, badge, squad, level, access, category, totalLessons, is_visible, is_published, sort_order) VALUES ('v250-micro-animation', 'v250-micro-animation', 'Micro-Animation & Emote Delivery', 'Master the art of creating micro-animations and emotes that enhance communication, express emotion, and amplify your digital presence. Learn to deliver visual impact in small, powerful packages.', '✨', 'Emote Master', 'Speakers', 'intermediate', 'optional', 'visual-delivery', 3, true, false, 0)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  emoji = EXCLUDED.emoji,
  badge = EXCLUDED.badge,
  squad = EXCLUDED.squad,
  level = EXCLUDED.level,
  access = EXCLUDED.access,
  category = EXCLUDED.category,
  totalLessons = EXCLUDED.totalLessons,
  is_visible = EXCLUDED.is_visible,
  is_published = EXCLUDED.is_published,
  sort_order = EXCLUDED.sort_order,
  cover_url = EXCLUDED.cover_url,
  updated_at = NOW();

-- 37. Wallet Wizardry: Security Fundamentals (wallet-wizardry-basics.json)
INSERT INTO courses (id, slug, title, description, emoji, badge, squad, level, access, category, totalLessons, is_visible, is_published, sort_order) VALUES ('wallet-wizardry-basics', 'wallet-wizardry-security-fundamentals', 'Wallet Wizardry: Security Fundamentals', 'Master the basics of wallet security and best practices for protecting your digital assets', '🔐', 'Security Badge', 'decoders', 'beginner', 'free', 'security', 6, true, false, 0)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  emoji = EXCLUDED.emoji,
  badge = EXCLUDED.badge,
  squad = EXCLUDED.squad,
  level = EXCLUDED.level,
  access = EXCLUDED.access,
  category = EXCLUDED.category,
  totalLessons = EXCLUDED.totalLessons,
  is_visible = EXCLUDED.is_visible,
  is_published = EXCLUDED.is_published,
  sort_order = EXCLUDED.sort_order,
  cover_url = EXCLUDED.cover_url,
  updated_at = NOW();

-- 38. Wallet Wizardry (wallet-wizardry.json)
INSERT INTO courses (id, slug, title, description, emoji, badge, squad, level, access, category, totalLessons, is_visible, is_published, sort_order) VALUES ('wallet-wizardry', 'wallet-wizardry', 'Wallet Wizardry', 'Master wallet setup with interactive quizzes and MetaMask integration.', '🔒', 'Vault Keeper', 'decoders', 'beginner', 'free', 'wallet', 4, true, false, 0)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  emoji = EXCLUDED.emoji,
  badge = EXCLUDED.badge,
  squad = EXCLUDED.squad,
  level = EXCLUDED.level,
  access = EXCLUDED.access,
  category = EXCLUDED.category,
  totalLessons = EXCLUDED.totalLessons,
  is_visible = EXCLUDED.is_visible,
  is_published = EXCLUDED.is_published,
  sort_order = EXCLUDED.sort_order,
  cover_url = EXCLUDED.cover_url,
  updated_at = NOW();

-- 39. Trait Creation Masterclass (wc300-trait-masterclass.json)
INSERT INTO courses (id, slug, title, description, emoji, badge, squad, level, access, category, totalLessons, is_visible, is_published, sort_order) VALUES ('wc300-trait-masterclass', 'wc300-trait-masterclass', 'Trait Creation Masterclass', 'Advanced course for DAO members to master trait creation for official Hoodie Academy collections. Learn professional techniques for creating high-value, community-driven traits.', '⚒️', 'Master Trait Smith', 'creators', 'advanced', 'dao-only', 'dao-mastery', 8, true, false, 0)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  emoji = EXCLUDED.emoji,
  badge = EXCLUDED.badge,
  squad = EXCLUDED.squad,
  level = EXCLUDED.level,
  access = EXCLUDED.access,
  category = EXCLUDED.category,
  totalLessons = EXCLUDED.totalLessons,
  is_visible = EXCLUDED.is_visible,
  is_published = EXCLUDED.is_published,
  sort_order = EXCLUDED.sort_order,
  cover_url = EXCLUDED.cover_url,
  updated_at = NOW();

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check total courses imported
SELECT COUNT(*) as total_courses FROM courses;

-- Check courses by squad
SELECT squad, COUNT(*) as course_count 
FROM courses 
GROUP BY squad 
ORDER BY course_count DESC;

-- Check courses by level
SELECT level, COUNT(*) as course_count 
FROM courses 
GROUP BY level 
ORDER BY course_count DESC;

-- Check courses by access
SELECT access, COUNT(*) as course_count 
FROM courses 
GROUP BY access 
ORDER BY course_count DESC;

-- Check visibility status
SELECT 
  is_visible,
  is_published,
  COUNT(*) as course_count 
FROM courses 
GROUP BY is_visible, is_published 
ORDER BY is_visible, is_published;

-- List all imported courses
SELECT 
  id,
  slug,
  title,
  squad,
  level,
  access,
  is_visible,
  is_published,
  sort_order
FROM courses 
ORDER BY sort_order, title;
