// Ensure this file is included by tsconfig "include"
export {};

declare global {
  interface Window {
    solflare?: {
      isSolflare?: boolean;
      isConnected?: boolean;
      publicKey?: { toString(): string } | null;
      connect(): Promise<{ publicKey: { toString(): string } }>;
      disconnect(): Promise<void>;
      signTransaction(transaction: any): Promise<any>;
      signAllTransactions(transactions: any[]): Promise<any[]>;
      [k: string]: any;
    };
    solana?: {
      isPhantom?: boolean;
      isSolflare?: boolean;
      isConnected?: boolean;
      publicKey?: { toString(): string } | null;
      connect(): Promise<{ publicKey: { toString(): string } }>;
      disconnect(): Promise<void>;
      signTransaction(transaction: any): Promise<any>;
      signAllTransactions(transactions: any[]): Promise<any[]>;
      // Allow unknown fields from various wallet providers
      [k: string]: any;
    };
    phantom?: {
      solana?: {
        isPhantom?: boolean;
        isConnected?: boolean;
        publicKey?: { toString(): string } | null;
        connect(): Promise<{ publicKey: { toString(): string } }>;
        disconnect(): Promise<void>;
        signTransaction(transaction: any): Promise<any>;
        signAllTransactions(transactions: any[]): Promise<any[]>;
        [k: string]: any;
      };
    };
  }
}
