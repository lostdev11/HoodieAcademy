'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { getSupabaseBrowser } from '@/lib/supabaseClient';
import { Target, Clock, Award, Users, Eye, EyeOff, Send, CheckCircle, Upload, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DBBounty } from '@/types/database';

interface BountiesGridProps {
  initialBounties?: DBBounty[];
  showHidden?: boolean; // For admin view
}

export default function BountiesGrid({ 
  initialBounties = [], 
  showHidden = false 
}: BountiesGridProps) {
  const [bounties, setBounties] = useState<DBBounty[]>(initialBounties);
  const [userSubmissions, setUserSubmissions] = useState<{ [bountyId: string]: { status: string; submission: string } }>({});
  const [submittingBounty, setSubmittingBounty] = useState<string | null>(null);
  const [submissionText, setSubmissionText] = useState<{ [bountyId: string]: string }>({});
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  useEffect(() => {
    // Get wallet address from localStorage - check both possible keys
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

  useEffect(() => {
    const fetchBounties = async () => {
      try {
        // Use the API instead of direct Supabase access
        const response = await fetch('/api/bounties');
        const result = await response.json();
        
        if (response.ok) {
          // API returns bounties directly, not wrapped in a bounties property
          setBounties(Array.isArray(result) ? result : []);
        } else {
          console.error('Error fetching bounties:', result.error || 'Unknown error');
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchBounties();
  }, []);

  // Fetch user submissions for all bounties
  useEffect(() => {
    if (!walletAddress || bounties.length === 0) return;

    const fetchUserSubmissions = async () => {
      const submissions: { [bountyId: string]: { status: string; submission: string } } = {};
      
      for (const bounty of bounties) {
        try {
          const response = await fetch(`/api/bounties/${bounty.id}/submit/?walletAddress=${walletAddress}`);
          if (response.ok) {
            const result = await response.json();
            if (result.submission) {
              submissions[bounty.id] = result.submission;
            }
          }
        } catch (error) {
          console.error(`Error fetching submission for bounty ${bounty.id}:`, error);
        }
      }
      
      setUserSubmissions(submissions);
    };

    fetchUserSubmissions();
  }, [walletAddress, bounties]);

  const handleSubmitBounty = async (bountyId: string) => {
    if (!walletAddress || !submissionText[bountyId]?.trim()) return;

    setSubmittingBounty(bountyId);
    try {
      const response = await fetch(`/api/bounties/${bountyId}/submit/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission: submissionText[bountyId],
          walletAddress,
          submissionType: 'text'
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        // Update user submissions
        setUserSubmissions(prev => ({
          ...prev,
          [bountyId]: result.submission
        }));
        
        // Clear submission text
        setSubmissionText(prev => ({
          ...prev,
          [bountyId]: ''
        }));
        
        // Update bounty submissions count
        setBounties(prev => prev.map(bounty => 
          bounty.id === bountyId 
            ? { ...bounty, submissions: bounty.submissions + 1 }
            : bounty
        ));
        
        alert('Bounty submitted successfully!');
      } else {
        alert(result.error || 'Failed to submit bounty');
      }
    } catch (error) {
      console.error('Error submitting bounty:', error);
      alert('Failed to submit bounty');
    } finally {
      setSubmittingBounty(null);
    }
  };

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

  // Filter bounties based on showHidden prop
  const visibleBounties = showHidden 
    ? bounties 
    : bounties.filter(bounty => !bounty.hidden);

  if (visibleBounties.length === 0) {
    return (
      <div className="text-center py-8">
        <Target className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">No Bounties Available</h3>
        <p className="text-gray-500">
          {showHidden ? 'No bounties have been created yet.' : 'All available bounties are currently hidden.'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {visibleBounties.map((bounty) => (
        <Card 
          key={bounty.id} 
          className={`hover:shadow-lg transition-all duration-200 overflow-hidden ${
            bounty.hidden ? 'opacity-60 border-dashed' : ''
          }`}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg mb-2 flex items-center gap-2">
                  <span className="truncate">{bounty.title}</span>
                  {bounty.hidden && (
                    <EyeOff className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  )}
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <Target className="w-4 h-4 flex-shrink-0" />
                  <span className="capitalize truncate">{bounty.squad_tag || 'All Squads'}</span>
                </div>
              </div>
              <Badge 
                className={`${getStatusColor(bounty.status)} text-white capitalize flex-shrink-0`}
              >
                {bounty.status}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="overflow-hidden">
            <p className="text-gray-700 mb-4 line-clamp-3 break-words">
              {bounty.short_desc}
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1 text-gray-600">
                  <Award className="w-4 h-4" />
                  <span>Reward:</span>
                </div>
                <span className="font-semibold text-green-600">{bounty.reward}</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1 text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>Submissions:</span>
                </div>
                <span className="font-semibold">{bounty.submissions}</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1 text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>Deadline:</span>
                </div>
                <span className={`font-semibold ${
                  isDeadlineNear(bounty.deadline) ? 'text-orange-600' : 'text-gray-700'
                }`}>
                  {formatDeadline(bounty.deadline)}
                </span>
              </div>
            </div>
            
            {/* User Actions */}
            {bounty.status === 'active' && (
              <div className="mt-4 space-y-3">
                {!walletAddress ? (
                  <div className="text-center p-3 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-600 mb-2">Connect your wallet to submit</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        // Try to trigger wallet connection
                        if (typeof window !== 'undefined' && window.solana) {
                          window.solana.connect();
                        }
                      }}
                      className="text-xs"
                    >
                      Connect Wallet
                    </Button>
                  </div>
                ) : userSubmissions[bounty.id] ? (
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Submission Submitted</span>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        userSubmissions[bounty.id].status === 'approved' 
                          ? 'border-green-500 text-green-600' 
                          : userSubmissions[bounty.id].status === 'rejected'
                          ? 'border-red-500 text-red-600'
                          : 'border-yellow-500 text-yellow-600'
                      }`}
                    >
                      {userSubmissions[bounty.id].status}
                    </Badge>
                  </div>
                ) : (
                  <BountySubmissionCard 
                    bounty={bounty}
                    onSubmit={handleSubmitBounty}
                    isSubmitting={submittingBounty === bounty.id}
                  />
                )}
              </div>
            )}

            {bounty.link_to && (
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => window.open(bounty.link_to!, '_blank')}
              >
                View Details
              </Button>
            )}
            
            <div className="text-xs text-gray-400 mt-3 text-center">
              Created {new Date(bounty.created_at).toLocaleDateString()}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Bounty Submission Card Component
interface BountySubmissionCardProps {
  bounty: DBBounty;
  onSubmit: (bountyId: string) => void;
  isSubmitting: boolean;
}

function BountySubmissionCard({ bounty, onSubmit, isSubmitting }: BountySubmissionCardProps) {
  const [submissionText, setSubmissionText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);

  // Check if bounty requires image
  const requiresImage = bounty.image_required || bounty.submission_type === 'image' || bounty.submission_type === 'both';

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadError('');
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      // Auto-upload the image
      await uploadImage(file);
    }
  };

  const uploadImage = async (file: File) => {
    setIsUploading(true);
    setUploadError('');
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('walletAddress', 'user-wallet'); // This would come from auth context
      formData.append('context', 'bounty_submission');
      
      const response = await fetch('/api/upload/moderated-image', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }
      
      const result = await response.json();
      console.log('✅ Image uploaded successfully:', result);
      
    } catch (error) {
      console.error('❌ Error uploading image:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to upload image');
      setSelectedFile(null);
      setImagePreview(null);
    } finally {
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
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
        setUploadError('');
        
        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
        
        // Auto-upload the image
        await uploadImage(file);
      } else {
        setUploadError('Please drop an image file');
      }
    }
  };

  const canSubmit = submissionText.trim() && (!requiresImage || selectedFile);

  return (
    <div className="space-y-3">
      {/* Text Submission */}
      <textarea
        placeholder="Describe your submission or paste a link..."
        value={submissionText}
        onChange={(e) => setSubmissionText(e.target.value)}
        className="w-full p-2 text-sm border border-gray-300 rounded-md resize-none break-words overflow-wrap-anywhere bg-white text-gray-900 placeholder:text-gray-500 focus:text-gray-900 focus:bg-white"
        rows={2}
      />

      {/* Image Upload Section */}
      {requiresImage && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            {bounty.image_required ? 'Upload Image *' : 'Upload Image (Optional)'}
          </label>
          
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative border-2 border-dashed rounded-lg p-4 text-center transition-all duration-200 cursor-pointer
              ${isDragOver 
                ? 'border-cyan-500 bg-cyan-500/10' 
                : isUploading 
                  ? 'border-blue-500 bg-blue-500/10' 
                  : selectedFile 
                    ? 'border-green-500 bg-green-500/10' 
                    : 'border-purple-500 bg-purple-500/10 hover:border-purple-400 hover:bg-purple-500/20'
              }
            `}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              required={bounty.image_required}
              disabled={isUploading}
            />
            
            {isUploading ? (
              <div className="flex items-center justify-center gap-2 text-blue-600">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm">Uploading...</span>
              </div>
            ) : selectedFile ? (
              <div className="flex items-center justify-center gap-2 text-green-600">
                <ImageIcon className="w-4 h-4" />
                <span className="text-sm">Image Selected - Click to Change</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-purple-600">
                <Upload className="w-4 h-4" />
                <span className="text-sm">Click to Upload or Drag & Drop</span>
              </div>
            )}
            
            {isDragOver && (
              <div className="absolute inset-0 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                <div className="text-cyan-600 font-medium text-sm">Drop your image here</div>
              </div>
            )}
          </div>

          {/* Upload Status */}
          {uploadError && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="w-3 h-3" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Image Preview */}
          {imagePreview && (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-24 object-cover rounded-lg border border-gray-300"
              />
              <div className="absolute top-1 right-1 bg-green-500 text-white text-xs px-2 py-1 rounded">
                ✓ Uploaded
              </div>
            </div>
          )}
        </div>
      )}

      {/* Submit Button */}
      <Button
        onClick={() => onSubmit(bounty.id)}
        disabled={!canSubmit || isSubmitting}
        className="w-full bg-cyan-600 hover:bg-cyan-700 text-white text-sm"
      >
        {isSubmitting ? (
          'Submitting...'
        ) : (
          <>
            <Send className="w-3 h-3 mr-1" />
            Submit Bounty
          </>
        )}
      </Button>
    </div>
  );
}
