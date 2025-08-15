'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from '@/hooks/use-toast';
import type { SolanaWallet } from '@/types/wallet';

// Constants - same approach as TokenGate
const HELIUS_API_KEY = process.env.NEXT_PUBLIC_HELIUS_API_KEY;
const WIFHOODIE_COLLECTION_ID = 'H3mnaqNFFNwqRfEiWFsRTgprCvG4tYFfmNezGEVnaMuQ';

// Types
type Props = {
  selectedPfpUrl?: string;
  onChange: (url: string | null) => void;
  userId: string;
};

const isHttpUrl = (v?: string) => !!v && /^(https?:)?\/\//i.test(v);

// --- NEW: Normalize NFT images to HTTP(S) ---
function normalizeNftImageUrl(raw?: string | null): string | null {
  if (!raw) return null;

  // ipfs://<cid>/<path?>
  if (raw.startsWith('ipfs://')) {
    const path = raw.replace('ipfs://', '');
    // choose one gateway and stick with it (also add to next.config images.remotePatterns)
    return `https://ipfs.io/ipfs/${path}`;
  }

  // arweave/http(s)
  if (/^https?:\/\//i.test(raw)) return raw;

  // some mints embed dweb.link, cf-ipfs, nftstorage.link, etc. If they ever
  // show up without protocol, you can add special handling here.
  return null;
}

export default function PfpPicker({ selectedPfpUrl, onChange, userId }: Props) {
  const [owner, setOwner] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [nfts, setNfts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const showImage = isHttpUrl(selectedPfpUrl);

  // Get wallet address from existing wallet connection
  useEffect(() => {
    const getWalletAddress = () => {
      const sol = typeof window !== 'undefined' ? window.solana : undefined;
      
      if (sol?.isPhantom && sol.isConnected) {
        const address = sol.publicKey?.toString();
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

    const sol = typeof window !== 'undefined' ? window.solana : undefined;

    if (sol?.on) {
      sol.on('connect', handleConnect);
      sol.on('disconnect', handleDisconnect);
    }

    return () => {
      if (sol?.removeListener) {
        sol.removeListener('connect', handleConnect);
        sol.removeListener('disconnect', handleDisconnect);
      }
    };
  }, []);

  useEffect(() => {
    if (!owner || !open) return;
    (async () => {
      setLoading(true);
      try {
        console.log('PfpPicker: Loading NFTs for wallet:', owner);

        if (!HELIUS_API_KEY) {
          throw new Error('Helius API key is missing. Please check your environment configuration.');
        }

        const url = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
        console.log('PfpPicker: Making API request to Helius...');

        const response = await fetch(url, {
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
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const data = await response.json();
        console.log('PfpPicker: Helius API response:', data);

        const items: any[] = data.result?.items || [];
        console.log('PfpPicker: Total NFTs found:', items.length);

        // Filter to WifHoodie and attach a normalized image URL
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

            const normalizedImage = normalizeNftImageUrl(rawImg);
            console.log('PfpPicker: NFT', nft.id, 'is WifHoodie:', isWifHoodie, 'raw:', rawImg, 'normalized:', normalizedImage);

            return { ...nft, _normalizedImage: normalizedImage, _isWifHoodie: isWifHoodie };
          })
          .filter((n) => n._isWifHoodie && isHttpUrl(n._normalizedImage));

        console.log('PfpPicker: WifHoodie NFTs after filtering:', filtered.length);
        setNfts(filtered);
      } catch (e) {
        console.error('PfpPicker: Error loading NFTs:', e);
        const errorMessage = e instanceof Error ? e.message : 'Unknown error loading NFTs';
        toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    })();
  }, [owner, open, toast]);

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

    console.log('PfpPicker: Choosing asset:', asset?.id);
    console.log('PfpPicker: Using normalized Image URL:', imageUrl);
    console.log('PfpPicker: User ID:', userId);

    const requestData = { owner, assetId: asset.id, imageUrl };

    try {
      const res = await fetch('/api/profile/pfp', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify(requestData),
      });

      console.log('PfpPicker: API response status:', res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.error('PfpPicker: API error response:', errorText);
        throw new Error(`API error: ${res.status} - ${errorText}`);
      }

      const j = await res.json();
      console.log('PfpPicker: API success response:', j);

      // Update the local selected value
      onChange(imageUrl!);

      toast({ title: 'Success', description: 'Profile picture updated!' });
      setOpen(false);
    } catch (error) {
      console.error('PfpPicker: Error updating profile picture:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to set PFP';
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
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
          <Button variant="secondary">Set wifhoodie PFP</Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Select your wifhoodie</DialogTitle>
            <p className="text-sm text-gray-500 mt-2">
              Choose a WifHoodie NFT from your wallet to set as your profile picture. Only NFTs from the verified WifHoodie collection will be displayed.
            </p>
          </DialogHeader>

          {!owner && <div className="py-6 text-sm opacity-70">Connect your wallet to see your NFTs.</div>}
          {loading && <div className="py-6">Loading your NFTs…</div>}

          {!loading && owner && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {nfts.map((n) => {
                const img = n._normalizedImage as string | null;
                return (
                  <Card key={n.id} className="cursor-pointer hover:opacity-90" onClick={() => choose(n)}>
                    <CardContent className="p-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img ?? undefined}
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
            <div className="py-6 text-sm opacity-70">No wifhoodie NFTs found in this wallet.</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
