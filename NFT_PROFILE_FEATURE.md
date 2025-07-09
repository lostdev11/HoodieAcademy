# NFT Profile Picture Feature

## Overview

The Hoodie Academy now supports using Solana NFTs as profile pictures! Users can select any NFT from their wallet to use as their profile picture across the platform.

## Features

### 🎨 NFT Profile Selector
- **Browse NFTs**: View all NFTs in your connected wallet
- **Search & Filter**: Search NFTs by name, collection, or symbol
- **Visual Preview**: See NFT images, names, collections, and attributes
- **Easy Selection**: Click any NFT to set it as your profile picture
- **Remove Option**: Easily remove NFT and return to default emoji

### 🖼️ Profile Display
- **Profile Page**: Large NFT display with detailed information
- **Dashboard Header**: Small profile picture with NFT indicator
- **Persistent Storage**: Profile picture persists across sessions
- **Fallback Handling**: Graceful fallback if NFT image fails to load

### 🔧 Technical Features
- **Multiple API Support**: Uses Helius API with Solscan fallback
- **Error Handling**: Robust error handling for API failures
- **Image Validation**: Validates image URLs and provides fallbacks
- **Local Storage**: Saves user preferences locally
- **Real-time Updates**: Profile changes reflect immediately

## How to Use

### Setting an NFT as Profile Picture

1. **Navigate to Profile**: Go to `/profile` page
2. **Click "Set NFT Profile"**: Located below your current profile picture
3. **Browse Your NFTs**: View all NFTs in your connected wallet
4. **Search (Optional)**: Use the search bar to find specific NFTs
5. **Select NFT**: Click on any NFT to set it as your profile picture
6. **Confirm**: The NFT will immediately become your profile picture

### Changing Your NFT Profile Picture

1. **Click "Change NFT"**: If you already have an NFT set
2. **Select New NFT**: Choose a different NFT from your collection
3. **Remove NFT**: Click "Remove" to return to the default emoji

### Viewing NFT Information

- **Profile Page**: See detailed NFT information including:
  - NFT name and collection
  - Attributes and traits
  - Visual preview
- **Dashboard**: Small profile picture with NFT indicator (✨)

## Technical Implementation

### Files Created/Modified

#### New Files:
- `src/services/nft-service.ts` - NFT fetching and management service
- `src/components/profile/NFTProfileSelector.tsx` - NFT selection component
- `NFT_PROFILE_FEATURE.md` - This documentation

#### Modified Files:
- `src/components/profile/ProfileView.tsx` - Integrated NFT selector
- `src/app/dashboard/page.tsx` - Added profile picture display

### API Integration

The feature uses multiple APIs for reliability:

1. **Primary**: Helius API (requires `NEXT_PUBLIC_HELIUS_API_KEY`)
2. **Fallback**: Solscan API (public)
3. **Mock Data**: For development/testing

### Data Storage

Profile picture data is stored in localStorage:
- `userProfileImage` - URL of the selected NFT image
- `userSelectedNFT` - Full NFT metadata (JSON)

## Configuration

### Environment Variables

Add to your `.env.local`:
```bash
NEXT_PUBLIC_HELIUS_API_KEY=your_helius_api_key_here
NEXT_PUBLIC_RPC_URL=https://api.mainnet-beta.solana.com
```

### API Keys

- **Helius API**: Recommended for production (better data quality)
- **Solscan API**: Free fallback option
- **No API Key**: Uses mock data for development

## User Experience

### Visual Indicators
- **NFT Badge**: Purple badge with sparkle icon (✨) on NFT profile pictures
- **Profile Picture**: Rounded display with border styling
- **Error Handling**: Graceful fallback to default emoji if image fails

### Responsive Design
- **Mobile**: Optimized for touch interactions
- **Desktop**: Hover effects and smooth animations
- **Grid Layout**: Responsive NFT grid (1-3 columns based on screen size)

## Future Enhancements

### Planned Features
- **NFT Collections**: Filter by specific collections
- **Rarity Display**: Show NFT rarity information
- **Social Features**: Share NFT profile pictures
- **Custom Frames**: Add decorative frames to profile pictures
- **Multiple Wallets**: Support for multiple connected wallets

### Technical Improvements
- **Caching**: Cache NFT data for better performance
- **WebSocket**: Real-time NFT updates
- **Compression**: Optimize image loading
- **Analytics**: Track NFT usage patterns

## Troubleshooting

### Common Issues

1. **No NFTs Showing**
   - Ensure wallet is connected
   - Check if wallet contains NFTs
   - Try refreshing the page

2. **Images Not Loading**
   - Check internet connection
   - NFT metadata might be corrupted
   - Fallback image will display

3. **API Errors**
   - Check API key configuration
   - Verify RPC endpoint
   - Fallback to Solscan API

### Support

For technical issues:
1. Check browser console for errors
2. Verify wallet connection
3. Clear localStorage and retry
4. Contact support with error details

## Security Considerations

- **Client-side Only**: All NFT data is fetched client-side
- **No Server Storage**: Profile pictures are not stored on servers
- **Wallet Verification**: Only shows NFTs from connected wallet
- **Image Validation**: Validates image URLs before display

---

*This feature enhances the Hoodie Academy experience by allowing users to express their NFT ownership through their profile pictures, creating a more personalized and engaging platform.* 