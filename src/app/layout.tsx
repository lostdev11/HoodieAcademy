import type {Metadata} from 'next';
import { Inter, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import BottomNavigation from '@/components/BottomNavigation';

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
  title: 'Hoodie Academy',
  description: 'Learn about NFTs, meme coins, and Web3 culture',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🎓</text></svg>'
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="data:," />
      </head>
      <body className={`${inter.variable} ${ibmPlexMono.variable} antialiased scrollbar-thin`}>
        {children}
        <BottomNavigation />
      </body>
    </html>
  );
}
