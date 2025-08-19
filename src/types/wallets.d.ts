// Ensure this file is included by tsconfig "include"
export {};

declare global {
  interface Window {
    solflare?: any;
    solana?: {
      isPhantom?: boolean;
      isSolflare?: boolean;
      isConnected?: boolean;
      publicKey?: { toString(): string } | null;
      // Allow unknown fields from various wallet providers
      [k: string]: any;
    };
  }
}
