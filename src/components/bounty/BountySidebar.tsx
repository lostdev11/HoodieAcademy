import { MiniBountyPanel } from './MiniBountyPanel';
import { Target, Award } from 'lucide-react';

interface Bounty {
  id: string;
  title: string;
  reward: string;
  linkTo: string;
  deadline?: string;
  squadTag?: string;
}

interface BountySidebarProps {
  bounties: Bounty[];
  className?: string;
}

export const BountySidebar = ({ bounties, className = '' }: BountySidebarProps) => {
  const activeBounties = bounties.filter(bounty => bounty.id).slice(0, 5); // Show top 5

  return (
    <div className={`bg-gray-900 p-4 rounded-lg ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-purple-400" />
        <h3 className="text-lg font-semibold text-white">Active Bounties</h3>
        <div className="ml-auto flex items-center gap-1 text-sm text-gray-400">
          <Award className="w-4 h-4" />
          <span>{activeBounties.length}</span>
        </div>
      </div>
      
      <div className="space-y-3">
        {activeBounties.map((bounty) => (
          <MiniBountyPanel
            key={bounty.id}
            id={bounty.id}
            title={bounty.title}
            reward={bounty.reward}
            linkTo={bounty.linkTo}
            deadline={bounty.deadline}
            squadTag={bounty.squadTag}
          />
        ))}
      </div>
      
      {activeBounties.length === 0 && (
        <div className="text-center py-6 text-gray-400">
          <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No active bounties</p>
        </div>
      )}
      
      <div className="mt-4 pt-4 border-t border-gray-700">
        <a 
          href="/bounties" 
          className="text-indigo-400 text-sm hover:text-indigo-300 transition-colors flex items-center gap-1"
        >
          View All Bounties →
        </a>
      </div>
    </div>
  );
}; 