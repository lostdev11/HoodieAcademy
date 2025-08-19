// Use canonical wallet types

export interface PfpAsset {
  id: string;
  imageUrl?: string;
  [key: string]: any;
}

export interface SetPfpOptions {
  owner?: string;
  assetId: string;
  imageUrl: string;
  userId: string;
}

/**
 * Sets a profile picture with automatic wallet connection
 * @param asset - The NFT asset to set as PFP
 * @param address - Current wallet address (optional, will connect if not provided)
 * @param connect - Function to connect wallet (optional, will use if address not provided)
 * @param provider - Phantom provider instance (optional, for safety checks)
 * @param userId - User ID for the API call
 * @returns Promise<string> - The image URL that was set
 */
export async function setPfp(
  asset: PfpAsset,
  options: {
    address?: string | null;
    connect?: () => Promise<string | undefined>;
    provider?: NonNullable<typeof window.solana> | null;
    userId: string;
  }
): Promise<string> {
  const { address, connect, provider, userId } = options;

  // Auto-connect if no address provided
  let currentAddress = address;
  if (!currentAddress && connect) {
    currentAddress = await connect();
  }

  if (!currentAddress) {
    throw new Error('No wallet address available');
  }

  if (!provider) {
    throw new Error('Phantom provider not available');
  }

  // Validate asset has required properties
  if (!asset.id) {
    throw new Error('Asset ID is required');
  }

  // Normalize image URL (similar to your existing logic)
  const imageUrl = normalizeImageUrl(asset.imageUrl);
  if (!imageUrl) {
    throw new Error('No valid image URL found for this asset');
  }

  // Prepare request data
  const requestData = {
    owner: currentAddress,
    assetId: asset.id,
    imageUrl,
  };

  // Make API call to update profile picture
  const res = await fetch('/api/profile/pfp', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-user-id': userId,
    },
    body: JSON.stringify(requestData),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`API error: ${res.status} - ${errorText}`);
  }

  const response = await res.json();
  return imageUrl;
}

/**
 * Normalizes NFT image URLs to HTTP(S) format
 * @param raw - Raw image URL from NFT metadata
 * @returns Normalized HTTP(S) URL or null if invalid
 */
function normalizeImageUrl(raw?: string | null): string | null {
  if (!raw) return null;

  // ipfs://<cid>/<path?>
  if (raw.startsWith('ipfs://')) {
    const path = raw.replace('ipfs://', '');
    return `https://ipfs.io/ipfs/${path}`;
  }

  // arweave/http(s)
  if (/^https?:\/\//i.test(raw)) return raw;

  // Handle other IPFS gateways if needed
  return null;
}

/**
 * Convenience function that can be used with usePhantom hook
 * @param asset - The NFT asset to set as PFP
 * @param phantom - Object from usePhantom hook
 * @param userId - User ID for the API call
 */
export async function setPfpWithPhantom(
  asset: PfpAsset,
  phantom: {
    address: string | null;
    connect: () => Promise<string | undefined>;
    provider: NonNullable<typeof window.solana> | null;
  },
  userId: string
): Promise<string> {
  return setPfp(asset, {
    address: phantom.address,
    connect: phantom.connect,
    provider: phantom.provider,
    userId,
  });
}
