export type OfficialSquadName = 'Creators' | 'Decoders' | 'Speakers' | 'Raiders' | 'Rangers';
export type SquadName = OfficialSquadName | 'Unassigned';

const BADGE_ASSET_VERSION = '2025-07-02';

const SQUAD_BADGE_IMAGES: Record<SquadName, string> = {
  Creators: '/badges/badge_creators.png',
  Decoders: '/badges/badge_decoders.png',
  Speakers: '/badges/badge_speakers.png',
  Raiders: '/badges/badge_raiders.png',
  Rangers: '/badges/badge_ranger.png',
  Unassigned: ''
};

const SQUAD_KEYWORDS: Array<{ keyword: string; canonical: OfficialSquadName }> = [
  { keyword: 'creator', canonical: 'Creators' },
  { keyword: 'decoder', canonical: 'Decoders' },
  { keyword: 'speaker', canonical: 'Speakers' },
  { keyword: 'raider', canonical: 'Raiders' },
  { keyword: 'ranger', canonical: 'Rangers' }
];

const EMOJI_REGEX = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;

const SQUAD_EMOJIS: Record<SquadName, string> = {
  Creators: '🎨',
  Decoders: '🧠',
  Speakers: '🎤',
  Raiders: '⚔️',
  Rangers: '🦅',
  Unassigned: '🎓'
};

function sanitizeSquadString(value: string) {
  return value
    .replace(EMOJI_REGEX, ' ')
    .replace(/[^a-zA-Z\s]/g, ' ')
    .replace(/\b(hoodie|academy|team|squads?|crew|clan)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function normalizeSquadName(value?: string | null): SquadName | null {
  if (value === null || value === undefined) {
    return null;
  }

  const sanitized = sanitizeSquadString(value);

  if (!sanitized) {
    return 'Unassigned';
  }

  if (sanitized.includes('unassign') || sanitized === 'academy') {
    return 'Unassigned';
  }

  for (const { keyword, canonical } of SQUAD_KEYWORDS) {
    if (sanitized.includes(keyword)) {
      return canonical;
    }
  }

  return null;
}

export function squadsMatch(target: SquadName, candidate?: string | null) {
  if (target === 'Unassigned') {
    const canonicalCandidate = normalizeSquadName(candidate);
    return (
      canonicalCandidate === 'Unassigned' ||
      candidate === null ||
      candidate === undefined ||
      candidate.trim() === ''
    );
  }

  return normalizeSquadName(candidate) === target;
}

export function getSquadEmoji(name?: string | null) {
  const canonical = normalizeSquadName(name);
  if (canonical && canonical in SQUAD_EMOJIS) {
    return SQUAD_EMOJIS[canonical as SquadName];
  }

  return SQUAD_EMOJIS.Unassigned;
}

export const OFFICIAL_SQUADS: OfficialSquadName[] = ['Creators', 'Decoders', 'Speakers', 'Raiders', 'Rangers'];

export function getSquadBadgeImage(name?: string | null) {
  const canonical = normalizeSquadName(name);
  if (!canonical) {
    return null;
  }

  const badge = SQUAD_BADGE_IMAGES[canonical];
  if (!badge) {
    return null;
  }

  return `${badge}?v=${BADGE_ASSET_VERSION}`;
}

function buildClausesForLabel(label: string) {
  const clauses = [`squad.ilike.*${label}*`];
  const singular = label.endsWith('s') ? label.slice(0, -1) : label;

  if (singular && singular !== label) {
    clauses.push(`squad.ilike.*${singular}*`);
  }

  return clauses;
}

export function buildSquadFilterClauses(squad: string | SquadName) {
  const canonical = normalizeSquadName(squad);

  if (canonical === 'Unassigned') {
    return ['squad.is.null', 'squad.eq.Unassigned'];
  }

  if (canonical) {
    return buildClausesForLabel(canonical);
  }

  const cleaned = typeof squad === 'string' ? squad.trim() : '';
  if (!cleaned) {
    return ['squad.is.null'];
  }

  return buildClausesForLabel(cleaned);
}

