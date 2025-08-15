# 🚀 Getting Real WifHoodie NFTs Working

## 🔑 **Step 1: Get Helius API Key**

1. Visit [dev.helius.xyz](https://dev.helius.xyz/)
2. Sign up for a free account
3. Create a new API key
4. Copy your API key

## 🌍 **Step 2: Set Environment Variable**

Create a `.env.local` file in your project root:

```bash
# .env.local
NEXT_PUBLIC_HELIUS_API_KEY=your_actual_api_key_here
```

## 🔄 **Step 3: Restart Development Server**

```bash
npm run dev
```

## ✅ **Step 4: Test NFT Loading**

1. Go to Profile tab
2. Click "Set NFT Profile"
3. Connect your wallet with WifHoodie NFTs
4. Real NFTs should now load!

## 🎭 **Demo NFTs (Current)**

If you don't have the API key set up, you'll see demo WifHoodie NFTs with placeholder images from Unsplash.

## 🆘 **Troubleshooting**

- **API Key Error**: Make sure your `.env.local` file is in the project root
- **No NFTs Loading**: Check browser console for error messages
- **CORS Issues**: The direct API approach should avoid CORS problems

## 🔗 **Useful Links**

- [Helius Developer Portal](https://dev.helius.xyz/)
- [Helius API Documentation](https://docs.helius.xyz/)
- [Solana NFT Standards](https://docs.solana.com/developing/runtime-facilities/programs/metadata-program)
