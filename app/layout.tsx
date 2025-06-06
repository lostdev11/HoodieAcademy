import type {Metadata} from 'next';
import { Inter, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

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
  title: 'Hoodie Academy Hub',
  description: 'Web3 learning center for NFTs, meme coins, and crypto culture',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${ibmPlexMono.variable} antialiased scrollbar-thin`}>
        {children}
      </body>
    </html>
  );
}
