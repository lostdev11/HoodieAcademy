import { Connection, PublicKey } from "@solana/web3.js";
import { formatWalletAddress } from '@/lib/utils';

// Enhanced SNS resolver interface
export interface SNSResolver {
  resolve: (connection: Connection, domain: string) => Promise<PublicKey | null>;
  reverseResolve: (connection: Connection, walletAddress: string) => Promise<string | null>;
  resolveProfile: (connection: Connection, walletAddress: string) => Promise<{ domain: string | null; displayName: string }>;
}

// Enhanced mock SNS resolver for development
export class MockSNSResolver implements SNSResolver {
  private mockDomains: Record<string, string> = {
    'hoodie.sol': 'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU',
    'scholar.sol': '9y...def', 
    'web3.sol': '5z...ghi',
    'hodler.sol': '3a...jkl',
    'builder.sol': '1b...mno',
    'crypto.sol': '2c...pqr',
    'nft.sol': '4d...stu',
    'dao.sol': '6e...vwx',
    'lostdev.sol': 'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU'
  };

  private reverseLookup: Record<string, string> = {};

  constructor() {
    // Build reverse lookup
    Object.entries(this.mockDomains).forEach(([domain, address]) => {
      this.reverseLookup[address] = domain;
    });
  }

  async resolve(connection: Connection, domain: string): Promise<PublicKey | null> {
    try {
      const address = this.mockDomains[domain];
      if (address) {
        return new PublicKey(address);
      }
      return null;
    } catch (error) {
      console.error('Error in mock SNS resolve:', error);
      return null;
    }
  }

  async reverseResolve(connection: Connection, walletAddress: string): Promise<string | null> {
    try {
      return this.reverseLookup[walletAddress] || null;
    } catch (error) {
      console.error('Error in mock SNS reverse resolve:', error);
      return null;
    }
  }

  async resolveProfile(connection: Connection, walletAddress: string): Promise<{ domain: string | null; displayName: string }> {
    try {
      const domain = this.reverseLookup[walletAddress] || null;
      const displayName = domain || formatWalletAddress(walletAddress);
      return { domain, displayName };
    } catch (error) {
      console.error('Error in mock SNS profile resolve:', error);
      return { domain: null, displayName: formatWalletAddress(walletAddress) };
    }
  }
}

// Real SNS resolver implementation using SNS API
export class RealSNSResolver implements SNSResolver {
  private snsApiUrl = 'https://api.sns.guide';

  async resolve(connection: Connection, domain: string): Promise<PublicKey | null> {
    try {
      // Use SNS API to resolve domain to wallet address
      const response = await fetch(`${this.snsApiUrl}/resolve/${domain}`);
      if (response.ok) {
        const data = await response.json();
        return new PublicKey(data.owner);
      }
      return null;
    } catch (error) {
      console.error('Error resolving SNS domain:', error);
      return null;
    }
  }

  async reverseResolve(connection: Connection, walletAddress: string): Promise<string | null> {
    try {
      // Use SNS API to reverse resolve wallet address to domain
      const response = await fetch(`${this.snsApiUrl}/reverse/${walletAddress}`);
      if (response.ok) {
        const data = await response.json();
        return data.domain || null;
      }
      return null;
    } catch (error) {
      console.error('Error reverse resolving wallet address:', error);
      return null;
    }
  }

  async resolveProfile(connection: Connection, walletAddress: string): Promise<{ domain: string | null; displayName: string }> {
    try {
      const domain = await this.reverseResolve(connection, walletAddress);
      const displayName = domain || formatWalletAddress(walletAddress);
      return { domain, displayName };
    } catch (error) {
      console.error('Error in real SNS profile resolve:', error);
      return { domain: null, displayName: formatWalletAddress(walletAddress) };
    }
  }
}

// Factory function to get the appropriate resolver
export function getSNSResolver(): SNSResolver {
  // In production, you'd check environment variables or config
  const useRealSNS = process.env.NODE_ENV === 'production' && process.env.USE_REAL_SNS === 'true';
  
  return useRealSNS ? new RealSNSResolver() : new MockSNSResolver();
}

// Utility function to check if a string is a .sol domain
export function isSolDomain(domain: string): boolean {
  return domain.endsWith('.sol') && domain.length > 4;
}

// Utility function to validate Solana address
export function isValidSolanaAddress(address: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{44}$/.test(address);
}

// Enhanced utility function to get display name with SNS resolution
export async function getDisplayNameWithSNS(walletAddress: string): Promise<string> {
  try {
    const resolver = getSNSResolver();
    const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL || 'https://api.mainnet-beta.solana.com');
    const profile = await resolver.resolveProfile(connection, walletAddress);
    return profile.displayName;
  } catch (error) {
    console.error('Error getting display name with SNS:', error);
    return formatWalletAddress(walletAddress);
  }
}

// Re-export utility for consumers expecting it from this module
export { formatWalletAddress };
