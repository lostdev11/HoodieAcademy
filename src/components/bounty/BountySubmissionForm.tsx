'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Image as ImageIcon, Wallet, AlertCircle, Star, Trophy, Gift } from 'lucide-react';
import { useWalletSupabase } from '@/hooks/use-wallet-supabase';
import { bountyXPService } from '@/services/bounty-xp-service';
import Link from 'next/link';

interface BountySubmissionFormProps {
  onSubmit: (data: BountySubmissionData) => void;
  className?: string;
}

export interface BountySubmissionData {
  title: string;
  squad: string;
  description: string;
  courseRef: string;
  bountyId?: string;
  file: File | null;
  author?: string;
  walletAddress?: string;
}

export const BountySubmissionForm = ({ onSubmit, className = '' }: BountySubmissionFormProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    squad: '',
    description: '',
    courseRef: ''
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
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
    
    onSubmit({ 
      ...formData, 
      file: selectedFile,
      walletAddress: wallet 
    });
    
    // Reset form
    setFormData({ title: '', squad: '', description: '', courseRef: '' });
    setSelectedFile(null);
  };

  return (
    <div className={`bg-gray-900 p-8 rounded-xl ${className}`}>
      <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
        <Upload className="w-5 h-5 text-purple-400" />
        Submit Your Entry
      </h2>

      {/* Wallet Connection Section */}
      <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wallet className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="text-white font-medium">Wallet Connection</h3>
              <p className="text-sm text-gray-400">
                {wallet ? `Connected: ${wallet.slice(0, 6)}...${wallet.slice(-4)}` : 'Connect your wallet to submit'}
              </p>
            </div>
          </div>
          {wallet ? (
            <Button
              onClick={disconnectWallet}
              variant="outline"
              size="sm"
              className="text-red-400 border-red-400 hover:bg-red-400/10"
            >
              Disconnect
            </Button>
          ) : (
            <Button
              onClick={handleWalletConnect}
              disabled={walletLoading}
              className="bg-purple-600 hover:bg-purple-700 text-white"
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
            className="mt-1 bg-gray-800 border-gray-600 text-white"
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
            className="mt-1 bg-gray-800 border-gray-600 text-white"
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
            className="mt-1 bg-gray-800 border-gray-600 text-white min-h-[100px]"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />
        </div>

        <div>
          <Label htmlFor="file" className="text-white">Upload Artwork</Label>
          <div className="mt-1">
            <Input
              id="file"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="bg-gray-800 border-gray-600 text-white file:bg-purple-600 file:border-0 file:text-white file:px-4 file:py-2 file:rounded file:cursor-pointer"
              required
            />
          </div>
          {selectedFile && (
            <div className="mt-2 flex items-center gap-2 text-sm text-gray-300">
              <ImageIcon className="w-4 h-4" />
              <span>{selectedFile.name}</span>
              <span className="text-gray-500">({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
            </div>
          )}
        </div>

        <Button 
          type="submit" 
          disabled={!wallet}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {wallet ? '🚀 Submit Bounty Entry' : '🔒 Connect Wallet to Submit'}
        </Button>
      </form>
    </div>
  );
}; 