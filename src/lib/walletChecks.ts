export function inBrowser(): boolean {
  return typeof window !== "undefined";
}

export function hasSolflare(): boolean {
  if (!inBrowser()) return false;
  const w = window as any;
  return Boolean(w.solflare || w.solana?.isSolflare);
}

export function getSolflareProvider(): any | null {
  if (!inBrowser()) return null;
  const w = window as any;
  return w.solflare ?? (w.solana?.isSolflare ? w.solana : null) ?? null;
}

export function getSolana(): any | null {
  if (!inBrowser()) return null;
  return (window as any)?.solana ?? null;
}

export function isAnyWalletConnected(): boolean {
  const sol = getSolana();
  return Boolean(sol?.isConnected ?? sol?.publicKey);
}
