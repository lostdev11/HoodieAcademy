'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Target, Clock, Award, Users, Calendar, FileText, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { BountySubmissionForm, BountySubmissionData } from '@/components/bounty';

interface BountyDetail {
  id: string;
  title: string;
  description: string;
  reward: string;
  deadline: string;
  squadTag?: string;
  image?: string;
  requirements: string[];
  submissions: number;
  status: 'active' | 'completed' | 'expired';
}

// Sample bounty data - in real app this would come from API
const bountyData: BountyDetail = {
  id: 'logo-redesign',
  title: 'Hoodie Academy Logo Redesign',
  description: `Create a modern, pixel-art inspired logo that captures the essence of Hoodie Academy. The logo should reflect our community's focus on education, creativity, and the Web3 ecosystem.

Key elements to consider:
- Pixel art aesthetic with modern touches
- Incorporation of hoodie/community themes
- Scalable design that works at various sizes
- Color scheme that matches our brand (purple, indigo, dark themes)
- Should feel both professional and approachable

The winning design will become the official logo for Hoodie Academy and will be used across all our platforms and materials.`,
  reward: '2.5 SOL',
  deadline: '2024-02-15',
  squadTag: 'Creators',
  image: '/images/hoodie-academy-pixel-art-logo.png',
  requirements: [
    'High-resolution vector format (SVG preferred)',
    'Multiple size variations (16x16, 32x32, 64x64, 128x128, 256x256)',
    'Both light and dark background versions',
    'Include source files (AI, Figma, or similar)',
    'Brief explanation of design choices',
    'Mockup showing logo in various contexts'
  ],
  submissions: 12,
  status: 'active'
};

export default function BountyDetailPage({ params }: { params: { id: string } }) {
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);

  const handleSubmit = (data: BountySubmissionData) => {
    console.log('Submitting to bounty:', params.id, data);
    setShowSubmissionForm(false);
    // Handle submission logic here
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
              <Target className="w-8 h-8 text-purple-400" />
              <h1 className="text-3xl font-bold text-purple-400">Bounty Details</h1>
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

                {bountyData.image && (
                  <div className="mb-6">
                    <img 
                      src={bountyData.image} 
                      alt={bountyData.title} 
                      className="rounded-lg w-full object-cover h-64 bg-gray-700"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="flex items-center gap-2 text-white">
                    <Award className="w-5 h-5 text-yellow-400" />
                    <div>
                      <p className="text-sm text-gray-400">Reward</p>
                      <p className="font-semibold text-yellow-400">{bountyData.reward}</p>
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
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Action Card */}
            <Card className="border border-indigo-500/30 bg-gray-800/50">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Submit Your Entry</h3>
                <div className="space-y-4">
                  <div className="text-sm text-gray-300">
                    <p className="mb-2">Ready to submit your work?</p>
                    <p className="text-xs text-gray-400">
                      Make sure you've reviewed all requirements before submitting.
                    </p>
                  </div>
                  
                  <Button 
                    onClick={() => setShowSubmissionForm(true)}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    🚀 Submit Entry
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
                </div>
              </CardContent>
            </Card>
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