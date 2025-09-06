import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import BountiesGrid from '@/components/BountiesGrid';
import PageLayout from '@/components/layouts/PageLayout';

export const metadata: Metadata = {
  title: 'Bounties - Hoodie Academy',
  description: 'Complete bounties to earn XP, SOL, and exclusive rewards. Take on challenges and showcase your skills in the Hoodie Academy community.',
  keywords: [
    'Web3 bounties',
    'crypto challenges',
    'NFT bounties',
    'Solana bounties',
    'Hoodie Academy bounties',
    'crypto rewards',
    'XP earning'
  ],
  openGraph: {
    title: 'Bounties - Hoodie Academy',
    description: 'Complete bounties to earn XP, SOL, and exclusive rewards.',
    type: 'website',
    url: 'https://hoodieacademy.xyz/bounties',
    images: [
      {
        url: '/images/hoodie-academy-bounties.png',
        width: 1200,
        height: 630,
        alt: 'Hoodie Academy Bounties',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bounties - Hoodie Academy',
    description: 'Complete bounties to earn XP, SOL, and exclusive rewards.',
    images: ['/images/hoodie-academy-bounties.png'],
  },
  alternates: {
    canonical: '/bounties',
  },
};

export default async function BountiesPage() {
  // Use the API to fetch bounties instead of direct database access
  // This ensures we get the most up-to-date data
  let bounties = [];
  
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/bounties`, {
      cache: 'no-store' // Disable caching to get fresh data
    });
    
    if (response.ok) {
      const result = await response.json();
      // API returns bounties directly, not wrapped in a bounties property
      bounties = Array.isArray(result) ? result : [];
    }
  } catch (error) {
    console.error('Error fetching bounties:', error);
  }

  return (
    <PageLayout
      title="🎯 Academy Bounties"
      subtitle="Complete challenges to earn XP, SOL, and exclusive rewards"
      showHomeButton={true}
      showBackButton={true}
      backHref="/dashboard"
      backgroundImage={undefined}
      backgroundOverlay={false}
    >
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Available Bounties</h2>
          <p className="text-gray-600">
            Take on challenges, showcase your skills, and earn rewards in the Hoodie Academy community. 
            Complete bounties to gain XP, SOL, and exclusive access to special content.
          </p>
        </div>
        
        <BountiesGrid initialBounties={bounties} showHidden={false} />
      </div>
    </PageLayout>
  );
} 