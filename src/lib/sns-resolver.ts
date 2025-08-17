/**
 * Minimal SNS resolver stubs to satisfy imports at build time.
 * Replace TODOs with real SNS lookups if/when needed.
 */

export type SnsResolved = {
  domain: string | null;
  owner: string | null;
  display: string; // domain || owner
};

// ---- Utilities

export function normalizeDomain(raw?: string | null): string | null {
  if (!raw) return null;
  const d = raw.trim().toLowerCase();
  return d.endsWith('.sol') ? d : `${d}.sol`;
}

export function isSnsDomain(raw?: string | null): boolean {
  return !!raw && /\.sol$/i.test(raw.trim());
}

export function getDisplayHandle(owner: string, domain?: string | null): string {
  const d = normalizeDomain(domain);
  return d ?? owner;
}

// ---- TODO: plug in real SNS lookups later (e.g., your API route or sns.guide endpoints)

export async function getPrimaryDomain(owner: string): Promise<string | null> {
  // TODO: call your SNS API to reverse-lookup a wallet -> domain
  // For now return null to avoid breaking the UI.
  return null;
}

export async function reverseLookup(owner: string): Promise<string | null> {
  return getPrimaryDomain(owner);
}

export async function getOwnerByDomain(domain: string): Promise<string | null> {
  // TODO: call your SNS API to resolve domain -> owner
  return null;
}

export async function resolveSnsForAddress(owner: string): Promise<SnsResolved> {
  const domain = await getPrimaryDomain(owner);
  return { domain, owner, display: domain ?? owner };
}

// ---- Aliases (cover common import names you might have used)

export const resolveSnsName = reverseLookup;
export const resolveSnsHandle = reverseLookup;
export const resolveSnsDomain = reverseLookup;

// Default export (so both `import x from` and named imports work)
export default {
  normalizeDomain,
  isSnsDomain,
  getDisplayHandle,
  getPrimaryDomain,
  reverseLookup,
  getOwnerByDomain,
  resolveSnsForAddress,
  resolveSnsName,
  resolveSnsHandle,
  resolveSnsDomain,
};
