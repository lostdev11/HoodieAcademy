'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Target, Award, Users, Clock, Filter, Search } from 'lucide-react';
import Link from 'next/link';
import { BountyPanel, BountySubmissionForm, BountySubmissionData } from '@/components/bounty';

interface Bounty {
  id: string;
  title: string;
  shortDesc: string;
  reward: string;
  deadline?: string;
  linkTo: string;
  image?: string;
  squadTag?: string;
  status: 'active' | 'completed' | 'expired';
  submissions: number;
}

const bounties: Bounty[] = [
  {
    id: '1',
    title: 'Hoodie Academy Logo Redesign',
    shortDesc: 'Create a modern, pixel-art inspired logo that captures the essence of Hoodie Academy',
    reward: '2.5 SOL',
    deadline: '2024-02-15',
    linkTo: '/bounties/logo-redesign',
    image: '/images/hoodie-academy-pixel-art-logo.png',
    squadTag: 'Creators',
    status: 'active',
    submissions: 12
  },
  {
    id: '2',
    title: 'Trading Psychology Meme Collection',
    shortDesc: 'Design 5 memes that illustrate key trading psychology concepts',
    reward: '1.8 SOL',
    deadline: '2024-02-20',
    linkTo: '/bounties/trading-memes',
    squadTag: 'Creators',
    status: 'active',
    submissions: 8
  },
  {
    id: '3',
    title: 'Technical Analysis Tutorial Video',
    shortDesc: 'Create a 5-minute tutorial on support and resistance levels',
    reward: '3.2 SOL',
    deadline: '2024-02-25',
    linkTo: '/bounties/ta-tutorial',
    squadTag: 'Decoders',
    status: 'active',
    submissions: 5
  },
  {
    id: '4',
    title: 'Community Onboarding Guide',
    shortDesc: 'Write a comprehensive guide for new Hoodie Academy members',
    reward: '2.0 SOL',
    deadline: '2024-02-18',
    linkTo: '/bounties/onboarding-guide',
    squadTag: 'Speakers',
    status: 'active',
    submissions: 15
  },
  {
    id: '5',
    title: 'NFT Market Analysis Report',
    shortDesc: 'Analyze current NFT market trends and provide actionable insights',
    reward: '4.0 SOL',
    deadline: '2024-02-22',
    linkTo: '/bounties/market-analysis',
    squadTag: 'Raiders',
    status: 'active',
    submissions: 3
  },
  {
    id: '6',
    title: 'Squad Badge Design Contest',
    shortDesc: 'Design unique badges for each of the four Hoodie squads',
    reward: '5.0 SOL',
    deadline: '2024-03-01',
    linkTo: '/bounties/squad-badges',
    status: 'active',
    submissions: 22
  },
  {
    id: '7',
    title: '🎨 Create a Hoodie Visual',
    shortDesc: 'Create a unique Hoodie Academy-themed image featuring WifHoodie-style characters in school/training environments',
    reward: '0.05 SOL (1st), 0.03 SOL (2nd), 0.02 SOL (3rd)',
    deadline: '2024-03-15',
    linkTo: '/bounties/hoodie-visual',
    squadTag: 'Creators',
    status: 'active',
    submissions: 7
  }
];

