'use client';
export const dynamic = "force-static";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Home, ArrowDown, ArrowRight, LockKeyhole, CheckCircle, LineChart, Clock, Filter, Shield } from "lucide-react";
import { MilestoneBadge } from "@/components/course-roadmap/MilestoneBadge";
import { RiskArt } from "@/components/course-roadmap/RiskArt";
import { HoodieIcon } from "@/components/icons/HoodieIcon";
import type { CourseCardProps } from "@/components/course-roadmap/CourseCard";
import { CourseCard } from "@/components/course-roadmap/CourseCard";
import { GatedCourseCard } from "@/components/course-roadmap/GatedCourseCard";
import { PixelHoodieIcon } from "@/components/icons/PixelHoodieIcon";
import { SaberHoodieIcon } from "@/components/icons/SaberHoodieIcon";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { GlowingCoinIcon } from "@/components/icons/GlowingCoinIcon";
import TokenGate from "@/components/TokenGate";
import { Card, CardContent } from "@/components/ui/card";
import { squadTracks, getSquadForCourse, getCoursesForSquad } from "@/lib/squadData";
import { isCurrentUserAdmin, getConnectedWallet, getCompletedCoursesCount } from "@/lib/utils";
import { fetchUserByWallet } from "@/lib/supabase";
import SquadFilter from '@/components/SquadFilter';
import { logUserActivity } from '@/lib/activity-logger';

// Only showing the two completed courses for now
const allCourses: Array<{
  id: string;
  title: string;
  description: string;
  badge: string;
  emoji: string;
  pathType: "tech" | "social" | "converged";
  href: string;
  localStorageKey?: string;
  totalLessons?: number;
  category?: string;
  level?: string;
  access?: string;
  squad?: string;
}> = [
  {
    id: 'wallet-wizardry',
    title: "Wallet Wizardry",
    description: "Master wallet setup with interactive quizzes and MetaMask integration.",
    badge: "Vault Keeper",
    emoji: "🔒",
    pathType: "tech",
    href: "/courses/wallet-wizardry",
    localStorageKey: "walletWizardryProgress",
    totalLessons: 4,
    squad: "Decoders",
    category: "wallet",
    level: "beginner",
    access: "free",
  },
  {
    id: 't100-chart-literacy',
    title: "T100 🎯 Intro to Indicators: RSI, BBands, Fibs + Candle Basics",
    description: "Learn the core tools of technical analysis: RSI, Bollinger Bands, Fibonacci levels, and candlestick theory. Understand how they work, when they lie, and how to combine them for real confluence.",
    badge: "Chart Reader",
    emoji: "📊",
    pathType: "tech",
    href: "/courses/t100-chart-literacy",
    localStorageKey: "t100ChartLiteracyProgress",
    totalLessons: 4,
    squad: "Raiders",
    category: "technical-analysis",
    level: "beginner",
    access: "free",
  },
];

type FilterType = 'all' | 'squads' | 'completed' | 'collab';

