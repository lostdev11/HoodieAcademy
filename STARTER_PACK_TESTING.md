# Starter Pack Feature - Testing Checklist

## Quick Test Guide

### 1. Test Client Claim Page

1. **Navigate to `/starter-pack`**
   - You should see the Web3 Starter Pack page with wallet connection button

2. **Connect Wallet**
   - Click "Connect Wallet"
   - Approve connection in Phantom wallet
   - Wallet address should display

3. **Create a Claim**
   - Click "Claim for 0.05 SOL"
   - Approve the transaction in your wallet
   - You should see the rip video reveal animation
   - Claim should be created with status "pending"

### 2. Test Admin Dashboard

1. **Navigate to `/admin-dashboard`**
   - Make sure you're logged in as an admin

2. **Go to Starter Pack Tab**
   - Click on "Starter Pack" tab (or select from dropdown on mobile)
   - You should see the claim you just created

3. **Approve a Claim**
   - Find a pending claim
   - Click "Approve"
   - Claim status should change to "approved"
   - Delivery worker should be triggered automatically

4. **Reject a Claim (Optional)**
   - Find a pending claim
   - Click "Reject"
   - Enter a rejection reason
   - Claim status should change to "rejected"

### 3. Verify Payment Verification

1. **Check Payment Transaction**
   - In the admin dashboard, click on the payment transaction link
   - Should open Solscan showing the transaction
   - Verify it shows 0.05 SOL sent to treasury wallet

2. **Check Claim Status**
   - After approval, check if delivery started
   - Look for SOL send transaction ($3 worth of SOL - calculated dynamically)
   - Domain and NFT minting are placeholders for now

## Common Issues & Solutions

### Issue: "Wallet not connected"
- **Solution**: Make sure Phantom wallet is installed and unlocked
- Check browser console for errors

### Issue: "Payment verification failed"
- **Solution**: 
  - Verify `STARTER_PACK_TREASURY_WALLET` is correct
  - Check that payment was sent to the correct address
  - Verify payment amount is exactly 0.05 SOL

### Issue: "Admin access denied"
- **Solution**: 
  - Verify your wallet is in `admin_wallets` table
  - Or verify `is_admin = true` in `users` table

### Issue: "Delivery failed"
- **Solution**:
  - Check `STARTER_PACK_DELIVERY_WALLET_PRIVATE_KEY` is correct
  - Verify delivery wallet has sufficient SOL
  - Check Solana RPC endpoint is accessible

## Testing Checklist

- [ ] Client page loads correctly
- [ ] Wallet connection works
- [ ] Payment transaction creates successfully
- [ ] Claim is created with "pending" status
- [ ] Admin dashboard shows the claim
- [ ] Admin can approve claim
- [ ] Admin can reject claim with reason
- [ ] Delivery worker triggers on approval
- [ ] SOL is sent to user wallet ($3 worth of SOL - calculated dynamically)
- [ ] Transaction signatures are saved correctly

## Next Steps After Testing

1. **Domain Minting**: Integrate with Bonfida/SNS API
2. **NFT Minting**: Integrate with Metaplex
3. **Email Notifications**: Notify users on approval/delivery
4. **Analytics**: Track conversion rates and delivery success

