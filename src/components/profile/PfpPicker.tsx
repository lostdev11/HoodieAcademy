'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

// Constants - same approach as TokenGate
const HELIUS_API_KEY = process.env.NEXT_PUBLIC_HELIUS_API_KEY;
const WIFHOODIE_COLLECTION_ID = 'H3mnaqNFFNwqRfEiWFsRTgprCvG4tYFfmNezGEVnaMuQ';

// Local type declarations to avoid global conflicts
interface SolanaWallet {
  isPhantom?: boolean;
  isConnected: boolean;
  publicKey: {
    toString(): string;
  } | null;
  on(event: string, callback: () => void): void;
  removeListener(event: string, callback: () => void): void;
}

declare global {
  interface Window {
    solana?: SolanaWallet;
  }
}

type Props = {
  currentPfp?: string | null;
  userId: string; // if you pass this down or authenticate server-side
};

export default function PfpPicker({ currentPfp, userId }: Props) {
  const [owner, setOwner] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [nfts, setNfts] = useState<any[]>([]); // Changed to any[] as DasAsset is removed
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Get wallet address from existing wallet connection
  useEffect(() => {
    const getWalletAddress = () => {
      if (window.solana?.isPhantom && window.solana.isConnected) {
        const address = window.solana.publicKey?.toString();
        if (address) {
          setOwner(address);
          console.log('PfpPicker: Wallet connected:', address);
        }
      }
    };

    // Check immediately
    getWalletAddress();

    // Listen for wallet connection changes
    const handleConnect = () => {
      getWalletAddress();
    };

    const handleDisconnect = () => {
      setOwner(null);
      setNfts([]);
    };

    if (window.solana) {
      window.solana.on('connect', handleConnect);
      window.solana.on('disconnect', handleDisconnect);
    }

    return () => {
      if (window.solana) {
        window.solana.removeListener('connect', handleConnect);
        window.solana.removeListener('disconnect', handleDisconnect);
      }
    };
  }, []);

  useEffect(() => {
    if (!owner || !open) return;
    (async () => {
      setLoading(true);
      try {
        console.log('PfpPicker: Loading NFTs for wallet:', owner);
        
        // Check if Helius API key is defined
        if (!HELIUS_API_KEY) {
          throw new Error('Helius API key is missing. Please check your environment configuration.');
        }
        
        console.log('PfpPicker: Using Helius API key:', HELIUS_API_KEY ? 'YES' : 'NO');
        
        const url = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
        console.log('PfpPicker: Making API request to Helius...');
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 'pfp-picker',
            method: 'getAssetsByOwner',
            params: { ownerAddress: owner, page: 1, limit: 200 },
          }),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('PfpPicker: Helius API response:', data);
        
        const items = data.result?.items || [];
        console.log('PfpPicker: Total NFTs found:', items.length);
        
        // Filter for WifHoodie NFTs using the same logic as TokenGate
        const filtered = items.filter((nft: any) => {
          // Check if NFT belongs to WifHoodie collection
          const collectionGroup = nft.grouping?.find((g: any) => g.group_key === 'collection');
          const isWifHoodieCollection = collectionGroup?.group_value === WIFHOODIE_COLLECTION_ID;
          
          // Check if NFT has WifHoodie symbol
          const isWifHoodieSymbol = nft.content?.metadata?.symbol?.toUpperCase() === 'WIFHOODIES';
          
          const isWifHoodie = isWifHoodieCollection || isWifHoodieSymbol;
          console.log('PfpPicker: NFT', nft.id, 'is WifHoodie:', isWifHoodie);
          
          return isWifHoodie && nft.content?.links?.image;
        });
        
        console.log('PfpPicker: WifHoodie NFTs after filtering:', filtered.length);
        console.log('PfpPicker: Filtered NFTs:', filtered);
        
        setNfts(filtered);
      } catch (e: any) {
        console.error('PfpPicker: Error loading NFTs:', e);
        toast({
          title: "Error",
          description: e.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [owner, open, toast]);

  async function choose(asset: any) {
    if (!owner) {
      toast({
        title: "Error",
        description: "Connect wallet first",
        variant: "destructive",
      });
      return;
    }
    
    const imageUrl = asset.content?.links?.image;
    if (!imageUrl) {
      toast({
        title: "Error",
        description: "No image URL found for this NFT",
        variant: "destructive",
      });
      return;
    }

    console.log('PfpPicker: Choosing asset:', asset);
    console.log('PfpPicker: Image URL:', imageUrl);
    console.log('PfpPicker: User ID:', userId);

    // Validate all required data is present
    if (!owner || !asset?.id || !imageUrl) {
      console.error('PfpPicker: Missing required data:', { owner, assetId: asset?.id, imageUrl });
      toast({
        title: "Error",
        description: "Missing required data for profile picture update",
        variant: "destructive",
      });
      return;
    }

    // Log the exact data being sent
    const requestData = {
      owner,
      assetId: asset.id,
      imageUrl
    };
    console.log('PfpPicker: Sending request data:', requestData);

    try {
      const res = await fetch('/api/profile/pfp', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify(requestData)
      });

      console.log('PfpPicker: API response status:', res.status);
      console.log('PfpPicker: API response headers:', Object.fromEntries(res.headers.entries()));

      if (!res.ok) {
        const errorText = await res.text();
        console.error('PfpPicker: API error response:', errorText);
        throw new Error(`API error: ${res.status} - ${errorText}`);
      }

      const j = await res.json();
      console.log('PfpPicker: API success response:', j);
      
      toast({
        title: "Success",
        description: "Profile picture updated!",
      });
      setOpen(false);
      
      // Optionally refresh the page or update the UI to show the new profile picture
      window.location.reload();
      
    } catch (error: any) {
      console.error('PfpPicker: Error updating profile picture:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to set PFP',
        variant: "destructive",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">Set wifhoodie PFP</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Select your wifhoodie</DialogTitle>
          <p className="text-sm text-gray-500 mt-2">
            Choose a WifHoodie NFT from your wallet to set as your profile picture. Only NFTs from the verified WifHoodie collection will be displayed.
          </p>
        </DialogHeader>

        {(!owner) && <div className="py-6 text-sm opacity-70">Connect your wallet to see your NFTs.</div>}

        {loading && <div className="py-6">Loading your NFTs…</div>}

        {!loading && owner && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {nfts.map((n) => {
              console.log('PfpPicker: Rendering NFT:', n.id, 'Image URL:', n.content?.links?.image);
              return (
                <Card key={n.id} className="cursor-pointer hover:opacity-90" onClick={() => choose(n)}>
                  <CardContent className="p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={n.content?.links?.image}
                      alt={n.content?.metadata?.name || 'NFT'}
                      className="w-full h-40 object-cover rounded-xl"
                      loading="lazy"
                      onError={(e) => console.error('PfpPicker: Image failed to load:', n.id, e)}
                      onLoad={() => console.log('PfpPicker: Image loaded successfully:', n.id)}
                    />
                    <div className="mt-2 text-xs truncate">{n.content?.metadata?.name || n.id}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {!loading && owner && nfts.length === 0 && (
          <div className="py-6 text-sm opacity-70">
            No wifhoodie NFTs found in this wallet.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
