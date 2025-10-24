# Twitter/X Integration with Privy Setup Guide

This guide will help you set up Twitter/X authentication using Privy in your Hoodie Academy project.

## Prerequisites

1. **Privy Account**: Sign up at [privy.io](https://privy.io)
2. **Twitter Developer Account**: Apply for Twitter API access at [developer.twitter.com](https://developer.twitter.com)

## Step 1: Set up Privy Dashboard

1. Go to [privy.io](https://privy.io) and create an account
2. Create a new app in the Privy dashboard
3. Note down your **App ID** from the dashboard
4. In the Privy dashboard, go to **Authentication** → **Social Logins**
5. Enable **Twitter** as a login method
6. You'll need to configure Twitter OAuth settings (see Step 2)

## Step 2: Set up Twitter Developer Account

1. Go to [developer.twitter.com](https://developer.twitter.com)
2. Create a new app or use an existing one
3. Go to **App Settings** → **Authentication settings**
4. Enable **OAuth 2.0** and **OAuth 1.0a**
5. Set the **Callback URL** to: `https://your-domain.com/api/auth/callback/twitter`
6. Note down your **Client ID** and **Client Secret**

## Step 3: Configure Environment Variables

Update your `.env.local` file with the following variables:

```env
# Privy Configuration
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id_here

# Twitter OAuth (if using direct Twitter integration)
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret
```

## Step 4: Update Privy Configuration

1. Replace `your_privy_app_id_here` in `.env.local` with your actual Privy App ID
2. Update the logo URL in `src/lib/privy-config.ts` if desired
3. Update the legal URLs (terms and privacy policy) in the config

## Step 5: Test the Integration

1. Start your development server: `npm run dev`
2. Navigate to `/twitter-demo` to test the Twitter integration
3. Try connecting your wallet and linking your Twitter account

## Step 6: Integrate with Existing Profile System

To integrate Twitter data with your existing user system, you can:

1. **Update User Profile**: Store Twitter username in your user profile
2. **Social Features**: Add social sharing capabilities
3. **Identity Verification**: Use Twitter for additional identity verification

### Example Integration Code:

```typescript
// In your profile component
import { usePrivy } from '@privy-io/react-auth';

export function ProfileWithTwitter() {
  const { user } = usePrivy();
  
  const twitterUsername = user?.twitter?.username;
  const twitterName = user?.twitter?.name;
  
  // Use this data to enhance your user profile
  return (
    <div>
      {twitterUsername && (
        <div>
          <p>Twitter: @{twitterUsername}</p>
          {twitterName && <p>Name: {twitterName}</p>}
        </div>
      )}
    </div>
  );
}
```

## Step 7: Deploy to Production

1. Update your production environment variables
2. Ensure your domain is added to Twitter app settings
3. Update callback URLs for production
4. Test the integration in production

## Features Available

With this setup, users can:

- ✅ Connect their Twitter account to their wallet
- ✅ View their Twitter profile information
- ✅ Share achievements to Twitter
- ✅ Use Twitter for identity verification
- ✅ Access cross-platform features

## Troubleshooting

### Common Issues:

1. **"Invalid App ID"**: Check that your Privy App ID is correct
2. **Twitter OAuth Error**: Verify your Twitter app settings and callback URLs
3. **CORS Issues**: Ensure your domain is properly configured in Twitter settings

### Debug Steps:

1. Check browser console for errors
2. Verify environment variables are loaded
3. Test with different browsers/incognito mode
4. Check Privy dashboard for authentication logs

## Next Steps

1. **Customize UI**: Update the styling to match your brand
2. **Add Social Features**: Implement sharing and social interactions
3. **Database Integration**: Store Twitter data in your user database
4. **Analytics**: Track social engagement and user behavior

## Support

- [Privy Documentation](https://docs.privy.io)
- [Twitter API Documentation](https://developer.twitter.com/en/docs)
- [Privy Discord](https://discord.gg/privy) for community support
