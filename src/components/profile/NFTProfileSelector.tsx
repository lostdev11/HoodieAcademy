'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Image, 
  Search, 
  RefreshCw, 
  CheckCircle, 
  ExternalLink,
  User,
  Sparkles
} from 'lucide-react';
import { nftService, NFT } from '@/services/nft-service';
import { motion, AnimatePresence } from 'framer-motion';

interface NFTProfileSelectorProps {
  walletAddress: string;
  currentProfileImage?: string;
  onProfileImageChange: (imageUrl: string, nftData?: NFT) => void;
  className?: string;
}

export function NFTProfileSelector({ 
  walletAddress, 
  currentProfileImage, 
  onProfileImageChange,
  className = ''
}: NFTProfileSelectorProps) {
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && walletAddress) {
      loadNFTs();
    }
  }, [isOpen, walletAddress]);

  const loadNFTs = async () => {
    if (!walletAddress) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('NFTProfileSelector: Starting to load NFTs for wallet:', walletAddress);
      
      // Test environment variables
      nftService.testEnvironment();
      
      const userNFTs = await nftService.getUserNFTs(walletAddress);
      console.log('NFTProfileSelector: Received NFTs:', userNFTs.length);
      console.log('NFTProfileSelector: NFT details:', userNFTs);
      
      setNfts(userNFTs);
    } catch (err) {
      console.error('Error loading NFTs:', err);
      setError('Failed to load NFTs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredNFTs = nfts.filter(nft => 
    nft.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    nft.collection?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    nft.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleNFTSelect = (nft: NFT) => {
    setSelectedNFT(nft);
    const imageUrl = nft.image || nftService.getFallbackImage(nft);
    onProfileImageChange(imageUrl, nft);
    setIsOpen(false);
  };

  const handleRemoveNFT = () => {
    setSelectedNFT(null);
    onProfileImageChange(''); // Reset to default emoji
  };

  const getCurrentProfileImage = () => {
    if (currentProfileImage && currentProfileImage !== '🧑‍🎓') {
      return currentProfileImage;
    }
    return selectedNFT?.image || nftService.getFallbackImage(selectedNFT!);
  };

  const isNFTSelected = selectedNFT || (currentProfileImage && currentProfileImage !== '🧑‍🎓');

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Current Profile Picture Display */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative group">
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-cyan-500/30 shadow-lg">
            {isNFTSelected ? (
              <img 
                src={getCurrentProfileImage()} 
                alt="Profile NFT"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = nftService.getFallbackImage(selectedNFT!);
                }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-cyan-400 to-pink-400 flex items-center justify-center text-4xl">
                🧑‍🎓
              </div>
            )}
          </div>
          
          {/* NFT Badge */}
          {isNFTSelected && (
            <div className="absolute -top-2 -right-2">
              <Badge className="bg-purple-600 text-white text-xs px-2 py-1">
                <Sparkles className="w-3 h-3 mr-1" />
                NFT
              </Badge>
            </div>
          )}
        </div>

        {/* NFT Info */}
        {selectedNFT && (
          <div className="text-center">
            <h4 className="font-semibold text-cyan-400 text-sm">{selectedNFT.name}</h4>
            {selectedNFT.collection && (
              <p className="text-gray-400 text-xs">{selectedNFT.collection}</p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button 
                size="sm" 
                variant="outline"
                className="border-cyan-500/30 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
              >
                <Image className="w-4 h-4 mr-2" />
                {isNFTSelected ? 'Change NFT' : 'Set NFT Profile'}
              </Button>
            </DialogTrigger>
          </Dialog>

          {isNFTSelected && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleRemoveNFT}
              className="border-red-500/30 text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              <User className="w-4 h-4 mr-2" />
              Remove
            </Button>
          )}
        </div>
      </div>

      {/* NFT Selection Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-cyan-400 flex items-center gap-2">
              <Image className="w-5 h-5" />
              Select NFT as Profile Picture
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Choose an NFT from your wallet to use as your profile picture. You can search by name, collection, or symbol.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search and Refresh */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search NFTs by name, collection, or symbol..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-700/50 border-cyan-500/30 text-white"
                />
              </div>
              <Button
                onClick={loadNFTs}
                disabled={loading}
                variant="outline"
                className="border-cyan-500/30 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                {error}
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-cyan-400 mr-2" />
                <span className="text-gray-300">Loading your NFTs...</span>
              </div>
            )}

            {/* NFT Grid */}
            {!loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                <AnimatePresence>
                  {filteredNFTs.map((nft, index) => (
                    <motion.div
                      key={nft.mint}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card 
                        className="cursor-pointer hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 border-cyan-500/30 bg-slate-800/60 hover:bg-slate-700/60"
                        onClick={() => handleNFTSelect(nft)}
                      >
                        <CardContent className="p-4">
                          <div className="aspect-square rounded-lg overflow-hidden mb-3 border border-slate-600/30">
                            <img 
                              src={nft.image || nftService.getFallbackImage(nft)} 
                              alt={nft.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = nftService.getFallbackImage(nft);
                              }}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <h4 className="font-semibold text-white text-sm truncate" title={nft.name}>
                              {nft.name}
                            </h4>
                            
                            {nft.collection && (
                              <p className="text-gray-400 text-xs truncate" title={nft.collection}>
                                {nft.collection}
                              </p>
                            )}
                            
                            {nft.attributes && nft.attributes.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {nft.attributes.slice(0, 2).map((attr, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs bg-slate-700/50 border-cyan-500/30 text-cyan-300">
                                    {attr.trait_type}: {attr.value}
                                  </Badge>
                                ))}
                                {nft.attributes.length > 2 && (
                                  <Badge variant="outline" className="text-xs bg-slate-700/50 border-gray-500/30 text-gray-300">
                                    +{nft.attributes.length - 2} more
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Empty State */}
            {!loading && filteredNFTs.length === 0 && (
              <div className="text-center py-8">
                <Image className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-400">
                  {searchTerm ? 'No NFTs found matching your search.' : 'No NFTs found in your wallet.'}
                </p>
                {!searchTerm && (
                  <p className="text-gray-500 text-sm mt-1">
                    Make sure you have NFTs in your connected wallet.
                  </p>
                )}
              </div>
            )}

            {/* View on Explorer Link */}
            {walletAddress && (
              null // Removed Solscan link button
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 