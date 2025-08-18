// src/types/wallets.d.ts
export {};

declare global {
  interface Window {
    solflare?: any;
    solana?: {
      isPhantom?: boolean;
      isSolflare?: boolean;
      // add more wallet flags/methods as needed
      [key: string]: any;
    } | any;
    phantom?: any;
    keystone?: any;
  }
}
