'use client';

import { BountyXPCard, BountyXPCardCompact } from '@/components/bounty';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function BountyXPDemoPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            BountyXPCard Demo
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Showcasing the versatile BountyXPCard component for different use cases across the Hoodie Academy platform
          </p>
        </div>

        {/* Use Cases Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Profile Page Example */}
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <span className="text-blue-400">👤</span>
                Profile Page
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <BountyXPCard 
                submissionCount={3} 
                placement="2nd" 
                bountyTitle="Hoodie Visual Design"
              />
              <div className="text-sm text-gray-400">
                Shows detailed XP breakdown with bounty context
              </div>
            </CardContent>
          </Card>

          {/* Submission Confirmation Modal */}
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <span className="text-green-400">✅</span>
                Confirmation Modal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <BountyXPCard 
                submissionCount={1} 
                showDetails={false}
                className="bg-green-500/10 border-green-500/30"
              />
              <div className="text-sm text-gray-400">
                Compact version for submission confirmations
              </div>
            </CardContent>
          </Card>

          {/* Leaderboard Entry */}
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <span className="text-yellow-400">🏆</span>
                Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <BountyXPCardCompact 
                submissionCount={5} 
                placement="1st"
                totalXP={280}
              />
              <div className="text-sm text-gray-400">
                Compact variant for leaderboard entries
              </div>
            </CardContent>
          </Card>

          {/* Bounty Detail Sidebar */}
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <span className="text-purple-400">📊</span>
                Bounty Sidebar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Submissions</span>
                  <Badge variant="secondary">3</Badge>
                </div>
                <BountyXPCardCompact 
                  submissionCount={3} 
                  totalXP={130}
                  className="mt-2"
                />
              </div>
              <div className="text-sm text-gray-400">
                XP stat line in bounty detail pages
              </div>
            </CardContent>
          </Card>

          {/* Squad Leaderboard */}
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <span className="text-indigo-400">👥</span>
                Squad Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-sm font-bold">
                    H
                  </div>
                  <span className="text-white font-medium">Hoodie Squad</span>
                </div>
                <BountyXPCardCompact 
                  submissionCount={12} 
                  totalXP={450}
                  className="mt-2"
                />
              </div>
              <div className="text-sm text-gray-400">
                Average XP per bounty per squad
              </div>
            </CardContent>
          </Card>

          {/* Winner Announcement */}
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <span className="text-yellow-400">🎉</span>
                Winner Announcement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <BountyXPCard 
                submissionCount={2} 
                placement="1st"
                bountyTitle="Meme Creation Challenge"
                className="bg-yellow-500/10 border-yellow-500/30"
              />
              <div className="text-sm text-gray-400">
                Highlighted version for winner announcements
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Code Examples */}
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">💻 Usage Examples</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Basic Usage</h4>
                <pre className="bg-gray-800 p-3 rounded text-xs overflow-x-auto">
{`<BountyXPCard 
  submissionCount={3} 
  placement="2nd" 
/>`}
                </pre>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Compact Variant</h4>
                <pre className="bg-gray-800 p-3 rounded text-xs overflow-x-auto">
{`<BountyXPCardCompact 
  submissionCount={5} 
  placement="1st"
  totalXP={280}
/>`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* XP Calculation Logic */}
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">🧮 XP Calculation Logic</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-semibold text-green-400">Base XP</h4>
                <p className="text-gray-400">10 XP per submission (max 30 XP)</p>
                <p className="text-gray-400">Formula: min(submissions × 10, 30)</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-yellow-400">Placement Bonuses</h4>
                <p className="text-gray-400">🥇 1st Place: +250 XP</p>
                <p className="text-gray-400">🥈 2nd Place: +100 XP</p>
                <p className="text-gray-400">🥉 3rd Place: +50 XP</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-purple-400">Total XP</h4>
                <p className="text-gray-400">Base XP + Placement Bonus</p>
                <p className="text-gray-400">Example: 30 + 100 = 130 XP</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 