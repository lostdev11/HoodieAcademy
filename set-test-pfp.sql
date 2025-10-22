-- Set Test Profile Picture for Your Wallet
-- Replace 'YOUR_WALLET_ADDRESS' with your actual wallet address
-- Replace 'YOUR_PFP_URL' with your actual profile picture URL

-- Example usage:
-- UPDATE users 
-- SET profile_picture = 'https://example.com/your-pfp.jpg'
-- WHERE wallet_address = 'qg7pNNZq7qDQuc6Xkd1x4NvS2VM3aHtCqHEzucZxRGA';

-- Check if your user exists
SELECT 
  wallet_address,
  display_name,
  squad,
  profile_picture,
  created_at
FROM users 
WHERE wallet_address = 'YOUR_WALLET_ADDRESS';

-- Update your profile picture
UPDATE users 
SET 
  profile_picture = 'YOUR_PFP_URL',
  updated_at = NOW()
WHERE wallet_address = 'YOUR_WALLET_ADDRESS';

-- Verify the update
SELECT 
  wallet_address,
  display_name,
  squad,
  profile_picture,
  updated_at
FROM users 
WHERE wallet_address = 'YOUR_WALLET_ADDRESS';

-- Alternative: Set a test PFP URL (replace with your actual wallet)
-- UPDATE users 
-- SET profile_picture = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
-- WHERE wallet_address = 'qg7pNNZq7qDQuc6Xkd1x4NvS2VM3aHtCqHEzucZxRGA';

-- Check all users with profile pictures
SELECT 
  wallet_address,
  display_name,
  squad,
  profile_picture
FROM users 
WHERE profile_picture IS NOT NULL
ORDER BY updated_at DESC;
