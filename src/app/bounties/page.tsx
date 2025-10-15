import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import BountiesGridOptimized from '@/components/BountiesGridOptimized';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import TokenGate from '@/components/TokenGate';
import { Suspense } from 'react';
import { BountyListSkeleton } from '@/components/ui/skeleton';

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

// Force dynamic rendering to avoid build-time fetch errors
export const dynamic = 'force-dynamic';
export const revalidate = 60; // Revalidate every 60 seconds

export default async function BountiesPage() {
  // Use the API to fetch bounties instead of direct database access
  // This ensures we get the most up-to-date data
  let bounties = [];
  
  // Skip fetch during build time
  if (process.env.NEXT_PHASE !== 'phase-production-build') {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/bounties`, {
        next: { revalidate: 60 },
        cache: 'no-store' // Don't cache during SSR
      });
      
      if (response.ok) {
        const result = await response.json();
        bounties = Array.isArray(result) ? result : [];
      }
    } catch (error) {
      // Silently handle errors during build or when API is unavailable
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching bounties:', error);
      }
    }
  }

  return (
    <TokenGate>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
        {/* Animated background effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-900 to-slate-900"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        
        {/* Header with Navigation */}
        <header className="relative z-10 bg-slate-800/50 border-b border-cyan-500/30 px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-4">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                >
                  <Link href="/">
                    <Home className="w-4 h-4 mr-2" />
                    Home
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                >
                  <Link href="/dashboard">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Dashboard
                  </Link>
                </Button>
              </div>
            </div>
            
            {/* Page Title */}
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl font-bold text-cyan-400 mb-2">
                🎯 Academy Bounties
              </h1>
              <p className="text-gray-300 text-sm sm:text-base">
                Complete challenges to earn XP, SOL, and exclusive rewards
              </p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="relative z-10 px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Hero Section */}
            <div className="mb-12 text-center">
              <div className="inline-flex items-center gap-3 mb-6 px-6 py-3 bg-slate-800/50 border border-cyan-500/30 rounded-full shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                <span className="text-cyan-400 text-lg font-bold">🏆 Active Bounties</span>
                <span className="bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-full text-sm font-semibold border border-cyan-500/30">
                  {bounties.filter(b => !b.hidden && b.status === 'active').length}
                </span>
              </div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent mb-4">
                Earn Rewards Through Challenges
              </h2>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
                Take on challenges, showcase your skills, and earn XP, SOL, and exclusive access. 
                Join the Hoodie Academy community and level up your Web3 journey! 🚀
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-slate-800/50 border border-purple-500/30 rounded-xl p-6 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] transform hover:scale-105 transition-all duration-300">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">🎯</span>
                  <span className="text-sm font-medium text-purple-300">Total Bounties</span>
                </div>
                <p className="text-4xl font-bold text-purple-400">{bounties.filter(b => !b.hidden).length}</p>
              </div>
              
              <div className="bg-slate-800/50 border border-cyan-500/30 rounded-xl p-6 text-white shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transform hover:scale-105 transition-all duration-300">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">💰</span>
                  <span className="text-sm font-medium text-cyan-300">Total Rewards</span>
                </div>
                <p className="text-4xl font-bold text-cyan-400">
                  {bounties.filter(b => !b.hidden).reduce((acc, b) => {
                    const match = b.reward.match(/(\d+)/);
                    return acc + (match ? parseInt(match[1]) : 0);
                  }, 0)} XP
                </p>
              </div>
              
              <div className="bg-slate-800/50 border border-pink-500/30 rounded-xl p-6 text-white shadow-[0_0_20px_rgba(236,72,153,0.3)] hover:shadow-[0_0_30px_rgba(236,72,153,0.5)] transform hover:scale-105 transition-all duration-300">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">👥</span>
                  <span className="text-sm font-medium text-pink-300">Total Submissions</span>
                </div>
                <p className="text-4xl font-bold text-pink-400">
                  {bounties.filter(b => !b.hidden).reduce((acc, b) => acc + b.submissions, 0)}
                </p>
              </div>
            </div>
            
            <Suspense fallback={<BountyListSkeleton count={6} />}>
              <BountiesGridOptimized initialBounties={bounties} showHidden={false} />
            </Suspense>
          </div>
        </main>
      </div>
    </TokenGate>
  );
} 