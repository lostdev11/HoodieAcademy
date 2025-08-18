'use client';

import { GlobalXPTracker, SquadXPPool, SquadXPPoolCompact } from '@/components/xp';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function XPTrackerDemoPage() {
  // Sample squad data
  const squads = [
    { name: "Creators", xp: 520, color: "bg-pink-500", memberCount: 45, icon: "🎨" },
    { name: "Raiders", xp: 740, color: "bg-green-500", memberCount: 38, icon: "⚔️" },
    { name: "Speakers", xp: 330, color: "bg-blue-500", memberCount: 52, icon: "🗣️" },
    { name: "Decoders", xp: 890, color: "bg-yellow-500", memberCount: 41, icon: "🔍" },
    { name: "Rangers", xp: 420, color: "bg-purple-500", memberCount: 29, icon: "🏹" },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            XP Tracker System Demo
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Global XP progression tracking and squad rivalry system for the Hoodie Academy platform
          </p>
        </div>

        {/* Main Components Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Global XP Tracker Examples */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">🌍 Global XP Tracker</h2>
            
            {/* Full Featured */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Full Featured Tracker</CardTitle>
              </CardHeader>
              <CardContent>
                <GlobalXPTracker 
                  userXP={3450}
                  level={4}
                  rank="127"
                  totalUsers={1247}
                  nextUnlock={5000}
                />
              </CardContent>
            </Card>

            {/* Compact Version */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Compact Sidebar Version</CardTitle>
              </CardHeader>
              <CardContent>
                <GlobalXPTracker 
                  userXP={3450}
                  showDetails={false}
                  className="max-w-sm"
                />
              </CardContent>
            </Card>

            {/* High Level User */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">High Level User</CardTitle>
              </CardHeader>
              <CardContent>
                <GlobalXPTracker 
                  userXP={12500}
                  level={13}
                  rank="3"
                  totalUsers={1247}
                  nextUnlock={15000}
                  className="bg-yellow-500/10 border-yellow-500/30"
                />
              </CardContent>
            </Card>
          </div>

          {/* Squad XP Pool Examples */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">👥 Squad XP Pool</h2>
            
            {/* Full Featured */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Squad Competition</CardTitle>
              </CardHeader>
              <CardContent>
                <SquadXPPool squads={squads} />
              </CardContent>
            </Card>

            {/* Compact Version */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Compact Sidebar</CardTitle>
              </CardHeader>
              <CardContent>
                <SquadXPPool 
                  squads={squads} 
                  showDetails={false}
                  className="max-w-sm"
                />
              </CardContent>
            </Card>

            {/* Leaderboard Compact */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Leaderboard Widget</CardTitle>
              </CardHeader>
              <CardContent>
                <SquadXPPoolCompact squads={squads} />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Combined Dashboard Example */}
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">🎯 Combined Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <GlobalXPTracker 
                userXP={3450}
                level={4}
                rank="127"
                totalUsers={1247}
                nextUnlock={5000}
                className="h-fit"
              />
              <SquadXPPool 
                squads={squads}
                title="🏆 Squad Rankings"
                className="h-fit"
              />
            </div>
          </CardContent>
        </Card>

        {/* Use Cases */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <span className="text-blue-400">👤</span>
                Profile Page
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <GlobalXPTracker 
                userXP={3450}
                level={4}
                rank="127"
                totalUsers={1247}
                nextUnlock={5000}
                className="max-w-sm"
              />
              <div className="text-sm text-gray-400">
                Shows user's overall progression and achievements
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <span className="text-green-400">📊</span>
                Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <SquadXPPoolCompact squads={squads} />
              <div className="text-sm text-gray-400">
                Compact squad competition widget
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <span className="text-purple-400">🏠</span>
                Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <GlobalXPTracker 
                  userXP={3450}
                  showDetails={false}
                  className="max-w-sm"
                />
                <SquadXPPool 
                  squads={squads.slice(0, 3)}
                  showDetails={false}
                  className="max-w-sm"
                />
              </div>
              <div className="text-sm text-gray-400">
                Sidebar widgets for quick overview
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
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Global XP Tracker</h4>
                <pre className="bg-gray-800 p-3 rounded text-xs overflow-x-auto">
{`<GlobalXPTracker 
  userXP={3450}
  level={4}
  rank="127"
  totalUsers={1247}
  nextUnlock={5000}
/>`}
                </pre>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Squad XP Pool</h4>
                <pre className="bg-gray-800 p-3 rounded text-xs overflow-x-auto">
{`<SquadXPPool 
  squads={[
    { name: "Creators", xp: 520, color: "bg-pink-500" },
    { name: "Raiders", xp: 740, color: "bg-green-500" }
  ]}
/>`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">🚀 Key Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold text-purple-400">Global XP Tracker</h4>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• Automatic level calculation</li>
                  <li>• Progress to next level</li>
                  <li>• Global rank display</li>
                  <li>• Next unlock tracking</li>
                  <li>• Compact sidebar variant</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-indigo-400">Squad XP Pool</h4>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• Squad rivalry visualization</li>
                  <li>• Real-time rankings</li>
                  <li>• Member count display</li>
                  <li>• Market share percentages</li>
                  <li>• Compact leaderboard widget</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 