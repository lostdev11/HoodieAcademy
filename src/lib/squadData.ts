export interface SquadTrack {
  id: string;
  name: string;
  color: string;
  borderColor: string;
  bgColor: string;
  description: string;
  icon: string;
}

export interface CourseSquadMapping {
  courseId: string;
  squadId: string;
}

export const squadTracks: SquadTrack[] = [
  {
    id: 'creators',
    name: 'Hoodie Creators',
    color: 'text-yellow-400',
    borderColor: 'border-yellow-500/50',
    bgColor: 'bg-yellow-500/10',
    description: 'Build, create, and innovate in the Web3 ecosystem',
    icon: '🎨'
  },
  {
    id: 'decoders',
    name: 'Hoodie Decoders',
    color: 'text-gray-300',
    borderColor: 'border-gray-500/50',
    bgColor: 'bg-gray-500/10',
    description: 'Analyze, research, and understand market dynamics',
    icon: '🔍'
  },
  {
    id: 'speakers',
    name: 'Hoodie Speakers',
    color: 'text-red-400',
    borderColor: 'border-red-500/50',
    bgColor: 'bg-red-500/10',
    description: 'Communicate, influence, and build communities',
    icon: '🗣️'
  },
  {
    id: 'raiders',
    name: 'Hoodie Raiders',
    color: 'text-blue-400',
    borderColor: 'border-blue-500/50',
    bgColor: 'bg-blue-500/10',
    description: 'Trade, strategize, and navigate market opportunities',
    icon: '⚔️'
  },
  {
    id: 'rangers',
    name: 'Hoodie Rangers',
    color: 'text-purple-400',
    borderColor: 'border-purple-500/50',
    bgColor: 'bg-purple-500/10',
    description: 'Versatile generalists who want a bit of everything',
    icon: '🦅'
  },
  {
    id: 'treasury',
    name: 'Treasury Builders',
    color: 'text-green-400',
    borderColor: 'border-green-500/50',
    bgColor: 'bg-green-500/10',
    description: 'Manage, grow, and optimize digital assets',
    icon: '🏦'
  }
];

export const courseSquadMapping: CourseSquadMapping[] = [
  { courseId: 'wallet-wizardry', squadId: 'creators' },
  { courseId: 'nft-mastery', squadId: 'creators' },
  { courseId: 'v100-pixel-art-basics', squadId: 'creators' },
  { courseId: 'v120-meme-creation', squadId: 'creators' },
  { courseId: 'v150-visual-composition', squadId: 'creators' },
  { courseId: 'v200-custom-trait-creation', squadId: 'creators' },
  { courseId: 'v220-comics-sequential', squadId: 'creators' },
  { courseId: 'l150-personal-lore', squadId: 'creators' },
  { courseId: 'l250-threadweaving', squadId: 'creators' },
  { courseId: 'wc300-trait-masterclass', squadId: 'creators' },
  { courseId: 'meme-coin-mania', squadId: 'decoders' },
  { courseId: 't120-support-resistance', squadId: 'decoders' },
  { courseId: 't150-indicator-basics', squadId: 'decoders' },
  { courseId: 't200-confluence-strategy', squadId: 'decoders' },
  { courseId: 'n200-trait-meta', squadId: 'decoders' },
  { courseId: 'a120-ai-vocab', squadId: 'decoders' },
  { courseId: 'community-strategy', squadId: 'speakers' },
  { courseId: 'sns', squadId: 'speakers' },
  { courseId: 'o200-space-hosting', squadId: 'speakers' },
  { courseId: 'o220-squad-ritual', squadId: 'speakers' },
  { courseId: 'o300-scaling-vibes', squadId: 'speakers' },
  { courseId: 'a150-prompt-engineering', squadId: 'speakers' },
  { courseId: 'v250-micro-animation', squadId: 'speakers' },
  { courseId: 'n300-collector-archetypes', squadId: 'speakers' },
  { courseId: 'hl240-faceless-lore', squadId: 'speakers' },
  { courseId: 'l220-conflict-portal', squadId: 'speakers' },
  { courseId: 'technical-analysis', squadId: 'raiders' },
  { courseId: 'o120-raid-psychology', squadId: 'raiders' },
  { courseId: 'o250-onboarding-wizard', squadId: 'raiders' },
  { courseId: 'c150-scam-detection', squadId: 'raiders' },
  { courseId: 'n150-bid-games', squadId: 'raiders' },
  { courseId: 't250-emotional-traps', squadId: 'raiders' },
  { courseId: 'v120-meme-copywriting', squadId: 'raiders' },
  { courseId: 'l100-lore-identity', squadId: 'raiders' },
  { courseId: 'hl140-randomizer-power', squadId: 'raiders' }
];

export const getSquadForCourse = (courseId: string): SquadTrack | null => {
  const mapping = courseSquadMapping.find(m => m.courseId === courseId);
  if (!mapping) return null;
  return squadTracks.find(s => s.id === mapping.squadId) || null;
};

export const getCoursesForSquad = (squadId: string): string[] => {
  return courseSquadMapping
    .filter(m => m.squadId === squadId)
    .map(m => m.courseId);
}; 