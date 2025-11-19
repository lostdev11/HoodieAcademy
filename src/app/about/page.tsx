import { Metadata } from 'next';
import AboutPageClient from './AboutPageClient';

export const metadata: Metadata = {
  title: 'About Us - Hoodie Academy',
  description: 'Learn about Hoodie Academy, our Founding Class, Top Contributors, and the community that makes Web3 education accessible and beginner-friendly.',
  keywords: [
    'Hoodie Academy',
    'Web3 education',
    'crypto education',
    'NFT learning',
    'Founding Class',
    'community',
    'Web3 community',
    'crypto community',
    'beginner-friendly crypto',
    'gamified learning'
  ],
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
  openGraph: {
    title: 'About Us - Hoodie Academy',
    description: 'Learn about Hoodie Academy, our Founding Class, Top Contributors, and the community that makes Web3 education accessible.',
    type: 'website',
    url: 'https://hoodieacademy.com/about',
    images: [{
      url: '/images/hoodie-academy-pixel-art-logo.png',
      width: 1200,
      height: 630,
      alt: 'Hoodie Academy - About Us',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Us - Hoodie Academy',
    description: 'Learn about Hoodie Academy, our Founding Class, Top Contributors, and the community that makes Web3 education accessible.',
    images: ['/images/hoodie-academy-pixel-art-logo.png'],
  },
  alternates: {
    canonical: 'https://hoodieacademy.com/about',
  },
};

export default function AboutPage() {
  return <AboutPageClient />;
}



