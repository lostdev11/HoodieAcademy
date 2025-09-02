-- Populate Bounties Table with Sample Data
-- Run this in your Supabase SQL Editor to add test bounties

INSERT INTO bounties (title, short_desc, squad_tag, reward, deadline, status, hidden, submissions) VALUES
(
  'Create NFT Collection Website',
  'Build a modern, responsive website for showcasing an NFT collection with minting functionality.',
  'Creators',
  '500 XP + Hoodie Badge',
  '2024-02-15T23:59:59Z',
  'active',
  false,
  3
),
(
  'Design Trading Strategy Dashboard',
  'Create a comprehensive dashboard for analyzing NFT trading strategies and market trends.',
  'Raiders',
  '300 XP + Trading Badge',
  '2024-02-20T23:59:59Z',
  'active',
  false,
  1
),
(
  'Write AI Trading Bot Guide',
  'Create a comprehensive guide on building AI-powered trading bots for NFT markets.',
  'Decoders',
  '400 XP + AI Badge',
  '2024-02-10T23:59:59Z',
  'completed',
  false,
  5
),
(
  'Community Engagement Campaign',
  'Design and execute a community engagement campaign to grow the Hoodie Academy Discord.',
  'Speakers',
  '200 XP + Community Badge',
  '2024-02-25T23:59:59Z',
  'draft',
  true,
  0
);

-- Verify the data was inserted
SELECT * FROM bounties ORDER BY created_at DESC;

