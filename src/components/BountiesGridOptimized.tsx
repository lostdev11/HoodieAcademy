'use client';

import React, { useState, useEffect } from 'react';
import { OptimizedButton } from '@/components/ui/optimized-button';
import { OptimizedLink } from '@/components/ui/optimized-link';
import { StaggerChildren, StaggerItem, FadeInWhenVisible } from '@/components/ui/page-transition';
import { useUserBounties } from '@/hooks/useUserBounties';
import { useWalletSupabase } from '@/hooks/use-wallet-supabase';
import { Target, Clock, Award, Users, EyeOff, Send, CheckCircle, Upload, Image as ImageIcon, AlertCircle, XCircle, RefreshCw, Video } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExpandableDescription } from '@/components/ui/ExpandableDescription';
import Markdown from '@/components/Markdown';
import { ExpandableMarkdown } from '@/components/ui/ExpandableMarkdown';
import { BountyListSkeleton } from '@/components/ui/skeleton';
import { DBBounty } from '@/types/database';
import { motion } from 'framer-motion';

interface BountiesGridOptimizedProps {
  initialBounties?: DBBounty[];
  showHidden?: boolean;
}

export default function BountiesGridOptimized({ 
  initialBounties = [], 
  showHidden = false 
}: BountiesGridOptimizedProps) {
  const { submissions, stats, loading: userLoading, error } = useUserBounties();
  const { wallet } = useWalletSupabase();
  const [userSubmissions, setUserSubmissions] = useState<{ [bountyId: string]: any }>({});
  const [submittingBounty, setSubmittingBounty] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  // Use initialBounties from server-side rendering and filter based on showHidden prop
  const displayBounties = (initialBounties || []).filter(bounty => showHidden || !bounty.hidden);

  // Get wallet address from localStorage
  useEffect(() => {
    const checkWalletConnection = () => {
      if (typeof window !== 'undefined') {
        const storedWallet = localStorage.getItem('walletAddress') || localStorage.getItem('hoodie_academy_wallet');
        setWalletAddress(storedWallet);
      }
    };

    // Check on mount
    checkWalletConnection();

    // Listen for storage changes (when wallet connects/disconnects)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'walletAddress' || e.key === 'hoodie_academy_wallet') {
        checkWalletConnection();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      
      // Also check periodically for changes
      const interval = setInterval(checkWalletConnection, 1000);
      
      return () => {
        window.removeEventListener('storage', handleStorageChange);
        clearInterval(interval);
      };
    }
  }, []);

  // Fetch user submissions for all bounties (optimized - single API call)
  useEffect(() => {
    if (!walletAddress || !displayBounties || displayBounties.length === 0) return;

    const fetchUserSubmissions = async () => {
      try {
        // Batch fetch all submissions in a single API call
        const bountyIds = displayBounties.map(b => b.id);
        const response = await fetch(`/api/bounties/submissions?walletAddress=${walletAddress}&bountyIds=${bountyIds.join(',')}`);
        
        if (response.ok) {
          const result = await response.json();
          setUserSubmissions(result.submissions || {});
        }
      } catch (error) {
        console.error('Error fetching submissions:', error);
      }
    };

    fetchUserSubmissions();
  }, [walletAddress, displayBounties]);

  // Auto-refresh submissions every 60 seconds to catch status updates (optimized)
  useEffect(() => {
    if (!walletAddress || !displayBounties || displayBounties.length === 0) return;

    const interval = setInterval(() => {
      const fetchUserSubmissions = async () => {
        try {
          const bountyIds = displayBounties.map(b => b.id);
          const response = await fetch(`/api/bounties/submissions?walletAddress=${walletAddress}&bountyIds=${bountyIds.join(',')}`);
          
          if (response.ok) {
            const result = await response.json();
            setUserSubmissions(prev => {
              // Only update if there are actual changes
              const hasChanges = Object.keys(result.submissions || {}).some(bountyId => 
                JSON.stringify(prev[bountyId]) !== JSON.stringify(result.submissions[bountyId])
              );
              return hasChanges ? result.submissions : prev;
            });
          }
        } catch (error) {
          console.error('Error refreshing submissions:', error);
        }
      };

      fetchUserSubmissions();
    }, 60000); // Refresh every 60 seconds (reduced frequency)

    return () => clearInterval(interval);
  }, [walletAddress, displayBounties]);

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'completed':
        return 'bg-blue-500';
      case 'expired':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatDeadline = (deadline: string | null): string => {
    if (!deadline) return 'No deadline';
    const date = new Date(deadline);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `${diffDays} days left`;
    return date.toLocaleDateString();
  };

  const isDeadlineNear = (deadline: string | null): boolean => {
    if (!deadline) return false;
    const date = new Date(deadline);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays >= 0;
  };

  const handleSubmitBounty = async (bountyId: string, submissionText: string, imageUrl?: string) => {
    if (!wallet || !submissionText?.trim()) {
      console.error('❌ Cannot submit - missing wallet or text:', {
        wallet,
        submissionText: submissionText
      });
      return;
    }

    setSubmittingBounty(bountyId);
    
    const requestData = {
      submission: submissionText,
      walletAddress: wallet,
      submissionType: imageUrl ? 'both' : 'text',
      imageUrl: imageUrl || undefined
    };
    
    console.log('📤 Submitting bounty to API:', {
      bountyId,
      url: `/api/bounties/${bountyId}/submit/`,
      data: requestData
    });
    
    try {
      const response = await fetch(`/api/bounties/${bountyId}/submit/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      console.log('📥 API Response status:', response.status);

      const result = await response.json();
      console.log('📥 API Response data:', result);
      
      if (response.ok) {
        console.log('✅ Bounty submitted successfully!');
        
        // Update user submissions with the new submission
        setUserSubmissions(prev => ({
          ...prev,
          [bountyId]: result.submission
        }));
        
        console.log('🔄 Submission updated in state:', result.submission);
        
        // Toast will be shown by parent component
      } else {
        console.error('❌ Submission failed:', result.error);
        // Error toast will be shown by parent component
      }
    } catch (error) {
      console.error('❌ Error submitting bounty:', error);
      // Error toast will be shown by parent component
    } finally {
      setSubmittingBounty(null);
    }
  };

  if (!initialBounties || initialBounties.length === 0) {
    return <BountyListSkeleton count={6} />;
  }

  if (!displayBounties || displayBounties.length === 0) {
    return (
      <FadeInWhenVisible>
        <div className="text-center py-8">
          <Target className="w-12 h-12 mx-auto text-cyan-300 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Bounties Available</h3>
          <p className="text-gray-200">
            {showHidden ? 'No bounties have been created yet.' : 'All available bounties are currently hidden.'}
          </p>
        </div>
      </FadeInWhenVisible>
    );
  }

  return (
    <StaggerChildren className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {(displayBounties || []).map((bounty, index) => (
        <StaggerItem key={bounty.id}>
          <motion.div
            whileHover={{ scale: 1.02, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <Card 
              className={`group overflow-hidden bg-slate-800/50 border transition-all duration-300 ${
                bounty.hidden ? 'opacity-60 border-dashed border-gray-500' : 'border-cyan-500/30 hover:border-cyan-500/60 hover:shadow-[0_0_30px_rgba(168,85,247,0.5)]'
              }`}
            >
              <CardHeader className="pb-3 bg-gradient-to-r from-purple-900/30 to-cyan-900/30 group-hover:from-purple-900/50 group-hover:to-cyan-900/50 transition-all duration-300 border-b border-cyan-500/20">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-xl font-bold mb-2 text-white group-hover:text-cyan-200 transition-colors">
                      <div className="flex items-start gap-2">
                        <span className="flex-1 break-words">{bounty.title}</span>
                        {bounty.hidden && (
                          <EyeOff className="w-4 h-4 text-gray-500 flex-shrink-0 mt-1" />
                        )}
                      </div>
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-purple-200 mb-2">
                      <Target className="w-4 h-4 flex-shrink-0 text-purple-400" />
                      <span className="capitalize truncate font-medium">{bounty.squad_tag || 'All Squads'}</span>
                    </div>
                  </div>
                  <Badge 
                    className={`${getStatusColor(bounty.status)} text-white capitalize flex-shrink-0 shadow-lg px-3 py-1`}
                  >
                    {bounty.status}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="overflow-hidden">
                <div className="mb-6">
                  <ExpandableMarkdown 
                    content={bounty.short_desc}
                    maxLength={200}
                    className="text-white"
                  />
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                    <div className="flex items-center gap-2 text-sm text-green-300">
                      <Award className="w-5 h-5 text-green-400" />
                      <span className="font-medium">Reward</span>
                    </div>
                    <span className="font-bold text-green-400 text-lg">{bounty.reward}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/30">
                    <div className="flex items-center gap-2 text-sm text-cyan-300">
                      <Users className="w-5 h-5 text-cyan-400" />
                      <span className="font-medium">Submissions</span>
                    </div>
                    <span className="font-bold text-cyan-400">{bounty.submissions}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-orange-500/10 rounded-lg border border-orange-500/30">
                    <div className="flex items-center gap-2 text-sm text-orange-300">
                      <Clock className="w-5 h-5 text-orange-400" />
                      <span className="font-medium">Deadline</span>
                    </div>
                    <span className={`font-bold ${
                      isDeadlineNear(bounty.deadline) ? 'text-red-400 animate-pulse' : 'text-orange-400'
                    }`}>
                      {formatDeadline(bounty.deadline)}
                    </span>
                  </div>
                </div>
                
                {bounty.status === 'active' && (
                  <div className="mt-6 space-y-3">
                    {!wallet && !walletAddress ? (
                      <div className="text-center p-4 bg-slate-700/50 rounded-lg border border-purple-500/30">
                        <p className="text-sm text-gray-300 mb-3 font-medium">🔒 Connect your wallet to submit</p>
                        <OptimizedButton 
                          size="sm"
                          onClick={async () => {
                            if (typeof window !== 'undefined' && window.solana) {
                              await window.solana.connect();
                            }
                          }}
                          className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                        >
                          Connect Wallet
                        </OptimizedButton>
                      </div>
                    ) : userSubmissions[bounty.id] ? (
                      <div className="text-center p-4 rounded-lg border">
                        {userSubmissions[bounty.id].status === 'approved' ? (
                          <div className="bg-green-500/10 border-green-500/30">
                            <div className="flex items-center justify-center gap-2 text-green-400 mb-3">
                              <CheckCircle className="w-5 h-5" />
                              <span className="text-sm font-bold">Bounty Completed! 🎉</span>
                            </div>
                            <Badge 
                              variant="outline" 
                              className="text-sm font-semibold px-4 py-1 border-green-500/50 text-green-400 bg-green-500/20"
                            >
                              APPROVED
                            </Badge>
                            <div className="mt-3 text-xs text-green-300">
                              XP Awarded: {userSubmissions[bounty.id].xp_awarded || 0}
                            </div>
                          </div>
                        ) : userSubmissions[bounty.id].status === 'rejected' ? (
                          <div className="bg-red-500/10 border-red-500/30">
                            <div className="flex items-center justify-center gap-2 text-red-400 mb-3">
                              <XCircle className="w-5 h-5" />
                              <span className="text-sm font-bold">Submission Rejected</span>
                            </div>
                            <Badge 
                              variant="outline" 
                              className="text-sm font-semibold px-4 py-1 border-red-500/50 text-red-400 bg-red-500/20 mb-3"
                            >
                              REJECTED
                            </Badge>
                            <p className="text-xs text-red-300 text-center mt-2">
                              You can only submit once per bounty. This submission cannot be resubmitted.
                            </p>
                          </div>
                        ) : (
                          <div className="bg-yellow-500/10 border-yellow-500/30">
                            <div className="flex items-center justify-center gap-2 text-yellow-400 mb-3">
                              <Clock className="w-5 h-5" />
                              <span className="text-sm font-bold">Submission Submitted! ✨</span>
                            </div>
                            <Badge 
                              variant="outline" 
                              className="text-sm font-semibold px-4 py-1 border-yellow-500/50 text-yellow-400 bg-yellow-500/20"
                            >
                              PENDING REVIEW
                            </Badge>
                          </div>
                        )}
                      </div>
                    ) : (wallet || walletAddress) ? (
                      <BountySubmissionCard 
                        bounty={bounty}
                        onSubmit={handleSubmitBounty}
                        isSubmitting={submittingBounty === bounty.id}
                      />
                    ) : (
                      <div className="text-center p-4 bg-slate-700/50 rounded-lg border border-purple-500/30">
                        <p className="text-sm text-gray-300 mb-3 font-medium">🔒 Connect your wallet to submit</p>
                        <OptimizedButton 
                          size="sm"
                          onClick={async () => {
                            if (typeof window !== 'undefined' && window.solana) {
                              await window.solana.connect();
                            }
                          }}
                          className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                        >
                          Connect Wallet
                        </OptimizedButton>
                      </div>
                    )}
                  </div>
                )}

                {bounty.link_to && (
                  <OptimizedButton 
                    variant="outline" 
                    className="w-full mt-4 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/60 font-medium"
                    onClick={() => window.open(bounty.link_to!, '_blank')}
                  >
                    View Details →
                  </OptimizedButton>
                )}
                
                <div className="text-xs text-gray-200 mt-4 text-center border-t pt-3 border-slate-700/50">
                  Created {new Date(bounty.created_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </StaggerItem>
      ))}
    </StaggerChildren>
  );
}

// Bounty Submission Card Component
interface BountySubmissionCardProps {
  bounty: DBBounty;
  onSubmit: (bountyId: string, submissionText: string, imageUrl?: string) => void;
  isSubmitting: boolean;
}

function BountySubmissionCard({ bounty, onSubmit, isSubmitting }: BountySubmissionCardProps) {
  const { wallet } = useWalletSupabase();
  const [submissionText, setSubmissionText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Get wallet address from localStorage as fallback
  const walletAddress = typeof window !== 'undefined' 
    ? localStorage.getItem('walletAddress') || localStorage.getItem('hoodie_academy_wallet')
    : null;
  
  // Use wallet from hook or fallback to localStorage
  const effectiveWallet = wallet || walletAddress;

  // Check if bounty requires image
  const requiresImage = bounty.image_required || bounty.submission_type === 'image' || bounty.submission_type === 'both';

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log('📁 File selected:', file ? { name: file.name, size: file.size, type: file.type } : 'No file');
    
    if (file) {
      // Check if wallet is connected before allowing upload
      if (!effectiveWallet) {
        console.error('❌ No wallet connected');
        setUploadError('Please connect your wallet before uploading media');
        setSelectedFile(null);
        return;
      }

      console.log('✅ Wallet found:', effectiveWallet.slice(0, 10) + '...');
      setSelectedFile(file);
      setUploadError('');
      setUploadSuccess(false);
      
      // Determine media type
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      setMediaType(isImage ? 'image' : isVideo ? 'video' : null);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      // Auto-upload the media
      console.log('🚀 Starting upload...');
      await uploadMedia(file);
    } else {
      console.log('⚠️ No file selected');
    }
  };

  const uploadMedia = async (file: File) => {
    console.log('🔄 uploadMedia called with file:', file.name, file.size, file.type);
    setIsUploading(true);
    setUploadError('');
    setUploadSuccess(false);
    
    try {
      // Validate wallet is connected
      if (!effectiveWallet) {
        console.error('❌ No effective wallet found');
        throw new Error('Wallet not connected. Please connect your wallet before uploading.');
      }

      console.log('✅ Wallet validated:', effectiveWallet.slice(0, 10) + '...');
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      
      console.log('📦 Creating FormData...');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('walletAddress', effectiveWallet);
      formData.append('context', 'bounty_submission');
      
      console.log('📤 Sending upload request to /api/upload/moderated-media...');
      const response = await fetch('/api/upload/moderated-media', {
        method: 'POST',
        body: formData,
      });
      
      console.log('📥 Response received:', response.status, response.statusText);
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
          console.error('❌ Upload error response:', errorData);
        } catch (parseError) {
          const text = await response.text();
          console.error('❌ Failed to parse error response:', text);
          throw new Error(`Upload failed: ${response.status} ${response.statusText}${text ? ` - ${text}` : ''}`);
        }
        throw new Error(errorData.error || `Failed to upload media (${response.status})`);
      }
      
      const result = await response.json();
      console.log('✅ Media uploaded successfully:', result);
      
      // Store the uploaded media URL and type
      setUploadedImageUrl(result.url);
      setMediaType(result.mediaType);
      
      // Mark upload as successful
      setUploadSuccess(true);
      setUploadError(''); // Explicitly clear any errors
      console.log('✅ Upload state updated - success:', true, 'url:', result.url);
      
    } catch (error) {
      console.error('❌ Error uploading media:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload media';
      console.error('❌ Setting upload error:', errorMessage);
      setUploadError(errorMessage);
      setUploadSuccess(false);
      setSelectedFile(null);
      setImagePreview(null);
      setUploadedImageUrl('');
      setMediaType(null);
    } finally {
      console.log('🏁 Upload process finished, setting isUploading to false');
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    // Check if wallet is connected before allowing upload
    if (!effectiveWallet) {
      setUploadError('Please connect your wallet before uploading media');
      return;
    }
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        setSelectedFile(file);
        setUploadError('');
        setUploadSuccess(false);
        
        // Determine media type
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');
        setMediaType(isImage ? 'image' : isVideo ? 'video' : null);
        
        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
        
        // Auto-upload the media
        await uploadMedia(file);
      } else {
        setUploadError('Please drop an image or video file');
        setUploadSuccess(false);
      }
    }
  };

  const canSubmit = submissionText.trim() && (!bounty.image_required || (selectedFile && uploadSuccess));

  return (
    <div className="space-y-4 p-4 bg-slate-700/30 rounded-lg border border-cyan-500/20">
      {/* Text Submission */}
      <div>
        <label className="text-xs font-semibold text-cyan-400 mb-2 block">📝 Your Submission</label>
        <textarea
          placeholder="Describe your submission or paste a link..."
          value={submissionText}
          onChange={(e) => setSubmissionText(e.target.value)}
          className="w-full p-3 text-sm border border-slate-600 rounded-lg resize-none break-words overflow-wrap-anywhere bg-slate-800/50 text-gray-200 placeholder:text-gray-500 focus:text-gray-100 focus:bg-slate-800 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all"
          rows={3}
        />
      </div>

      {/* Media Upload Section */}
      <div className="space-y-3">
        <label className="text-xs font-semibold text-cyan-400 flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-cyan-400" />
          {bounty.image_required ? '📷 Upload Media (Required)' : '📷 Upload Media (Optional)'}
        </label>
          
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300 cursor-pointer
              ${isDragOver 
                ? 'border-cyan-500 bg-cyan-500/20 scale-105' 
                : isUploading 
                  ? 'border-blue-500 bg-blue-500/10' 
                  : selectedFile 
                    ? 'border-green-500 bg-green-500/10' 
                    : 'border-purple-500/50 bg-purple-500/5 hover:border-purple-500 hover:bg-purple-500/10 hover:scale-105'
              }
            `}
          >
            <input
              id={`file-upload-${bounty.id}`}
              type="file"
              accept="image/*,video/*"
              onChange={(e) => {
                console.log('📎 Input onChange triggered');
                handleFileChange(e);
              }}
              onClick={(e) => {
                console.log('🖱️ Input clicked');
                // Reset value to allow selecting same file again
                (e.target as HTMLInputElement).value = '';
              }}
              className="hidden"
              required={bounty.image_required}
              disabled={isUploading}
            />
            
            <label 
              htmlFor={`file-upload-${bounty.id}`} 
              className="cursor-pointer block"
              onClick={(e) => {
                console.log('🖱️ Label clicked');
              }}
            >
              {isUploading ? (
                <div className="flex flex-col items-center gap-3 text-blue-400">
                  <div className="w-10 h-10 border-3 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm font-semibold">Uploading Media...</span>
                  <span className="text-xs text-blue-300">Please wait</span>
                </div>
              ) : selectedFile ? (
                <div className="flex flex-col items-center gap-2 text-green-400">
                  {mediaType === 'image' ? <ImageIcon className="w-8 h-8" /> : <Video className="w-8 h-8" />}
                  <span className="text-sm font-bold">✅ Media Ready!</span>
                  <span className="text-xs text-green-300 opacity-80">Click to change</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-purple-400">
                  <Upload className="w-8 h-8" />
                  <span className="text-sm font-bold">📷 Upload Media</span>
                  <span className="text-xs text-purple-300">Click to browse or drag & drop</span>
                  <span className="text-xs text-gray-400">Images: JPG, PNG, GIF (Max 10MB)</span>
                  <span className="text-xs text-gray-400">Videos: MP4, WebM (Max 100MB)</span>
                </div>
              )}
            </label>
            
            {isDragOver && (
              <div className="absolute inset-0 bg-cyan-500/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <div className="text-cyan-300 font-bold text-sm">📥 Drop your image here!</div>
              </div>
            )}
          </div>

          {/* Upload Status */}
          {!isUploading && uploadSuccess && selectedFile && (
            <div className="flex items-center gap-2 text-sm text-green-400 bg-green-500/10 p-3 rounded-lg border border-green-500/30">
              <div className="w-5 h-5 flex items-center justify-center bg-green-500 rounded-full text-white font-bold">
                <span className="text-xs">✓</span>
              </div>
              <span className="font-medium">Image uploaded successfully! Pending review.</span>
            </div>
          )}
          
          {!isUploading && uploadError && !uploadSuccess && (
            <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/30">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="font-medium">{uploadError}</span>
            </div>
          )}

          {/* Media Preview */}
          {imagePreview && (
            <div className="relative rounded-lg overflow-hidden border-2 border-green-500/50 shadow-md">
              {mediaType === 'image' ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-32 object-cover"
                />
              ) : (
                <video
                  src={imagePreview}
                  controls
                  className="w-full h-48 object-cover"
                >
                  Your browser does not support video playback.
                </video>
              )}
              <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                <span>✓</span>
                <span>Uploaded</span>
              </div>
            </div>
          )}
          
          {/* Alternative Upload Button */}
          {!selectedFile && (
            <div className="mt-3">
              <OptimizedButton
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById(`file-upload-${bounty.id}`)?.click()}
                disabled={isUploading}
                className="w-full border-purple-500/30 text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/50"
              >
                <Upload className="w-4 h-4 mr-2" />
                {isUploading ? 'Uploading...' : 'Choose Image File'}
              </OptimizedButton>
            </div>
          )}
        </div>

      {/* Submit Button */}
      <OptimizedButton
        onClick={() => {
          console.log('🚀 Submitting bounty:', {
            bountyId: bounty.id,
            submissionText: submissionText,
            uploadedImageUrl: uploadedImageUrl,
            canSubmit: canSubmit,
            imageRequired: bounty.image_required,
            selectedFile: selectedFile,
            uploadSuccess: uploadSuccess
          });
          onSubmit(bounty.id, submissionText, uploadedImageUrl);
        }}
        disabled={!canSubmit || isSubmitting}
        className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 text-sm shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Submitting...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <Send className="w-4 h-4" />
            <span>Submit Bounty 🚀</span>
          </div>
        )}
      </OptimizedButton>
      
      {/* Debug Info - Remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-2 p-2 bg-slate-800/50 rounded text-xs text-gray-400">
          <div>Text: {submissionText.trim() ? '✅' : '❌'}</div>
          <div>Image Required: {bounty.image_required ? 'Yes' : 'No'}</div>
          <div>File Selected: {selectedFile ? '✅' : '❌'}</div>
          <div>Upload Success: {uploadSuccess ? '✅' : '❌'}</div>
          <div>Can Submit: {canSubmit ? '✅' : '❌'}</div>
        </div>
      )}
    </div>
  );
}

