import { Metadata } from 'next';
import CoursesPageClient from './CoursesPageClient';

// Generate metadata for the courses page
export const metadata: Metadata = {
  title: 'Courses - Hoodie Academy',
  description: 'Explore Web3 courses on NFT trading, technical analysis, wallet security, and community building. Join the Hoodie Academy and master crypto trading like a degen.',
  keywords: [
    'Web3 courses',
    'NFT trading courses',
    'crypto education',
    'technical analysis',
    'wallet security',
    'Solana trading',
    'blockchain learning',
    'crypto alpha',
    'trading psychology',
    'community building',
    'Hoodie Academy courses'
  ],
  openGraph: {
    title: 'Web3 Courses - Hoodie Academy',
    description: 'Master Web3, NFTs, and crypto trading with our comprehensive course library. From beginners to advanced traders.',
    type: 'website',
    url: 'https://hoodieacademy.xyz/courses',
    images: [
      {
        url: '/images/hoodie-academy-courses.png',
        width: 1200,
        height: 630,
        alt: 'Hoodie Academy Courses - Web3 Learning',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Web3 Courses - Hoodie Academy',
    description: 'Master Web3, NFTs, and crypto trading with our comprehensive course library.',
    images: ['/images/hoodie-academy-courses.png'],
  },
  alternates: {
    canonical: '/courses',
  },
};

export default function CoursesPage() {
  return <CoursesPageClient />;
}
