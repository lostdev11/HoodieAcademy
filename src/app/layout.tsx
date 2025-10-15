// src/app/layout.tsx
import type { Metadata, Viewport } from 'next';
import AppProvider from '@/components/providers/AppProvider';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://hoodieacademy.com'),
  title: 'Hoodie Academy',
  description: 'Learn Web3 the Hoodie way',
  icons: {
    icon: [
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48.png', sizes: '48x48', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
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
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
