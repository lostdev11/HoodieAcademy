import { Connection, PublicKey } from '@solana/web3.js';

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

export interface NFTMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
}

export interface NFT {
  mint: string;
  name: string;
  symbol: string;
  description?: string;
  image: string;
  collection?: string;
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
  tokenStandard: string;
  amount: number;
  decimals: number;
  isFrozen: boolean;
  tokenAccount: string;
  metadataAccount: string;
  updateAuthority: string;
  creators?: Array<{
    address: string;
    verified: boolean;
    share: number;
  }>;
}

export class NFTService {
  private connection: Connection;
  private heliusApiKey: string;
  private heliusRpcUrl: string;
  private wifHoodieCollectionAddress: string;
  private wifHoodieSymbol: string;

  constructor() {
    this.heliusApiKey = process.env.NEXT_PUBLIC_HELIUS_API_KEY || '';
    this.heliusRpcUrl = process.env.NEXT_PUBLIC_HELIUS_RPC_URL || 'https://mainnet.helius-rpc.com/?api-key=' + this.heliusApiKey;
    this.wifHoodieCollectionAddress = process.env.NEXT_PUBLIC_WIFHOODIE_COLLECTION_ADDRESS || '';
    this.wifHoodieSymbol = process.env.NEXT_PUBLIC_WIFHOODIE_SYMBOL || 'wifHoodies';
    this.connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL || 'https://api.mainnet-beta.solana.com');
    
