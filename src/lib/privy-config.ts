import { PrivyConfig } from '@privy-io/react-auth';

export const privyConfig: PrivyConfig = {
  // Replace with your actual Privy App ID
  appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID || '',
  
  // Configure login methods
  loginMethods: ['wallet', 'twitter', 'email'],
  
  // Configure appearance
  appearance: {
    theme: 'dark',
    accentColor: '#8b5cf6', // Purple accent to match your theme
    logo: 'https://your-logo-url.com/logo.png', // Optional: Add your logo
  },
  
  // Configure embedded wallets
  embeddedWallets: {
    createOnLogin: 'users-without-wallets',
    requireUserPasswordOnCreate: false,
    noPromptOnSignature: false,
  },
  
  // Configure social logins
  socialProviders: {
    twitter: {
      enabled: true,
    },
  },
  
  // Configure legal
  legal: {
    termsAndConditionsUrl: 'https://your-site.com/terms',
    privacyPolicyUrl: 'https://your-site.com/privacy',
  },
  
  // Configure MFA
  mfa: {
    noPromptOnMfaRequired: false,
  },
};
