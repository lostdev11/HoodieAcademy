import { Connection, PublicKey } from '@solana/web3.js';

export interface NFTMetadata {
  name: string;
  symbol: string;
  description?: string;
  image: string;
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
  collection?: {
    name: string;
    family: string;
  };
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

  constructor() {
    this.connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL || 'https://api.mainnet-beta.solana.com');
    this.heliusApiKey = process.env.NEXT_PUBLIC_HELIUS_API_KEY || '';
    
    // Debug logging
    console.log('NFTService initialized');
    console.log('Helius API key present:', !!this.heliusApiKey);
    console.log('RPC URL:', process.env.NEXT_PUBLIC_RPC_URL || 'https://api.mainnet-beta.solana.com');
  }

  async getUserNFTs(walletAddress: string): Promise<NFT[]> {
    console.log('Fetching NFTs for wallet:', walletAddress);
    
    if (!this.heliusApiKey) {
      console.warn('Helius API key not found, using fallback method');
      console.warn('Please set NEXT_PUBLIC_HELIUS_API_KEY in your .env.local file');
      return this.getUserNFTsFallback(walletAddress);
    }

    try {
      console.log('Using Helius API to fetch NFTs...');
      
      // Try the newer Helius API endpoint first
      let response = await fetch(`https://api.helius.xyz/v1/addresses/${walletAddress}/nfts?api-key=${this.heliusApiKey}`);
      
      console.log('Helius API v1 response status:', response.status);
      
      // If v1 fails, try the older v0 endpoint
      if (!response.ok) {
        console.log('Helius API v1 failed, trying v0...');
        response = await fetch(`https://api.helius.xyz/v0/addresses/${walletAddress}/nfts?api-key=${this.heliusApiKey}`);
        console.log('Helius API v0 response status:', response.status);
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Helius API error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('Helius API returned data:', data);
      console.log('Helius API returned NFTs:', Array.isArray(data) ? data.length : 'Not an array');
      
      // Handle different response formats
      let nfts = data;
      if (data && typeof data === 'object' && data.result) {
        nfts = data.result;
      } else if (Array.isArray(data)) {
        nfts = data;
      } else {
        console.warn('Unexpected Helius API response format:', data);
        nfts = [];
      }
      
      const formattedNFTs = nfts.map((nft: any) => this.formatNFT(nft));
      console.log('Formatted NFTs:', formattedNFTs.length);
      
      return formattedNFTs;
    } catch (error) {
      console.error('Error fetching NFTs from Helius:', error);
      console.log('Falling back to alternative method...');
      return this.getUserNFTsFallback(walletAddress);
    }
  }

  private async getUserNFTsFallback(walletAddress: string): Promise<NFT[]> {
    try {
      console.log('Using Solscan fallback API...');
      // Fallback to a simpler API or mock data
      const response = await fetch(`https://public-api.solscan.io/account/tokens?account=${walletAddress}`);
      
      console.log('Solscan API response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Solscan API data:', data);
      
      const nfts = data.data?.filter((token: any) => token.tokenAmount?.decimals === 0) || [];
      console.log('Filtered NFTs from Solscan:', nfts.length);
      
      const formattedNFTs = nfts.map((nft: any) => ({
        mint: nft.mint,
        name: nft.tokenInfo?.name || 'Unknown NFT',
        symbol: nft.tokenInfo?.symbol || 'NFT',
        description: nft.tokenInfo?.description || '',
        image: nft.tokenInfo?.logoURI || '',
        collection: nft.tokenInfo?.name || '',
        tokenStandard: 'NonFungible',
        amount: nft.tokenAmount?.uiAmount || 1,
        decimals: nft.tokenAmount?.decimals || 0,
        isFrozen: false,
        tokenAccount: nft.tokenAccount || '',
        metadataAccount: '',
        updateAuthority: '',
        attributes: []
      }));
      
      console.log('Formatted NFTs from Solscan:', formattedNFTs.length);
      return formattedNFTs;
    } catch (error) {
      console.error('Error fetching NFTs from fallback API:', error);
      console.log('Using mock NFTs as final fallback...');
      return this.getMockNFTs();
    }
  }

  private formatNFT(nft: any): NFT {
    // Handle Helius v1 NFT and ProgrammableNFT formats
    let name = '';
    let symbol = '';
    let image = '';
    let description = '';
    let collection = '';
    let attributes = [];

    // Helius v1 NFT format
    if (nft.interface === 'V1_NFT' || nft.interface === 'ProgrammableNFT') {
      name = nft.content?.metadata?.name || '';
      symbol = nft.content?.metadata?.symbol || '';
      image = nft.content?.links?.image || '';
      description = nft.content?.metadata?.description || '';
      collection = nft.content?.metadata?.collection?.name || '';
      attributes = nft.content?.metadata?.attributes || [];
    } else {
      // Fallback to old format
      name = nft.onChainMetadata?.metadata?.data?.name || nft.offChainMetadata?.name || 'Unknown NFT';
      symbol = nft.onChainMetadata?.metadata?.data?.symbol || nft.offChainMetadata?.symbol || 'NFT';
      image = nft.offChainMetadata?.image || nft.onChainMetadata?.metadata?.data?.uri || '';
      description = nft.offChainMetadata?.description || '';
      collection = nft.onChainMetadata?.metadata?.collection?.name || nft.offChainMetadata?.collection?.name || '';
      attributes = nft.offChainMetadata?.attributes || [];
    }

    return {
      mint: nft.id || nft.mint,
      name,
      symbol,
      description,
      image,
      collection,
      attributes,
      tokenStandard: nft.tokenStandard || 'NonFungible',
      amount: nft.amount || 1,
      decimals: nft.decimals || 0,
      isFrozen: nft.isFrozen || false,
      tokenAccount: nft.tokenAccount || '',
      metadataAccount: nft.metadataAccount || '',
      updateAuthority: nft.updateAuthority || '',
      creators: nft.onChainMetadata?.metadata?.data?.creators || []
    };
  }

  private getMockNFTs(): NFT[] {
    return [
      {
        mint: 'mock1',
        name: 'Hoodie Academy Graduate',
        symbol: 'HAG',
        description: 'A special NFT for Hoodie Academy graduates',
        image: 'https://via.placeholder.com/400x400/6366f1/ffffff?text=Hoodie+Graduate',
        collection: 'Hoodie Academy',
        tokenStandard: 'NonFungible',
        amount: 1,
        decimals: 0,
        isFrozen: false,
        tokenAccount: 'mock',
        metadataAccount: 'mock',
        updateAuthority: 'mock',
        attributes: [
          { trait_type: 'Graduation Year', value: '2024' },
          { trait_type: 'Specialization', value: 'Web3 Development' }
        ]
      },
      {
        mint: 'mock2',
        name: 'Crypto Punk #1234',
        symbol: 'PUNK',
        description: 'A rare Crypto Punk NFT',
        image: 'https://via.placeholder.com/400x400/10b981/ffffff?text=Crypto+Punk',
        collection: 'Crypto Punks',
        tokenStandard: 'NonFungible',
        amount: 1,
        decimals: 0,
        isFrozen: false,
        tokenAccount: 'mock',
        metadataAccount: 'mock',
        updateAuthority: 'mock',
        attributes: [
          { trait_type: 'Type', value: 'Alien' },
          { trait_type: 'Accessory', value: 'Cap' }
        ]
      }
    ];
  }

  async getNFTMetadata(mintAddress: string): Promise<NFTMetadata | null> {
    try {
      const response = await fetch(`https://public-api.solscan.io/token/meta?tokenAddress=${mintAddress}`);
      
      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return {
        name: data.name || 'Unknown NFT',
        symbol: data.symbol || 'NFT',
        description: data.description || '',
        image: data.image || '',
        attributes: data.attributes || [],
        collection: data.collection ? {
          name: data.collection.name,
          family: data.collection.family
        } : undefined
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

  // Test function to debug API key and environment variables
  testEnvironment(): void {
    console.log('=== NFT Service Environment Test ===');
    console.log('NEXT_PUBLIC_HELIUS_API_KEY exists:', !!process.env.NEXT_PUBLIC_HELIUS_API_KEY);
    console.log('NEXT_PUBLIC_HELIUS_API_KEY length:', process.env.NEXT_PUBLIC_HELIUS_API_KEY?.length || 0);
    console.log('NEXT_PUBLIC_RPC_URL:', process.env.NEXT_PUBLIC_RPC_URL);
    console.log('Instance heliusApiKey exists:', !!this.heliusApiKey);
    console.log('Instance heliusApiKey length:', this.heliusApiKey.length);
    console.log('=====================================');
  }

  // Test function to test Helius API directly
  async testHeliusAPI(walletAddress: string): Promise<void> {
    console.log('=== Testing Helius API ===');
    console.log('Wallet address:', walletAddress);
    console.log('API key:', this.heliusApiKey ? `${this.heliusApiKey.substring(0, 8)}...` : 'NOT FOUND');
    
    try {
      const response = await fetch(`https://api.helius.xyz/v1/addresses/${walletAddress}/nfts?api-key=${this.heliusApiKey}`);
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const data = await response.json();
        console.log('Response data:', data);
        console.log('NFTs found:', Array.isArray(data) ? data.length : 'Not an array');
      } else {
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error('Test failed:', error);
    }
    console.log('=== End Test ===');
  }
}

export const nftService = new NFTService(); 