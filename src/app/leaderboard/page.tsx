import { Metadata } from 'next';
import LeaderboardPageClient from './LeaderboardPageClient';

export const metadata: Metadata = {
  title: 'Leaderboard - Top Students',
  description: 'See top performers at Hoodie Academy. Compete with students, earn XP, and climb the rankings. View leaderboards by squad and timeframe.',
  keywords: [
    'leaderboard',
    'top students',
    'XP rankings',
    'Hoodie Academy leaderboard',
    'student competition',
    'XP earners',
    'academy rankings',
    'squad leaderboard'
  ],
  openGraph: {
    title: 'Leaderboard - Top Students - Hoodie Academy',
    description: 'See top performers at Hoodie Academy. Compete with students, earn XP, and climb the rankings.',
    type: 'website',
    url: 'https://hoodieacademy.com/leaderboard',
    images: [{
      url: '/images/hoodie-academy-pixel-art-logo.png',
      width: 1200,
      height: 630,
      alt: 'Hoodie Academy Leaderboard - Top Students',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Leaderboard - Top Students - Hoodie Academy',
    description: 'See top performers at Hoodie Academy. Compete with students, earn XP, and climb the rankings.',
    images: ['/images/hoodie-academy-pixel-art-logo.png'],
  },
  alternates: {
    canonical: 'https://hoodieacademy.com/leaderboard',
  },
};

export default function LeaderboardPage() {
  return <LeaderboardPageClient />;
}
