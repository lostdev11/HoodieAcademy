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
  { courseId: 'meme-coin-mania', squadId: 'decoders' },
  { courseId: 'community-strategy', squadId: 'speakers' },
  { courseId: 'sns', squadId: 'speakers' },
  { courseId: 'technical-analysis', squadId: 'raiders' }
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