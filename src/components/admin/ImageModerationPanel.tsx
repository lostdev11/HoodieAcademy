'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  CheckCircle, 
  XCircle, 
  Trash2, 
  Eye, 
  Clock, 
  User, 
  Calendar,
  AlertTriangle,
  Image as ImageIcon
} from 'lucide-react';

interface ModeratedImage {
  id: string;
  filename: string;
  original_name: string;
  public_url: string;
  wallet_address: string;
  context: string;
  file_size: number;
  mime_type: string;
  status: 'pending_review' | 'approved' | 'rejected' | 'deleted';
  uploaded_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
  review_reason?: string;
  users?: {
    display_name?: string;
    squad?: string;
  };
}

interface ImageModerationPanelProps {
  className?: string;
}

export const ImageModerationPanel = ({ className = '' }: ImageModerationPanelProps) => {
  const [images, setImages] = useState<ModeratedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<ModeratedImage | null>(null);
  const [reviewReason, setReviewReason] = useState('');
  const [isModerating, setIsModerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');

  const fetchImages = async (status: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/moderate-image?status=${status}&limit=50`);
      
      if (response.ok) {
        const data = await response.json();
        setImages(data.images || []);
      } else {
        console.error('Failed to fetch images:', response.status);
      }
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setLoading(false);
    }
  };

  const moderateImage = async (imageId: string, action: 'approve' | 'reject' | 'delete') => {
    try {
      setIsModerating(true);
      
      const response = await fetch('/api/admin/moderate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageId,
          action,
          reason: reviewReason.trim() || null,
          adminWallet: 'admin-wallet' // This would come from auth context
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Image moderated:', result);
        
        // Refresh the current tab
        await fetchImages(activeTab === 'pending' ? 'pending_review' : activeTab);
        
        // Close modal and reset
        setSelectedImage(null);
        setReviewReason('');
      } else {
        const error = await response.json();
        console.error('❌ Moderation failed:', error);
        alert(`Failed to moderate image: ${error.error}`);
      }
    } catch (error) {
      console.error('❌ Error moderating image:', error);
      alert('Failed to moderate image');
    } finally {
      setIsModerating(false);
    }
  };

  useEffect(() => {
    const statusMap = {
      pending: 'pending_review',
      approved: 'approved',
      rejected: 'rejected'
    };
    fetchImages(statusMap[activeTab]);
  }, [activeTab]);

  const formatFileSize = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_review':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-400"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="border-green-500 text-green-400"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="border-red-500 text-red-400"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case 'deleted':
        return <Badge variant="outline" className="border-gray-500 text-gray-400"><Trash2 className="w-3 h-3 mr-1" />Deleted</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <Card className="bg-slate-800/50 border-cyan-500/30">
        <CardHeader>
          <CardTitle className="text-cyan-400 flex items-center gap-2">
            <ImageIcon className="w-6 h-6" />
            Image Moderation Panel
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Tab Navigation */}
          <div className="flex space-x-4 mb-6">
            <Button
              variant={activeTab === 'pending' ? 'default' : 'outline'}
              onClick={() => setActiveTab('pending')}
              className={activeTab === 'pending' ? 'bg-cyan-600 hover:bg-cyan-700' : 'border-cyan-500/30 text-cyan-400'}
            >
              <Clock className="w-4 h-4 mr-2" />
              Pending Review ({images.length})
            </Button>
            <Button
              variant={activeTab === 'approved' ? 'default' : 'outline'}
              onClick={() => setActiveTab('approved')}
              className={activeTab === 'approved' ? 'bg-green-600 hover:bg-green-700' : 'border-green-500/30 text-green-400'}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Approved
            </Button>
            <Button
              variant={activeTab === 'rejected' ? 'default' : 'outline'}
              onClick={() => setActiveTab('rejected')}
              className={activeTab === 'rejected' ? 'bg-red-600 hover:bg-red-700' : 'border-red-500/30 text-red-400'}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Rejected
            </Button>
          </div>

          {/* Images Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-2 text-cyan-400">Loading images...</span>
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No images found for {activeTab} status</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.map((image) => (
                <Card key={image.id} className="bg-slate-700/50 border-slate-600/30">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Image Preview */}
                      <div className="relative">
                        <img
                          src={image.public_url}
                          alt={image.original_name}
                          className="w-full h-32 object-cover rounded-lg"
                          onError={(e) => {
                            e.currentTarget.src = '/images/placeholder-image.jpg';
                          }}
                        />
                        {getStatusBadge(image.status)}
                      </div>

                      {/* Image Info */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-3 h-3 text-gray-400" />
                          <span className="text-gray-300">
                            {image.users?.display_name || image.wallet_address.slice(0, 8) + '...'}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span className="text-gray-300">{formatDate(image.uploaded_at)}</span>
                        </div>
                        
                        <div className="text-sm text-gray-400">
                          {image.original_name} ({formatFileSize(image.file_size)})
                        </div>
                      </div>

                      {/* Action Buttons */}
                      {image.status === 'pending_review' && (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => setSelectedImage(image)}
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Review
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="bg-slate-800 border-cyan-500/30 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="text-cyan-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Review Image
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Image Preview */}
              <div className="flex justify-center">
                <img
                  src={selectedImage.public_url}
                  alt={selectedImage.original_name}
                  className="max-w-full max-h-64 object-contain rounded-lg"
                />
              </div>

              {/* Image Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Uploaded by:</span>
                  <p className="text-white">{selectedImage.users?.display_name || selectedImage.wallet_address}</p>
                </div>
                <div>
                  <span className="text-gray-400">File size:</span>
                  <p className="text-white">{formatFileSize(selectedImage.file_size)}</p>
                </div>
                <div>
                  <span className="text-gray-400">Uploaded:</span>
                  <p className="text-white">{formatDate(selectedImage.uploaded_at)}</p>
                </div>
                <div>
                  <span className="text-gray-400">Context:</span>
                  <p className="text-white">{selectedImage.context}</p>
                </div>
              </div>

              {/* Review Reason */}
              <div>
                <label className="text-gray-400 text-sm">Review Reason (Optional)</label>
                <Textarea
                  value={reviewReason}
                  onChange={(e) => setReviewReason(e.target.value)}
                  placeholder="Enter reason for approval/rejection..."
                  className="mt-1 bg-slate-700 border-slate-600 text-white"
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <Button
                  onClick={() => moderateImage(selectedImage.id, 'approve')}
                  disabled={isModerating}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
                <Button
                  onClick={() => moderateImage(selectedImage.id, 'reject')}
                  disabled={isModerating}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => moderateImage(selectedImage.id, 'delete')}
                  disabled={isModerating}
                  variant="outline"
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
                <Button
                  onClick={() => {
                    setSelectedImage(null);
                    setReviewReason('');
                  }}
                  variant="outline"
                  className="border-gray-500/30 text-gray-400"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
