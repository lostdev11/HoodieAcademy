'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Plus, Edit, Trash2, Eye, EyeOff, Calendar, Award, Target, 
  X, Save, AlertCircle, CheckCircle 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Bounty {
  id?: string;
  title: string;
  short_desc: string;
  reward: string;
  reward_type: 'XP' | 'SOL' | 'NFT';
  start_date?: string;
  deadline?: string;
  status: 'active' | 'completed' | 'expired';
  hidden: boolean;
  squad_tag?: string;
  submissions?: number;
  nft_prize?: string;
  nft_prize_image?: string;
  nft_prize_description?: string;
  created_at?: string;
  updated_at?: string;
}

interface BountyManagerProps {
  bounties: Bounty[];
  onBountiesChange: (bounties: Bounty[]) => void;
  walletAddress: string | null;
}

export default function BountyManagerSimple({ bounties, onBountiesChange, walletAddress }: BountyManagerProps) {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingBounty, setEditingBounty] = useState<Bounty | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [bountyToDelete, setBountyToDelete] = useState<string | null>(null);

  // Form state - initialize with default values
  const [formData, setFormData] = useState<Partial<Bounty>>({
    title: '',
    short_desc: '',
    reward: '',
    reward_type: 'XP',
    start_date: '',
    deadline: '',
    status: 'active',
    hidden: false,
    squad_tag: 'none',
    nft_prize: '',
    nft_prize_image: '',
    nft_prize_description: ''
  });

  // Reset form when editing changes
  const resetForm = () => {
    setFormData({
      title: '',
      short_desc: '',
      reward: '',
      reward_type: 'XP',
      start_date: '',
      deadline: '',
      status: 'active',
      hidden: false,
      squad_tag: 'none',
      nft_prize: '',
      nft_prize_image: '',
      nft_prize_description: ''
    });
    setError(null);
  };

  // Handle edit button click
  const handleEditClick = (bounty: Bounty) => {
    setEditingBounty(bounty);
    setFormData({
      ...bounty,
      start_date: bounty.start_date ? bounty.start_date.split('T')[0] : '',
      deadline: bounty.deadline ? bounty.deadline.split('T')[0] : '',
      squad_tag: bounty.squad_tag || 'none'
    });
    setShowForm(true);
  };

  // Handle create button click
  const handleCreateClick = () => {
    setEditingBounty(null);
    resetForm();
    setShowForm(true);
  };

  // Handle cancel
  const handleCancel = () => {
    setShowForm(false);
    setEditingBounty(null);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAddress) {
      setError('Wallet not connected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Clean up form data - only send valid fields
      const bountyData: any = {
        title: formData.title,
        short_desc: formData.short_desc,
        reward: formData.reward,
        reward_type: formData.reward_type,
        squad_tag: formData.squad_tag === 'none' || !formData.squad_tag ? null : formData.squad_tag,
        start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
        status: formData.status,
        hidden: formData.hidden,
        walletAddress
      };

      // Add NFT fields only if reward type is NFT
      if (formData.reward_type === 'NFT') {
        bountyData.nft_prize = formData.nft_prize || null;
        bountyData.nft_prize_image = formData.nft_prize_image || null;
        bountyData.nft_prize_description = formData.nft_prize_description || null;
      }

      const url = editingBounty ? `/api/bounties/${editingBounty.id}` : '/api/bounties';
      const method = editingBounty ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'X-Wallet-Address': walletAddress
        },
        body: JSON.stringify(bountyData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Bounty save error:', errorData);
        const errorMessage = errorData.details 
          ? `${errorData.error}: ${JSON.stringify(errorData.details)}`
          : errorData.error || 'Failed to save bounty';
        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      const savedBounty = responseData.bounty || responseData;
      
      if (editingBounty) {
        // Update existing bounty
        onBountiesChange(bounties.map(b => b.id === editingBounty.id ? savedBounty : b));
      } else {
        // Add new bounty
        onBountiesChange([savedBounty, ...bounties]);
      }

      // Reset form and close
      handleCancel();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (bountyId: string) => {
    setBountyToDelete(bountyId);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!bountyToDelete) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/bounties/${bountyToDelete}?walletAddress=${walletAddress}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete bounty');
      }

      onBountiesChange(bounties.filter(b => b.id !== bountyToDelete));
      toast({
        title: 'Bounty Deleted',
        description: 'The bounty has been deleted successfully',
      });
      setShowDeleteDialog(false);
      setBountyToDelete(null);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete bounty',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleHidden = async (bounty: Bounty) => {
    setLoading(true);
    try {
      console.log('🔄 [BOUNTY TOGGLE] Toggling bounty visibility:', bounty.id, 'from', bounty.hidden, 'to', !bounty.hidden);
      console.log('🔑 [BOUNTY TOGGLE] Using wallet address:', walletAddress);
      
      const response = await fetch(`/api/bounties/${bounty.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'X-Wallet-Address': walletAddress  // ← Send wallet address for admin check
        },
        body: JSON.stringify({ 
          hidden: !bounty.hidden  // ← Only send the field we want to update
        })
      });
      
      console.log('📊 [BOUNTY TOGGLE] Response status:', response.status);

      if (!response.ok) {
        throw new Error('Failed to update bounty');
      }

      const responseData = await response.json();
      const updatedBounty = responseData.bounty || responseData;
      onBountiesChange(bounties.map(b => b.id === bounty.id ? updatedBounty : b));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update bounty');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No date set';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'completed': return 'bg-blue-500';
      case 'expired': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Bounty Management</h2>
          <p className="text-slate-400">Create and manage bounties for your community</p>
        </div>
        <Button 
          onClick={handleCreateClick}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Bounty
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="bg-red-900/20 border-red-500">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-400">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bounty Form */}
      {showForm && (
        <Card className="bg-slate-800">
          <CardHeader>
            <CardTitle className="text-green-400">
              {editingBounty ? 'Edit Bounty' : 'Create New Bounty'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div className="md:col-span-2">
                  <Label htmlFor="title">Bounty Title *</Label>
                  <Input
                    id="title"
                    value={formData.title || ''}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter bounty title"
                    required
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <Label htmlFor="short_desc">Description *</Label>
                  <Textarea
                    id="short_desc"
                    value={formData.short_desc || ''}
                    onChange={(e) => setFormData({ ...formData, short_desc: e.target.value })}
                    placeholder="Describe what needs to be done"
                    required
                    className="bg-slate-700 border-slate-600 text-white"
                    rows={3}
                  />
                </div>

                {/* Reward Type and Amount */}
                <div>
                  <Label htmlFor="reward_type">Reward Type *</Label>
                  <Select
                    value={formData.reward_type || 'XP'}
                    onValueChange={(value: 'XP' | 'SOL' | 'NFT') => setFormData({ ...formData, reward_type: value })}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="XP">XP Points</SelectItem>
                      <SelectItem value="SOL">SOL Tokens</SelectItem>
                      <SelectItem value="NFT">NFT Prize</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.reward_type === 'NFT' ? (
                  <>
                    <div>
                      <Label htmlFor="nft_prize">NFT Prize Name *</Label>
                      <Input
                        id="nft_prize"
                        value={formData.nft_prize || ''}
                        onChange={(e) => setFormData({ ...formData, nft_prize: e.target.value })}
                        placeholder="e.g., Hoodie Academy Genesis NFT"
                        required
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="nft_prize_image">NFT Image URL</Label>
                      <Input
                        id="nft_prize_image"
                        value={formData.nft_prize_image || ''}
                        onChange={(e) => setFormData({ ...formData, nft_prize_image: e.target.value })}
                        placeholder="https://example.com/nft-image.png"
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="nft_prize_description">NFT Description</Label>
                      <Textarea
                        id="nft_prize_description"
                        value={formData.nft_prize_description || ''}
                        onChange={(e) => setFormData({ ...formData, nft_prize_description: e.target.value })}
                        placeholder="Describe the NFT prize..."
                        className="bg-slate-700 border-slate-600 text-white"
                        rows={3}
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <Label htmlFor="reward">Reward Amount *</Label>
                    <Input
                      id="reward"
                      type="number"
                      value={formData.reward || ''}
                      onChange={(e) => setFormData({ ...formData, reward: e.target.value })}
                      placeholder="Enter reward amount"
                      required
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                )}

                {/* Start Date */}
                <div>
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date || ''}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                {/* End Date */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="deadline">End Date</Label>
                    {formData.deadline && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setFormData({ ...formData, deadline: '' })}
                        className="text-xs text-slate-400 hover:text-slate-200 h-6 px-2"
                      >
                        No Deadline
                      </Button>
                    )}
                  </div>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline || ''}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                {/* Squad Tag */}
                <div>
                  <Label htmlFor="squad_tag">Squad Tag (Optional)</Label>
                  <Select
                    value={formData.squad_tag || ''}
                    onValueChange={(value) => setFormData({ ...formData, squad_tag: value })}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Select squad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Squad</SelectItem>
                      <SelectItem value="Creators">Creators</SelectItem>
                      <SelectItem value="Speakers">Speakers</SelectItem>
                      <SelectItem value="Raiders">Raiders</SelectItem>
                      <SelectItem value="Decoders">Decoders</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Status */}
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status || 'active'}
                    onValueChange={(value: 'active' | 'completed' | 'expired') => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Hidden Toggle */}
                <div className="md:col-span-2 flex items-center space-x-2">
                  <Switch
                    id="hidden"
                    checked={formData.hidden || false}
                    onCheckedChange={(checked) => setFormData({ ...formData, hidden: checked })}
                  />
                  <Label htmlFor="hidden">Hide this bounty from public view</Label>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  className="border-slate-600 text-slate-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading ? 'Saving...' : editingBounty ? 'Update Bounty' : 'Create Bounty'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Bounties List */}
      <div className="grid gap-4">
        {bounties.length === 0 ? (
          <Card className="bg-slate-800">
            <CardContent className="pt-6 text-center">
              <Target className="w-12 h-12 mx-auto text-slate-500 mb-4" />
              <h3 className="text-lg font-semibold text-slate-300 mb-2">No Bounties Yet</h3>
              <p className="text-slate-500">Create your first bounty to get started!</p>
            </CardContent>
          </Card>
        ) : (
          bounties.map((bounty) => (
            <Card key={bounty.id} className="bg-slate-800">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-white">{bounty.title}</h3>
                      {bounty.hidden && (
                        <Badge variant="secondary" className="bg-yellow-900 text-yellow-300">
                          <EyeOff className="w-3 h-3 mr-1" />
                          Hidden
                        </Badge>
                      )}
                      <Badge className={`${getStatusColor(bounty.status)} text-white`}>
                        {bounty.status}
                      </Badge>
                    </div>
                    
                    <p className="text-slate-300 mb-3">{bounty.short_desc}</p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                      <div className="flex items-center space-x-1">
                        <Award className="w-4 h-4" />
                        <span>
                          {bounty.reward_type === 'NFT' 
                            ? (bounty.nft_prize || 'NFT Prize')
                            : `${bounty.reward} ${bounty.reward_type}`
                          }
                        </span>
                      </div>
                      
                      {bounty.reward_type === 'NFT' && bounty.nft_prize_image && (
                        <div className="flex items-center space-x-1">
                          <img 
                            src={bounty.nft_prize_image} 
                            alt={bounty.nft_prize}
                            className="w-6 h-6 rounded object-cover"
                          />
                        </div>
                      )}
                      
                      {bounty.start_date && (
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>Start: {formatDate(bounty.start_date)}</span>
                        </div>
                      )}
                      
                      {bounty.deadline && (
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>End: {formatDate(bounty.deadline)}</span>
                        </div>
                      )}
                      
                      {bounty.squad_tag && (
                        <Badge variant="outline" className="border-blue-500 text-blue-400">
                          {bounty.squad_tag}
                        </Badge>
                      )}
                      
                      <span>Submissions: {bounty.submissions || 0}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleHidden(bounty)}
                      disabled={loading}
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      {bounty.hidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditClick(bounty)}
                      className="border-blue-500 text-blue-400 hover:bg-blue-500/10"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(bounty.id!)}
                      disabled={loading}
                      className="border-red-500 text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bounty</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this bounty? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
