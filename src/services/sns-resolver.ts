import { Connection, PublicKey } from "@solana/web3.js";

// Mock implementation for now - in production, you'd use the actual SNS SDK
export interface SNSResolver {
  resolve: (connection: Connection, domain: string) => Promise<PublicKey | null>;
  reverseResolve: (connection: Connection, walletAddress: string) => Promise<string | null>;
}

// Mock SNS resolver for development
export class MockSNSResolver implements SNSResolver {
  private mockDomains: Record<string, string> = {
    'hoodie.sol': '7x...abc',
    'scholar.sol': '9y...def', 
    'web3.sol': '5z...ghi',
    'hodler.sol': '3a...jkl',
    'builder.sol': '1b...mno',
    'crypto.sol': '2c...pqr',
    'nft.sol': '4d...stu',
    'dao.sol': '6e...vwx',
    // Remove demo wallet mapping
    // 'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU': 'lostdev.sol'
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
        // Convert mock address to PublicKey (this is simplified)
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
}

// Real SNS resolver implementation (placeholder for production)
export class RealSNSResolver implements SNSResolver {
  async resolve(connection: Connection, domain: string): Promise<PublicKey | null> {
    try {
      // This would use the actual SNS SDK
      // const result = await resolve(connection, domain);
      // return result;
      
      // For now, return null to indicate no real implementation
      return null;
    } catch (error) {
      console.error('Error resolving SNS domain:', error);
      return null;
    }
  }

  async reverseResolve(connection: Connection, walletAddress: string): Promise<string | null> {
    try {
      // This would use the actual SNS SDK for reverse resolution
      // For now, return null
      return null;
    } catch (error) {
      console.error('Error reverse resolving wallet address:', error);
      return null;
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

// Utility function to format wallet address
export function formatWalletAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

// Utility function to validate Solana address
export function isValidSolanaAddress(address: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{44}$/.test(address);
} 