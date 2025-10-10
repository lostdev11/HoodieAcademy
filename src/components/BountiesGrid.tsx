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
    if (!walletAddress || !submissionText[bountyId]?.trim()) return;

    setSubmittingBounty(bountyId);
    try {
      const response = await fetch(`/api/bounties/${bountyId}/submit/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission: submissionText[bountyId],
          walletAddress,
          submissionType: imageUrl ? 'both' : 'text',
          imageUrl: imageUrl || undefined
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {visibleBounties.map((bounty) => (
        <Card 
          key={bounty.id} 
          className={`group hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 overflow-hidden bg-white border-2 ${
            bounty.hidden ? 'opacity-60 border-dashed' : 'border-gray-200 hover:border-purple-400'
          }`}
        >
          <CardHeader className="pb-3 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 group-hover:from-purple-500/20 group-hover:to-cyan-500/20 transition-all duration-300">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-xl font-bold mb-2 flex items-center gap-2 text-gray-800 group-hover:text-purple-600 transition-colors">
                  <span className="truncate">{bounty.title}</span>
                  {bounty.hidden && (
                    <EyeOff className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  )}
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <Target className="w-4 h-4 flex-shrink-0 text-purple-500" />
                  <span className="capitalize truncate font-medium">{bounty.squad_tag || 'All Squads'}</span>
                </div>
              </div>
              <Badge 
                className={`${getStatusColor(bounty.status)} text-white capitalize flex-shrink-0 shadow-md px-3 py-1`}
              >
                {bounty.status}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="overflow-hidden">
            <p className="text-gray-700 mb-6 line-clamp-3 break-words leading-relaxed">
              {bounty.short_desc}
            </p>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Award className="w-5 h-5 text-green-600" />
                  <span className="font-medium">Reward</span>
                </div>
                <span className="font-bold text-green-600 text-lg">{bounty.reward}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span className="font-medium">Submissions</span>
                </div>
                <span className="font-bold text-blue-600">{bounty.submissions}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Clock className="w-5 h-5 text-orange-600" />
                  <span className="font-medium">Deadline</span>
                </div>
                <span className={`font-bold ${
                  isDeadlineNear(bounty.deadline) ? 'text-red-600 animate-pulse' : 'text-gray-700'
                }`}>
                  {formatDeadline(bounty.deadline)}
                </span>
              </div>
            </div>
            
            {/* User Actions */}
            {bounty.status === 'active' && (
              <div className="mt-6 space-y-3">
                {!walletAddress ? (
                  <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-cyan-50 rounded-lg border-2 border-purple-200">
                    <p className="text-sm text-gray-700 mb-3 font-medium">🔒 Connect your wallet to submit</p>
                    <Button 
                      size="sm"
                      onClick={() => {
                        // Try to trigger wallet connection
                        if (typeof window !== 'undefined' && window.solana) {
                          window.solana.connect();
                        }
                      }}
                      className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-semibold shadow-md"
                    >
                      Connect Wallet
                    </Button>
                  </div>
                ) : userSubmissions[bounty.id] ? (
                  <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-300">
                    <div className="flex items-center justify-center gap-2 text-green-700 mb-3">
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-sm font-bold">Submission Submitted! ✨</span>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`text-sm font-semibold px-4 py-1 ${
                        userSubmissions[bounty.id].status === 'approved' 
                          ? 'border-green-500 text-green-700 bg-green-100' 
                          : userSubmissions[bounty.id].status === 'rejected'
                          ? 'border-red-500 text-red-700 bg-red-100'
                          : 'border-yellow-500 text-yellow-700 bg-yellow-100'
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
                className="w-full mt-4 border-purple-300 text-purple-600 hover:bg-purple-50 hover:border-purple-400 font-medium"
                onClick={() => window.open(bounty.link_to!, '_blank')}
              >
                View Details →
              </Button>
            )}
            
            <div className="text-xs text-gray-500 mt-4 text-center border-t pt-3 border-gray-200">
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

  const canSubmit = submissionText.trim() && (!requiresImage || selectedFile);

  return (
    <div className="space-y-4 p-4 bg-gradient-to-br from-gray-50 to-white rounded-lg border-2 border-gray-200">
      {/* Text Submission */}
      <div>
        <label className="text-xs font-semibold text-gray-700 mb-2 block">📝 Your Submission</label>
        <textarea
          placeholder="Describe your submission or paste a link..."
          value={submissionText}
          onChange={(e) => setSubmissionText(e.target.value)}
          className="w-full p-3 text-sm border-2 border-gray-300 rounded-lg resize-none break-words overflow-wrap-anywhere bg-white text-gray-900 placeholder:text-gray-500 focus:text-gray-900 focus:bg-white focus:border-purple-400 focus:ring-2 focus:ring-purple-200 transition-all"
          rows={3}
        />
      </div>

      {/* Image Upload Section */}
      {requiresImage && (
        <div className="space-y-3">
          <label className="text-xs font-semibold text-gray-700 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-purple-600" />
            {bounty.image_required ? '📷 Upload Image (Required)' : '📷 Upload Image (Optional)'}
          </label>
          
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300 cursor-pointer
              ${isDragOver 
                ? 'border-cyan-500 bg-gradient-to-br from-cyan-500/20 to-cyan-400/20 scale-105' 
                : isUploading 
                  ? 'border-blue-500 bg-gradient-to-br from-blue-500/20 to-blue-400/20' 
                  : selectedFile 
                    ? 'border-green-500 bg-gradient-to-br from-green-500/20 to-emerald-400/20' 
                    : 'border-purple-400 bg-gradient-to-br from-purple-500/10 to-pink-500/10 hover:border-purple-500 hover:from-purple-500/20 hover:to-pink-500/20 hover:scale-105'
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
                <div className="flex flex-col items-center gap-3 text-blue-600">
                  <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm font-semibold">Uploading Image...</span>
                  <span className="text-xs text-blue-500">Please wait</span>
                </div>
              ) : selectedFile ? (
                <div className="flex flex-col items-center gap-2 text-green-600">
                  <ImageIcon className="w-8 h-8" />
                  <span className="text-sm font-bold">✅ Image Ready!</span>
                  <span className="text-xs text-green-600 opacity-80">Click to change</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-purple-600">
                  <Upload className="w-8 h-8" />
                  <span className="text-sm font-bold">Upload Image</span>
                  <span className="text-xs text-purple-500">Click or drag & drop</span>
                </div>
              )}
            </label>
            
            {isDragOver && (
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/30 to-cyan-400/30 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <div className="text-cyan-700 font-bold text-sm">📥 Drop your image here!</div>
              </div>
            )}
          </div>

          {/* Upload Status */}
          {!isUploading && uploadSuccess && selectedFile && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-lg border border-green-200">
              <div className="w-5 h-5 flex items-center justify-center bg-green-500 rounded-full text-white font-bold">
                <span className="text-xs">✓</span>
              </div>
              <span className="font-medium">Image uploaded successfully! Pending review.</span>
            </div>
          )}
          
          {!isUploading && uploadError && !uploadSuccess && (
            <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 p-3 rounded-lg border border-red-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="font-medium">{uploadError}</span>
            </div>
          )}

          {/* Image Preview */}
          {imagePreview && (
            <div className="relative rounded-lg overflow-hidden border-2 border-green-300 shadow-md">
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
        </div>
      )}

      {/* Submit Button */}
      <Button
        onClick={() => onSubmit(bounty.id, uploadedImageUrl)}
        disabled={!canSubmit || isSubmitting}
        className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-bold py-3 text-sm shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
    </div>
  );
}
