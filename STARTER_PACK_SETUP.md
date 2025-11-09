# Web3 Starter Pack Feature - Setup Guide

This document provides setup instructions for the Web3 Starter Pack feature.

## Overview

The Web3 Starter Pack feature allows users to purchase a starter pack for 0.05 SOL, which includes:
- A .sol domain
- $3 worth of SOL (calculated dynamically based on current SOL price)
- A mystery NFT

The flow is:
1. User pays 0.05 SOL → claim saved as pending
2. Admin approves → backend delivers rewards automatically
3. One claim per wallet (enforced)

## Database Setup

1. **IMPORTANT**: Run the SQL script file (NOT the markdown file) in your Supabase SQL Editor:
   - **File to run**: `lib/create-starter-pack-claims-table.sql`
   - **DO NOT run**: `STARTER_PACK_SETUP.md` (this is documentation, not SQL)

2. Steps:
   - Open your Supabase dashboard
   - Go to SQL Editor
   - Click "New Query"
   - Copy and paste the contents of `lib/create-starter-pack-claims-table.sql`
   - Click "Run" to execute

The script creates:
- `starter_pack_claims` table with all required fields
- Indexes for performance
- Row Level Security (RLS) policies
- Triggers for automatic timestamp updates

## Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# Starter Pack Configuration
STARTER_PACK_TREASURY_WALLET=YOUR_TREASURY_WALLET_ADDRESS
STARTER_PACK_DELIVERY_WALLET_PRIVATE_KEY=YOUR_DELIVERY_WALLET_PRIVATE_KEY
STARTER_PACK_DELIVERY_SECRET=YOUR_SECRET_FOR_DELIVERY_API
NEXT_PUBLIC_STARTER_PACK_TREASURY_WALLET=YOUR_TREASURY_WALLET_ADDRESS
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# Optional: For custom RPC endpoint
# NEXT_PUBLIC_SOLANA_RPC_URL=https://your-custom-rpc-endpoint.com
```

### Environment Variables Explained

- **STARTER_PACK_TREASURY_WALLET**: The Solana wallet address that receives payments (0.05 SOL per claim)
- **STARTER_PACK_DELIVERY_WALLET_PRIVATE_KEY**: Private key of the wallet that will send rewards (must have SOL for transactions - will send $3 worth of SOL per claim)
- **STARTER_PACK_DELIVERY_SECRET**: Optional secret for securing the delivery API endpoint
- **NEXT_PUBLIC_STARTER_PACK_TREASURY_WALLET**: Public treasury wallet (used in client-side code)
- **NEXT_PUBLIC_SOLANA_RPC_URL**: Solana RPC endpoint (defaults to mainnet)

## Features

### 1. Client Claim Page (`/starter-pack`)

- Wallet connection
- Payment transaction creation
- Claim submission with on-chain payment verification
- Rip video reveal animation on claim
- Status tracking

### 2. Admin Dashboard (`/admin-dashboard` → Starter Pack tab)

- View all claims with filtering
- Approve/reject claims
- View payment transactions
- Track delivery status
- See delivery details (domain, SOL sent, NFT mint)

### 3. API Routes

- **POST `/api/starter-pack/claim`**: Create a claim with payment verification
- **GET `/api/starter-pack/claim`**: Get claim status for a wallet
- **GET `/api/starter-pack/admin`**: Get all claims (admin only)
- **POST `/api/starter-pack/admin`**: Approve/reject claims (admin only)
- **POST `/api/starter-pack/deliver`**: Delivery worker (automatically triggered on approval)

### 4. Delivery Worker

The delivery worker automatically:
1. Fetches current SOL price from CoinGecko
2. Calculates $3 worth of SOL and sends it to the user's wallet
3. Mints a .sol domain (placeholder - requires Bonfida/SNS integration)
4. Mints a mystery NFT (placeholder - requires Metaplex integration)

**Note**: Domain and NFT minting are placeholders. You'll need to integrate with:
- Bonfida API or SNS (Solana Name Service) for domain minting
- Metaplex for NFT minting

## Claim Price

The claim price is hard-coded to **0.05 SOL** in:
- `src/app/api/starter-pack/claim/route.ts` (line 6)
- `src/app/starter-pack/page.tsx` (line 12)

To change the price, update both files.

## Security

1. **Payment Verification**: All payments are verified on-chain before creating claims
2. **One Claim Per Wallet**: Enforced by database unique constraint
3. **Admin Only Actions**: Admin approval/rejection requires admin wallet verification
4. **Idempotent Delivery**: Delivery worker can be called multiple times safely

## Testing

1. **Test Claim Flow**:
   - Navigate to `/starter-pack`
   - Connect wallet
   - Create payment transaction
   - Submit claim
   - Verify claim appears in admin dashboard

2. **Test Admin Approval**:
   - Go to `/admin-dashboard` → Starter Pack tab
   - Find pending claim
   - Approve claim
   - Verify delivery worker is triggered
   - Check delivery status

3. **Test Rejection**:
   - Reject a claim with reason
   - Verify rejection reason is saved

## Troubleshooting

### Payment Verification Fails

- Check that the payment transaction signature is valid
- Verify the payment amount matches 0.05 SOL (with 99% tolerance)
- Ensure the payment was sent to the correct treasury wallet

### Delivery Fails

- Check that `STARTER_PACK_DELIVERY_WALLET_PRIVATE_KEY` is correctly formatted
- Ensure the delivery wallet has sufficient SOL for transactions
- Verify the Solana RPC endpoint is accessible

### Admin Access Denied

- Verify your wallet is in the `admin_wallets` table or has `is_admin = true` in the `users` table
- Check that you're using the correct wallet address

## Next Steps

1. **Integrate Domain Minting**: Replace placeholder with actual Bonfida/SNS integration
2. **Integrate NFT Minting**: Replace placeholder with actual Metaplex integration
3. **Add Email Notifications**: Notify users when their claim is approved/delivered
4. **Add Analytics**: Track claim conversion rates and delivery success rates

## Files Created

- `lib/create-starter-pack-claims-table.sql` - Database schema
- `src/app/api/starter-pack/claim/route.ts` - Claim creation API
- `src/app/api/starter-pack/admin/route.ts` - Admin management API
- `src/app/api/starter-pack/deliver/route.ts` - Delivery worker
- `src/app/starter-pack/page.tsx` - Client claim page
- `src/components/admin/StarterPackManager.tsx` - Admin dashboard component

## Support

For issues or questions, check the code comments in the API routes and components.

