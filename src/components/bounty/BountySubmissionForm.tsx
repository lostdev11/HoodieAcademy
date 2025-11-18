'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Image as ImageIcon, Wallet, AlertCircle, Star, Trophy, Gift, Video, File } from 'lucide-react';
import { useWalletSupabase } from '@/hooks/use-wallet-supabase';
import { bountyXPService } from '@/services/bounty-xp-service';
import Link from 'next/link';

interface BountySubmissionFormProps {
  onSubmit: (data: BountySubmissionData) => void;
  className?: string;
  bountyData?: {
    image_required?: boolean;
    submission_type?: 'text' | 'image' | 'both';
    title?: string;
    description?: string;
  };
}

export interface BountySubmissionData {
  title: string;
  squad: string;
  description: string;
  courseRef: string;
  bountyId?: string;
  file: File | null;
  imageUrl?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  author?: string;
  walletAddress?: string;
}

export const BountySubmissionForm = ({ onSubmit, className = '', bountyData }: BountySubmissionFormProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    squad: '',
    description: '',
    courseRef: '',
    imageUrl: '',
    mediaUrl: '',
    mediaType: null as 'image' | 'video' | null
  });
  
  // Wallet connection state
  const { wallet, connectWallet, disconnectWallet, loading: walletLoading, error: walletError } = useWalletSupabase();
  const [showWalletAlert, setShowWalletAlert] = useState(false);

  // Get XP rules for display
  const xpRules = bountyXPService.getXPRules();

  // Calculate Squad XP bonus
  const getSquadXPBonus = (squad: string) => {
    switch (squad) {
      case 'Creators': return 50;
      case 'Speakers': return 40;
      case 'Raiders': return 45;
      case 'Decoders': return 35;
      default: return 25;
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check if wallet is connected before allowing upload
      if (!wallet) {
        setUploadError('Please connect your wallet before uploading media');
        setSelectedFile(null);
        return;
      }

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
        setMediaPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      // Auto-upload the media
      await uploadMedia(file);
    }
  };

  const uploadMedia = async (file: File) => {
    setIsUploading(true);
    setUploadError('');
    setUploadSuccess(false);
    
    try {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      
      console.log('🔄 Starting media upload:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        mediaType: isImage ? 'image' : 'video',
        wallet: wallet
      });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('walletAddress', wallet || '');
      formData.append('context', 'bounty_submission');
      
      console.log('📤 Sending upload request...');
      
      const response = await fetch('/api/upload/moderated-media', {
        method: 'POST',
        body: formData,
      });
      
      console.log('📥 Upload response status:', response.status);
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (parseError) {
          const text = await response.text();
          throw new Error(`Upload failed: ${response.status} ${response.statusText}${text ? ` - ${text}` : ''}`);
        }
        console.error('❌ Upload failed:', errorData);
        throw new Error(errorData.error || `Failed to upload media (${response.status})`);
      }
      
      const result = await response.json();
      console.log('✅ Media uploaded successfully:', result);
      
      // Store the uploaded media URL and type in form data
      setFormData(prev => ({ 
        ...prev, 
        imageUrl: result.url,
        mediaUrl: result.url,
        mediaType: result.mediaType
      }));
      
      // Mark upload as successful
      setUploadSuccess(true);
      setUploadError(''); // Explicitly clear any errors
      
    } catch (error) {
      console.error('❌ Error uploading media:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to upload media');
      setUploadSuccess(false);
      setSelectedFile(null);
      setMediaPreview(null);
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
    
    // Check if wallet is connected before allowing upload
    if (!wallet) {
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
          setMediaPreview(e.target?.result as string);
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

  const handleWalletConnect = async () => {
    const connectedWallet = await connectWallet();
    if (connectedWallet) {
      setShowWalletAlert(false);
    } else {
      setShowWalletAlert(true);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!wallet) {
      setShowWalletAlert(true);
      return;
    }
    
    // Check if image is required but not uploaded
    if (bountyData?.image_required && (!selectedFile || !uploadSuccess)) {
      setUploadError('Image upload is required for this bounty');
      return;
    }
    
    // Check if image is required and uploaded but URL is missing
    if (bountyData?.image_required && selectedFile && uploadSuccess && !formData.imageUrl) {
      setUploadError('Image upload is still processing. Please wait...');
      return;
    }
    
    onSubmit({ 
      ...formData, 
      file: selectedFile,
      imageUrl: formData.imageUrl,
      mediaUrl: formData.mediaUrl,
      mediaType: formData.mediaType || undefined,
      walletAddress: wallet 
    });
    
    // Reset form
    setFormData({ title: '', squad: '', description: '', courseRef: '', imageUrl: '', mediaUrl: '', mediaType: null });
    setSelectedFile(null);
    setMediaPreview(null);
    setMediaType(null);
    setUploadError('');
    setUploadSuccess(false);
  };

  return (
    <div className={`bg-gray-900 p-8 rounded-xl ${className}`}>
      <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
        <Upload className="w-5 h-5 text-purple-400" />
        Submit Your Entry
      </h2>

      {/* Wallet Connection Section */}
      <div className="mb-6 p-4 sm:p-4 bg-gray-800 rounded-lg border border-gray-700">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Wallet className="w-5 h-5 text-purple-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-medium text-sm sm:text-base">Wallet Connection</h3>
              <p className="text-xs sm:text-sm text-gray-400 truncate">
                {wallet ? `Connected: ${wallet.slice(0, 6)}...${wallet.slice(-4)}` : 'Connect your wallet to submit'}
              </p>
            </div>
          </div>
          {wallet ? (
            <Button
              onClick={disconnectWallet}
              variant="outline"
              size="sm"
              className="text-red-400 border-red-400 hover:bg-red-400/10 w-full sm:w-auto min-h-[44px] sm:min-h-[36px] touch-manipulation"
            >
              Disconnect
            </Button>
          ) : (
            <Button
              onClick={handleWalletConnect}
              disabled={walletLoading}
              className="bg-purple-600 hover:bg-purple-700 text-white w-full sm:w-auto min-h-[48px] sm:min-h-[40px] touch-manipulation text-sm sm:text-base"
            >
              {walletLoading ? 'Connecting...' : 'Connect Wallet'}
            </Button>
          )}
        </div>
        
        {walletError && (
          <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span className="text-sm text-red-400">{walletError}</span>
          </div>
        )}
        
        {showWalletAlert && !wallet && (
          <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-yellow-400">Please connect your wallet to submit an entry</span>
          </div>
        )}
      </div>

      {/* XP Information Section */}
      <div className="mb-6 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/30">
        <div className="flex items-center gap-2 mb-3">
          <Star className="w-5 h-5 text-yellow-400" />
          <h3 className="text-white font-medium">Bounty XP System</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-green-400">✅</span>
              <span className="text-gray-300">+{xpRules.participationXP} XP per submission</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-400">📊</span>
              <span className="text-gray-300">Max {xpRules.maxSubmissionsPerBounty} submissions per bounty</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-purple-400">🎯</span>
              <span className="text-gray-300">Max {xpRules.participationXP * xpRules.maxSubmissionsPerBounty} XP from participation</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span className="text-gray-300 font-medium">Winner Bonuses:</span>
            </div>
            <div className="ml-6 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-yellow-400">🥇</span>
                <span className="text-gray-300">1st: +{xpRules.winnerBonuses.first.xp} XP + {xpRules.winnerBonuses.first.sol} SOL</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">🥈</span>
                <span className="text-gray-300">2nd: +{xpRules.winnerBonuses.second.xp} XP + {xpRules.winnerBonuses.second.sol} SOL</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-orange-400">🥉</span>
                <span className="text-gray-300">3rd: +{xpRules.winnerBonuses.third.xp} XP + {xpRules.winnerBonuses.third.sol} SOL</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Retailstar Rewards Section */}
      <div className="mb-6 p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-lg border border-indigo-500/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-indigo-400" />
            <h3 className="text-white font-medium">Retailstar Rewards</h3>
          </div>
          <Link href="/retailstar-incentives">
            <Button variant="outline" size="sm" className="border-indigo-500 text-indigo-400 hover:bg-indigo-500/10">
              View All Rewards
            </Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-indigo-400">🎟️</span>
              <span className="text-gray-300">Retail Tickets for raffles & events</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-indigo-400">🪪</span>
              <span className="text-gray-300">Domain PFP upgrades</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-indigo-400">🧱</span>
              <span className="text-gray-300">1-page landing page builds</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-indigo-400">🔐</span>
              <span className="text-gray-300">Hidden lore access</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-indigo-400">📦</span>
              <span className="text-gray-300">Mallcore asset packs</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-indigo-400">📣</span>
              <span className="text-gray-300">Public spotlight features</span>
            </div>
          </div>
        </div>
        
        <div className="mt-3 p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/30">
          <p className="text-xs text-indigo-300">
            💡 <strong>Pro Tip:</strong> The better your submission, the bigger the reward. Tiered bonuses available for excellent and creative work!
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="title" className="text-white">Artwork Title</Label>
          <Input
            id="title"
            name="title"
            placeholder="Enter your artwork title"
            className="mt-1 bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:text-white focus:bg-gray-800"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>

        <div>
          <Label htmlFor="squad" className="text-white">Squad (Optional)</Label>
          <Select value={formData.squad} onValueChange={(value) => setFormData({ ...formData, squad: value })}>
            <SelectTrigger className="mt-1 bg-gray-800 border-gray-600 text-white">
              <SelectValue placeholder="Select Squad (optional)" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600">
              <SelectItem value="Creators">🎨 Creators</SelectItem>
              <SelectItem value="Speakers">🎤 Speakers</SelectItem>
              <SelectItem value="Raiders">⚔️ Raiders</SelectItem>
              <SelectItem value="Decoders">🧠 Decoders</SelectItem>
            </SelectContent>
          </Select>
          {formData.squad && (
            <div className="mt-2 p-2 bg-purple-500/10 rounded-lg border border-purple-500/30">
              <p className="text-sm text-purple-400">
                ⭐ Squad XP Bonus: +{getSquadXPBonus(formData.squad)} XP for {formData.squad} submission
              </p>
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="courseRef" className="text-white">Related Course (Optional)</Label>
          <Input
            id="courseRef"
            name="courseRef"
            placeholder="e.g., v120-meme-creation, t100-chart-literacy"
            className="mt-1 bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:text-white focus:bg-gray-800"
            value={formData.courseRef}
            onChange={(e) => setFormData({ ...formData, courseRef: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="description" className="text-white">Description</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="Describe your submission and creative process..."
            className="mt-1 bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:text-white focus:bg-gray-800 min-h-[100px]"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />
        </div>

        {/* Media Upload Section - Always Available (Mobile-Optimized) */}
        <div>
          <Label className="text-white block mb-3 text-sm sm:text-base">
            {bountyData?.image_required ? 'Upload Media *' : 'Upload Media (Optional)'}
          </Label>
            
            {/* Custom Upload Button with Drag & Drop - Mobile Friendly */}
            <div className="mt-1">
              <input
                id="file"
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="hidden"
                required={bountyData?.image_required}
                disabled={isUploading}
              />
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                  relative border-2 border-dashed rounded-lg p-4 sm:p-6 text-center transition-all duration-200
                  min-h-[120px] sm:min-h-[140px]
                  ${isDragOver 
                    ? 'border-cyan-500 bg-cyan-500/10' 
                    : isUploading 
                      ? 'border-blue-500 bg-blue-500/10' 
                      : selectedFile 
                        ? 'border-green-500 bg-green-500/10' 
                        : 'border-purple-500 bg-purple-500/10 hover:border-purple-400 hover:bg-purple-500/20 active:bg-purple-500/30'
                  }
                `}
              >
                <label
                  htmlFor="file"
                  className={`
                    inline-flex flex-col sm:flex-row items-center gap-2 cursor-pointer transition-all duration-200
                    w-full touch-manipulation
                    ${isUploading 
                      ? 'text-blue-400 cursor-not-allowed' 
                      : selectedFile 
                        ? 'text-green-400 hover:text-green-300' 
                        : 'text-purple-400 hover:text-purple-300 active:text-purple-200'
                    }
                  `}
                >
                  {isUploading ? (
                    <>
                      <div className="w-6 h-6 sm:w-5 sm:h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-base sm:text-lg font-medium">Uploading Media...</span>
                    </>
                  ) : selectedFile ? (
                    <>
                      {mediaType === 'image' ? <ImageIcon className="w-8 h-8 sm:w-6 sm:h-6" /> : <Video className="w-8 h-8 sm:w-6 sm:h-6" />}
                      <span className="text-base sm:text-lg font-medium">Change Media</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 sm:w-6 sm:h-6" />
                      <span className="text-base sm:text-lg font-medium text-center">
                        <span className="hidden sm:inline">Click to Upload or Drag & Drop</span>
                        <span className="sm:hidden">Tap to Upload</span>
                      </span>
                    </>
                  )}
                </label>
                
                {!selectedFile && !isUploading && (
                  <p className="text-xs sm:text-sm text-gray-400 mt-2">
                    Images: JPG, PNG, GIF, WebP (Max 10MB)<br/>
                    Videos: MP4, WebM, MOV (Max 100MB)
                  </p>
                )}
                
                {isDragOver && (
                  <div className="absolute inset-0 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                    <div className="text-cyan-400 font-medium text-sm sm:text-base">Drop your image here</div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Upload Status - Mobile Optimized */}
            {isUploading && (
              <div className="mt-3 flex items-center justify-center gap-2 text-sm sm:text-base text-blue-400 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
                <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                <span>Uploading image...</span>
              </div>
            )}
            
            {!isUploading && uploadSuccess && selectedFile && (
              <div className="mt-3 flex items-center gap-2 text-sm sm:text-base text-green-400 p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                <div className="w-5 h-5 flex items-center justify-center">
                  <span className="text-lg">✓</span>
                </div>
                <span className="break-words">Media uploaded successfully! Pending admin review.</span>
              </div>
            )}
            
            {!isUploading && uploadError && !uploadSuccess && (
              <div className="mt-3 flex items-center gap-2 text-sm sm:text-base text-red-400 p-3 bg-red-500/10 rounded-lg border border-red-500/30">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="break-words">{uploadError}</span>
              </div>
            )}
            
            {/* File Info - Mobile Friendly */}
            {selectedFile && !isUploading && (
              <div className="mt-3 flex items-center gap-2 text-xs sm:text-sm text-gray-300 p-2 bg-gray-800/50 rounded-lg">
                <ImageIcon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate flex-1">{selectedFile.name}</span>
                <span className="text-gray-500 flex-shrink-0">({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
              </div>
            )}
            
            {/* Media Preview - Mobile Optimized */}
            {mediaPreview && (
              <div className="mt-4">
                <div className="relative inline-block group w-full sm:w-auto">
                  {mediaType === 'image' ? (
                    <img 
                      src={mediaPreview} 
                      alt="Preview" 
                      className="w-full sm:max-w-full h-40 sm:h-32 object-cover rounded-lg border border-gray-600"
                    />
                  ) : (
                    <video 
                      src={mediaPreview} 
                      controls
                      className="w-full sm:max-w-full h-40 sm:h-48 object-cover rounded-lg border border-gray-600"
                    >
                      Your browser does not support video playback.
                    </video>
                  )}
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-lg shadow-lg">
                    ✓ Uploaded
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setMediaPreview(null);
                      setMediaType(null);
                      setFormData(prev => ({ ...prev, imageUrl: '', mediaUrl: '', mediaType: null }));
                      setUploadError('');
                      setUploadSuccess(false);
                    }}
                    className="absolute top-2 left-2 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-lg opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity touch-manipulation min-h-[32px] min-w-[64px]"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
        </div>

        <Button 
          type="submit" 
          disabled={!wallet || (bountyData?.image_required && (!selectedFile || !uploadSuccess || !formData.imageUrl))}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {!wallet ? '🔒 Connect Wallet to Submit' : 
           (bountyData?.image_required && (!selectedFile || !uploadSuccess || !formData.imageUrl)) ? '📷 Media Upload Required' :
           '🚀 Submit Bounty Entry'}
        </Button>
      </form>
    </div>
  );
}; 