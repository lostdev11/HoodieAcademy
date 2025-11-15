import { Card, CardContent } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface FoundingClassCardProps {
  name: string;
  xHandle: string;
  bio?: string;
  pfp?: string;
}

export function FoundingClassCard({ name, xHandle, bio, pfp }: FoundingClassCardProps) {
  const xUrl = xHandle.startsWith('@') 
    ? `https://x.com/${xHandle.slice(1)}` 
    : xHandle.startsWith('http') 
    ? xHandle 
    : `https://x.com/${xHandle}`;

  return (
    <Card className="bg-slate-900/70 border border-cyan-500/20 hover:border-cyan-400/50 transition-colors duration-200">
      <CardContent className="p-4 space-y-3">
        {pfp && (
          <div className="flex justify-center">
            <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-cyan-500/30">
              <Image
                src={pfp}
                alt={name}
                width={64}
                height={64}
                className="object-cover w-full h-full"
              />
            </div>
          </div>
        )}
        <div className="text-center space-y-1">
          <Link
            href={xUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 text-cyan-400 hover:text-cyan-300 transition-colors group"
          >
            <span className="font-semibold">{xHandle}</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
          {bio && (
            <p className="text-xs text-gray-300 leading-relaxed">{bio}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

