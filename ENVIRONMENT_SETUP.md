# 🌍 Environment Setup for Profile Picture System

## 🔑 Required Environment Variables

Create a `.env.local` file in your project root with the following variables:

```bash
# Helius API Configuration
NEXT_PUBLIC_HELIUS_API_KEY=your_helius_api_key_here
NEXT_PUBLIC_HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=your_helius_api_key_here

# WifHoodie NFT Detection
NEXT_PUBLIC_WIFHOODIE_COLLECTION_ADDRESS=H3mnaqNFFNwqRfEiWFsRTgprCvG4tYFfmNezGEVnaMuQ
NEXT_PUBLIC_WIFHOODIE_SYMBOL=wifHoodies

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## 🚀 Getting Started

### 1. **Helius API Key**
- Visit [dev.helius.xyz](https://dev.helius.xyz/)
- Sign up for a free account
- Create a new API key
- Copy your API key

### 2. **WifHoodie Collection Address** ✅
- **Collection Address**: `H3mnaqNFFNwqRfEiWFsRTgprCvG4tYFfmNezGEVnaMuQ`
- This provides accurate filtering for genuine WifHoodie NFTs
- The system will only show NFTs from this verified collection

### 3. **WifHoodie Symbol**
- Default: `wifHoodies`
- Used as a backup identifier for WifHoodie NFTs
- Combined with collection address for maximum accuracy

### 4. **Supabase Setup**
- Create a Supabase project
- Get your project URL and service role key
- Create a `profiles` table with the following columns:
  ```sql
  CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pfp_url TEXT,
    pfp_asset_id TEXT,
    pfp_last_verified TIMESTAMP WITH TIME ZONE
  );
  ```

## 🔧 Configuration Options

### **NFT Filtering Behavior**
With the collection address set, the system will:

1. **Primary Filter**: Check if NFT belongs to collection `H3mnaqNFFNwqRfEiWFsRTgprCvG4tYFfmNezGEVnaMuQ`
2. **Secondary Filter**: Verify NFT symbol matches `wifHoodies`
3. **Result**: Only genuine WifHoodie NFTs will appear in the picker

### **API Endpoints**
- `/api/profile/pfp` - Update profile picture
- `/api/profile/verify-ownership` - Verify NFT ownership

## 🧪 Testing

1. **Start your development server**
   ```bash
   npm run dev
   ```

2. **Connect a wallet** with WifHoodie NFTs from the verified collection

3. **Go to Profile tab** and click "Set wifhoodie PFP"

4. **Select an NFT** from the grid (only WifHoodie NFTs will appear)

5. **Verify** the profile picture updates

## 🆘 Troubleshooting

### **Common Issues**

1. **"No wifhoodie NFTs found"**
   - Check your Helius API key
   - Verify the wallet has NFTs from collection `H3mnaqNFFNwqRfEiWFsRTgprCvG4tYFfmNezGEVnaMuQ`
   - Check environment variable configuration

2. **"Failed to set PFP"**
   - Check Supabase configuration
   - Verify service role key permissions
   - Check browser console for errors

3. **Images not loading**
   - Check if NFT images are accessible
   - Verify Helius API response structure
   - Check network requests in browser dev tools

### **Debug Steps**

1. **Check browser console** for error messages
2. **Verify environment variables** are loaded
3. **Test Helius API** directly with your key
4. **Check Supabase logs** for database errors

## 🔗 Useful Links

- [Helius Developer Portal](https://dev.helius.xyz/)
- [Helius API Documentation](https://docs.helius.xyz/)
- [Supabase Documentation](https://supabase.com/docs)
- [Solana DAS Standard](https://docs.solana.com/developing/runtime-facilities/programs/metadata-program)

## 🎯 **WifHoodie Collection Details**

- **Collection Address**: `H3mnaqNFFNwqRfEiWFsRTgprCvG4tYFfmNezGEVnaMuQ`
- **Network**: Solana Mainnet
- **Standard**: Metaplex NFT Standard
- **Verification**: This address is verified and will ensure only genuine WifHoodie NFTs are displayed
