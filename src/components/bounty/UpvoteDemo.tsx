'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';

export const UpvoteDemo = () => {
  const { user, login, logout } = useAuth();
  const [demoUser, setDemoUser] = useState({
    id: 'demo_user_123',
    username: 'DemoCreator',
    squad: 'Creators'
  });

  const handleLogin = () => {
    login(demoUser);
  };

  const handleLogout = () => {
    logout();
  };

  const changeSquad = (squad: string) => {
    const newUser = { ...demoUser, squad };
    setDemoUser(newUser);
    if (user) {
      login(newUser);
    }
  };

  return (
    <Card className="border border-purple-500/30 bg-gray-800/50">
      <CardHeader>
        <h3 className="text-lg font-semibold text-white">🎖️ Upvote System Demo</h3>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-300">
          <p className="mb-2">Test the community upvote system:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Click emoji reactions to upvote submissions</li>
            <li>⭐ Star reactions count as "Squad Favorites"</li>
            <li>See squad breakdown of reactions</li>
            <li>Filter and sort submissions</li>
          </ul>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Current User:</span>
            {user ? (
              <div className="flex items-center gap-2">
                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                  {user.username} ({user.squad})
                </Badge>
                <Button size="sm" variant="outline" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            ) : (
              <Button size="sm" onClick={handleLogin}>
                Login as Demo User
              </Button>
            )}
          </div>

          {user && (
            <div className="space-y-2">
              <span className="text-sm text-gray-400">Change Squad:</span>
              <div className="flex flex-wrap gap-2">
                {['Creators', 'Speakers', 'Raiders', 'Decoders'].map((squad) => (
                  <Button
                    key={squad}
                    size="sm"
                    variant={user.squad === squad ? "default" : "outline"}
                    onClick={() => changeSquad(squad)}
                    className="text-xs"
                  >
                    {squad}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-gray-700">
          <h4 className="text-sm font-medium text-gray-400 mb-2">Emoji Reactions:</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <span>🔥</span>
              <span className="text-gray-400">Fire - General approval</span>
            </div>
            <div className="flex items-center gap-1">
              <span>💎</span>
              <span className="text-gray-400">Diamond - High quality</span>
            </div>
            <div className="flex items-center gap-1">
              <span>🚀</span>
              <span className="text-gray-400">Rocket - Innovative</span>
            </div>
            <div className="flex items-center gap-1">
              <span>⭐</span>
              <span className="text-gray-400">Star - Squad favorite</span>
            </div>
            <div className="flex items-center gap-1">
              <span>❤️</span>
              <span className="text-gray-400">Heart - Love it</span>
            </div>
            <div className="flex items-center gap-1">
              <span>👑</span>
              <span className="text-gray-400">Crown - Best of the best</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 