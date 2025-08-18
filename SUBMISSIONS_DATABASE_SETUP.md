# 🎯 Submissions Database Setup Guide

## Overview

This guide sets up the submissions table with wallet-based identity for the Hoodie Academy platform.

## 📋 Required Tables

### 1. Submissions Table

```sql
-- Create submissions table
CREATE TABLE submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  squad TEXT,
  course_ref TEXT,
  bounty_id TEXT,
  wallet_address TEXT NOT NULL,
  image_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  upvotes JSONB DEFAULT '{}',
  total_upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_submissions_wallet_address ON submissions(wallet_address);
CREATE INDEX idx_submissions_bounty_id ON submissions(bounty_id);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_submissions_created_at ON submissions(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all submissions" ON submissions
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own submissions" ON submissions
  FOR INSERT WITH CHECK (auth.jwt() ->> 'wallet_address' = wallet_address);

CREATE POLICY "Users can update their own submissions" ON submissions
  FOR UPDATE USING (auth.jwt() ->> 'wallet_address' = wallet_address);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_submissions_updated_at 
    BEFORE UPDATE ON submissions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

### 2. Update Users Table (if not exists)

```sql
-- Ensure users table has wallet_address column
ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_address TEXT UNIQUE;

-- Create index for wallet_address
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);
```

## 🔗 Foreign Key Relationships

```sql
-- Add foreign key constraint to submissions table
ALTER TABLE submissions 
ADD CONSTRAINT fk_submissions_wallet_address 
FOREIGN KEY (wallet_address) 
REFERENCES users(wallet_address) 
ON DELETE CASCADE;
```

## 📊 Sample Data

```sql
-- Insert sample submissions
INSERT INTO submissions (
  title, 
  description, 
  squad, 
  course_ref, 
  bounty_id, 
  wallet_address, 
  image_url, 
  status, 
  upvotes, 
  total_upvotes
) VALUES (
  'Cyber Hoodie Academy Student',
  'Created a pixel art character for the Hoodie Academy! Used a limited 8-color palette with cel shading.',
  'Creators',
  'v100-pixel-art-basics',
  'hoodie-visual',
  'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU',
  '/uploads/cyber-hoodie-student.png',
  'approved',
  '{"🔥": [{"userId": "user456", "squad": "Raiders", "timestamp": "2024-01-15T11:00:00.000Z"}], "⭐": [{"userId": "user123", "squad": "Creators", "timestamp": "2024-01-15T11:15:00.000Z"}]}',
  2
);
```

## 🎯 Benefits

1. **Spam Reduction**: Wallet-based identity prevents anonymous spam submissions
2. **Future Reward Systems**: Enables NFT badges and reputation points
3. **DAO Voting**: Foundation for community governance and role gating
4. **Audit Trail**: Complete history of user contributions
5. **Reputation Building**: Users build reputation through their wallet address

## 🔧 API Integration

The submissions API now supports:

- `GET /api/submissions` - Fetch all submissions
- `POST /api/submissions` - Create new submission (requires wallet address)
- `PUT /api/submissions/:id/upvote` - Upvote submission
- `PUT /api/submissions/:id/review` - Review submission (admin only)

## 🚀 Next Steps

1. **NFT Badges**: Create "Certified Hoodie Builder" NFTs for approved submissions
2. **Reputation System**: Implement reputation points based on submission quality
3. **DAO Integration**: Enable wallet-based voting on submissions
4. **Role Gating**: Use wallet addresses for access control to premium features 