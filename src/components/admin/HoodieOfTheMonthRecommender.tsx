'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy, 
  Award, 
  TrendingUp, 
  BookOpen, 
  Target, 
  Activity, 
  Users, 
  MessageSquare,
  Calendar,
  RefreshCw,
  Sparkles,
  Zap,
  Star,
  Crown
} from 'lucide-react';

interface UserActivityScore {
  wallet_address: string;
  display_name: string;
  username?: string;
  squad?: string;
  avatar_url?: string;
  totalScore: number;
  breakdown: {
    xpScore: number;
    courseScore: number;
    bountyScore: number;
    activityScore: number;
    communityScore: number;
    consistencyScore: number;
  };
  metrics: {
    xpEarned: number;
    coursesCompleted: number;
    bountiesSubmitted: number;
    bountiesWon: number;
    activityCount: number;
    activeDays: number;
    feedbackSubmitted: number;
    socialPosts: number;
  };
  recommendationReason: string;
}

interface RecommendationsResponse {
  success: boolean;
  recommendations: UserActivityScore[];
  month: {
    start: string;
    end: string;
    label: string;
  };
  totalUsersAnalyzed: number;
}

interface HoodieOfTheMonthRecommenderProps {
  walletAddress: string;
}

export default function HoodieOfTheMonthRecommender({ walletAddress }: HoodieOfTheMonthRecommenderProps) {
  const [recommendations, setRecommendations] = useState<UserActivityScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monthInfo, setMonthInfo] = useState<{ start: string; end: string; label: string } | null>(null);
  const [totalUsersAnalyzed, setTotalUsersAnalyzed] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/admin/hoodie-of-the-month/recommendations?limit=10&monthOffset=${monthOffset}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Failed to fetch recommendations: ${response.status}`);
      }

      const data: RecommendationsResponse = await response.json();
      
      if (!data.success) {
        throw new Error('Failed to fetch recommendations');
      }

      setRecommendations(data.recommendations || []);
      setMonthInfo(data.month);
      setTotalUsersAnalyzed(data.totalUsersAnalyzed || 0);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch recommendations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [monthOffset]);

  const getScoreColor = (score: number) => {
    if (score >= 200) return 'text-green-400';
    if (score >= 100) return 'text-yellow-400';
    if (score >= 50) return 'text-blue-400';
    return 'text-gray-400';
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="w-5 h-5 text-yellow-400" />;
    if (index === 1) return <Trophy className="w-5 h-5 text-gray-300" />;
    if (index === 2) return <Award className="w-5 h-5 text-orange-400" />;
    return <Star className="w-4 h-4 text-gray-500" />;
  };

  if (loading && recommendations.length === 0) {
    return (
      <Card className="bg-slate-800/50 border-slate-600">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-400" />
            Hoodie of the Month Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-cyan-400 mx-auto mb-4" />
              <p className="text-gray-400">Analyzing user activity...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800/50 border-slate-600">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-400" />
                Hoodie of the Month Recommendations
              </CardTitle>
              <p className="text-sm text-gray-400 mt-1">
                AI-powered recommendations based on academy activity
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setMonthOffset(prev => Math.max(0, prev - 1))}
                disabled={monthOffset === 0}
                variant="outline"
                size="sm"
                className="border-slate-600 text-white"
              >
                Previous Month
              </Button>
              <Button
                onClick={() => setMonthOffset(prev => prev + 1)}
                variant="outline"
                size="sm"
                className="border-slate-600 text-white"
              >
                Next Month
              </Button>
              <Button
                onClick={fetchRecommendations}
                disabled={loading}
                variant="outline"
                size="sm"
                className="border-slate-600 text-white"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-700 rounded text-red-400 text-sm">
              ⚠️ {error}
            </div>
          )}

          {monthInfo && (
            <div className="mb-6 p-3 bg-slate-700/50 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Calendar className="w-4 h-4" />
                <span>Analyzing: <strong>{monthInfo.label}</strong></span>
                <span className="text-gray-500">•</span>
                <span>{totalUsersAnalyzed} users analyzed</span>
              </div>
            </div>
          )}

          {recommendations.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No recommendations available for this period.</p>
              <p className="text-gray-500 text-sm mt-2">Users need activity data to generate recommendations.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recommendations.map((user, index) => (
                <Card 
                  key={user.wallet_address} 
                  className={`bg-slate-700/30 border ${
                    index === 0 
                      ? 'border-yellow-500/50 bg-yellow-500/5' 
                      : index < 3 
                        ? 'border-cyan-500/30' 
                        : 'border-slate-600'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        {/* Rank */}
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-800 border border-slate-600">
                          {getRankIcon(index)}
                        </div>

                        {/* User Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-bold text-white">
                              {user.display_name}
                              {user.username && (
                                <span className="text-gray-400 font-normal ml-2">@{user.username}</span>
                              )}
                            </h3>
                            {user.squad && (
                              <Badge variant="outline" className="text-xs border-cyan-500/30 text-cyan-400">
                                {user.squad}
                              </Badge>
                            )}
                          </div>

                          {/* Recommendation Reason */}
                          <p className="text-sm text-gray-300 mb-3">
                            <Sparkles className="w-3 h-3 inline mr-1 text-yellow-400" />
                            {user.recommendationReason}
                          </p>

                          {/* Metrics Grid */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                            <div className="flex items-center gap-2 text-sm">
                              <Zap className="w-4 h-4 text-yellow-400" />
                              <span className="text-gray-400">XP:</span>
                              <span className="text-white font-semibold">{user.metrics.xpEarned.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <BookOpen className="w-4 h-4 text-blue-400" />
                              <span className="text-gray-400">Courses:</span>
                              <span className="text-white font-semibold">{user.metrics.coursesCompleted}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Target className="w-4 h-4 text-purple-400" />
                              <span className="text-gray-400">Bounties:</span>
                              <span className="text-white font-semibold">{user.metrics.bountiesSubmitted}</span>
                              {user.metrics.bountiesWon > 0 && (
                                <Badge className="bg-green-600 text-white text-xs ml-1">
                                  {user.metrics.bountiesWon} won
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Activity className="w-4 h-4 text-green-400" />
                              <span className="text-gray-400">Active Days:</span>
                              <span className="text-white font-semibold">{user.metrics.activeDays}</span>
                            </div>
                          </div>

                          {/* Score Breakdown */}
                          <div className="mt-3 pt-3 border-t border-slate-600">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-gray-400">Activity Score Breakdown:</span>
                              <span className={`text-lg font-bold ${getScoreColor(user.totalScore)}`}>
                                {Math.round(user.totalScore)} pts
                              </span>
                            </div>
                            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-xs">
                              <div className="text-center">
                                <div className="text-gray-500">XP</div>
                                <div className="text-white font-semibold">{Math.round(user.breakdown.xpScore)}</div>
                              </div>
                              <div className="text-center">
                                <div className="text-gray-500">Courses</div>
                                <div className="text-white font-semibold">{Math.round(user.breakdown.courseScore)}</div>
                              </div>
                              <div className="text-center">
                                <div className="text-gray-500">Bounties</div>
                                <div className="text-white font-semibold">{Math.round(user.breakdown.bountyScore)}</div>
                              </div>
                              <div className="text-center">
                                <div className="text-gray-500">Activity</div>
                                <div className="text-white font-semibold">{Math.round(user.breakdown.activityScore)}</div>
                              </div>
                              <div className="text-center">
                                <div className="text-gray-500">Community</div>
                                <div className="text-white font-semibold">{Math.round(user.breakdown.communityScore)}</div>
                              </div>
                              <div className="text-center">
                                <div className="text-gray-500">Consistency</div>
                                <div className="text-white font-semibold">{Math.round(user.breakdown.consistencyScore)}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Total Score Badge */}
                      <div className="ml-4 text-right">
                        <div className={`text-3xl font-bold ${getScoreColor(user.totalScore)}`}>
                          {Math.round(user.totalScore)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Total Score</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {recommendations.length > 0 && (
            <div className="mt-6 p-4 bg-slate-700/30 rounded-lg border border-slate-600">
              <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                How Recommendations Work
              </h4>
              <p className="text-xs text-gray-400">
                Recommendations are calculated based on a weighted scoring system that considers:
                XP earned, course completions, bounty participation and wins, activity frequency, 
                community engagement (feedback, social posts), and consistency (active days).
                The top-scoring users are recommended for Hoodie of the Month recognition.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

