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
      next: { revalidate: 60 } // Revalidate every 60 seconds for fresh data
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-cyan-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Hero Section */}
          <div className="mb-12 text-center">
            <div className="inline-flex items-center gap-3 mb-4 px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-full shadow-lg">
              <span className="text-white text-lg font-bold">🏆 Active Bounties</span>
              <span className="bg-white text-purple-600 px-3 py-1 rounded-full text-sm font-semibold">
                {bounties.filter(b => !b.hidden && b.status === 'active').length}
              </span>
            </div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent mb-4">
              Earn Rewards Through Challenges
            </h2>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto leading-relaxed">
              Take on challenges, showcase your skills, and earn XP, SOL, and exclusive access. 
              Join the Hoodie Academy community and level up your Web3 journey! 🚀
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl transform hover:scale-105 transition-all duration-200">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">🎯</span>
                <span className="text-sm font-medium opacity-90">Total Bounties</span>
              </div>
              <p className="text-4xl font-bold">{bounties.filter(b => !b.hidden).length}</p>
            </div>
            
            <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl p-6 text-white shadow-xl transform hover:scale-105 transition-all duration-200">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">💰</span>
                <span className="text-sm font-medium opacity-90">Total Rewards</span>
              </div>
              <p className="text-4xl font-bold">
                {bounties.filter(b => !b.hidden).reduce((acc, b) => {
                  const match = b.reward.match(/(\d+)/);
                  return acc + (match ? parseInt(match[1]) : 0);
                }, 0)} XP
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl p-6 text-white shadow-xl transform hover:scale-105 transition-all duration-200">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">👥</span>
                <span className="text-sm font-medium opacity-90">Total Submissions</span>
              </div>
              <p className="text-4xl font-bold">
                {bounties.filter(b => !b.hidden).reduce((acc, b) => acc + b.submissions, 0)}
              </p>
            </div>
          </div>
          
          <BountiesGrid initialBounties={bounties} showHidden={false} />
        </div>
      </div>
    </PageLayout>
  );
} 