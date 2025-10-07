'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Target, Clock, Award, Users, FileText, Palette, Star, Trophy } from 'lucide-react';
import Link from 'next/link';
import { BountySubmissionForm, BountySubmissionData } from '@/components/bounty';
import { SubmissionsGallery } from '@/components/bounty/SubmissionsGallery';
import { UpvoteDemo } from '@/components/bounty/UpvoteDemo';
import { useAuth } from '@/hooks/useAuth';

interface BountyDetail {
  id: string;
  title: string;
  description: string;
  reward: string;
  deadline: string;
  squadTag?: string;
  image?: string;
  requirements: string[];
  judgingCriteria: string[];
  submissions: number;
  status: 'active' | 'completed' | 'expired';
}

// Sample bounty data for the hoodie visual bounty
const bountyData: BountyDetail = {
  id: 'hoodie-visual',
  title: '🎨 Create a Hoodie Visual',
  description: `Calling all Creators — Hoodie Academy needs official hoodie visuals for use in courses, banners, and lore scenes.

Whether you're using pixel art (from our V100 course) or AI image generation (G100 course), your task is simple:

🔧 Create a unique Hoodie Academy-themed image
It must feature at least one WifHoodie-style character in a school-related or training environment (dojo, library, squad room, etc.)

🧪 Your image can be:
• Pixel art (preferred for top prizes)
• AI-generated art using your own prompts (must match Academy vibe)
• Hand-drawn or digitally illustrated

💡 Judging Criteria:
✍️ Creativity & theme fit (school vibes, squad references, etc.)
🎨 Cohesive style (especially for pixel art submissions)
🧠 Bonus if you tie in squad motifs (Creators, Speakers, Raiders, etc.)
🧱 Bonus if your scene aligns with the lore (gym, vault, dojo, cipher room...)

🏆 Prizes:
1st Place – 0.05 SOL
2nd Place – 0.03 SOL
3rd Place – 0.02 SOL
🎖️ Honorable Mentions will be displayed on the Academy Wall

Your creation will become part of the Hoodie Academy visual identity and may be featured in courses, social media, and community materials.`,
  reward: '0.05 SOL (1st), 0.03 SOL (2nd), 0.02 SOL (3rd)',
  deadline: '2024-03-15',
  squadTag: 'Creators',
  requirements: [
    'Must feature at least one WifHoodie-style character',
    'Set in a school-related or training environment',
    'High-resolution format (minimum 800x600px)',
    'Include source files if using digital tools',
    'Brief description of your creative process',
    'Optional: Multiple variations or scenes'
  ],
  judgingCriteria: [
    'Creativity & theme fit (school vibes, squad references)',
    'Cohesive style (especially for pixel art submissions)',
    'Technical quality and execution',
    'Bonus: Squad motifs integration (Creators, Speakers, Raiders, Decoders)',
    'Bonus: Lore alignment (gym, vault, dojo, cipher room, etc.)',
    'Bonus: Multiple characters or scenes'
  ],
  submissions: 7,
  status: 'active'
};

