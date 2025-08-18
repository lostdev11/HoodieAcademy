'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Connection } from '@solana/web3.js';
import { getSNSResolver, isValidSolanaAddress } from '@/services/sns-resolver';
import { formatWalletAddress } from '@/lib/utils';
import { squadTracks } from '@/lib/squadData';
import PfpPicker from './PfpPicker';
import { useToast } from '@/hooks/use-toast';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { Pencil, Save, User, Award, BookOpen, Wallet, Users, ChevronDown, ChevronUp, CheckCircle, TrendingUp, Home, Copy, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import SquadBadge from '@/components/SquadBadge';

function ProfileView() {
  const [wallet, setWallet] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [solDomain, setSolDomain] = useState<string | null>(null);
  const [isLoadingDomain, setIsLoadingDomain] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [displayName, setDisplayName] = useState(() => {
    return localStorage.getItem('userDisplayName') || 'Hoodie Scholar';
  });
  const [originalDisplayName, setOriginalDisplayName] = useState(() => {
    return localStorage.getItem('userDisplayName') || 'Hoodie Scholar';
  });
  const [squad, setSquad] = useState('Unassigned');
  const [userSquad, setUserSquad] = useState<any>(null);
  const [placementTestCompleted, setPlacementTestCompleted] = useState(false);
  const [profileImage, setProfileImage] = useState<string>('🧑‍🎓');
  const [userData, setUserData] = useState<any>(null);

  const snsResolver = getSNSResolver();
  const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL || 'https://api.mainnet-beta.solana.com');

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

  // Wallet state management using the same method as TokenGate
  useEffect(() => {
    const checkWalletConnection = () => {
      const savedWalletAddress = localStorage.getItem('walletAddress');
      const sessionData = sessionStorage.getItem('wifhoodie_verification');
      
      if (savedWalletAddress && sessionData) {
        try {
          const session = JSON.parse(sessionData);
          const now = Date.now();
          const sessionAge = now - session.timestamp;
          const sessionValid = sessionAge < 24 * 60 * 60 * 1000; // 24 hours
          
          if (sessionValid && session.walletAddress === savedWalletAddress && session.isHolder) {
            console.log("🔄 Debug: Restoring wallet connection for profile:", savedWalletAddress);
            setWallet(savedWalletAddress);
          } else {
            console.log("⏰ Debug: Session expired or invalid, clearing wallet");
            setWallet(null);
          }
        } catch (error) {
          console.error("❌ Debug: Error parsing session data:", error);
          setWallet(null);
        }
      } else {
        setWallet(null);
      }
    };

    // Check wallet connection on mount
    checkWalletConnection();

    // Listen for storage changes (when wallet connects/disconnects)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'walletAddress' || e.key === 'wifhoodie_verification') {
        checkWalletConnection();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically for changes
    const interval = setInterval(checkWalletConnection, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Load squad placement and profile data on mount
  useEffect(() => {
    // Check for squad placement result
    const squadResult = localStorage.getItem('userSquad');
    const testCompleted = localStorage.getItem('placementTestCompleted');
    
    if (squadResult) {
      try {
        const result = JSON.parse(squadResult);
        setUserSquad(result);
      } catch (error) {
        console.error('Error parsing squad result:', error);
        // If parsing fails, treat it as a string
        setUserSquad(squadResult);
      }
    }
    
    if (testCompleted) {
      setPlacementTestCompleted(true);
    }

    // Load saved profile image
    const savedProfileImage = localStorage.getItem('userProfileImage');
    if (savedProfileImage) {
      setProfileImage(savedProfileImage);
    }
  }, []);

  // Resolve .sol domain when wallet changes
  useEffect(() => {
    const resolveSolDomain = async () => {
      if (wallet && isValidSolanaAddress(wallet)) {
        setIsLoadingDomain(true);
        try {
          const domain = await snsResolver.reverseResolve(connection, wallet);
          setSolDomain(domain);
        } catch (error) {
          console.error('Error resolving .sol domain:', error);
          setSolDomain(null);
        } finally {
          setIsLoadingDomain(false);
        }
      } else {
        setSolDomain(null);
      }
    };

    if (wallet) {
      resolveSolDomain();
    }
  }, [wallet, snsResolver, connection]);

  // Load real user data when wallet changes
  useEffect(() => {
    if (wallet) {
      const realData = getRealUserData(wallet);
      setUserData(realData);
    }
  }, [wallet]);

  const handleSave = () => {
    if (displayName.trim()) {
      const trimmedName = displayName.trim();
      localStorage.setItem('userDisplayName', trimmedName);
      setOriginalDisplayName(trimmedName);
      setEditMode(false);
      // Optional: Add a success message or toast notification here
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
      return squadData ? squadData.description : 'No description available';
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
      if (!wallet) return; // nothing to copy

      // Clipboard API may be unavailable (or blocked) in some browsers/contexts.
      if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
        // Fallback: temporary textarea + execCommand
        const el = document.createElement('textarea');
        el.value = wallet;
        el.style.position = 'fixed';
        el.style.opacity = '0';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      } else {
        await navigator.clipboard.writeText(wallet); // wallet is now narrowed to string
      }

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const handleDisconnectWallet = async () => {
    console.log("🔌 Debug: Disconnecting wallet from profile:", wallet);
    
    setWallet('');
    setSolDomain(null);
    
    // Clear wallet data from storage
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('connectedWallet');
    sessionStorage.removeItem('wifhoodie_verification');
    
    // Disconnect from wallet providers safely
    const sol = typeof window !== 'undefined' ? window.solana : undefined;

    try {
      if (sol?.disconnect) {
        await sol.disconnect();
      }
    } catch (e) {
      console.error("disconnect error", e);
    }
  };

  const getWalletDisplay = () => {
    if (!wallet) {
      return <span className="text-gray-500">No wallet connected</span>;
    }

    if (isLoadingDomain) {
      return (
        <div className="flex items-center gap-2">
          <span className="text-green-400 font-mono">{formatWalletAddress(wallet)}</span>
          <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }

    if (solDomain) {
      return (
        <div className="flex items-center gap-2">
          <span className="text-green-400 font-semibold">{solDomain}</span>
          <Badge variant="outline" className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
            .sol
          </Badge>
          <span className="text-gray-500 text-sm">({formatWalletAddress(wallet)})</span>
        </div>
      );
    }

    return <span className="text-green-400 font-mono">{formatWalletAddress(wallet)}</span>;
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
              <Button
                asChild
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                <Link href="/">
                  <Home className="w-4 h-4 mr-2" />
                  Go to Dashboard
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="flex-1 flex flex-col items-center py-12 px-4">
        {/* Back to Dashboard Button */}
        <div className="w-full max-w-2xl mb-6">
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
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Display Name:</span>
                  {editMode ? (
                    <Input value={displayName} onChange={e => setDisplayName(e.target.value)} className="w-40 bg-slate-700/50 border-cyan-500/30 text-white" />
                  ) : (
                    <span className="text-cyan-300 font-semibold">{displayName}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Squad:</span>
                  {editMode ? (
                    <Select value={squad} onValueChange={setSquad}>
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
                    <span className="text-yellow-400 font-semibold">
                      {getSquadDisplayName()}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Wallet:</span>
                  {editMode ? (
                    <Input value={wallet} onChange={e => setWallet(e.target.value)} className="w-40 bg-slate-700/50 border-cyan-500/30 text-white" />
                  ) : (
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
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Joined:</span>
                  <span className="text-cyan-400 font-mono">{userData?.joined || 'Unknown'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Rank:</span>
                  <span className="text-pink-400 font-semibold">{userData?.rank || 'Scholar'}</span>
                </div>
                <div className="mt-4">
                  {editMode ? (
                    <div className="flex gap-2">
                      <Button onClick={handleSave} className="bg-cyan-600 hover:bg-cyan-700 text-white">
                        <Save className="w-4 h-4 mr-1" /> Save
                      </Button>
                      <Button 
                        onClick={() => {
                          setEditMode(false);
                          // Reset display name to original value
                          setDisplayName(originalDisplayName);
                        }} 
                        variant="outline" 
                        className="border-gray-500/30 text-gray-400 hover:text-gray-300 hover:bg-gray-500/10"
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      onClick={() => {
                        setOriginalDisplayName(displayName);
                        setEditMode(true);
                      }} 
                      variant="outline" 
                      className="text-cyan-400 border-cyan-500/30 hover:text-cyan-300 hover:bg-cyan-500/10"
                    >
                      <Pencil className="w-4 h-4 mr-1" /> Edit
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-center gap-4">
                  {/* Profile Picture Section */}
                  <div className="text-center mb-2">
                    <h3 className="text-sm font-semibold text-purple-400 mb-1">Profile Picture</h3>
                    <p className="text-xs text-gray-400">
                      Set your WifHoodie NFT as your profile picture to represent yourself in the community
                    </p>
                  </div>
                  
                  {/* Profile Avatar */}
                  <ProfileAvatar pfpUrl={profileImage} size={120} />
                  
                  {/* PfpPicker for selecting new profile pictures */}
                  <PfpPicker 
                    selectedPfpUrl={profileImage}
                    onChange={(url) => {
                      setProfileImage(url || '🧑‍🎓');
                      // Save to localStorage
                      if (url) {
                        localStorage.setItem('userProfileImage', url);
                      } else {
                        localStorage.removeItem('userProfileImage');
                      }
                    }}
                    userId={wallet} // Using wallet address as user ID for now
                  />
                
                {/* Squad Badge */}
                {userSquad && (
                  <div className="text-center">
                    <SquadBadge squad={getSquadForBadge()} />
                  </div>
                )}
                
                <div className="flex flex-wrap gap-2 justify-center">
                  {userData?.badges?.length > 0 ? (
                    userData.badges.map((badge: any) => (
                      <Badge key={badge.id} className="flex items-center gap-1 px-3 py-1 border border-cyan-500/30 bg-slate-900/60 text-cyan-300">
                        {badge.icon} {badge.label}
                      </Badge>
                    ))
                  ) : (
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
              Completed Courses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userData?.completedCourses?.length > 0 ? (
                userData.completedCourses.map((course: any) => (
                  <div key={course.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 p-4 bg-slate-700/30 rounded-lg border border-slate-600/30">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-cyan-500/20 rounded-lg">
                        <BookOpen className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">{course.title}</h4>
                        <p className="text-sm text-gray-400">Progress: {Math.round(course.progress)}%</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-cyan-400">{course.score}%</p>
                        <p className="text-xs text-gray-400">Final Score</p>
                      </div>
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No courses completed yet</p>
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
      </div>
    </div>
  );
}

export default ProfileView;
export { ProfileView }; 