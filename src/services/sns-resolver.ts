/**
 * SNS Resolver Service
 * 
 * NOTE: Currently using MockSNSResolver due to API endpoint issues.
 * The real SNS API (api.sns.guide) is not resolving, so we've temporarily
 * switched to the mock resolver to ensure the application continues to work.
 * 
 * TODO: Re-enable RealSNSResolver when the API endpoint is stable.
 */

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
    'lostdev.sol': 'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU',
    'academy.sol': 'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU',
    'student.sol': 'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU',
    'teacher.sol': 'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU',
    'hoodieacademy.sol': 'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU'
  };

  private reverseLookup: Record<string, string> = {};

  constructor() {
    // Build reverse lookup
    Object.entries(this.mockDomains).forEach(([domain, address]) => {
      this.reverseLookup[address] = domain;
    });
    
    // Add specific wallet addresses that users might have
    this.reverseLookup['JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU'] = 'hoodie.sol';
    
    console.log('🔧 MockSNSResolver initialized with domains:', Object.keys(this.mockDomains));
    console.log('🔧 MockSNSResolver reverse lookup entries:', Object.keys(this.reverseLookup).length);
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
      const result = this.reverseLookup[walletAddress] || null;
      if (result) {
        console.log(`🔍 Mock SNS: Found domain ${result} for wallet ${walletAddress}`);
      } else {
        console.log(`🔍 Mock SNS: No domain found for wallet ${walletAddress}`);
      }
      return result;
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

  // Debug method to help with troubleshooting
  debugInfo(): { domains: string[]; reverseLookupCount: number; sampleAddresses: string[] } {
    return {
      domains: Object.keys(this.mockDomains),
      reverseLookupCount: Object.keys(this.reverseLookup).length,
      sampleAddresses: Object.keys(this.reverseLookup).slice(0, 3)
    };
  }
}

// Real SNS resolver implementation using SNS API
export class RealSNSResolver implements SNSResolver {
  private snsApiUrl = 'https://sns.guide'; // Updated to use working endpoint
  private timeoutMs = 5000; // Reduced timeout for better UX
  private fallbackApiUrl = 'https://api.sns.guide'; // Keep as fallback

  private async fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);
    
    try {
      // Add mobile-friendly headers
      const mobileHeaders = {
        'User-Agent': 'Mozilla/5.0 (compatible; HoodieAcademy/1.0)',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
        ...options.headers
      };

      const response = await fetch(url, {
        ...options,
        headers: mobileHeaders,
        signal: controller.signal,
        mode: 'cors'
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('SNS API request timed out');
      }
      throw error;
    }
  }

  private async tryFallbackApi(url: string, options: RequestInit = {}): Promise<Response> {
    try {
      // Try fallback API if main API fails
      const fallbackUrl = url.replace(this.snsApiUrl, this.fallbackApiUrl);
      return await this.fetchWithTimeout(fallbackUrl, options);
    } catch (error) {
      console.error('Fallback API also failed:', error);
      throw error;
    }
  }

  async resolve(connection: Connection, domain: string): Promise<PublicKey | null> {
    try {
      // Use SNS API to resolve domain to wallet address
      const response = await this.fetchWithTimeout(`${this.snsApiUrl}/resolve/${domain}`);
      if (response.ok) {
        const data = await response.json();
        return new PublicKey(data.owner);
      }
      
      // Try fallback API
      try {
        const fallbackResponse = await this.tryFallbackApi(`${this.snsApiUrl}/resolve/${domain}`);
        if (fallbackResponse.ok) {
          const data = await fallbackResponse.json();
          return new PublicKey(data.owner);
        }
      } catch (fallbackError) {
        console.warn('Fallback API failed, continuing with error handling');
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
      const response = await this.fetchWithTimeout(`${this.snsApiUrl}/reverse/${walletAddress}`);
      if (response.ok) {
        const data = await response.json();
        return data.domain || null;
      }
      
      // Try fallback API
      try {
        const fallbackResponse = await this.tryFallbackApi(`${this.snsApiUrl}/reverse/${walletAddress}`);
        if (fallbackResponse.ok) {
          const data = await fallbackResponse.json();
          return data.domain || null;
        }
      } catch (fallbackError) {
        console.warn('Fallback API failed, continuing with error handling');
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
      // Fallback to formatted wallet address
      return { domain: null, displayName: formatWalletAddress(walletAddress) };
    }
  }
}

// Factory function to get the appropriate resolver
export function getSNSResolver(): SNSResolver {
  // Check if we're in a browser environment and if the user agent suggests mobile
  const isMobile = typeof window !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // For now, use mock resolver to avoid API failures
  // This ensures the app works even when SNS API is down
  console.log('🔧 SNS Resolver: Using MockSNSResolver (API temporarily disabled)');
  return new MockSNSResolver();
  
  // TODO: Re-enable real SNS resolver when API is stable
  // To re-enable:
  // 1. Change the line above to: return new RealSNSResolver();
  // 2. Test that the API endpoints are working
  // 3. Remove or comment out the console.log line above
  // 
  // const useRealSNS = process.env.NODE_ENV === 'production' || process.env.USE_REAL_SNS === 'true';
  // return useRealSNS ? new RealSNSResolver() : new MockSNSResolver();
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
