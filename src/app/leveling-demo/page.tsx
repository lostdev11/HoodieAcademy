'use client';

import { useState } from 'react';
import { LevelBadge, LevelUpAnimation } from '@/components/leveling';
import { useLevel, useSquadLevel } from '@/hooks/useLevel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LEVELS } from '@/lib/levels';

export default function LevelingDemoPage() {
  const [xp, setXP] = useState(850);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [oldXP, setOldXP] = useState(850);
  
  const levelData = useLevel(xp);
  
  // Sample squad data
  const squadMembers = [
    { xp: 1200 },
    { xp: 850 },
    { xp: 2100 },
    { xp: 450 },
    { xp: 3200 }
  ];
  
  const squadLevel = useSquadLevel(squadMembers);

  const handleXPChange = (newXP: number) => {
    setOldXP(xp);
    setXP(newXP);
    
    // Check for level up
    const oldLevel = Math.floor(oldXP / 1000) + 1;
    const newLevel = Math.floor(newXP / 1000) + 1;
    
    if (newLevel > oldLevel) {
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Leveling System Demo
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Modular and scalable leveling system for the Hoodie Academy platform
          </p>
        </div>

        {/* XP Controls */}
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">🎮 XP Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-sm text-gray-400 mb-2 block">Current XP</label>
                <Input
                  type="number"
                  value={xp}
                  onChange={(e) => handleXPChange(Number(e.target.value))}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Button 
                  onClick={() => handleXPChange(xp + 100)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  +100 XP
                </Button>
                <Button 
                  onClick={() => handleXPChange(xp + 500)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  +500 XP
                </Button>
                <Button 
                  onClick={() => handleXPChange(xp + 1000)}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  +1000 XP
                </Button>
              </div>
            </div>
            <div className="text-sm text-gray-400">
              Current: {xp} XP | Level: {levelData.level} | Progress: {Math.round(levelData.progress)}%
            </div>
          </CardContent>
        </Card>

        {/* Level Badge Variants */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Default Variant</CardTitle>
            </CardHeader>
            <CardContent>
              <LevelBadge xp={xp} showDetails={true} />
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Compact Variant</CardTitle>
            </CardHeader>
            <CardContent>
              <LevelBadge xp={xp} variant="compact" />
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Premium Variant</CardTitle>
            </CardHeader>
            <CardContent>
              <LevelBadge xp={xp} variant="premium" showUnlocks={true} />
            </CardContent>
          </Card>
        </div>

        {/* Level Progression Examples */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">📊 Level Progression</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[100, 500, 1000, 2500, 5000, 7777].map((testXP) => {
                const testLevel = useLevel(testXP);
                return (
                  <div key={testXP} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{testLevel.icon}</span>
                      <div>
                        <div className="text-white font-medium">Level {testLevel.level}</div>
                        <div className={`text-sm ${testLevel.color || 'text-gray-400'}`}>
                          {testLevel.title}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-medium">{testXP.toLocaleString()} XP</div>
                      <div className="text-xs text-gray-400">{Math.round(testLevel.progress)}%</div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">👥 Squad Level Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{squadLevel.averageLevel}</div>
                  <div className="text-xs text-gray-400">Average Level</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{squadLevel.highestLevel}</div>
                  <div className="text-xs text-gray-400">Highest Level</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{squadLevel.lowestLevel}</div>
                  <div className="text-xs text-gray-400">Lowest Level</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">{squadLevel.totalXP.toLocaleString()}</div>
                  <div className="text-xs text-gray-400">Total XP</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm text-gray-300">Squad Members</div>
                {squadMembers.map((member, index) => {
                  const memberLevel = useLevel(member.xp);
                  return (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-800/30 rounded">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{memberLevel.icon}</span>
                        <span className="text-white text-sm">Member {index + 1}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-white text-sm">Lv.{memberLevel.level}</div>
                        <div className="text-xs text-gray-400">{member.xp.toLocaleString()} XP</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Level System Info */}
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">📋 Level System Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-purple-400 mb-3">Level Thresholds</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {LEVELS.slice(0, 10).map((level) => (
                    <div key={level.level} className="flex items-center justify-between p-2 bg-gray-800/30 rounded">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{level.icon}</span>
                        <div>
                          <div className="text-white text-sm">Level {level.level}</div>
                          <div className={`text-xs ${level.color || 'text-gray-400'}`}>
                            {level.title}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white text-sm">{level.xpRequired.toLocaleString()} XP</div>
                        {level.unlocks && (
                          <div className="text-xs text-gray-400">
                            {level.unlocks.length} unlock{level.unlocks.length !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-indigo-400 mb-3">Current Level Details</h4>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-800/30 rounded">
                    <div className="text-white font-medium">Level {levelData.level}</div>
                    <div className={`text-sm ${levelData.color || 'text-gray-400'}`}>
                      {levelData.title}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {levelData.description}
                    </div>
                  </div>
                  
                  <div className="p-3 bg-gray-800/30 rounded">
                    <div className="text-yellow-300 text-sm font-medium mb-2">Current Unlocks</div>
                    <div className="flex flex-wrap gap-1">
                      {levelData.unlocks.map((unlock, index) => (
                        <Badge key={index} variant="secondary" className="bg-green-500/20 text-green-400 text-xs">
                          {unlock}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  {levelData.nextLevel && (
                    <div className="p-3 bg-gray-800/30 rounded">
                      <div className="text-purple-300 text-sm font-medium mb-2">Next Level</div>
                      <div className="text-white text-sm">Level {levelData.nextLevel.level}</div>
                      <div className={`text-sm ${levelData.nextLevel.color || 'text-gray-400'}`}>
                        {levelData.nextLevel.title}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {levelData.xpNeeded.toLocaleString()} XP needed
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Code Examples */}
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">💻 Usage Examples</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Basic Level Badge</h4>
                <pre className="bg-gray-800 p-3 rounded text-xs overflow-x-auto">
{`<LevelBadge xp={850} />`}
                </pre>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-2">With Unlocks</h4>
                <pre className="bg-gray-800 p-3 rounded text-xs overflow-x-auto">
{`<LevelBadge 
  xp={850} 
  showUnlocks={true}
  variant="premium"
/>`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Level Up Animation */}
        <LevelUpAnimation 
          isVisible={showLevelUp}
          newLevel={levelData.level}
          newTitle={levelData.title}
        />
      </div>
    </div>
  );
} 