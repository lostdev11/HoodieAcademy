import { Badge } from '@/components/ui/badge';
import { Award, Clock } from 'lucide-react';
import Link from 'next/link';

interface MiniBountyPanelProps {
  id: string;
  title: string;
  reward: string;
  linkTo: string;
  deadline?: string;
  squadTag?: string;
}

export const MiniBountyPanel = ({ 
  title, 
  reward, 
  linkTo, 
  deadline,
  squadTag 
}: MiniBountyPanelProps) => {
  const getSquadColor = (squad: string) => {
    switch (squad) {
      case 'Creators': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Decoders': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'Speakers': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'Raiders': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    }
  };

  return (
    <div className="bg-gray-900 border-l-4 border-indigo-500 p-3 mb-3 rounded hover:bg-gray-800 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-white font-semibold text-sm leading-tight">{title}</h4>
        {squadTag && (
          <Badge className={`${getSquadColor(squadTag)} text-xs`}>
            {squadTag}
          </Badge>
        )}
      </div>
      
      <div className="space-y-1 text-xs">
        <div className="flex items-center gap-1 text-indigo-300">
          <Award className="w-3 h-3" />
          <span>Reward: {reward}</span>
        </div>
        {deadline && (
          <div className="flex items-center gap-1 text-red-300">
            <Clock className="w-3 h-3" />
            <span>Due: {new Date(deadline).toLocaleDateString()}</span>
          </div>
        )}
      </div>
      
      <Link href={linkTo}>
        <span className="text-indigo-400 text-xs mt-2 inline-block hover:text-indigo-300 transition-colors">
          Submit →
        </span>
      </Link>
    </div>
  );
}; 