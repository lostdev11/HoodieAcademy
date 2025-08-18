import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Award, Clock, Users } from 'lucide-react';
import Link from 'next/link';

interface BountyProps {
  id: string;
  title: string;
  shortDesc: string;
  reward: string;
  deadline?: string;
  linkTo: string;
  image?: string;
  squadTag?: string;
  status: 'active' | 'completed' | 'expired';
  submissions: number;
}

export const BountyPanel = ({
  title,
  shortDesc,
  reward,
  deadline,
  linkTo,
  image,
  squadTag,
  status,
  submissions
}: BountyProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'completed': return 'bg-blue-500';
      case 'expired': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

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
    <Card className="border border-indigo-500/30 bg-gray-800/50 hover:shadow-indigo-500/30 transition-all duration-300 hover:scale-105">
      <CardContent className="p-6">
        {image && (
          <div className="mb-4">
            <img 
              src={image} 
              alt={title} 
              className="rounded-md w-full object-cover h-40 bg-gray-700"
            />
          </div>
        )}
        
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl text-white font-bold">{title}</h3>
          <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`}></div>
        </div>
        
        <p className="text-indigo-300 text-sm mb-4 leading-relaxed">{shortDesc}</p>
        
        {squadTag && (
          <Badge className={`${getSquadColor(squadTag)} text-xs mb-3`}>
            {squadTag}
          </Badge>
        )}
        
        <div className="space-y-2 text-sm text-white mb-4">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-yellow-400" />
            <strong>Reward:</strong> <span className="text-yellow-400">{reward}</span>
          </div>
          {deadline && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-red-400" />
              <strong>Deadline:</strong> <span className="text-red-400">{new Date(deadline).toLocaleDateString()}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" />
            <strong>Submissions:</strong> <span className="text-blue-400">{submissions}</span>
          </div>
        </div>
        
        <Link href={linkTo}>
          <Button variant="outline" className="w-full border-indigo-500/30 text-indigo-300 hover:text-white hover:bg-indigo-500/20">
            View Details →
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}; 