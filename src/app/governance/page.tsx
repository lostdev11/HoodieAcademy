import { Metadata } from 'next';
import GovernancePageClient from './GovernancePageClient';

export const metadata: Metadata = {
  title: 'Governance Proposals - Hoodie Academy',
  description: 'View and vote on community governance proposals. Your voting power is based on your HOOD tokens and XP.',
  keywords: [
    'governance',
    'proposals',
    'voting',
    'community decisions',
    'Hoodie Academy governance',
    'decentralized',
    'token voting',
    'DAO governance'
  ],
  openGraph: {
    title: 'Governance Proposals - Hoodie Academy',
    description: 'View and vote on community governance proposals.',
    type: 'website',
    url: 'https://hoodieacademy.com/governance',
    images: [{
      url: '/images/hoodie-academy-pixel-art-logo.png',
      width: 1200,
      height: 630,
      alt: 'Hoodie Academy Governance Proposals',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Governance Proposals - Hoodie Academy',
    description: 'View and vote on community governance proposals.',
    images: ['/images/hoodie-academy-pixel-art-logo.png'],
  },
  alternates: {
    canonical: 'https://hoodieacademy.com/governance',
  },
};

export default function GovernancePage() {
  return <GovernancePageClient />;
}

