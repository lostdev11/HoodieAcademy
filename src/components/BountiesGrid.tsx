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

  const handleSubmitBounty = async (bountyId: string, imageUrl?: string) => {
    if (!walletAddress || !submissionText[bountyId]?.trim()) {
      console.error('❌ Cannot submit - missing wallet or text:', {
        walletAddress,
        submissionText: submissionText[bountyId]
      });
      return;
    }

    setSubmittingBounty(bountyId);
    
    const requestData = {
      submission: submissionText[bountyId],
      walletAddress,
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
        
        alert('✅ Bounty submitted successfully!');
      } else {
        console.error('❌ API returned error:', result);
        alert(`❌ ${result.error || 'Failed to submit bounty'}`);
      }
    } catch (error) {
      console.error('❌ Network error submitting bounty:', error);
      alert(`❌ Failed to submit bounty: ${error instanceof Error ? error.message : 'Network error'}`);
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {visibleBounties.map((bounty) => (
        <Card 
          key={bounty.id} 
          className={`group hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] hover:-translate-y-2 transition-all duration-300 overflow-hidden bg-slate-800/50 border ${
            bounty.hidden ? 'opacity-60 border-dashed border-gray-500' : 'border-cyan-500/30 hover:border-cyan-500/60'
          }`}
        >
          <CardHeader className="pb-3 bg-gradient-to-r from-purple-900/30 to-cyan-900/30 group-hover:from-purple-900/50 group-hover:to-cyan-900/50 transition-all duration-300 border-b border-cyan-500/20">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-xl font-bold mb-2 flex items-center gap-2 text-cyan-400 group-hover:text-cyan-300 transition-colors">
                  <span className="truncate">{bounty.title}</span>
                  {bounty.hidden && (
                    <EyeOff className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  )}
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
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
            <p className="text-gray-300 mb-6 line-clamp-3 break-words leading-relaxed">
              {bounty.short_desc}
            </p>
            
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
            
            {/* User Actions */}
            {bounty.status === 'active' && (
              <div className="mt-6 space-y-3">
                {!walletAddress ? (
                  <div className="text-center p-4 bg-slate-700/50 rounded-lg border border-purple-500/30">
                    <p className="text-sm text-gray-300 mb-3 font-medium">🔒 Connect your wallet to submit</p>
                    <Button 
                      size="sm"
                      onClick={() => {
                        // Try to trigger wallet connection
                        if (typeof window !== 'undefined' && window.solana) {
                          window.solana.connect();
                        }
                      }}
                      className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                    >
                      Connect Wallet
                    </Button>
                  </div>
                ) : userSubmissions[bounty.id] ? (
                  <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/30">
                    <div className="flex items-center justify-center gap-2 text-green-400 mb-3">
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-sm font-bold">Submission Submitted! ✨</span>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`text-sm font-semibold px-4 py-1 ${
                        userSubmissions[bounty.id].status === 'approved' 
                          ? 'border-green-500/50 text-green-400 bg-green-500/20' 
                          : userSubmissions[bounty.id].status === 'rejected'
                          ? 'border-red-500/50 text-red-400 bg-red-500/20'
                          : 'border-yellow-500/50 text-yellow-400 bg-yellow-500/20'
                      }`}
                    >
                      {userSubmissions[bounty.id].status.toUpperCase()}
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
                className="w-full mt-4 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/60 font-medium"
                onClick={() => window.open(bounty.link_to!, '_blank')}
              >
                View Details →
              </Button>
            )}
            
            <div className="text-xs text-gray-500 mt-4 text-center border-t pt-3 border-slate-700/50">
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
  onSubmit: (bountyId: string, imageUrl?: string) => void;
  isSubmitting: boolean;
}

function BountySubmissionCard({ bounty, onSubmit, isSubmitting }: BountySubmissionCardProps) {
  const [submissionText, setSubmissionText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Check if bounty requires image
  const requiresImage = bounty.image_required || bounty.submission_type === 'image' || bounty.submission_type === 'both';

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadError('');
      setUploadSuccess(false);
      
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
    setUploadSuccess(false);
    
    try {
      // Get wallet address from localStorage
      const walletAddress = typeof window !== 'undefined' 
        ? localStorage.getItem('walletAddress') || localStorage.getItem('hoodie_academy_wallet') || 'anonymous'
        : 'anonymous';
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('walletAddress', walletAddress);
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
      
      // Store the uploaded image URL
      setUploadedImageUrl(result.url);
      
      // Mark upload as successful
      setUploadSuccess(true);
      setUploadError(''); // Explicitly clear any errors
      
    } catch (error) {
      console.error('❌ Error uploading image:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to upload image');
      setUploadSuccess(false);
      setSelectedFile(null);
      setImagePreview(null);
      setUploadedImageUrl('');
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
        setUploadSuccess(false);
        
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

      {/* Image Upload Section */}
      <div className="space-y-3">
        <label className="text-xs font-semibold text-cyan-400 flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-cyan-400" />
          {bounty.image_required ? '📷 Upload Image (Required)' : '📷 Upload Image (Optional)'}
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
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              required={bounty.image_required}
              disabled={isUploading}
            />
            
            <label htmlFor={`file-upload-${bounty.id}`} className="cursor-pointer block">
              {isUploading ? (
                <div className="flex flex-col items-center gap-3 text-blue-400">
                  <div className="w-10 h-10 border-3 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm font-semibold">Uploading Image...</span>
                  <span className="text-xs text-blue-300">Please wait</span>
                </div>
              ) : selectedFile ? (
                <div className="flex flex-col items-center gap-2 text-green-400">
                  <ImageIcon className="w-8 h-8" />
                  <span className="text-sm font-bold">✅ Image Ready!</span>
                  <span className="text-xs text-green-300 opacity-80">Click to change</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-purple-400">
                  <Upload className="w-8 h-8" />
                  <span className="text-sm font-bold">📷 Upload Image</span>
                  <span className="text-xs text-purple-300">Click to browse or drag & drop</span>
                  <span className="text-xs text-gray-500">JPG, PNG, GIF (Max 10MB)</span>
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

          {/* Image Preview */}
          {imagePreview && (
            <div className="relative rounded-lg overflow-hidden border-2 border-green-500/50 shadow-md">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-32 object-cover"
              />
              <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                <span>✓</span>
                <span>Uploaded</span>
              </div>
            </div>
          )}
          
          {/* Alternative Upload Button */}
          {!selectedFile && (
            <div className="mt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById(`file-upload-${bounty.id}`)?.click()}
                disabled={isUploading}
                className="w-full border-purple-500/30 text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/50"
              >
                <Upload className="w-4 h-4 mr-2" />
                {isUploading ? 'Uploading...' : 'Choose Image File'}
              </Button>
            </div>
          )}
        </div>

      {/* Submit Button */}
      <Button
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
          onSubmit(bounty.id, uploadedImageUrl);
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
      </Button>
      
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
