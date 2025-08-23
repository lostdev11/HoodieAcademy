'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeaderboardService } from '@/services/leaderboard-service';
import { initializeUserInLeaderboard, updateScoreForLessonCompletion, updateScoreForQuizCompletion } from '@/lib/utils';

export default function TestLeaderboardPage() {
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [walletAddress, setWalletAddress] = useState<string>('');

  const leaderboardService = LeaderboardService.getInstance();

  useEffect(() => {
    // Get wallet address from localStorage
    const storedWallet = localStorage.getItem('walletAddress') || 'demo-wallet';
    setWalletAddress(storedWallet);
    
    // Load leaderboard data
    loadLeaderboardData();
    
    // Get current user data
    const loadUserData = async () => {
      try {
        const user = await leaderboardService.getUserProgress(storedWallet);
        setCurrentUser(user);
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };
    
    loadUserData();
  }, []);

  const loadLeaderboardData = async () => {
    try {
      const data = await leaderboardService.getLeaderboard();
      setLeaderboardData(data);
    } catch (error) {
      console.error('Error loading leaderboard data:', error);
      setLeaderboardData([]);
    }
  };

  const testInitializeUser = async () => {
    // TODO: Get display name and squad from database instead of localStorage
    const displayName = 'Test User'; // This should come from database
    const squad = 'Decoders'; // This should come from database
    
    initializeUserInLeaderboard(walletAddress, displayName, squad);
    await loadLeaderboardData();
    
    // Update current user data
    try {
      const user = await leaderboardService.getUserProgress(walletAddress);
      setCurrentUser(user);
    } catch (error) {
      console.error('Error getting user progress:', error);
    }
  };

  const testLessonCompletion = async () => {
    updateScoreForLessonCompletion(walletAddress, 'test-course', 0, 4);
    await loadLeaderboardData();
    
    // Update current user data
    try {
      const user = await leaderboardService.getUserProgress(walletAddress);
      setCurrentUser(user);
    } catch (error) {
      console.error('Error getting user progress:', error);
    }
  };

  const testQuizCompletion = async () => {
    updateScoreForQuizCompletion(walletAddress, 'test-course', 85, 10, 1, 4);
    await loadLeaderboardData();
    
    // Update current user data
    try {
      const user = await leaderboardService.getUserProgress(walletAddress);
      setCurrentUser(user);
    } catch (error) {
      console.error('Error getting user progress:', error);
    }
  };

  const resetLeaderboard = async () => {
    leaderboardService.resetLeaderboard();
    await loadLeaderboardData();
    setCurrentUser(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-cyan-400 mb-8">Leaderboard System Test</h1>
        
        {/* Test Controls */}
        <Card className="bg-slate-800/50 border-cyan-500/30 mb-8">
          <CardHeader>
            <CardTitle className="text-cyan-400">Test Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button onClick={testInitializeUser} className="bg-green-600 hover:bg-green-700">
                Initialize User
              </Button>
              <Button onClick={testLessonCompletion} className="bg-blue-600 hover:bg-blue-700">
                Complete Lesson
              </Button>
              <Button onClick={testQuizCompletion} className="bg-purple-600 hover:bg-purple-700">
                Complete Quiz (85%)
              </Button>
              <Button onClick={resetLeaderboard} className="bg-red-600 hover:bg-red-700">
                Reset All Data
              </Button>
              <Button onClick={loadLeaderboardData} className="bg-cyan-600 hover:bg-cyan-700">
                Refresh Data
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Current User Info */}
        {currentUser && (
          <Card className="bg-slate-800/50 border-green-500/30 mb-8">
            <CardHeader>
              <CardTitle className="text-green-400">Current User</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Display Name</p>
                  <p className="text-lg font-semibold text-white">{currentUser.displayName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Completion</p>
                  <p className="text-lg font-semibold text-cyan-400">{currentUser.overallCompletionPercentage?.toFixed(1) || 0}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Courses Started</p>
                  <p className="text-lg font-semibold text-purple-400">{currentUser.coursesStarted || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Rank</p>
                  <p className="text-lg font-semibold text-yellow-400">#{leaderboardService.getUserRank(walletAddress)}</p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-400">Course Progress:</p>
                <div className="mt-2 space-y-2">
                  {currentUser.courseProgress.map((course: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-slate-700/30 rounded">
                      <span className="text-white">{course.courseName}</span>
                      <span className="text-cyan-400">{course.progress}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Leaderboard Data */}
        <Card className="bg-slate-800/50 border-cyan-500/30">
          <CardHeader>
            <CardTitle className="text-cyan-400">Leaderboard Data ({leaderboardData.length} users)</CardTitle>
          </CardHeader>
          <CardContent>
            {leaderboardData.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No users in leaderboard yet. Try initializing a user!</p>
            ) : (
              <div className="space-y-4">
                {leaderboardData.map((user, index) => (
                  <div key={user.walletAddress} className="flex items-center justify-between p-4 bg-slate-700/30 rounded border border-slate-600/30">
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl font-bold text-yellow-400">#{index + 1}</div>
                      <div>
                        <p className="text-white font-semibold">{user.displayName}</p>
                        <p className="text-sm text-gray-400">{user.walletAddress}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-cyan-400">{user.overallCompletionPercentage?.toFixed(1) || 0}%</p>
                      <p className="text-sm text-gray-400">completion</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 