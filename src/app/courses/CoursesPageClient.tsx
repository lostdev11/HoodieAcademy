'use client';

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Home, ArrowDown, ArrowRight, LockKeyhole, CheckCircle, LineChart, Clock, Filter, Shield, RefreshCw, Info } from "lucide-react";
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
import { squadTracks, getSquadForCourse, getCoursesForSquad } from '@/lib/squadData';
import { isCurrentUserAdmin, getConnectedWallet, getCompletedCoursesCount } from '@/lib/utils';
import { fetchUserByWallet } from '@/lib/supabase';
import SquadFilter from '@/components/SquadFilter';
import { MobileNavigation } from '@/components/dashboard/MobileNavigation';
import { SyllabusPanel } from '@/components/SyllabusPanel';
import { getVisibleCourses, type Course, initializeCourses } from '@/lib/coursesData';

// Get visible courses dynamically instead of at import time
const getCourses = (isAdmin: boolean = false) => {
  // Always initialize courses from storage to get latest admin changes
  initializeCourses(isAdmin);
  return getVisibleCourses(isAdmin);
};

type FilterType = 'all' | 'squads' | 'completed' | 'collab';

export default function CoursesPageClient() {
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
  const [syllabusPanel, setSyllabusPanel] = useState<{
    isOpen: boolean;
    data: any;
    courseTitle: string | null;
  }>({
    isOpen: false,
    data: null,
    courseTitle: null
  });

  // Add state to force re-renders when courses change
  const [coursesVersion, setCoursesVersion] = useState(0);

  // Initialize courses from localStorage on mount
  useEffect(() => {
    // Force initialization of courses from localStorage
    initializeCourses(isAdmin);
    if (isAdmin) {
      console.log('Courses initialized from localStorage');
    }

    // Listen for course visibility changes from admin
    const handleCoursesVisibilityChanged = () => {
      console.log('Courses visibility changed, refreshing courses...');
      setCoursesVersion(prev => prev + 1);
    };

    window.addEventListener('coursesVisibilityChanged', handleCoursesVisibilityChanged);
    
    return () => {
      window.removeEventListener('coursesVisibilityChanged', handleCoursesVisibilityChanged);
    };
  }, [isAdmin]);

  // Clean up corrupted squad data in localStorage
  useEffect(() => {
    const savedSquad = localStorage.getItem('userSquad');
    if (savedSquad) {
      try {
        const parsedSquad = JSON.parse(savedSquad);
        if (parsedSquad && typeof parsedSquad === 'object' && parsedSquad.name) {
          // If it's a full squad object, clean it up
          if (isAdmin) {
            console.log('Found corrupted squad data:', parsedSquad);
          }
          const squadId = parsedSquad.name || parsedSquad.id || savedSquad;
          setUserSquad(squadId);
          // Clean up localStorage to only store the squad ID/name
          localStorage.setItem('userSquad', squadId);
          if (isAdmin) {
            console.log('Cleaned up squad data in localStorage:', squadId);
          }
        } else {
          if (isAdmin) {
            console.log('Squad data is already in correct format:', savedSquad);
          }
        }
      } catch (e) {
        // If parsing fails, it's already a string, which is fine
        if (isAdmin) {
          console.log('Squad data is already in correct format (string):', savedSquad);
        }
      }
    } else {
      if (isAdmin) {
        console.log('No squad data found in localStorage');
      }
    }
  }, [isAdmin]);

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
          try {
            // Try to parse as JSON first (in case it's stored as a full squad object)
            const parsedSquad = JSON.parse(savedSquad);
            if (parsedSquad && typeof parsedSquad === 'object') {
              // If it's a full squad object, extract the squad ID and clean up localStorage
              const squadId = parsedSquad.name || parsedSquad.id || savedSquad;
              setUserSquad(squadId);
              // Clean up localStorage to only store the squad ID/name
              localStorage.setItem('userSquad', squadId);
              console.log('Cleaned up squad data in localStorage:', squadId);
            } else {
              // If parsing fails or it's just a string, use as is
              setUserSquad(savedSquad);
            }
          } catch (e) {
            // If JSON parsing fails, treat as plain string
            setUserSquad(savedSquad);
          }
        }

        // Load course completion status
        const status: Record<string, { completed: boolean, progress: number }> = {};
        getCourses(isAdmin).forEach(course => {
          if (course.localStorageKey) {
            const saved = localStorage.getItem(course.localStorageKey);
            if (saved) {
              try {
                const progress = JSON.parse(saved);
                status[course.id] = {
                  completed: progress.completed || false,
                  progress: progress.progress || 0
                };
              } catch (e) {
                console.error('Error parsing course progress:', e);
              }
            }
          }
        });
        setCourseCompletionStatus(status);
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
    loadUserData();
  }, [coursesVersion, isAdmin]); // Add coursesVersion and isAdmin dependency

  // Listen for localStorage changes to refresh courses when admin makes changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'adminCoursesData') {
        if (isAdmin) {
          console.log('Admin courses data changed, refreshing courses...');
        }
        setCoursesVersion(prev => prev + 1);
      }
    };

    // Listen for custom event when courses are updated in the same tab
    const handleCoursesUpdated = (e: CustomEvent) => {
      if (isAdmin) {
        console.log('Courses updated event received, refreshing courses...');
      }
      setCoursesVersion(prev => prev + 1);
    };

    // Listen for storage events from other tabs/windows
    window.addEventListener('storage', handleStorageChange);
    
    // Listen for custom event from same tab
    window.addEventListener('coursesUpdated', handleCoursesUpdated as EventListener);

    // Also check for changes periodically (every 5 seconds)
    const interval = setInterval(() => {
      const stored = localStorage.getItem('adminCoursesData');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          // Get current courses without calling getCourses() to avoid infinite loops
          const currentCourses = getVisibleCourses(isAdmin);
          // Check if any course visibility has changed
          const hasChanges = parsed.some((storedCourse: any) => {
            const currentCourse = currentCourses.find(c => c.id === storedCourse.id);
            return currentCourse && (storedCourse.isVisible !== currentCourse.isVisible || storedCourse.isPublished !== currentCourse.isPublished);
          });
          
          if (hasChanges) {
            if (isAdmin) {
              console.log('Course visibility changes detected, refreshing...');
            }
            setCoursesVersion(prev => prev + 1);
          }
        } catch (error) {
          console.error('Error checking for course changes:', error);
        }
      }
    }, 5000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('coursesUpdated', handleCoursesUpdated as EventListener);
      clearInterval(interval);
    };
  }, [isAdmin]);

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
      getCourses(isAdmin).forEach(course => {
        if (course.localStorageKey) {
          localStorage.removeItem(course.localStorageKey);
        }
      });
      
      // Clear final exam results
      localStorage.removeItem('walletWizardryFinalExamPassed');
      
      // Clear placement test results
      if (isAdmin) {
        console.log('Clearing userSquad from localStorage in resetAllCourses');
      }
      localStorage.removeItem('userSquad');
      
      // Clear onboarding completion
      localStorage.removeItem('onboardingCompleted');
      
      // Refresh the page to update the UI
      window.location.reload();
    }
  };

  const resetIndividualCourse = (courseId: string) => {
    const course = getCourses(isAdmin).find(c => c.id === courseId);
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

  const openSyllabusPanel = (courseId: string, courseTitle: string) => {
    const syllabusData = require('@/lib/syllabusData').syllabusData;
    const data = syllabusData[courseId];
    
    if (data) {
      setSyllabusPanel({
        isOpen: true,
        data,
        courseTitle
      });
    }
  };

  const closeSyllabusPanel = () => {
    setSyllabusPanel({
      isOpen: false,
      data: null,
      courseTitle: null
    });
  };

  // Filter courses based on active filter, selected squad, and user's squad
  const getFilteredCourses = () => {
    let filteredCourses = getCourses(isAdmin); // Get fresh data each time

    if (isAdmin) {
      console.log('Filtering courses:', {
        activeFilter,
        selectedSquad,
        userSquad,
        isAdmin,
        totalCourses: filteredCourses.length,
        visibleCourses: filteredCourses.map(c => ({ id: c.id, title: c.title, visible: c.isVisible, published: c.isPublished }))
      });

      // Debug: Log all courses and their visibility status
      console.log('All courses from getCourses():', filteredCourses.map(c => ({
        id: c.id,
        title: c.title,
        isVisible: c.isVisible,
        isPublished: c.isPublished,
        access: c.access,
        level: c.level
      })));
    }

    switch (activeFilter) {
      case 'squads':
        if (selectedSquad !== 'All') {
          filteredCourses = filteredCourses.filter(course => course.squad === selectedSquad);
        }
        return filteredCourses;
      case 'completed':
        return filteredCourses.filter(course => {
          const status = courseCompletionStatus[course.id];
          return status && status.completed;
        });
      case 'collab':
        return filteredCourses.filter(course => course.pathType === 'social');
      default:
        // For 'all' filter, apply gating logic
        // Only show 100-level free courses to non-admin users
        if (!isAdmin) {
          filteredCourses = filteredCourses.filter(course => {
            const isFree = course.access === 'free' || course.access === 'Free';
            const is100Level = course.level === 'beginner' || course.level === '100' || course.level === '100-level';
            return isFree && is100Level;
          });
          if (isAdmin) {
            console.log('Filtered to 100-level free courses:', filteredCourses.length);
          }
        }
        if (isAdmin) {
          console.log('All courses (all filter):', filteredCourses.length);
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
        {/* Animated background effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-900 to-slate-900"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="relative z-10 px-4 py-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12">
            {/* Navigation */}
            <div className="flex justify-between items-center mb-6">
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
              
              {/* Mobile Navigation */}
              <div className="sm:hidden">
                <MobileNavigation userSquad={userSquad} isAdmin={isAdmin} />
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <h1 className="text-3xl font-bold text-white">Courses</h1>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Clock className="w-4 h-4" />
                  {currentTime}
                </div>
                <div className="text-sm text-cyan-400">
                  {getFilteredCourses().length} courses available
                </div>
              </div>
              
              {isAdmin && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCoursesVersion(prev => prev + 1)}
                  className="text-xs border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                >
                  <RefreshCw className={`w-3 h-3 mr-1 ${coursesVersion > 0 ? 'animate-spin' : ''}`} />
                  Refresh Courses
                </Button>
              )}
            </div>

            {/* Squad Assignment Notice */}
            {userSquad && (
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-600 mb-6">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">
                    {(() => {
                      // Try to find squad by name first, then by ID
                      const squadData = squadTracks.find(s => 
                        s.name === userSquad || s.id === userSquad
                      );
                      return squadData?.icon || '🎯';
                    })()}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">
                      Your Squad: {(() => {
                        const squadData = squadTracks.find(s => 
                          s.name === userSquad || s.id === userSquad
                        );
                        return squadData?.name || userSquad;
                      })()}
                    </h2>
                    <p className="text-gray-400">
                      {(() => {
                        const squadData = squadTracks.find(s => 
                          s.name === userSquad || s.id === userSquad
                        );
                        return squadData?.description || '';
                      })()}
                    </p>
                  </div>
                </div>
                {/* Debug info for admins */}
                {isAdmin && (
                  <div className="mt-2 text-xs text-gray-500">
                    Debug: userSquad = "{userSquad}" (type: {typeof userSquad})
                    <Button
                      onClick={() => {
                        if (window.confirm('Clear and fix squad data in localStorage?')) {
                          localStorage.removeItem('userSquad');
                          setUserSquad(null);
                          console.log('Squad data cleared from localStorage');
                        }
                      }}
                      variant="outline"
                      size="sm"
                      className="ml-2 border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                    >
                      Clear Squad Data
                    </Button>
                  </div>
                )}
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
          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-2 sm:gap-4 mb-6 sm:mb-8">
            <Button
              onClick={() => setActiveFilter('all')}
              variant={activeFilter === 'all' ? 'default' : 'outline'}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white w-full sm:w-auto min-h-[44px]"
            >
              <Filter className="w-4 h-4 mr-2" />
              All Courses
            </Button>
            <Button
              onClick={() => setActiveFilter('squads')}
              variant={activeFilter === 'squads' ? 'default' : 'outline'}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white w-full sm:w-auto min-h-[44px]"
            >
              <HoodieIcon className="w-4 h-4 mr-2" />
              Squad Courses
            </Button>
            <Button
              onClick={() => setActiveFilter('completed')}
              variant={activeFilter === 'completed' ? 'default' : 'outline'}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white w-full sm:w-auto min-h-[44px]"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Completed ({completedCoursesCount})
            </Button>
            <Button
              onClick={() => {
                if (isAdmin) {
                  console.log('Manual refresh triggered');
                }
                setCoursesVersion(prev => prev + 1);
              }}
              variant="outline"
              className="border-orange-500 text-orange-400 hover:bg-orange-500 hover:text-white w-full sm:w-auto min-h-[44px]"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-7xl mx-auto">
            {/* Debug: Show what courses are being displayed */}
            {isAdmin && (
              <div className="md:col-span-2 lg:col-span-3 mb-4 p-3 bg-slate-800/30 rounded-lg border border-cyan-500/30">
                <p className="text-cyan-400 text-sm font-semibold mb-2">Debug: Courses being displayed:</p>
                <div className="text-xs text-gray-400">
                  {getFilteredCourses().map(course => (
                    <div key={course.id} className="flex items-center gap-2 mb-1">
                      <span className={`w-2 h-2 rounded-full ${course.isVisible ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      <span className={`w-2 h-2 rounded-full ${course.isPublished ? 'bg-blue-500' : 'bg-yellow-500'}`}></span>
                      <span>{course.title}</span>
                      <span className="text-gray-500">({course.id})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
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
                  onOpenSyllabus={openSyllabusPanel}
                />
              )
            ))}
          </div>

          {/* Admin Controls */}
          {isAdmin && (
            <div className="mt-8 sm:mt-12 text-center">
              <Card className="max-w-md mx-auto bg-slate-800/50 border-2 border-red-500/30 backdrop-blur-sm">
                <CardContent className="p-4 sm:p-6">
                  <h3 className="text-red-400 font-semibold mb-4">Admin Controls</h3>
                  <div className="space-y-3">
                    <Button
                      onClick={resetAllCourses}
                      variant="destructive"
                      className="w-full min-h-[44px]"
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

          {/* Debug Section for Admin */}
          {isAdmin && (
            <div className="mt-8 sm:mt-12">
              <Card className="max-w-4xl mx-auto bg-slate-800/50 border-2 border-orange-500/30 backdrop-blur-sm">
                <CardContent className="p-4 sm:p-6">
                  <h3 className="text-orange-400 font-semibold mb-4 flex items-center gap-2">
                    <Info className="w-5 h-5" />
                    Course Visibility Debug Info
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400 mb-2">LocalStorage Status:</p>
                      <p className="text-cyan-400">
                        {typeof window !== 'undefined' && localStorage.getItem('adminCoursesData') ? '✅ Data saved' : '❌ No data'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-2">Courses in Memory:</p>
                      <p className="text-cyan-400">{getCourses(isAdmin).length} total</p>
                    </div>
                    <div className="md:col-span-2 flex justify-center">
                      <Button
                        onClick={() => {
                          if (isAdmin) {
                            console.log('Manual refresh triggered from courses page');
                          }
                          setCoursesVersion(prev => prev + 1);
                        }}
                        variant="outline"
                        size="sm"
                        className="border-orange-500 text-orange-400 hover:bg-orange-500 hover:text-white"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh Courses
                      </Button>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-gray-400 mb-2">All Courses Status:</p>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {getCourses(isAdmin).map(course => (
                          <div key={course.id} className="flex items-center gap-2 text-xs">
                            <span className={`w-3 h-3 rounded-full ${course.isVisible ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            <span className={`w-3 h-3 rounded-full ${course.isPublished ? 'bg-blue-500' : 'bg-yellow-500'}`}></span>
                            <span className="text-gray-300">{course.title}</span>
                            <span className="text-gray-500">({course.id})</span>
                            <span className={`text-xs ${course.isVisible ? 'text-green-400' : 'text-red-400'}`}>
                              {course.isVisible ? 'Visible' : 'Hidden'}
                            </span>
                            <span className={`text-xs ${course.isPublished ? 'text-blue-400' : 'text-yellow-400'}`}>
                              {course.isPublished ? 'Published' : 'Draft'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Footer */}
          <div className="text-center mt-8 sm:mt-16 text-gray-400">
            <p className="text-xs sm:text-sm">
              🎓 Hoodie Academy - Building the Future of Web3 Education
            </p>
          </div>
        </div>

        {/* Syllabus Panel */}
        <SyllabusPanel
          data={syllabusPanel.data}
          courseTitle={syllabusPanel.courseTitle}
          isOpen={syllabusPanel.isOpen}
          onClose={closeSyllabusPanel}
        />
      </div>
    </TokenGate>
  );
} 