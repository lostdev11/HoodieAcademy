// Use canonical wallet types from src/types/solana.d.ts
export type SolanaWallet = NonNullable<typeof window.solana>;

export const getWallet = (): SolanaWallet | null => {
  if (typeof window === 'undefined') return null;
  const p = (window as any).solana as any;
  return p && p.isPhantom ? (p as unknown as SolanaWallet) : null;
};

export const isWalletConnected = (wallet?: SolanaWallet | null): boolean =>
  Boolean(wallet?.publicKey);

export const ensureConnected = async (wallet: SolanaWallet) => {
  if (!wallet.publicKey) {
    if (wallet.connect) {
      await wallet.connect();
    } else if (wallet.request) {
      await wallet.request({ method: 'connect' });
    }
  }
  return wallet.publicKey;
};
