// src/app/layout.tsx
import type { Metadata, Viewport } from 'next';
import AppProvider from '@/components/providers/AppProvider';
import AIChatWidget from '@/components/ai/AIChatWidget';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://hoodieacademy.com'),
  title: {
    default: 'Hoodie Academy - Master Web3, NFTs & Crypto Trading',
    template: '%s | Hoodie Academy'
  },
  description: 'Master Web3, NFTs, and crypto trading through gamified lessons, squads, and bounties inside Hoodie Academy.',
  keywords: [
    'Web3 education',
    'NFT trading',
    'crypto academy',
    'Solana courses',
    'blockchain learning',
    'technical analysis',
    'wallet security',
    'Hoodie Academy',
    'crypto trading courses',
    'Web3 community'
  ],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://hoodieacademy.com',
    siteName: 'Hoodie Academy',
    title: 'Hoodie Academy - Master Web3, NFTs & Crypto Trading',
    description: 'Gamified Web3 education with squads, bounties, and real crypto rewards',
    images: [{
      url: '/images/hoodie-academy-pixel-art-logo.png',
      width: 1200,
      height: 630,
      alt: 'Hoodie Academy - Web3 Education Platform',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hoodie Academy - Master Web3',
    description: 'Gamified Web3 education platform',
    images: ['/images/hoodie-academy-pixel-art-logo.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://hoodieacademy.com',
  },
  icons: {
    icon: [
      { url: '/favicon16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon64.png', sizes: '64x64', type: 'image/png' },
    ],
    apple: [
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    other: [
      { rel: 'icon', url: '/favicon.ico' },
    ],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0ea5e9' },
    { media: '(prefers-color-scheme: dark)',  color: '#06b6d4' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // PERFORMANCE FIX: Removed blocking database queries from layout
  // These queries were running on EVERY page load, causing massive slowdowns
  // Data now fetches client-side with caching in providers
  
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body className="h-full m-0 p-0">
        {/* Organization Schema for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Hoodie Academy",
              "url": "https://hoodieacademy.com",
              "logo": "https://hoodieacademy.com/images/hoodie-academy-pixel-art-logo.png",
              "description": "Web3 and NFT trading education platform with gamified learning",
              "foundingDate": "2024",
              "sameAs": [
                "https://twitter.com/hoodieacademy"
              ],
              "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "customer service",
                "url": "https://hoodieacademy.com"
              }
            })
          }}
        />
        <AppProvider>
          {children}
          {/* AI Assistant - Available on all pages */}
          <AIChatWidget />
        </AppProvider>
      </body>
    </html>
  );
}
