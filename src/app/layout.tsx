import type {Metadata, Viewport} from 'next';
import { Inter, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import SquadAssignmentGuard from '@/components/SquadAssignmentGuard';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-ibm-plex-mono',
  weight: ['400', '700'], // Specify weights you might use
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Hoodie Academy – Learn Web3 Like a Degen',
    template: '%s | Hoodie Academy'
  },
  description: 'Master Web3, NFTs, and crypto trading with gamified learning. Join the Hoodie Academy community and become a Web3 expert through hands-on courses, live sessions, and real-world projects.',
  keywords: [
    'Web3 education',
    'NFT academy',
    'Solana NFTs',
    'crypto trading',
    'blockchain learning',
    'degen courses',
    'NFT marketplaces',
    'crypto indicators',
    'chart skills',
    'Web3 quest system',
    'course unlocks',
    'Hoodie Academy',
    'Web3 community',
    'crypto education',
    'NFT trading',
    'Solana trading',
    'crypto alpha',
    'trading psychology',
    'technical analysis',
    'community building'
  ],
  authors: [{ name: 'Hoodie Academy' }],
  creator: 'Hoodie Academy',
  publisher: 'Hoodie Academy',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://hoodieacademy.xyz'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://hoodieacademy.xyz',
    siteName: 'Hoodie Academy',
    title: 'Hoodie Academy – Learn Web3 Like a Degen',
    description: 'Master Web3, NFTs, and crypto trading with gamified learning. Join the Hoodie Academy community and become a Web3 expert.',
    images: [
      {
        url: '/images/hoodie-academy-pixel-art-logo.png',
        width: 1200,
        height: 630,
        alt: 'Hoodie Academy - Web3 Learning Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hoodie Academy – Learn Web3 Like a Degen',
    description: 'Master Web3, NFTs, and crypto trading with gamified learning. Join the Hoodie Academy community.',
    images: ['/images/hoodie-academy-pixel-art-logo.png'],
    creator: '@hoodieacademy',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
    yahoo: 'your-yahoo-verification-code',
  },
  icons: {
    icon: [
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-48.png', sizes: '48x48', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon-32.png',
  },
  manifest: '/site.webmanifest',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#06b6d4' },
    { media: '(prefers-color-scheme: dark)', color: '#06b6d4' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon-32.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        
        {/* Structured Data for Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "EducationalOrganization",
              "name": "Hoodie Academy",
              "description": "Master Web3, NFTs, and crypto trading with gamified learning. Join the Hoodie Academy community and become a Web3 expert through hands-on courses, live sessions, and real-world projects.",
              "url": "https://hoodieacademy.xyz",
              "logo": "https://hoodieacademy.xyz/images/hoodie-academy-pixel-art-logo.png",
              "sameAs": [
                "https://twitter.com/hoodieacademy",
                "https://discord.gg/hoodieacademy"
              ],
              "address": {
                "@type": "PostalAddress",
                "addressCountry": "US"
              },
              "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "customer service",
                "url": "https://hoodieacademy.xyz"
              },
              "offers": {
                "@type": "Offer",
                "description": "Web3 education courses and community access",
                "price": "0",
                "priceCurrency": "USD",
                "availability": "https://schema.org/InStock"
              }
            })
          }}
        />
      </head>
      <body className={`${inter.variable} ${ibmPlexMono.variable} antialiased scrollbar-thin`}>
        <SquadAssignmentGuard>
          {children}
        </SquadAssignmentGuard>
      </body>
    </html>
  );
}