export default function CoursesPage() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedSquad, setSelectedSquad] = useState<string>('All');
  const [courseCompletionStatus, setCourseCompletionStatus] = useState<Record<string, { completed: boolean, progress: number }>>({});
  const [userSquad, setUserSquad] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [passwordAttempt, setPasswordAttempt] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Update current time
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString());
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Check admin status and load user data
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const walletAddress = getConnectedWallet();
        if (walletAddress) {
          const user = await fetchUserByWallet(walletAddress);
          setIsAdmin(user?.is_admin || false);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };

    const loadUserData = async () => {
      try {
        // Load user squad from localStorage
        const savedSquad = localStorage.getItem('userSquad');
        if (savedSquad) {
          setUserSquad(savedSquad);
        }

        // Load course completion status
        const status: Record<string, { completed: boolean, progress: number }> = {};
        allCourses.forEach(course => {
          if (course.localStorageKey) {
            const saved = localStorage.getItem(course.localStorageKey);
            if (saved) {
              try {
                const data = JSON.parse(saved);
                status[course.localStorageKey] = {
                  completed: data.completed || false,
                  progress: data.progress || 0
                };
              } catch (e) {
                console.error('Error parsing course data for', course.localStorageKey, e);
              }
            }
          }
        });
        setCourseCompletionStatus(status);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading user data:', error);
        setIsLoading(false);
      }
    };

    checkAdminStatus();
    loadUserData();
  }, [userSquad, isAdmin]);

  // Log course browsing activity
  useEffect(() => {
    const logCourseBrowsing = async () => {
      try {
        const walletAddress = getConnectedWallet();
        if (walletAddress) {
          await logUserActivity({
            wallet_address: walletAddress,
            activity_type: 'course_browse',
            course_data: {
              course_id: 'courses_page',
              course_name: 'Course Catalog'
            },
            notes: 'User browsed available courses'
          });
        }
      } catch (error) {
        console.error('Failed to log course browsing:', error);
      }
    };

    // Log after a short delay to ensure user is actually browsing
    const timer = setTimeout(logCourseBrowsing, 2000);
    return () => clearTimeout(timer);
  }, []);

  const getCompletionInfo = (key: string): { completed: boolean, progress: number } => {
    return courseCompletionStatus[key] || { completed: false, progress: 0 };
  };

  const handlePasswordSubmit = () => {
    // Admin bypass removed - proper authentication required
    setPasswordError("");
    setShowPasswordInput(false);
  };

  const resetAllCourses = () => {
    if (window.confirm('Are you sure you want to reset all course progress? This action cannot be undone.')) {
      // Clear all course progress from localStorage
      allCourses.forEach(course => {
        if (course.localStorageKey) {
          localStorage.removeItem(course.localStorageKey);
        }
      });
      
      // Clear final exam results
      localStorage.removeItem('walletWizardryFinalExamPassed');
      
      // Clear placement test results
      localStorage.removeItem('userSquad');
      
      // Clear onboarding completion
      localStorage.removeItem('onboardingCompleted');
      
      // Refresh the page to update the UI
      window.location.reload();
    }
  };

  const resetIndividualCourse = (courseId: string) => {
    const course = allCourses.find(c => c.id === courseId);
    if (!course || !course.localStorageKey) return;
    
    if (window.confirm(`Are you sure you want to reset progress for "${course.title}"? This action cannot be undone.`)) {
      localStorage.removeItem(course.localStorageKey);
      
      // If it's wallet wizardry, also clear the final exam
      if (courseId === 'wallet-wizardry') {
        localStorage.removeItem('walletWizardryFinalExamPassed');
      }
      
      // Refresh the page to update the UI
      window.location.reload();
    }
  };

  // Filter courses based on active filter, selected squad, and user's squad
  const getFilteredCourses = () => {
    let filteredCourses = allCourses;

    // Apply squad filter first
    if (selectedSquad && selectedSquad !== 'All') {
      filteredCourses = filteredCourses.filter(course => course.squad === selectedSquad);
    }

    // Apply filters based on active filter
    switch (activeFilter) {
      case 'completed':
        const completedCourses = filteredCourses.filter(course => 
          course.localStorageKey && courseCompletionStatus[course.localStorageKey]?.completed
        );
        return completedCourses;
      case 'squads':
        if (selectedSquad) {
          // Show courses for selected squad
          const squadCourseIds = getCoursesForSquad(selectedSquad);
          const squadCourses = filteredCourses.filter(course => squadCourseIds.includes(course.id));
          return squadCourses;
        } else if (!isAdmin && userSquad) {
          // Show courses for user's squad when no specific squad is selected
          const squadCourseIds = getCoursesForSquad(userSquad);
          const userSquadCourses = filteredCourses.filter(course => squadCourseIds.includes(course.id));
          return userSquadCourses;
        }
        return filteredCourses;
      default:
        // For 'all' filter, apply gating logic
        // Only show 100-level free courses to non-admin users
        if (!isAdmin) {
          filteredCourses = filteredCourses.filter(course => {
            const isFree = course.access === 'free' || course.access === 'Free';
            const is100Level = course.level === 'beginner' || course.level === '100' || course.level === '100-level';
            return isFree && is100Level;
          });
        }
        return filteredCourses;
    }
  };

  const completedCoursesCount = getCompletedCoursesCount();

  // Helper function to determine if a course should be gated
  const shouldShowGatedCourse = (course: any) => {
    if (isAdmin) return false; // Admins see all courses normally
    const isFree = course.access === 'free' || course.access === 'Free';
    const is100Level = course.level === 'beginner' || course.level === '100' || course.level === '100-level';
    return !isFree || !is100Level;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <span className="text-cyan-400 text-2xl animate-pulse">Loading courses...</span>
      </div>
    );
  }

  return (
    <TokenGate>
      <div className="min-h-screen relative overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 -z-10 bg-cover bg-center bg-fixed"
          style={{
            backgroundImage: "url('/images/Hoodie Courses.png')",
          }}
        />
        
        {/* Background Overlay - Enhanced for Hoodie courses theme */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-slate-900/80 via-purple-900/70 to-slate-900/80" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_60%_at_50%_20%,rgba(139,92,246,0.20),transparent)]" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(80%_80%_at_20%_80%,rgba(6,182,212,0.15),transparent)]" />
        
        {/* Animated background effects */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        
        <div className="relative z-10 p-8">
          {/* Header */}
          <div className="text-center mb-12">
            {/* Home Navigation Button */}
            <div className="flex justify-start mb-6">
              <Button
                asChild
                variant="outline"
                className="bg-slate-800/50 hover:bg-slate-700/50 text-cyan-400 hover:text-cyan-300 border-cyan-500/30 hover:border-cyan-400/50 transition-all duration-300"
              >
                <Link href="/">
                  <Home className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
            </div>
            
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent glow-text">
              The Hoodie Path
            </h1>
            <p className="text-xl text-gray-300 mb-2">Your Quest to Hoodie Scholar.</p>
            <p className="text-cyan-300 text-lg">
              Current Time: <span className="text-green-400 font-mono">{currentTime}</span>
            </p>

            {/* Squad Information */}
            {userSquad && !isAdmin && (
              <div className="mt-6">
                <Card className="max-w-md mx-auto bg-slate-800/50 border-2 border-yellow-500/30 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-center space-x-3">
                      <span className="text-yellow-400 text-lg">🎯</span>
                      <div className="text-center">
                        <p className="text-yellow-400 font-semibold">Your Squad Track</p>
                        <p className="text-gray-300 text-sm">
                          {typeof userSquad === 'string' 
                            ? (squadTracks.find(s => s.id === userSquad)?.name || userSquad)
                            : 'Unknown Squad'
                          }
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Admin Access Notice */}
            {isAdmin && (
              <div className="mt-6">
                <Card className="max-w-md mx-auto bg-slate-800/50 border-2 border-purple-500/30 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-center space-x-3">
                      <Shield className="w-5 h-5 text-purple-400" />
                      <div className="text-center">
                        <p className="text-purple-400 font-semibold">Admin Access</p>
                        <p className="text-gray-300 text-sm">Password authenticated - viewing all courses</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* No Squad Notice */}
            {!userSquad && !isAdmin && (
              <div className="mt-6">
                <Card className="max-w-md mx-auto bg-slate-800/50 border-2 border-orange-500/30 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-center space-x-3">
                      <span className="text-orange-400 text-lg">⚠️</span>
                      <div className="text-center">
                        <p className="text-orange-400 font-semibold">Squad Assignment Required</p>
                        <p className="text-gray-300 text-sm">Complete onboarding to access squad-specific courses</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <Button
              onClick={() => setActiveFilter('all')}
              variant={activeFilter === 'all' ? 'default' : 'outline'}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white"
            >
              <Filter className="w-4 h-4 mr-2" />
              All Courses
            </Button>
            <Button
              onClick={() => setActiveFilter('squads')}
              variant={activeFilter === 'squads' ? 'default' : 'outline'}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white"
            >
              <HoodieIcon className="w-4 h-4 mr-2" />
              Squad Courses
            </Button>
            <Button
              onClick={() => setActiveFilter('completed')}
              variant={activeFilter === 'completed' ? 'default' : 'outline'}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Completed ({completedCoursesCount})
            </Button>
          </div>

          {/* Squad Filter */}
          <div className="flex justify-center mb-8">
            <SquadFilter
              onChange={setSelectedSquad}
              selectedSquad={selectedSquad}
            />
          </div>

          {/* Course Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {getFilteredCourses().map((course) => (
              shouldShowGatedCourse(course) ? (
                <GatedCourseCard
                  key={course.id}
                  id={course.id}
                  title={course.title}
                  description={course.description}
                  badge={course.badge}
                  emoji={course.emoji}
                  pathType={course.pathType}
                  squad={course.squad}
                  level={course.level}
                  access={course.access}
                />
              ) : (
                <CourseCard
                  key={course.id}
                  id={course.id}
                  title={course.title}
                  description={course.description}
                  badge={course.badge}
                  emoji={course.emoji}
                  pathType={course.pathType}
                  href={course.href}
                  isCompleted={course.localStorageKey ? courseCompletionStatus[course.localStorageKey]?.completed : false}
                  progress={course.localStorageKey ? courseCompletionStatus[course.localStorageKey]?.progress : 0}
                  isAdmin={isAdmin}
                  onResetCourse={resetIndividualCourse}
                />
              )
            ))}
          </div>

          {/* Admin Controls */}
          {isAdmin && (
            <div className="mt-12 text-center">
              <Card className="max-w-md mx-auto bg-slate-800/50 border-2 border-red-500/30 backdrop-blur-sm">
                <CardContent className="p-6">
                  <h3 className="text-red-400 font-semibold mb-4">Admin Controls</h3>
                  <div className="space-y-3">
                    <Button
                      onClick={resetAllCourses}
                      variant="destructive"
                      className="w-full"
                    >
                      Reset All Course Progress
                    </Button>
                    <p className="text-xs text-gray-400">
                      This will clear all user progress and force re-onboarding
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Footer */}
          <div className="text-center mt-16 text-gray-400">
            <p className="text-sm">
              🎓 Hoodie Academy - Building the Future of Web3 Education
            </p>
          </div>
        </div>
      </div>
    </TokenGate>
  );
}
