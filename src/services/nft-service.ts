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
    
    try {
      console.log('Using server-side NFT verification API...');
      
      // Use our server-side API route to avoid CORS issues
      const response = await fetch('/api/nft-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ walletAddress }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('NFT Verification API error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('NFT Verification API returned data:', data);
      
      // Convert the API response to our NFT format
      const nfts = data.nfts || [];
      console.log('NFTs found:', nfts.length);
      
      const formattedNFTs = nfts.map((nft: any) => this.formatNFTFromAPI(nft));
      console.log('Formatted NFTs:', formattedNFTs.length);
      
      return formattedNFTs;
    } catch (error) {
      console.error('Error fetching NFTs from server API:', error);
      console.log('Using mock NFTs as fallback...');
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

  private formatNFTFromAPI(nft: any): NFT {
    return {
      mint: nft.mint,
      name: nft.name,
      symbol: nft.symbol,
      description: nft.description,
      image: nft.image,
      collection: nft.collection,
      attributes: nft.attributes,
      tokenStandard: nft.tokenStandard,
      amount: nft.amount,
      decimals: nft.decimals,
      isFrozen: nft.isFrozen,
      tokenAccount: nft.tokenAccount,
      metadataAccount: nft.metadataAccount,
      updateAuthority: nft.updateAuthority,
      creators: nft.creators
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
      // Use our server-side API route to avoid CORS issues
      const response = await fetch('/api/nft-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          walletAddress: mintAddress, // We'll need to modify the API to handle metadata requests
          requestType: 'metadata'
        }),
      });
      
      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      // For now, return basic metadata since the API doesn't handle metadata requests yet
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
    console.log('Using server-side API route for all NFT operations');
    console.log('NEXT_PUBLIC_RPC_URL:', process.env.NEXT_PUBLIC_RPC_URL);
    console.log('=====================================');
  }
}

export const nftService = new NFTService(); 