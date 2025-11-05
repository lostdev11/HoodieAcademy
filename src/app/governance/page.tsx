import { Metadata } from 'next';
import GovernancePageClient from './GovernancePageClient';

export const metadata: Metadata = {
  title: 'Governance - HOOD Token Voting',
  description: 'Participate in Hoodie Academy governance. Vote on proposals, unlock tokens, and shape the future of the community through decentralized decision-making.',
  keywords: [
    'governance',
    'HOOD token',
    'voting',
    'proposals',
    'decentralized',
    'community decisions',
    'Hoodie Academy governance',
    'token voting',
    'DAO governance'
  ],
  openGraph: {
    title: 'Governance - HOOD Token Voting - Hoodie Academy',
    description: 'Participate in Hoodie Academy governance. Vote on proposals and shape the community.',
    type: 'website',
    url: 'https://hoodieacademy.com/governance',
    images: [{
      url: '/images/hoodie-academy-pixel-art-logo.png',
      width: 1200,
      height: 630,
      alt: 'Hoodie Academy Governance - HOOD Token Voting',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Governance - HOOD Token Voting - Hoodie Academy',
    description: 'Participate in Hoodie Academy governance. Vote on proposals and shape the community.',
    images: ['/images/hoodie-academy-pixel-art-logo.png'],
  },
  alternates: {
    canonical: 'https://hoodieacademy.com/governance',
  },
};

export default function GovernancePage() {
  return <GovernancePageClient />;
}