export default function HoodieVisualBountyPage() {
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (data: BountySubmissionData) => {
    console.log('Submitting to hoodie visual bounty:', data);
    
    if (!data.walletAddress) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      const response = await fetch(`/api/bounties/hoodie-visual/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission: data.description,
          walletAddress: data.walletAddress,
          submissionType: data.imageUrl ? 'image' : 'text',
          title: data.title,
          description: data.description,
          imageUrl: data.imageUrl,
          squad: data.squad,
          courseRef: data.courseRef
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        alert('✅ Bounty submitted successfully! Go to the admin dashboard to review it.');
        setShowSubmissionForm(false);
        window.location.reload(); // Reload to show updated count
      } else {
        alert(`❌ ${result.error || 'Failed to submit bounty'}`);
      }
    } catch (error) {
      console.error('Error submitting bounty:', error);
      alert('❌ Failed to submit bounty. Please try again.');
    }
  };

  const getSquadColor = (squad: string) => {
    switch (squad) {
      case 'Creators': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Decoders': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'Speakers': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'Raiders': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'completed': return 'bg-blue-500';
      case 'expired': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/bounties">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Bounties
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <Palette className="w-8 h-8 text-purple-400" />
              <h1 className="text-3xl font-bold text-purple-400">Hoodie Visual Bounty</h1>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bounty Header */}
            <Card className="border border-indigo-500/30 bg-gray-800/50">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-2xl font-bold text-white mb-2">{bountyData.title}</h1>
                    {bountyData.squadTag && (
                      <Badge className={`${getSquadColor(bountyData.squadTag)} text-sm`}>
                        {bountyData.squadTag}
                      </Badge>
                    )}
                  </div>
                  <div className={`w-4 h-4 rounded-full ${getStatusColor(bountyData.status)}`}></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="flex items-center gap-2 text-white">
                    <Trophy className="w-5 h-5 text-yellow-400" />
                    <div>
                      <p className="text-sm text-gray-400">Top Prize</p>
                      <p className="font-semibold text-yellow-400">0.05 SOL</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-white">
                    <Clock className="w-5 h-5 text-red-400" />
                    <div>
                      <p className="text-sm text-gray-400">Deadline</p>
                      <p className="font-semibold text-red-400">{new Date(bountyData.deadline).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-white">
                    <Users className="w-5 h-5 text-blue-400" />
                    <div>
                      <p className="text-sm text-gray-400">Submissions</p>
                      <p className="font-semibold text-blue-400">{bountyData.submissions}</p>
                    </div>
                  </div>
                </div>

                <div className="prose prose-invert max-w-none">
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-400" />
                    Description
                  </h3>
                  <div className="text-gray-300 leading-relaxed whitespace-pre-line">
                    {bountyData.description}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Requirements */}
            <Card className="border border-indigo-500/30 bg-gray-800/50">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-400" />
                  Requirements
                </h3>
                <ul className="space-y-2">
                  {bountyData.requirements.map((requirement, index) => (
                    <li key={index} className="flex items-start gap-2 text-gray-300">
                      <span className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></span>
                      <span>{requirement}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Judging Criteria */}
            <Card className="border border-indigo-500/30 bg-gray-800/50">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-purple-400" />
                  Judging Criteria
                </h3>
                <ul className="space-y-2">
                  {bountyData.judgingCriteria.map((criteria, index) => (
                    <li key={index} className="flex items-start gap-2 text-gray-300">
                      <span className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></span>
                      <span>{criteria}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Prize Structure */}
            <Card className="border border-yellow-500/30 bg-yellow-500/5">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-yellow-400 mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  Prize Structure
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-yellow-500/10 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🥇</span>
                      <span className="text-white font-semibold">1st Place</span>
                    </div>
                    <span className="text-yellow-400 font-bold">0.05 SOL</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-500/10 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🥈</span>
                      <span className="text-white font-semibold">2nd Place</span>
                    </div>
                    <span className="text-gray-400 font-bold">0.03 SOL</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-orange-500/10 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🥉</span>
                      <span className="text-white font-semibold">3rd Place</span>
                    </div>
                    <span className="text-orange-400 font-bold">0.02 SOL</span>
                  </div>
                  <div className="text-center text-sm text-gray-400 mt-3">
                    🎖️ Honorable Mentions will be displayed on the Academy Wall
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Community Submissions */}
            <Card className="border border-indigo-500/30 bg-gray-800/50">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-400" />
                  Community Submissions
                </h3>
                <SubmissionsGallery 
                  bountyId="hoodie-visual"
                  currentUserId={user?.id}
                  currentUserSquad={user?.squad}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Action Card */}
            <Card className="border border-indigo-500/30 bg-gray-800/50">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Submit Your Entry</h3>
                <div className="space-y-4">
                  <div className="text-sm text-gray-300">
                    <p className="mb-2">Ready to create your Hoodie Visual?</p>
                    <p className="text-xs text-gray-400">
                      Make sure you've reviewed all requirements and judging criteria before submitting.
                    </p>
                  </div>
                  
                  <Button 
                    onClick={() => setShowSubmissionForm(true)}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    🎨 Submit Hoodie Visual
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card className="border border-indigo-500/30 bg-gray-800/50">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Bounty Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Status</span>
                    <Badge className={getStatusColor(bountyData.status) === 'bg-green-500' ? 'bg-green-500' : 'bg-red-500'}>
                      {bountyData.status.charAt(0).toUpperCase() + bountyData.status.slice(1)}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Submissions</span>
                    <span className="text-white font-semibold">{bountyData.submissions}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Days Left</span>
                    <span className="text-white font-semibold">
                      {Math.max(0, Math.ceil((new Date(bountyData.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Total Prize Pool</span>
                    <span className="text-yellow-400 font-semibold">0.10 SOL</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tips Card */}
            <Card className="border border-blue-500/30 bg-blue-500/5">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-blue-400 mb-4">💡 Tips for Success</h3>
                <div className="space-y-2 text-sm text-gray-300">
                  <p>• Pixel art submissions are preferred for top prizes</p>
                  <p>• Include squad references for bonus points</p>
                  <p>• Consider Academy lore locations (dojo, vault, etc.)</p>
                  <p>• Multiple characters or scenes can boost your score</p>
                  <p>• High-quality, scalable formats work best</p>
                </div>
              </CardContent>
            </Card>

            {/* Upvote Demo */}
            <UpvoteDemo />
          </div>
        </div>

        {/* Submission Form Modal */}
        {showSubmissionForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-white">Submit to: {bountyData.title}</h2>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowSubmissionForm(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    ✕
                  </Button>
                </div>
                <BountySubmissionForm onSubmit={handleSubmit} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 