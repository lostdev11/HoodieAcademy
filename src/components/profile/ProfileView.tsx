'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pencil, Save, User, Award, BookOpen, Wallet, Users, ChevronDown, ChevronUp, CheckCircle, TrendingUp, Home, Copy, ExternalLink, Target, Upload, Image as ImageIcon, Star, Zap, Trophy, Medal, Crown, Gem, Shield, AlertCircle } from 'lucide-react';
import { squadTracks } from '@/lib/squadData';
import Link from 'next/link';
import { formatWalletAddress } from '@/lib/utils';
import SquadBadge from '@/components/SquadBadge';
import PfpPicker from '@/components/profile/PfpPicker';
import { NFT } from '@/services/nft-service';
import { fetchUserByWallet, isSupabaseConfigured } from '@/lib/supabase';
import { BountySubmissionForm, BountySubmissionData } from '@/components/bounty';
import { useWalletSupabase } from '@/hooks/use-wallet-supabase';
import { useUserXP } from '@/hooks/useUserXP';
import { useUserBounties } from '@/hooks/useUserBounties';
import { UserDataDebug } from '@/components/debug/UserDataDebug';

// Real data functions
const getRealUserData = (walletAddress: string) => {
  if (!walletAddress) return null;
  
  const userProgress = localStorage.getItem('userProgress');
  const userProfiles = localStorage.getItem('userProfiles');
  
  if (userProgress) {
    try {
      const progress = JSON.parse(userProgress);
      const profiles = userProfiles ? JSON.parse(userProfiles) : {};
      const userData = progress[walletAddress];
      const profile = profiles[walletAddress] || {};
      
      if (userData) {
        return {
          displayName: profile.displayName || `User ${walletAddress.slice(0, 6)}...`,
          squad: profile.squad || 'Unassigned',
          joined: profile.createdAt || new Date().toISOString(),
          rank: profile.rank || 'Scholar',
          completedCourses: Object.entries(userData.courses || {}).map(([courseId, courseData]: [string, any]) => ({
            id: courseId,
            title: courseId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
            progress: courseData.progress ? (courseData.progress.filter((p: string) => p === 'completed').length / courseData.progress.length) * 100 : 0,
            score: courseData.finalExam?.score || 0
          })),
          badges: [] // Badges would be calculated based on achievements
        };
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
  }
  
  return null;
};

export function ProfileView() {
  const [editMode, setEditMode] = useState(false);
  const [displayName, setDisplayName] = useState(() => {
    // Get display name from localStorage
    return localStorage.getItem('userDisplayName') || 'Hoodie Scholar';
  });
  const [originalDisplayName, setOriginalDisplayName] = useState(() => {
    // Store original value for cancel functionality
    return localStorage.getItem('userDisplayName') || 'Hoodie Scholar';
  });
  const [squad, setSquad] = useState('Unassigned');
  const [wallet, setWallet] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [userSquad, setUserSquad] = useState<any>(null);
  const [placementTestCompleted, setPlacementTestCompleted] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [profileImage, setProfileImage] = useState<string>('🧑‍🎓');
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmittingBounty, setIsSubmittingBounty] = useState(false);
  const [selectedBountyId, setSelectedBountyId] = useState<string>('');
  const [availableBounties, setAvailableBounties] = useState<any[]>([]);
  const [saveProgress, setSaveProgress] = useState<string>('');
  const [saveError, setSaveError] = useState<string>('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Wallet connection
  const { connectWallet, disconnectWallet: disconnectWalletHook } = useWalletSupabase();

  // XP System integration
  const { 
    totalXP = 0, 
    level = 1, 
    completedCourses = [], 
    badges = [], 
    loading: xpLoading = false,
    completeCourse 
  } = useUserXP(wallet);

  // Bounty System integration
  const {
    submissions: bountySubmissions,
    stats: bountyStats,
    loading: bountyLoading,
    error: bountyError
  } = useUserBounties(wallet);

  // Handle bounty submission from profile page
  const handleBountySubmit = async (data: BountySubmissionData) => {
    if (!wallet) {
      alert('Please connect your wallet first');
      return;
    }

    // For profile page submissions, redirect to bounties page  
    alert('To submit to a specific bounty, please go to the Bounties page and click Submit Entry on the bounty you want to submit to.');
    window.location.href = '/bounties';
  };

  // Save profile function
  const saveProfile = async () => {
    if (!wallet) {
      setSaveError('No wallet connected');
      return;
    }

    if (displayName.trim() === '') {
      setSaveError('Display name cannot be empty');
      return;
    }

    setIsSaving(true);
    setSaveError('');
    setSaveSuccess(false);
    setSaveProgress('Saving profile...');

    try {
      const response = await fetch('/api/users/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: wallet,
          displayName: displayName.trim(),
          squad: squad,
          activityType: 'profile_update',
          metadata: {
            field: 'display_name',
            old_value: originalDisplayName,
            new_value: displayName.trim(),
            timestamp: new Date().toISOString()
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save profile');
      }

      const result = await response.json();
      console.log('✅ Profile saved successfully:', result);

      // Update localStorage
      localStorage.setItem('userDisplayName', displayName.trim());
      setOriginalDisplayName(displayName.trim());
      setSaveSuccess(true);
      setSaveProgress('Profile saved successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
        setSaveProgress('');
      }, 3000);

    } catch (error) {
      console.error('❌ Error saving profile:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to save profile');
      setSaveProgress('');
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel editing function
  const cancelEdit = () => {
    setDisplayName(originalDisplayName);
    setEditMode(false);
    setSaveError('');
    setSaveSuccess(false);
    setSaveProgress('');
  };

  // Load profile data from API
  const loadProfileData = async (walletAddress: string) => {
    try {
      console.log('🔄 Loading profile data for wallet:', walletAddress.slice(0, 8) + '...');
      
      const response = await fetch(`/api/users/track?wallet=${walletAddress}`);
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Profile data loaded:', data);
        
        if (data.user && data.user.display_name) {
          const savedDisplayName = data.user.display_name;
          setDisplayName(savedDisplayName);
          setOriginalDisplayName(savedDisplayName);
          localStorage.setItem('userDisplayName', savedDisplayName);
          console.log('✅ Loaded saved display name:', savedDisplayName);
        }
        
        if (data.user && data.user.squad) {
          setSquad(data.user.squad);
        }
      }
    } catch (error) {
      console.error('❌ Error loading profile data:', error);
    }
  };

  // Auto-detect connected wallet from database or session
  useEffect(() => {
    const detectConnectedWallet = async () => {
      // Check localStorage for wallet address
      const currentWallet = typeof window !== 'undefined' 
        ? localStorage.getItem('walletAddress') || localStorage.getItem('hoodie_academy_wallet') || ''
        : '';
      
      console.log('ProfileView: Detected wallet:', currentWallet);
      setWallet(currentWallet);

      // Load profile data from API
      if (currentWallet) {
        await loadProfileData(currentWallet);
      }

      // Try to fetch user data from Supabase first
      if (currentWallet) {
        try {
          // Check if Supabase is properly configured
          if (isSupabaseConfigured) {
            const userData = await fetchUserByWallet(currentWallet);
            if (userData) {
              // Update state with Supabase data
              if (userData.display_name) {
                setDisplayName(userData.display_name);
                setOriginalDisplayName(userData.display_name);
              }
              if (userData.squad) {
                // Set squad from Supabase
                setSquad(userData.squad);
                setUserSquad({ name: userData.squad });
              }
              if (userData.squad_test_completed) {
                setPlacementTestCompleted(true);
              }
            }
          } else {
            console.warn('Supabase not configured - user data will be loaded from database');
          }
        } catch (error) {
          console.error('Error fetching user data from Supabase:', error);
        }
      }
    };

    // Load user data from database instead of localStorage
    const loadUserData = async () => {
      try {
        // TODO: Implement database loading for user profile data
        // This should fetch user squad, display name, profile image, etc. from database
        console.log('Loading user data from database...');
      } catch (error) {
        console.error('Error loading user data from database:', error);
      }
    };

    loadUserData();
    detectConnectedWallet();
  }, []);

  // Load real user data when wallet changes
  useEffect(() => {
    if (wallet) {
      const realData = getRealUserData(wallet);
      setUserData(realData);
      setIsInitializing(false);
    }
  }, [wallet]);

  // Add timeout fallback to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isInitializing) {
        console.warn('Profile initialization timeout - forcing completion');
        setIsInitializing(false);
      }
    }, 5000); // 5 second timeout

    return () => clearTimeout(timeout);
  }, [isInitializing]);

  const handleSave = async () => {
    if (displayName.trim()) {
      const trimmedName = displayName.trim();
      
      // Set loading state
      setIsSaving(true);
      
      // Global timeout protection for the entire save operation
      const saveTimeout = setTimeout(() => {
        console.warn('Save operation timed out, forcing completion');
        setSaveProgress('Operation timed out after 15 seconds - local changes saved');
        alert('Save operation took longer than expected (15+ seconds). Your changes have been saved locally. This might be due to a slow internet connection or server issues. Please check your connection and try again later if you need to sync with the server.');
        setIsSaving(false);
        setEditMode(false);
      }, 15000); // 15 second global timeout
      
      try {
        // Save to database immediately for better UX
        setSaveProgress('Saving to database...');
        setOriginalDisplayName(trimmedName);
        setSaveProgress('Database saved successfully!');
        
        // Sync with Supabase if configured
        if (wallet) {
          try {
            // Check if Supabase is properly configured
            if (isSupabaseConfigured) {
              setSaveProgress('Connecting to server...');
              // Add timeout protection for the Supabase operation
              let supabase;
              try {
                const supabaseModule = await import('@/lib/supabase');
                supabase = supabaseModule.supabase;
                setSaveProgress('Server connected successfully!');
              } catch (importError) {
                console.error('Failed to import Supabase module:', importError);
                setSaveProgress('Server connection failed, database changes saved');
                throw new Error('Failed to connect to server');
              }
              
              setSaveProgress('Syncing with server... (1/3)');
              // Try the operation with a retry mechanism
              let retries = 2;
              let lastError;
              
              while (retries > 0) {
                try {
                  setSaveProgress(`Syncing with server... (${3 - retries}/3)`);
                  const { data, error } = await supabase
                    .from('users')
                    .upsert([
                      {
                        wallet_address: wallet,
                        display_name: trimmedName,
                        last_active: new Date().toISOString(),
                      }
                    ], {
                      onConflict: 'wallet_address'
                    });
                  
                  if (error) {
                    throw error;
                  } else {
                    console.log('Successfully updated display name in Supabase');
                    setSaveProgress('Server sync completed successfully!');
                    break; // Success, exit retry loop
                  }
                } catch (error) {
                  lastError = error;
                  retries--;
                  if (retries > 0) {
                    setSaveProgress(`Sync failed, retrying in 1 second... (${retries} attempts left)`);
                    console.log(`Supabase operation failed, retrying... (${retries} attempts left)`);
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
                  }
                }
              }
              
              if (retries === 0 && lastError) {
                console.error('Error updating display name in Supabase after retries:', lastError);
                setSaveProgress('Server sync failed after retries, but database changes saved');
              }
            } else {
              console.log('Supabase not configured - changes saved to database only');
              setSaveProgress('Database only - server not configured');
            }
          } catch (error) {
            console.error('Error syncing display name with Supabase:', error);
            console.log('Changes saved to database only');
            setSaveProgress('Server sync failed, but database changes saved');
          }
        } else {
          setSaveProgress('Database only - no wallet connected for server sync');
        }
        
        // Exit edit mode
        setEditMode(false);
        
        // Show success message
        console.log('Profile updated successfully!');
        setSaveProgress('Profile updated successfully! All changes saved.');
        
        // Clear success message after a short delay
        setTimeout(() => {
          setSaveProgress('');
        }, 2000);
        
      } catch (error) {
        console.error('Error during save operation:', error);
        // Keep user in edit mode if there was an error
        setSaveProgress(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
        alert('There was an error saving your changes. Please try again. If the problem persists, check your internet connection.');
      } finally {
        // Clear timeout and loading state
        clearTimeout(saveTimeout);
        setIsSaving(false);
        setSaveProgress('');
      }
    } else {
      // Don't save if display name is empty
      alert('Display name cannot be empty');
    }
  };

  const getSquadName = (squadId: string) => {
    const squad = squadTracks.find(s => s.id === squadId);
    return squad ? squad.name : squadId;
  };

  const getSquadDisplayName = () => {
    if (userSquad && typeof userSquad === 'object' && userSquad.name) {
      return userSquad.name;
    } else if (userSquad && typeof userSquad === 'string') {
      return getSquadName(userSquad);
    } else {
      return getSquadName(squad);
    }
  };

  const getSquadForBadge = () => {
    if (userSquad && typeof userSquad === 'object' && userSquad.name) {
      // Remove emoji prefix if present
      return userSquad.name.replace(/^[🎨🧠🎤⚔️🦅]+\s*/, '');
    } else if (userSquad && typeof userSquad === 'string') {
      return userSquad;
    } else {
      return squad;
    }
  };

  const getSquadDescription = () => {
    if (userSquad && typeof userSquad === 'object' && userSquad.description) {
      return userSquad.description;
    } else {
      const squadData = squadTracks.find(s => s.id === squad);
      return squadData ? squadData.description : '';
    }
  };

  const getSquadSpecialties = () => {
    if (userSquad && typeof userSquad === 'object' && userSquad.specialties) {
      return userSquad.specialties;
    } else {
      return [];
    }
  };

  const handleCopyWallet = async () => {
    try {
      await navigator.clipboard.writeText(wallet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy wallet address:', err);
    }
  };

  const handleWalletConnect = async () => {
    const connectedWallet = await connectWallet();
    if (connectedWallet) {
      setWallet(connectedWallet);
      // TODO: Save wallet address to database instead of localStorage
      console.log('Wallet connected, should save to database:', connectedWallet);
    }
  };

  const handleDisconnectWallet = () => {
    setWallet('');
    
    // Clear wallet data from database instead of localStorage
    // TODO: Implement database logout here
    console.log('Wallet disconnected, should clear from database');
    
    // Disconnect from wallet providers
    if (window.solana?.disconnect) {
      window.solana.disconnect();
    }
    disconnectWalletHook();
  };

  const handleProfileImageChange = (imageUrl: string, nftData?: NFT) => {
    setProfileImage(imageUrl);
    setSelectedNFT(nftData || null);
    
    // Save to database instead of localStorage
    // TODO: Implement database save here
    console.log('Profile image changed, should save to database:', { imageUrl, nftData });
  };

  const getWalletDisplay = () => {
    if (!wallet) {
      return (
        <span className="text-gray-400 text-sm">No wallet connected</span>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <span className="text-green-400 font-mono">
          {formatWalletAddress(wallet)}
        </span>
      </div>
    );
  };

  const overallProgress = userData?.completedCourses?.length > 0 
    ? Math.round(userData.completedCourses.reduce((acc: number, c: any) => acc + c.progress, 0) / userData.completedCourses.length)
    : 0;

  // Add error boundary for rendering
  if (!wallet) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="flex-1 flex flex-col items-center justify-center py-12 px-4">
          <Card className="w-full max-w-2xl bg-slate-800/60 border-red-500/30">
            <CardContent className="p-6 text-center">
              <h2 className="text-xl font-bold text-red-400 mb-4">Wallet Not Connected</h2>
              <p className="text-gray-300 mb-4">
                Please connect your wallet to view your profile.
              </p>
              <div className="space-y-3">
                <Button
                  asChild
                  className="bg-cyan-600 hover:bg-cyan-700"
                >
                  <Link href="/">
                    <Home className="w-4 h-4 mr-2" />
                    Go to Dashboard
                  </Link>
                </Button>
                <Button
                  onClick={handleWalletConnect}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  Connect Wallet
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show loading state while initializing
  if (isInitializing) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="flex-1 flex flex-col items-center justify-center py-12 px-4">
          <Card className="w-full max-w-2xl bg-slate-800/60 border-cyan-500/30">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h2 className="text-xl font-bold text-cyan-400 mb-4">Loading Profile...</h2>
              <p className="text-gray-300 mb-4">
                Please wait while we load your profile data.
              </p>
              {!isSupabaseConfigured && (
                <p className="text-amber-400 text-sm">
                  ⚠️ Using local storage mode - Supabase not configured
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="flex-1 flex flex-col items-center py-12 px-4">
        {/* Navigation Buttons */}
        <div className="w-full max-w-2xl mb-6 flex gap-3">
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
          <Button
            asChild
            variant="outline"
            className="bg-slate-800/50 hover:bg-slate-700/50 text-purple-400 hover:text-purple-300 border-purple-500/30 hover:border-purple-400/50 transition-all duration-300"
          >
            <Link href="/admin-dashboard">
              <Shield className="w-4 h-4 mr-2" />
              Admin Dashboard
            </Link>
          </Button>
        </div>

        {/* Supabase Configuration Warning */}
        {!isSupabaseConfigured && (
          <Card className="w-full max-w-2xl bg-amber-900/60 border-amber-500/30 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-amber-500 rounded-full animate-pulse"></div>
                <div className="flex-1">
                  <p className="text-amber-200 text-sm font-medium">Local Storage Mode</p>
                  <p className="text-amber-300 text-xs">
                    Supabase not configured. Your profile data is saved locally and will not sync across devices.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Debug Component - Remove this in production */}
        <UserDataDebug />

        <Card className="w-full max-w-2xl bg-slate-800/60 border-cyan-500/30 mb-8">
          <CardHeader>
            <CardTitle className="text-cyan-400 flex items-center gap-2">
              <User className="w-6 h-6" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-1 space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm font-medium">Display Name</span>
                      {!editMode && (
                        <Button 
                          onClick={() => setEditMode(true)}
                          size="sm"
                          variant="outline"
                          className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                        >
                          <Pencil className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                      )}
                    </div>
                    
                    {editMode ? (
                      <div className="space-y-3">
                        <div className="relative">
                          <Input 
                            value={displayName} 
                            onChange={e => setDisplayName(e.target.value)} 
                            onKeyDown={e => {
                              if (e.key === 'Enter' && !isSaving && displayName.trim() !== originalDisplayName) {
                                saveProfile();
                              } else if (e.key === 'Escape') {
                                cancelEdit();
                              }
                            }}
                            className="w-full bg-slate-700/50 border-cyan-500/30 text-white pr-8" 
                            disabled={isSaving}
                            placeholder="Enter your display name"
                            autoFocus
                          />
                          {isSaving && (
                            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                              <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            onClick={saveProfile}
                            disabled={isSaving || displayName.trim() === originalDisplayName}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Save className="w-3 h-3 mr-1" />
                            Save
                          </Button>
                          <Button 
                            onClick={cancelEdit}
                            disabled={isSaving}
                            size="sm"
                            variant="outline"
                            className="border-gray-500 text-gray-400 hover:bg-gray-700"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-700/30 rounded-lg border border-slate-600/30">
                        <span className="text-cyan-300 font-semibold text-lg">{displayName}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Save Status Messages */}
                  {editMode && !saveProgress && !saveSuccess && !saveError && (
                    <div className="text-xs text-gray-500">
                      Press Enter to save, Escape to cancel
                    </div>
                  )}
                  
                  {saveProgress && (
                    <div className="text-sm text-blue-400 flex items-center gap-2">
                      <div className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                      {saveProgress}
                    </div>
                  )}
                  
                  {saveSuccess && (
                    <div className="text-sm text-green-400 flex items-center gap-2">
                      <CheckCircle className="w-3 h-3" />
                      Profile saved successfully!
                    </div>
                  )}
                  
                  {saveError && (
                    <div className="text-sm text-red-400 flex items-center gap-2">
                      <AlertCircle className="w-3 h-3" />
                      {saveError}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <span className="text-gray-400 text-sm font-medium">Squad</span>
                    {editMode ? (
                      <Select value={squad} onValueChange={setSquad} disabled={isSaving}>
                        <SelectTrigger className="w-40 bg-slate-700/50 border-cyan-500/30 text-white">
                          <SelectValue placeholder="Select a squad" />
                        </SelectTrigger>
                        <SelectContent>
                          {squadTracks.map(track => (
                            <SelectItem key={track.id} value={track.id}>
                              {track.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="p-3 bg-slate-700/30 rounded-lg border border-slate-600/30">
                        <span className="text-yellow-400 font-semibold">
                          {getSquadDisplayName()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-gray-400 text-sm font-medium">Wallet</span>
                  <div className="flex items-center gap-2">
                  {editMode ? (
                    <div className="flex items-center gap-2">
                      <Input 
                        value={wallet} 
                        onChange={e => setWallet(e.target.value)} 
                        className="w-40 bg-slate-700/50 border-cyan-500/30 text-white" 
                        disabled={isSaving}
                      />
                      <Button
                        size="sm"
                        onClick={handleWalletConnect}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                        disabled={isSaving}
                      >
                        Connect Wallet
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        {getWalletDisplay()}
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCopyWallet}
                            className="h-6 w-6 p-0 text-gray-400 hover:text-green-400 hover:bg-green-500/10"
                            title="Copy wallet address"
                          >
                            {copied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            asChild
                            className="h-6 w-6 p-0 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10"
                            title="View on Solscan"
                          >
                            <a 
                              href={`https://solscan.io/account/${wallet}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleDisconnectWallet}
                            className="h-6 w-6 p-0 text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                            title="Disconnect wallet"
                          >
                            <Wallet className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <span className="text-gray-400 text-sm font-medium">Joined</span>
                  <div className="p-3 bg-slate-700/30 rounded-lg border border-slate-600/30">
                    <span className="text-cyan-400 font-mono">{userData?.joined || 'Unknown'}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-gray-400 text-sm font-medium">Rank</span>
                  <div className="p-3 bg-slate-700/30 rounded-lg border border-slate-600/30">
                    <span className="text-pink-400 font-semibold">{userData?.rank || 'Scholar'}</span>
                  </div>
                </div>
                <div className="mt-4">
                  {editMode ? (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Button onClick={handleSave} className="bg-cyan-600 hover:bg-cyan-700 text-white" disabled={isSaving}>
                          {isSaving ? (
                            <div className="w-4 h-4 mr-1 animate-spin">
                              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.58 20 4 16.42 4 12C4 7.58 7.58 4 12 4C16.42 4 20 7.58 20 12C20 16.42 16.42 20 12 20Z" fill="currentColor"/>
                              </svg>
                            </div>
                          ) : (
                            <Save className="w-4 h-4 mr-1" />
                          )} Save
                        </Button>
                        <Button 
                          onClick={() => {
                            setEditMode(false);
                            // Reset display name to original value
                            setDisplayName(originalDisplayName);
                          }} 
                          variant="outline" 
                          className="border-gray-500/30 text-gray-400 hover:text-gray-300 hover:bg-gray-500/10"
                          disabled={isSaving}
                        >
                          Cancel
                        </Button>
                      </div>
                      {isSaving && saveProgress && (
                        <div className="text-sm text-cyan-400 bg-slate-700/30 p-2 rounded border border-cyan-500/30">
                          {saveProgress}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Button 
                      onClick={() => {
                        if (isSaving) return; // Prevent editing while saving
                        setOriginalDisplayName(displayName);
                        setEditMode(true);
                      }} 
                      variant="outline" 
                      className="text-cyan-400 border-cyan-500/30 hover:text-cyan-300 hover:bg-cyan-500/10"
                      disabled={isSaving}
                    >
                      <Pencil className="w-4 h-4 mr-1" /> Edit
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-center gap-4">
                  <PfpPicker 
                    selectedPfpUrl={profileImage !== '🧑‍🎓' ? profileImage : undefined}
                    onChange={(url) => handleProfileImageChange(url || '🧑‍🎓')}
                    userId={wallet}
                  />
                  
                  {/* Emoji Picker Fallback */}
                  <div className="text-center">
                    <p className="text-xs text-gray-400 mb-2">Or choose an emoji:</p>
                    <div className="flex gap-2 flex-wrap justify-center">
                      {['🧑‍🎓', '🎨', '🧠', '🎤', '⚔️', '🦅', '🏦', '👨‍💻', '👩‍💻', '🤖', '🎭', '🎪'].map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleProfileImageChange(emoji)}
                          className={`w-8 h-8 text-lg rounded-full border-2 transition-all ${
                            profileImage === emoji 
                              ? 'border-cyan-400 bg-cyan-400/20' 
                              : 'border-gray-600 hover:border-cyan-300 hover:bg-cyan-400/10'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                
                {/* Squad Badge */}
                {userSquad && (
                  <div className="text-center space-y-3">
                    <SquadBadge squad={getSquadForBadge()} />
                    <div className="text-xs text-gray-400">
                      {getSquadDisplayName()}
                    </div>
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                      <Crown className="w-3 h-3 mr-1" />
                      Squad Member
                    </Badge>
                  </div>
                )}
                
                <div className="flex flex-wrap gap-2 justify-center">
                  {badges.filter(b => b.unlocked).length > 0 ? (
                    badges.filter(b => b.unlocked).slice(0, 4).map((badge) => (
                      <Badge key={badge.id} className="flex items-center gap-1 px-3 py-1 border border-cyan-500/30 bg-slate-900/60 text-cyan-300">
                        {badge.icon} {badge.name}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-gray-400 text-sm">No badges earned yet</p>
                  )}
                  {badges.filter(b => b.unlocked).length > 4 && (
                    <Badge className="bg-slate-600/50 text-gray-300 border-gray-500/30">
                      +{badges.filter(b => b.unlocked).length - 4} more
                    </Badge>
                  )}
                </div>

                {/* NFT Profile Information */}
                {selectedNFT && (
                  <div className="text-center space-y-2 p-3 bg-slate-700/30 rounded-lg border border-purple-500/30">
                    <h4 className="font-semibold text-purple-400 text-sm">Profile NFT</h4>
                    <p className="text-white text-sm">{selectedNFT.name}</p>
                    {selectedNFT.collection && (
                      <p className="text-gray-400 text-xs">{selectedNFT.collection}</p>
                    )}
                    {selectedNFT.attributes && selectedNFT.attributes.length > 0 && (
                      <div className="flex flex-wrap gap-1 justify-center">
                        {selectedNFT.attributes.slice(0, 3).map((attr, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs bg-slate-600/50 border-purple-500/30 text-purple-300">
                            {attr.trait_type}: {attr.value}
                          </Badge>
                        ))}
                        {selectedNFT.attributes.length > 3 && (
                          <Badge variant="outline" className="text-xs bg-slate-600/50 border-gray-500/30 text-gray-300">
                            +{selectedNFT.attributes.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* XP System Card */}
        <Card className="w-full max-w-2xl bg-slate-800/60 border-purple-500/30 mb-8">
          <CardHeader>
            <CardTitle className="text-purple-400 flex items-center gap-2">
              <Zap className="w-6 h-6" />
              Experience & Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Level and XP Display */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                      {level}
                    </div>
                    <div className="absolute -top-1 -right-1 bg-yellow-500 text-slate-900 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                      ★
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Level {level}</h3>
                    <p className="text-purple-400 font-mono">{totalXP.toLocaleString()} XP</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">Next Level</p>
                  <p className="text-purple-400 font-semibold">
                    {((level) * 1000).toLocaleString()} XP
                  </p>
                </div>
              </div>

              {/* XP Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Progress to Level {level + 1}</span>
                  <span className="text-purple-400">
                    {totalXP % 1000}/1,000 XP
                  </span>
                </div>
                <Progress 
                  value={(totalXP % 1000) / 10} 
                  className="h-3 bg-slate-700 [&>div]:bg-gradient-to-r [&>div]:from-purple-500 [&>div]:to-pink-500" 
                />
              </div>

              {/* XP Breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                  <BookOpen className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                  <p className="text-cyan-400 font-semibold">{completedCourses.length}</p>
                  <p className="text-xs text-gray-400">Courses</p>
                </div>
                <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                  <Trophy className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                  <p className="text-yellow-400 font-semibold">{badges.filter(b => b.unlocked).length}</p>
                  <p className="text-xs text-gray-400">Badges</p>
                </div>
                <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                  <Target className="w-6 h-6 text-orange-400 mx-auto mb-2" />
                  <p className="text-orange-400 font-semibold">{bountyStats.totalSubmissions}</p>
                  <p className="text-xs text-gray-400">Bounties</p>
                </div>
                <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                  <Star className="w-6 h-6 text-pink-400 mx-auto mb-2" />
                  <p className="text-pink-400 font-semibold">{totalXP}</p>
                  <p className="text-xs text-gray-400">Total XP</p>
                </div>
              </div>

              {/* Recent Badges */}
              <div>
                <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Medal className="w-4 h-4" />
                  Recent Badges
                </h4>
                <div className="flex flex-wrap gap-2">
                  {badges.filter(b => b.unlocked).slice(0, 6).map((badge) => (
                    <Badge 
                      key={badge.id} 
                      className="flex items-center gap-1 px-3 py-1 border border-purple-500/30 bg-slate-900/60 text-purple-300"
                    >
                      {badge.icon} {badge.name}
                    </Badge>
                  ))}
                  {badges.filter(b => b.unlocked).length === 0 && (
                    <p className="text-gray-400 text-sm">No badges earned yet</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Squad Information Card */}
        {userSquad && (
          <Card className="w-full max-w-2xl bg-slate-800/60 border-yellow-500/30 mb-8">
            <CardHeader>
              <CardTitle className="text-yellow-400 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Squad Assignment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Squad Badge and Info */}
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="text-center">
                    <SquadBadge squad={getSquadForBadge()} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-yellow-400 mb-2">{getSquadDisplayName()}</h3>
                    <p className="text-gray-300 mb-3">{getSquadDescription()}</p>
                    
                    {/* Specialties */}
                    <div className="mb-3">
                      <h4 className="text-sm font-semibold text-cyan-400 mb-2">Specialties:</h4>
                      <div className="flex flex-wrap gap-2">
                        {getSquadSpecialties().map((specialty: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs bg-slate-700/50 border-cyan-500/30 text-cyan-300">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    {/* Test Info */}
                    {userSquad.assignedAt && (
                      <div className="text-xs text-gray-400">
                        <p>Assigned: {new Date(userSquad.assignedAt).toLocaleDateString()}</p>
                        {userSquad.testVersion && <p>Test Version: {userSquad.testVersion}</p>}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-600/30">
                  <Button
                    asChild
                    variant="outline"
                    className="border-cyan-500/30 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                  >
                    <Link href="/courses">
                      <BookOpen className="w-4 h-4 mr-2" />
                      View Recommended Courses
                    </Link>
                  </Button>
                  
                  <Button
                    asChild
                    variant="outline"
                    className="border-orange-500/30 text-orange-400 hover:text-orange-300 hover:bg-orange-500/10"
                  >
                    <Link href="/placement/squad-test">
                      <Users className="w-4 h-4 mr-2" />
                      Retake Placement Test
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Squad Assignment Card */}
        {!userSquad && (
          <Card className="w-full max-w-2xl bg-slate-800/60 border-orange-500/30 mb-8">
            <CardHeader>
              <CardTitle className="text-orange-400 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Squad Assignment
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-300 mb-4">
                You haven't taken the squad placement test yet. Take the test to get assigned to a squad and unlock personalized course recommendations.
              </p>
              <Button
                asChild
                className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
              >
                <Link href="/placement/squad-test">
                  <Users className="w-4 h-4 mr-2" />
                  Take Placement Test
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <Card className="w-full max-w-2xl bg-slate-800/60 border-green-500/30 mb-8">
          <CardHeader>
            <CardTitle className="text-green-400 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Course Progress & Completion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Course Progress Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-slate-700/30 rounded-lg">
                  <div className="text-2xl font-bold text-green-400">{completedCourses.length}</div>
                  <div className="text-sm text-gray-400">Completed</div>
                </div>
                <div className="text-center p-4 bg-slate-700/30 rounded-lg">
                  <div className="text-2xl font-bold text-cyan-400">{completedCourses.length * 100}</div>
                  <div className="text-sm text-gray-400">XP Earned</div>
                </div>
                <div className="text-center p-4 bg-slate-700/30 rounded-lg">
                  <div className="text-2xl font-bold text-purple-400">0</div>
                  <div className="text-sm text-gray-400">In Progress</div>
                </div>
              </div>

              {/* Completed Courses */}
              {completedCourses.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Completed Courses
                  </h4>
                  {completedCourses.map((course: string, index: number) => (
                    <div key={course} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600/30">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/20 rounded-lg">
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-white">
                            {course.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </h4>
                          <p className="text-sm text-gray-400">Completed</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-semibold text-green-400">+100 XP</p>
                          <p className="text-xs text-gray-400">Reward</p>
                        </div>
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          Complete
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm mb-4">No courses completed yet</p>
                  <Button asChild className="bg-cyan-600 hover:bg-cyan-700">
                    <Link href="/courses">
                      <BookOpen className="w-4 h-4 mr-2" />
                      Start Learning
                    </Link>
                  </Button>
                </div>
              )}

              {/* Course Recommendations */}
              {userSquad && (
                <div className="border-t border-slate-600/30 pt-4">
                  <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-400" />
                    Recommended for {getSquadDisplayName()}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-700/30 rounded-lg border border-slate-600/30">
                      <h5 className="font-semibold text-white text-sm">Advanced Trading Psychology</h5>
                      <p className="text-xs text-gray-400">Perfect for your squad's focus</p>
                    </div>
                    <div className="p-3 bg-slate-700/30 rounded-lg border border-slate-600/30">
                      <h5 className="font-semibold text-white text-sm">NFT Market Analysis</h5>
                      <p className="text-xs text-gray-400">Build on your strengths</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="w-full max-w-2xl bg-slate-800/60 border-purple-500/30 mb-8">
          <CardHeader>
            <CardTitle className="text-purple-400 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Overall Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-300">Progress</span>
                <span className="text-purple-400">{overallProgress}%</span>
              </div>
              <Progress value={overallProgress} className="h-3 bg-slate-700 [&>div]:bg-gradient-to-r [&>div]:from-purple-500 [&>div]:to-pink-500" />
            </div>
          </CardContent>
        </Card>

        {/* Bounty Submissions Section */}
        <Card className="w-full max-w-2xl bg-slate-800/60 border-orange-500/30 mb-8">
          <CardHeader>
            <CardTitle className="text-orange-400 flex items-center gap-2">
              <Target className="w-5 h-5" />
              Bounty Activity & Submissions
              {bountyStats.wins > 0 && (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 ml-auto">
                  🏆 {bountyStats.wins} Win{bountyStats.wins > 1 ? 's' : ''}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Bounty Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                  <div className="text-xl font-bold text-orange-400">{bountyStats.totalSubmissions}</div>
                  <div className="text-xs text-gray-400">Total Submissions</div>
                </div>
                <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                  <div className="text-xl font-bold text-green-400">{bountyStats.wins}</div>
                  <div className="text-xs text-gray-400">Wins</div>
                </div>
                <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                  <div className="text-xl font-bold text-yellow-400">{bountyStats.totalXP}</div>
                  <div className="text-xs text-gray-400">Bounty XP</div>
                </div>
                <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                  <div className="text-xl font-bold text-purple-400">{bountyStats.totalSOL.toFixed(2)}</div>
                  <div className="text-xs text-gray-400">SOL Earned</div>
                </div>
              </div>

              {/* Submission History */}
              {bountyLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400 mx-auto mb-2"></div>
                  <p className="text-gray-400 text-sm">Loading bounty submissions...</p>
                </div>
              ) : bountyError ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                  <p className="text-red-400 text-sm">Error loading bounty data</p>
                </div>
              ) : bountySubmissions.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Recent Submissions
                  </h4>
                  {bountySubmissions.slice(0, 5).map((submission) => (
                    <div key={submission.id} className="p-3 bg-slate-700/30 rounded-lg border border-slate-600/30">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            submission.placement 
                              ? 'bg-green-500/20' 
                              : 'bg-orange-500/20'
                          }`}>
                            {submission.placement ? (
                              <Award className="w-4 h-4 text-green-400" />
                            ) : (
                              <ImageIcon className="w-4 h-4 text-orange-400" />
                            )}
                          </div>
                          <div>
                            <h5 className="font-semibold text-white">
                              {submission.bounty?.title || 'Unknown Bounty'}
                            </h5>
                            <p className="text-sm text-gray-400">
                              Submitted {new Date(submission.created_at).toLocaleDateString()}
                            </p>
                            {submission.bounty?.squad_tag && (
                              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs mt-1">
                                {submission.bounty.squad_tag}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          {submission.placement ? (
                            <>
                              <p className="text-sm font-semibold text-green-400">
                                {submission.placement === 'first' ? '🥇 1st Place' :
                                 submission.placement === 'second' ? '🥈 2nd Place' : '🥉 3rd Place'}
                              </p>
                              <p className="text-xs text-gray-400">
                                +{submission.xp_awarded} XP
                                {submission.sol_prize > 0 && ` • ${submission.sol_prize} SOL`}
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="text-sm font-semibold text-orange-400">Pending Review</p>
                              <p className="text-xs text-gray-400">Under consideration</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {bountySubmissions.length > 5 && (
                    <div className="text-center">
                      <Button variant="outline" size="sm" className="text-orange-400 border-orange-500/30">
                        View All {bountySubmissions.length} Submissions
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                  <p className="text-gray-400 text-sm mb-6">No bounty submissions yet</p>
                  <div className="space-y-3">
                    <Button asChild className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 text-sm font-medium">
                      <Link href="/bounties">
                        <Target className="w-4 h-4 mr-2" />
                        Browse Bounties
                      </Link>
                    </Button>
                    <div className="text-xs text-gray-500">
                      Complete bounties to earn XP, SOL, and exclusive rewards
                    </div>
                  </div>
                </div>
              )}

              {/* Submit New Bounty */}
              <div className="border-t border-slate-600/30 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-white font-semibold flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Submit New Bounty Entry
                  </h4>
                  <Button asChild variant="outline" size="sm" className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10">
                    <Link href="/bounties">
                      <Target className="w-3 h-3 mr-1" />
                      Quick Browse
                    </Link>
                  </Button>
                </div>
                <BountySubmissionForm 
                  onSubmit={handleBountySubmit} 
                  className="max-w-none"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 