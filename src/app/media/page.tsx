export const dynamic = "force-static";

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Video, 
  Image, 
  Music, 
  FileText, 
  Download, 
  Share2,
  Sparkles,
  Play,
  Camera,
  Mic,
  Film
} from 'lucide-react';
import TokenGate from '@/components/TokenGate';
import Link from 'next/link';

export default function MediaPage() {
  return (
    <TokenGate>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Header */}
        <header className="bg-slate-800/50 border-b border-purple-500/30 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <Video className="w-8 h-8 text-purple-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-purple-400">My Media</h1>
                <p className="text-gray-300">Upload, manage, and share your content</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto p-6">
          {/* Coming Soon Banner */}
          <Card className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30 mb-8">
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                <Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-purple-400 mb-2">Media Center Coming Soon!</h2>
                <p className="text-gray-300 mb-4">
                  We're building an amazing media center where you can upload, organize, and share your content with the Hoodie Academy community.
                </p>
                <div className="bg-slate-700/50 p-4 rounded-lg mb-6">
                  <h3 className="text-sm font-semibold text-purple-400 mb-2">What's Coming</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4 text-purple-400" />
                      <span className="text-sm text-gray-300">Video uploads & streaming</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Image className="w-4 h-4 text-purple-400" />
                      <span className="text-sm text-gray-300">Image galleries & memes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Music className="w-4 h-4 text-purple-400" />
                      <span className="text-sm text-gray-300">Audio content & podcasts</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-purple-400" />
                      <span className="text-sm text-gray-300">Document sharing</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-4 justify-center">
                <Button asChild className="bg-purple-600 hover:bg-purple-700">
                  <Link href="/dashboard">
                    <Video className="w-4 h-4 mr-2" />
                    Back to Dashboard
                  </Link>
                </Button>
                <Button asChild variant="outline" className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10">
                  <Link href="/courses">
                    <Play className="w-4 h-4 mr-2" />
                    Explore Courses
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Preview of Media Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Video Content */}
            <Card className="bg-slate-800/50 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-purple-400 flex items-center space-x-2">
                  <Video className="w-5 h-5" />
                  <span>Video Content</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                        <Play className="w-4 h-4 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Course Recordings</p>
                        <p className="text-xs text-gray-400">Upload your learning videos</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-gray-600 text-gray-300">
                      Coming Soon
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-pink-500/20 rounded-full flex items-center justify-center">
                        <Film className="w-4 h-4 text-pink-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Tutorial Videos</p>
                        <p className="text-xs text-gray-400">Share your knowledge</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-gray-600 text-gray-300">
                      Coming Soon
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Image Content */}
            <Card className="bg-slate-800/50 border-green-500/30">
              <CardHeader>
                <CardTitle className="text-green-400 flex items-center space-x-2">
                  <Image className="w-5 h-5" />
                  <span>Image Content</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                        <Camera className="w-4 h-4 text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Meme Gallery</p>
                        <p className="text-xs text-gray-400">Share your crypto memes</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-gray-600 text-gray-300">
                      Coming Soon
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                        <Image className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Infographics</p>
                        <p className="text-xs text-gray-400">Educational visuals</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-gray-600 text-gray-300">
                      Coming Soon
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Audio Content */}
            <Card className="bg-slate-800/50 border-yellow-500/30">
              <CardHeader>
                <CardTitle className="text-yellow-400 flex items-center space-x-2">
                  <Music className="w-5 h-5" />
                  <span>Audio Content</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center">
                        <Mic className="w-4 h-4 text-yellow-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Podcasts</p>
                        <p className="text-xs text-gray-400">Share your insights</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-gray-600 text-gray-300">
                      Coming Soon
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center">
                        <Music className="w-4 h-4 text-orange-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Audio Lessons</p>
                        <p className="text-xs text-gray-400">Voice recordings</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-gray-600 text-gray-300">
                      Coming Soon
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Media Stats */}
          <Card className="bg-slate-800/50 border-purple-500/30 mt-8">
            <CardHeader>
              <CardTitle className="text-purple-400">Your Media Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-purple-400">0</p>
                  <p className="text-sm text-gray-400">Videos Uploaded</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-400">0</p>
                  <p className="text-sm text-gray-400">Images Shared</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-400">0</p>
                  <p className="text-sm text-gray-400">Audio Files</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-pink-400">0</p>
                  <p className="text-sm text-gray-400">Total Views</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Community Features Preview */}
          <Card className="bg-slate-800/50 border-cyan-500/30 mt-8">
            <CardHeader>
              <CardTitle className="text-cyan-400">Community Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4">
                  <Share2 className="w-12 h-12 text-cyan-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-white mb-2">Share & Collaborate</h3>
                  <p className="text-sm text-gray-400">Share your content with squad members and collaborate on projects</p>
                </div>
                <div className="text-center p-4">
                  <Download className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-white mb-2">Download & Offline</h3>
                  <p className="text-sm text-gray-400">Download content for offline viewing and learning</p>
                </div>
                <div className="text-center p-4">
                  <Badge className="w-12 h-12 text-purple-400 mx-auto mb-3 flex items-center justify-center">
                    <span className="text-lg">🏆</span>
                  </Badge>
                  <h3 className="text-lg font-semibold text-white mb-2">Earn Rewards</h3>
                  <p className="text-sm text-gray-400">Get rewarded for creating and sharing quality content</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </TokenGate>
  );
} 