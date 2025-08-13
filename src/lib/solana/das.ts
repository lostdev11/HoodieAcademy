// Define the proper Helius API response type
export type DasAsset = {
  id: string; // assetId (compressed) or mint id (non-compressed)
  content?: {
    links?: { image?: string };
    metadata?: { symbol?: string, name?: string };
  };
  grouping?: { group_key: string; group_value: string }[];
  interface?: string; // "V1_NFT" | "V2_NFT" | "CompressedNFT" etc.
};

// Use the Helius RPC URL for DAS methods
const HELIUS_RPC = process.env.NEXT_PUBLIC_HELIUS_RPC_URL!;

async function rpc(method: string, params: any) {
  try {
    console.log('DAS: Making RPC call to:', HELIUS_RPC);
    console.log('DAS: Method:', method);
    console.log('DAS: Params:', params);
    
    const r = await fetch(HELIUS_RPC, {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({ jsonrpc: '2.0', id: 'hoodie', method, params })
    });
    
    console.log('DAS: Response status:', r.status);
    console.log('DAS: Response headers:', Object.fromEntries(r.headers.entries()));
    
    if (!r.ok) {
      const errorText = await r.text();
      console.error('DAS: HTTP error response:', errorText);
      throw new Error(`HTTP error! status: ${r.status}, message: ${errorText}`);
    }
    
    const responseText = await r.text();
    console.log('DAS: Raw response:', responseText.substring(0, 200) + '...');
    
    let j;
    try {
      j = JSON.parse(responseText);
    } catch (parseError) {
      console.error('DAS: JSON parse error:', parseError);
      console.error('DAS: Response that failed to parse:', responseText);
      throw new Error(`Invalid JSON response from Helius: ${responseText.substring(0, 100)}...`);
    }
    
    if (j.error) {
      console.error('DAS: RPC error:', j.error);
      throw new Error(j.error.message || 'RPC error');
    }
    
    console.log('DAS: RPC result:', j.result);
    return j.result;
  } catch (error) {
    console.error('DAS: RPC call failed:', error);
    throw error;
  }
}

export async function getAssetsByOwner(owner: string, limit = 200): Promise<DasAsset[]> {
  try {
    console.log('DAS: Getting assets for owner:', owner);
    const result = await rpc('getAssetsByOwner', {
      ownerAddress: owner,
      page: 1,
      limit
    });
    console.log('DAS: Assets result:', result);
    return result?.items ?? [];
  } catch (error) {
    console.error('DAS: getAssetsByOwner failed:', error);
    throw error;
  }
}

export async function getAsset(assetIdOrMint: string): Promise<DasAsset | null> {
  try {
    console.log('DAS: Getting asset:', assetIdOrMint);
    const result = await rpc('getAsset', { id: assetIdOrMint });
    console.log('DAS: Asset result:', result);
    return result ?? null;
  } catch (error) {
    console.error('DAS: getAsset failed:', error);
    throw error;
  }
}

export function isWifHoodie(a: DasAsset): boolean {
  const collectionAddr = process.env.NEXT_PUBLIC_WIFHOODIE_COLLECTION_ADDRESS;
  const symbol = process.env.NEXT_PUBLIC_WIFHOODIE_SYMBOL || 'wifHoodies';

  // Debug logging
  console.log('DAS: Checking if NFT is WifHoodie:', a.id);
  console.log('DAS: Collection address from env:', collectionAddr);
  console.log('DAS: Symbol from env:', symbol);
  console.log('DAS: NFT grouping:', a.grouping);
  console.log('DAS: NFT symbol:', a.content?.metadata?.symbol);

  // Check verified collection grouping
  const hasCollection = collectionAddr
    ? (a.grouping || []).some(g => g.group_key === 'collection' && g.group_value === collectionAddr)
    : false;

  const hasSymbol = symbol
    ? a.content?.metadata?.symbol?.toUpperCase() === symbol.toUpperCase()
    : false;

  console.log('DAS: Has collection match:', hasCollection);
  console.log('DAS: Has symbol match:', hasSymbol);

  // If you only want wifhoodie, use (hasCollection || hasSymbol)
  // If you want *any* NFT but highlight wifhoodie, return true for all and tag in UI.
  const result = collectionAddr || symbol ? (hasCollection || hasSymbol) : true;
  console.log('DAS: Final result - is WifHoodie:', result);
  
  return result;
}