    // Debug logging
    console.log('NFTService initialized');
    console.log('Helius API key present:', !!this.heliusApiKey);
    console.log('Helius RPC URL:', this.heliusRpcUrl);
    console.log('WifHoodie Collection Address:', this.wifHoodieCollectionAddress);
    console.log('WifHoodie Symbol:', this.wifHoodieSymbol);
  }

  async getUserNFTs(walletAddress: string): Promise<NFT[]> {
    console.log('Fetching NFTs for wallet:', walletAddress);
    
    try {
      console.log('Using direct Helius API...');
      
      // Check if we have the API key
      if (!this.heliusApiKey) {
        console.log('No Helius API key, using mock NFTs');
        return this.getMockNFTs();
      }
      
      // Add timeout to prevent infinite loading
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      console.log('Making direct API request to Helius...');
      
      // Use Helius API directly
      const response = await fetch(this.heliusRpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'nft-verification',
          method: 'getAssetsByOwner',
          params: { ownerAddress: walletAddress, page: 1, limit: 1000 },
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      console.log('API response received:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Helius API error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('Helius API returned data:', data);
      
      // Debug: Log the structure of the first NFT if available
      if (data.result?.items && data.result.items.length > 0) {
        console.log('First NFT structure:', JSON.stringify(data.result.items[0], null, 2));
      }
      
      // Convert the API response to our NFT format
      const nfts = data.result?.items || [];
      console.log('NFTs found:', nfts.length);
      
      const formattedNFTs = nfts.map((nft: DasAsset) => {
        const formatted = this.formatNFT(nft);
        console.log('Formatted NFT:', formatted);
        return formatted;
      });
      console.log('Formatted NFTs:', formattedNFTs.length);
      
      return formattedNFTs;
    } catch (error: any) {
      console.error('Error fetching NFTs from Helius API:', error);
      console.error('Error details:', {
        name: error?.name || 'Unknown',
        message: error?.message || 'Unknown error',
        stack: error?.stack || 'No stack trace'
      });
      
      // Check if it's a timeout error
      if (error?.name === 'AbortError') {
        console.log('Request timed out, using mock NFTs as fallback...');
      } else {
        console.log('API failed, using mock NFTs as fallback...');
      }
      
      return this.getMockNFTs();
    }
  }

  private formatNFT(nft: DasAsset): NFT {
    // Extract metadata from DasAsset structure
    const name = nft.content?.metadata?.name || 'Unknown NFT';
    const symbol = nft.content?.metadata?.symbol || 'NFT';
    const image = nft.content?.links?.image || '';
    
    // Extract collection from grouping
    const collectionGroup = nft.grouping?.find(group => group.group_key === 'collection');
    const collection = collectionGroup?.group_value || '';
    
    // For now, we'll use empty values for fields not available in DasAsset
    const description = '';
    const attributes: Array<{ trait_type: string; value: string }> = [];

    return {
      mint: nft.id,
      name,
      symbol,
      description,
      image,
      collection,
      attributes,
      tokenStandard: nft.interface || 'NonFungible',
      amount: 1,
      decimals: 0,
      isFrozen: false,
      tokenAccount: '',
      metadataAccount: '',
      updateAuthority: '',
      creators: []
    };
  }

  private getMockNFTs(): NFT[] {
    return [
      {
        mint: 'mock1',
        name: 'WifHoodie #1337',
        symbol: 'WH',
        description: 'A legendary WifHoodie NFT from the exclusive collection',
        image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=400&fit=crop&crop=center',
        collection: 'WifHoodie Collection',
        tokenStandard: 'NonFungible',
        amount: 1,
        decimals: 0,
        isFrozen: false,
        tokenAccount: 'mock',
        metadataAccount: 'mock',
        updateAuthority: 'mock',
        attributes: [
          { trait_type: 'Type', value: 'Hoodie' },
          { trait_type: 'Rarity', value: 'Legendary' },
          { trait_type: 'Edition', value: '1337' }
        ]
      },
      {
        mint: 'mock2',
        name: 'WifHoodie #420',
        symbol: 'WH',
        description: 'A rare WifHoodie NFT with unique traits',
        image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop&crop=center',
        collection: 'WifHoodie Collection',
        tokenStandard: 'NonFungible',
        amount: 1,
        decimals: 0,
        isFrozen: false,
        tokenAccount: 'mock',
        metadataAccount: 'mock',
        updateAuthority: 'mock',
        attributes: [
          { trait_type: 'Type', value: 'Hoodie' },
          { trait_type: 'Rarity', value: 'Rare' },
          { trait_type: 'Edition', value: '420' }
        ]
      },
      {
        mint: 'mock3',
        name: 'WifHoodie #69',
        symbol: 'WH',
        description: 'A classic WifHoodie NFT from the early collection',
        image: 'https://images.unsplash.com/photo-1521577352947-9bb58764b69a?w=400&h=400&fit=crop&crop=center',
        collection: 'WifHoodie Collection',
        tokenStandard: 'NonFungible',
        amount: 1,
        decimals: 0,
        isFrozen: false,
        tokenAccount: 'mock',
        metadataAccount: 'mock',
        updateAuthority: 'mock',
        attributes: [
          { trait_type: 'Type', value: 'Hoodie' },
          { trait_type: 'Rarity', value: 'Common' },
          { trait_type: 'Edition', value: '69' }
        ]
      }
    ];
  }

  async getNFTMetadata(mintAddress: string): Promise<NFTMetadata | null> {
    try {
      // For now, return basic metadata since we don't have a direct metadata endpoint
      console.log('Getting metadata for mint:', mintAddress);
      
      return {
        name: 'Unknown NFT',
        symbol: 'NFT',
        description: '',
        image: '',
        attributes: [],
      };
    } catch (error) {
      console.error('Error fetching NFT metadata:', error);
      return null;
    }
  }

  // Validate if an image URL is accessible
  async validateImageUrl(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // Get a fallback image if the NFT image is not accessible
  getFallbackImage(nft: NFT): string {
    if (typeof nft.collection === 'string' && nft.collection.toLowerCase().includes('hoodie')) {
      return 'https://via.placeholder.com/400x400/6366f1/ffffff?text=Hoodie+NFT';
    }
    return 'https://via.placeholder.com/400x400/6b7280/ffffff?text=NFT';
  }

  // Test function to debug environment variables
  testEnvironment(): void {
    console.log('=== NFT Service Environment Test ===');
    console.log('Using direct Helius API for NFT operations');
    console.log('Helius API Key present:', !!this.heliusApiKey);
    console.log('=====================================');
  }

  // Helper method to check if an NFT is a WifHoodie NFT
  isWifHoodieNFT(nft: NFT): boolean {
    // Convert NFT back to DasAsset-like structure for detection
    const dasAsset: DasAsset = {
      id: nft.mint,
      content: {
        metadata: {
          symbol: nft.symbol,
          name: nft.name
        }
      },
      grouping: nft.collection ? [{ group_key: 'collection', group_value: nft.collection }] : []
    };
    
    return this.isWifHoodie(dasAsset);
  }

  // Improved WifHoodie detection using environment variables
  isWifHoodie(a: DasAsset): boolean {
    const collectionAddr = this.wifHoodieCollectionAddress;
    const symbol = this.wifHoodieSymbol;

    // Check verified collection grouping
    const hasCollection = collectionAddr
      ? (a.grouping || []).some(g => g.group_key === 'collection' && g.group_value === collectionAddr)
      : false;

    const hasSymbol = symbol
      ? a.content?.metadata?.symbol?.toUpperCase() === symbol.toUpperCase()
      : false;

    // If you only want wifhoodie, use (hasCollection || hasSymbol)
    // If you want *any* NFT but highlight wifhoodie, return true for all and tag in UI.
    return collectionAddr || symbol ? (hasCollection || hasSymbol) : true;
  }

  // Get only WifHoodie NFTs
  getWifHoodieNFTs(nfts: NFT[]): NFT[] {
    return nfts.filter(nft => this.isWifHoodieNFT(nft));
  }

  // Get non-WifHoodie NFTs
  getOtherNFTs(nfts: NFT[]): NFT[] {
    return nfts.filter(nft => !this.isWifHoodieNFT(nft));
  }
}

export const nftService = new NFTService(); 