export default function BountiesPage() {
  const [selectedSquad, setSelectedSquad] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const handleSubmit = (data: BountySubmissionData) => {
    // Handle form submission logic here
    console.log('Submitting bounty entry:', data);
    // You can add API call here to submit the bounty
  };

  // Filter bounties based on selected criteria
  const filteredBounties = bounties.filter(bounty => {
    const matchesSquad = selectedSquad === 'all' || bounty.squadTag === selectedSquad;
    const matchesStatus = selectedStatus === 'all' || bounty.status === selectedStatus;
    const matchesSearch = searchTerm === '' || 
      bounty.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bounty.shortDesc.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSquad && matchesStatus && matchesSearch;
  });

  const getSquadColor = (squad: string) => {
    switch (squad) {
      case 'Creators': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Decoders': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'Speakers': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'Raiders': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <Target className="w-8 h-8 text-purple-400" />
              <h1 className="text-3xl font-bold text-purple-400">Academy Bounties</h1>
            </div>
          </div>
        </div>

        {/* Bounty Banner */}
        <div className="relative py-12 text-center bg-gradient-to-r from-purple-900 to-indigo-700 rounded-xl mb-8 overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative z-10">
            <h1 className="text-4xl font-bold text-white mb-4">🎯 Academy Bounty Board</h1>
            <p className="mt-2 text-lg text-indigo-200 mb-4">
              Welcome to Hoodie Academy's Bounty Board — where your art earns SOL and your squad earns glory.
            </p>
            <p className="text-base text-indigo-300 mb-6">
              Browse live bounties, submit your best work, and help build the Hoodie-Verse.
            </p>
            <div className="flex items-center justify-center gap-8 text-white/80">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                <span>Active Bounties: {bounties.filter(b => b.status === 'active').length}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span>Total Submissions: {bounties.reduce((sum, b) => sum + b.submissions, 0)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>Total Rewards: {bounties.reduce((sum, b) => sum + parseFloat(b.reward.split(' ')[0]), 0)} SOL</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Target className="w-6 h-6 text-purple-400" />
              Live Bounties
            </h2>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search bounties..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-600/30 rounded-lg text-white placeholder-gray-400 focus:border-purple-500/50 focus:outline-none w-full sm:w-64"
                />
              </div>

              {/* Squad Filter */}
              <Select value={selectedSquad} onValueChange={setSelectedSquad}>
                <SelectTrigger className="w-full sm:w-40 bg-slate-800/50 border-slate-600/30 text-white">
                  <SelectValue placeholder="All Squads" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Squads</SelectItem>
                  <SelectItem value="Creators">Creators</SelectItem>
                  <SelectItem value="Decoders">Decoders</SelectItem>
                  <SelectItem value="Speakers">Speakers</SelectItem>
                  <SelectItem value="Raiders">Raiders</SelectItem>
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full sm:w-40 bg-slate-800/50 border-slate-600/30 text-white">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filters Display */}
          {(selectedSquad !== 'all' || selectedStatus !== 'all' || searchTerm) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedSquad !== 'all' && (
                <Badge className={`${getSquadColor(selectedSquad)}`}>
                  Squad: {selectedSquad}
                </Badge>
              )}
              {selectedStatus !== 'all' && (
                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                  Status: {selectedStatus}
                </Badge>
              )}
              {searchTerm && (
                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                  Search: "{searchTerm}"
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedSquad('all');
                  setSelectedStatus('all');
                  setSearchTerm('');
                }}
                className="text-gray-400 hover:text-white"
              >
                Clear All
              </Button>
            </div>
          )}
        </div>

        {/* Bounties Grid */}
        <div className="mb-12">
          {filteredBounties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredBounties.map((bounty) => (
                <BountyPanel key={bounty.id} {...bounty} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Target className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">No bounties found</h3>
              <p className="text-gray-500 mb-4">Try adjusting your filters or search terms</p>
              <Button
                onClick={() => {
                  setSelectedSquad('all');
                  setSelectedStatus('all');
                  setSearchTerm('');
                }}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>

        {/* AI Prompt Library */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Target className="w-6 h-6 text-cyan-400" />
            🎨 AI Prompt Library
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-cyan-500/10 rounded-lg border border-cyan-500/30">
              <h3 className="text-lg font-semibold text-cyan-400 mb-3">Pixel Art Prompts</h3>
              <div className="space-y-2 text-sm text-gray-300">
                <p>• "1-bit pixel art, hoodie character in academy dojo, 32x32 grid"</p>
                <p>• "Pixel art hoodie student studying charts, retro gaming style"</p>
                <p>• "8-bit style, hoodie squad training session, limited palette"</p>
              </div>
              <Button asChild size="sm" className="mt-4 bg-cyan-600 hover:bg-cyan-700">
                <Link href="/courses/v100-pixel-art-basics">Learn Pixel Art</Link>
              </Button>
            </div>

            <div className="p-6 bg-purple-500/10 rounded-lg border border-purple-500/30">
              <h3 className="text-lg font-semibold text-purple-400 mb-3">AI Generation Prompts</h3>
              <div className="space-y-2 text-sm text-gray-300">
                <p>• "Hoodie Academy student in futuristic trading room, cyberpunk style"</p>
                <p>• "Anime-style hoodie character learning technical analysis"</p>
                <p>• "Digital art, hoodie squad collaboration, vibrant colors"</p>
              </div>
              <Button asChild size="sm" className="mt-4 bg-purple-600 hover:bg-purple-700">
                <Link href="/courses/g100-ai-image-generation">Learn AI Art</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Submit Your Work */}
        <BountySubmissionForm onSubmit={handleSubmit} className="max-w-3xl mx-auto" />

        {/* Hall of Fame */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Award className="w-6 h-6 text-yellow-400" />
            🏆 Hall of Fame
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Sample winners */}
            <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
                  🥇
                </div>
                <div>
                  <h4 className="font-semibold text-white">@PixelMaster</h4>
                  <p className="text-sm text-yellow-400">Hoodie Visual Winner</p>
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-2">"Academy Dojo Scene" - 0.05 SOL</p>
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                Creators Squad
              </Badge>
            </div>

            <div className="p-4 bg-gray-500/10 rounded-lg border border-gray-500/30">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-r from-gray-400 to-slate-400 rounded-full flex items-center justify-center">
                  🥈
                </div>
                <div>
                  <h4 className="font-semibold text-white">@ChartWizard</h4>
                  <p className="text-sm text-gray-400">TA Tutorial Winner</p>
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-2">"Support & Resistance Masterclass" - 3.2 SOL</p>
              <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 text-xs">
                Decoders Squad
              </Badge>
            </div>

            <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/30">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-red-400 rounded-full flex items-center justify-center">
                  🥉
                </div>
                <div>
                  <h4 className="font-semibold text-white">@MemeLord</h4>
                  <p className="text-sm text-orange-400">Psychology Meme Winner</p>
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-2">"FOMO vs Patience" - 1.8 SOL</p>
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                Creators Squad
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 