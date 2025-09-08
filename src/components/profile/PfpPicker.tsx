'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

const HELIUS_API_KEY = process.env.NEXT_PUBLIC_HELIUS_API_KEY;
const WIFHOODIE_COLLECTION_ID = 'H3mnaqNFFNwqRfEiWFsRTgprCvG4tYFfmNezGEVnaMuQ';

type Props = {
  selectedPfpUrl?: string;
  onChange: (url: string | null) => void;
  userId: string;
};

const isHttpUrl = (v?: string) => !!v && /^(https?:)?\/\//i.test(v);

function normalizeNftImageUrl(raw?: string | null): string | null {
  if (!raw) return null;
  if (raw.startsWith('ipfs://')) return `https://ipfs.io/ipfs/${raw.slice('ipfs://'.length)}`;
  if (/^https?:\/\//i.test(raw)) return raw;
  return null;
}

export default function PfpPicker({ selectedPfpUrl, onChange, userId }: Props) {
  const { toast } = useToast();
  const [owner, setOwner] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  const [open, setOpen] = useState(false);
  const [nfts, setNfts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const showImage = isHttpUrl(selectedPfpUrl);

  // Wallet state management - more flexible connection check
  useEffect(() => {
    const checkWalletConnection = () => {
      const savedWalletAddress = localStorage.getItem('walletAddress') || localStorage.getItem('hoodie_academy_wallet');
      const sessionData = sessionStorage.getItem('wifhoodie_verification');
      
      console.log('PfpPicker: Checking wallet connection', { savedWalletAddress, sessionData });
      
      if (savedWalletAddress) {
        // If we have a wallet address, check if we also have session data
        if (sessionData) {
          try {
            const session = JSON.parse(sessionData);
            const now = Date.now();
            const sessionAge = now - session.timestamp;
            const sessionValid = sessionAge < 24 * 60 * 60 * 1000; // 24 hours
            
            if (sessionValid && session.walletAddress === savedWalletAddress && session.isHolder) {
              setOwner(savedWalletAddress);
              setConnected(true);
              console.log('PfpPicker: Connected with session data');
            } else {
              // Fallback: just use wallet address without session verification
              setOwner(savedWalletAddress);
              setConnected(true);
              console.log('PfpPicker: Connected with wallet address only');
            }
          } catch (error) {
            console.error("❌ Debug: Error parsing session data:", error);
            // Fallback: just use wallet address
            setOwner(savedWalletAddress);
            setConnected(true);
            console.log('PfpPicker: Connected with wallet address (session error)');
          }
        } else {
          // No session data, but we have wallet address - allow connection
          setOwner(savedWalletAddress);
          setConnected(true);
          console.log('PfpPicker: Connected with wallet address (no session)');
        }
      } else {
        setOwner(null);
        setConnected(false);
        console.log('PfpPicker: No wallet address found');
      }
    };

    // Check wallet connection on mount
    checkWalletConnection();

    // Listen for storage changes (when wallet connects/disconnects)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'walletAddress' || e.key === 'wifhoodie_verification') {
        checkWalletConnection();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically for changes
    const interval = setInterval(checkWalletConnection, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Fetch NFTs when dialog opens and wallet is connected
  useEffect(() => {
    if (!open || !owner) return;

    (async () => {
      setLoading(true);
      try {
        if (!HELIUS_API_KEY) {
          throw new Error('Helius API key is missing. Set NEXT_PUBLIC_HELIUS_API_KEY.');
        }

        const response = await fetch(`https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 'pfp-picker',
            method: 'getAssetsByOwner',
            params: { ownerAddress: owner, page: 1, limit: 200 },
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        const items: any[] = data.result?.items || [];

        const filtered = items
          .map((nft) => {
            const collectionGroup = nft.grouping?.find((g: any) => g.group_key === 'collection');
            const isWifHoodieCollection = collectionGroup?.group_value === WIFHOODIE_COLLECTION_ID;
            const isWifHoodieSymbol = nft.content?.metadata?.symbol?.toUpperCase() === 'WIFHOODIES';
            const isWifHoodie = isWifHoodieCollection || isWifHoodieSymbol;

            const rawImg =
              nft?.content?.links?.image ??
              nft?.content?.metadata?.image ??
              nft?.content?.files?.[0]?.uri ??
              nft?.content?.json?.image ??
              null;

            return {
              ...nft,
              _normalizedImage: normalizeNftImageUrl(rawImg),
              _isWifHoodie: isWifHoodie,
            };
          })
          .filter((n) => n._isWifHoodie && isHttpUrl(n._normalizedImage));

        setNfts(filtered);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error loading NFTs';
        toast({ title: 'Error', description: message, variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    })();
  }, [open, owner, toast]);

  async function choose(asset: any) {
    if (!owner) {
      toast({ title: 'Error', description: 'Connect wallet first', variant: 'destructive' });
      return;
    }

    const imageUrl = normalizeNftImageUrl(
      asset._normalizedImage ?? asset?.content?.links?.image ?? null
    );

    if (!isHttpUrl(imageUrl || '')) {
      toast({ title: 'Error', description: 'No valid image URL found for this NFT', variant: 'destructive' });
      return;
    }

    try {
      const res = await fetch('/api/profile/pfp', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({ owner, assetId: asset.id, imageUrl }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`API error: ${res.status} - ${errorText}`);
      }

      await res.json();
      onChange(imageUrl!);
      toast({ title: 'Success', description: 'Profile picture updated!' });
      setOpen(false);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to set PFP';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Avatar className="h-16 w-16">
        {showImage ? (
          <AvatarImage src={selectedPfpUrl} alt="Profile picture" />
        ) : (
          <AvatarFallback className="text-xl">🧑‍🎓</AvatarFallback>
        )}
      </Avatar>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="secondary"
            onClick={() => {
              if (!connected) {
                // Show a more helpful message instead of redirecting
                alert('Please connect your wallet first to set a profile picture. You can connect your wallet from the dashboard.');
                return;
              }
            }}
          >
            Set wifhoodie PFP
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Select your wifhoodie</DialogTitle>
            <p className="text-sm text-gray-500 mt-2">
              Choose a WifHoodie NFT from your wallet to set as your profile picture. Only NFTs from the verified WifHoodie collection will be displayed.
            </p>
          </DialogHeader>

          {!connected && (
            <div className="py-6 text-center">
              <div className="text-sm opacity-70 mb-4">Connect your wallet to see your NFTs.</div>
              <div className="text-xs text-gray-500">
                Don't have WifHoodie NFTs? You can still use emoji avatars!
              </div>
            </div>
          )}
          {loading && <div className="py-6">Loading your NFTs…</div>}

          {!loading && connected && (
            <>
              {nfts.length > 0 ? (
                <div className="max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pb-2">
                    {nfts.map((n) => {
                      const img = n._normalizedImage as string | null;
                      const name = n.content?.metadata?.name || 'NFT';
                      const isSelected = selectedPfpUrl === img;
                      return (
                        <Card 
                          key={n.id} 
                          className={`cursor-pointer hover:opacity-90 transition-all duration-200 ${
                            isSelected 
                              ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900 shadow-lg' 
                              : 'hover:ring-2 hover:ring-cyan-300 hover:ring-offset-2 hover:ring-offset-slate-900'
                          }`} 
                          onClick={() => choose(n)}
                        >
                          <CardContent className="p-2">
                            <div className="relative w-full h-40 rounded-xl overflow-hidden">
                              {/* Next Image with fill for responsive cover */}
                              {img && (
                                <Image
                                  src={img}
                                  alt={name}
                                  fill
                                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 25vw"
                                  className="object-cover"
                                  onError={(e) => console.error('PfpPicker: Image failed to load:', n.id, e)}
                                />
                              )}
                              {/* Selected indicator */}
                              {isSelected && (
                                <div className="absolute top-2 right-2 bg-cyan-400 text-slate-900 rounded-full w-6 h-6 flex items-center justify-center">
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="mt-2 text-xs truncate text-center">{name}</div>
                            {isSelected && (
                              <div className="text-xs text-cyan-400 text-center mt-1 font-medium">
                                Current PFP
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                  {nfts.length > 8 && (
                    <div className="text-center text-xs text-gray-400 mt-2 pb-2">
                      Scroll to see more NFTs
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-6 text-sm opacity-70">No wifhoodie NFTs found in this wallet.</div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
