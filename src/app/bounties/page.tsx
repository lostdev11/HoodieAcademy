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
  const supabase = createServerComponentClient({ cookies });

  // Fetch bounties from Supabase (only visible ones for public)
  const { data: bounties } = await supabase
    .from("bounties")
    .select("id,title,short_desc,reward,deadline,link_to,image,squad_tag,status,hidden,submissions,created_at,updated_at")
    .eq("hidden", false)
    .order("created_at", { ascending: false });

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
        
        <BountiesGrid initialBounties={bounties ?? []} showHidden={false} />
      </div>
    </PageLayout>
  );
} 