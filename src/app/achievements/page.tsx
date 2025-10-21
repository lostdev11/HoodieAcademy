import { Metadata } from 'next';
import AchievementsPageClient from './AchievementsPageClient';

export const metadata: Metadata = {
  title: 'Achievements & Badges',
  description: 'Track your progress, unlock badges, and earn rewards for completing courses at Hoodie Academy. See your achievements and compete with other students.',
  keywords: [
    'achievements',
    'badges',
    'rewards',
    'progress tracking',
    'Hoodie Academy achievements',
    'course completion',
    'student rewards',
    'gamification'
  ],
  openGraph: {
    title: 'Achievements & Badges - Hoodie Academy',
    description: 'Track your progress, unlock badges, and earn rewards for completing courses at Hoodie Academy.',
    type: 'website',
    url: 'https://hoodieacademy.com/achievements',
    images: [{
      url: '/images/hoodie-academy-pixel-art-logo.png',
      width: 1200,
      height: 630,
      alt: 'Hoodie Academy Achievements - Track Your Progress',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Achievements & Badges - Hoodie Academy',
    description: 'Track your progress, unlock badges, and earn rewards for completing courses.',
    images: ['/images/hoodie-academy-pixel-art-logo.png'],
  },
  alternates: {
    canonical: '/achievements',
  },
};

export default function AchievementsPage() {
  return <AchievementsPageClient />;
} 