import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Flame } from 'lucide-react';

interface TopContributorCardProps {
  username: string;
  description: string;
  badge?: 'star' | 'fire';
}

export function TopContributorCard({ username, description, badge }: TopContributorCardProps) {
  return (
    <Card className="bg-slate-900/70 border border-purple-500/20 hover:border-purple-400/50 transition-colors duration-200">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">@{username}</span>
            {badge === 'star' && (
              <Badge variant="outline" className="border-yellow-500/40 text-yellow-400 bg-yellow-500/10">
                <Star className="w-3 h-3 mr-1" />
              </Badge>
            )}
            {badge === 'fire' && (
              <Badge variant="outline" className="border-orange-500/40 text-orange-400 bg-orange-500/10">
                <Flame className="w-3 h-3 mr-1" />
              </Badge>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed italic">"{description}"</p>
      </CardContent>
    </Card>
  );
}

