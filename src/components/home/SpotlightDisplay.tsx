'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

interface Spotlight {
  id: string;
  quote: string;
  author: string;
  author_title?: string;
  author_squad?: string;
  author_image?: string;
}

export default function SpotlightDisplay() {
  const [spotlight, setSpotlight] = useState<Spotlight | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLatestSpotlight();
  }, []);

  const fetchLatestSpotlight = async () => {
    try {
      const response = await fetch('/api/spotlight?latest=true');
      const data = await response.json();
      if (data.success && data.spotlight) {
        setSpotlight(data.spotlight);
      }
    } catch (error) {
      console.error('Error fetching spotlight:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !spotlight) return null;

  return (
    <Card className="border border-blue-500 bg-gradient-to-r from-purple-900/30 to-blue-900/30 shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-purple-500/20 border-2 border-purple-500 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-purple-400" />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg font-semibold text-purple-400">⭐ Academy Spotlight</span>
            </div>
            
            <div className="bg-slate-800/50 p-4 rounded-lg mb-4 border-l-4 border-purple-500">
              <p className="text-lg italic text-purple-200 leading-relaxed">
                "{spotlight.quote}"
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {spotlight.author_image ? (
                <img 
                  src={spotlight.author_image} 
                  alt={spotlight.author}
                  className="w-10 h-10 rounded-full border-2 border-purple-500/50 object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-purple-500/20 border-2 border-purple-500/50 flex items-center justify-center">
                  <span className="text-purple-400 font-semibold text-sm">
                    {spotlight.author.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <p className="font-semibold text-white">— {spotlight.author}</p>
                {spotlight.author_title && (
                  <p className="text-sm text-purple-300">{spotlight.author_title}</p>
                )}
                {spotlight.author_squad && (
                  <p className="text-xs text-purple-400">{spotlight.author_squad}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
