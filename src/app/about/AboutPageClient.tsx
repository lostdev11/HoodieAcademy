'use client';

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FoundingClassCard } from '@/components/about/FoundingClassCard';
import { TopContributorCard } from '@/components/about/TopContributorCard';
import { 
  Users, 
  Star, 
  Flame, 
  Sparkles, 
  Gift, 
  ArrowRight,
  ExternalLink,
  Trophy,
  Heart
} from 'lucide-react';

// Founding Class members (28 total)
const foundingClassMembers = [
  {
    name: 'Karen',
    xHandle: '@cryptokaren_sol',
    bio: 'Custom wardrobe traits + music',
    pfp: '/images/cryptokaren.png',
    hoodieNumber: 'Hoodie #1760'
  },
  {
    name: 'Vic',
    xHandle: '@YourHomieVic',
    bio: 'Bridging web2 & web3 with physical products - Creator Squad',
    pfp: '/images/vic.png',
    hoodieNumber: 'Hoodie #2866'
  },
  {
    name: 'Jordan / NFT Preacher',
    xHandle: '@The_CorpsLord',
    bio: 'Preaching the Gospel and NFTs to anyone who will listen.',
    pfp: '/images/nft-preacher.png',
    hoodieNumber: 'Hoodie #1433'
  },
  {
    name: 'Solstradamus',
    xHandle: '@Solstradamus',
    bio: 'OG, Portals Ambassador. Passionate guide in web3 education, hot takes, advice, etc.',
    pfp: '/images/solstra.jpg',
    hoodieNumber: 'Hoodie #4502'
  },
  // Placeholder data for remaining members
  ...Array.from({ length: 24 }, (_, i) => ({
    name: `Founding Member ${i + 5}`,
    xHandle: `@HoodieMember${i + 5}`,
    bio: `Early Academy member — Decoders Squad.`,
    pfp: undefined // Optional - can be added later
  }))
];

// Placeholder data for Top Contributors
const topContributors = [
  {
    username: 'Username',
    description: 'Course tester + feedback legend.',
    badge: 'star' as const
  },
  {
    username: 'AnotherHoodie',
    description: 'Design squad — early visuals direction.',
    badge: 'fire' as const
  },
  {
    username: 'ResearchHoodie',
    description: 'Research, writing, and clarity checks.',
    badge: 'star' as const
  }
];

export default function AboutPageClient() {
  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/Hoodie Courses.png"
          alt="Hoodie Courses Background"
          fill
          className="object-cover"
          priority
        />
      </div>
      
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/60 z-10"></div>
      
      <div className="relative z-20 px-4 sm:px-6 py-8 sm:py-12 max-w-6xl mx-auto">
        {/* Navigation Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">🎓 About Hoodie Academy</h1>
            <p className="text-base sm:text-lg text-gray-300">
              Learn about our community, Founding Class, and the people who make Web3 education accessible.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full hover:from-indigo-500 hover:to-purple-500 transition-all duration-200 font-semibold text-sm"
            >
              🏛️ Login to Academy
            </Link>
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-700 text-gray-300 rounded-full hover:bg-gray-800 transition-all duration-200 text-sm"
            >
              📝 Blog
            </Link>
            <Link
              href="/preview"
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-700 text-gray-300 rounded-full hover:bg-gray-800 transition-all duration-200 text-sm"
            >
              👀 Preview
            </Link>
          </div>
        </div>

        {/* Main About Section */}
        <Card className="mb-8 bg-[#1a1a1a]/80 backdrop-blur-sm border-gray-700">
          <CardHeader>
            <CardTitle className="text-2xl sm:text-3xl text-cyan-400">About Hoodie Academy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-300 leading-relaxed">
            <p className="text-base sm:text-lg">
              Hoodie Academy started as a simple idea:
            </p>
            <p className="text-lg sm:text-xl font-semibold text-cyan-300">
              Web3 education shouldn't feel confusing, intimidating, or locked behind hype.
            </p>
            <p>
              Most people don't need another "crypto guru."
            </p>
            <p>
              They need a community — something honest, grounded, and actually beginner-friendly.
            </p>
            <p>
              So we built Hoodie Academy as a gamified learning hub for Web3, trading, and digital culture.
              No flexing. No jargon walls. No gatekeeping.
              Just real people learning together, squad by squad.
            </p>
            <p className="font-semibold text-purple-300">
              And from the very beginning, this place has been shaped by the Hoodies themselves.
            </p>
          </CardContent>
        </Card>

        {/* Founding Class Section */}
        <Card className="mb-8 bg-[#1a1a1a]/80 backdrop-blur-sm border-gray-700">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Trophy className="w-6 h-6 text-yellow-400" />
              <CardTitle className="text-2xl sm:text-3xl text-yellow-400">The Founding Class</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4 text-gray-300 leading-relaxed">
              <p>
                When Hoodie Academy launched, a small group of early members stepped up — testing the site, giving feedback, helping shape the lessons, and making the Academy better for everyone who joins after them.
              </p>
              <p className="font-semibold text-yellow-300">
                This is the Founding Class: 28 Hoodies who were here before the world knew what we were building.
              </p>
              <p className="text-lg font-semibold text-cyan-300">
                They are the reason this Academy exists today.
              </p>
            </div>
            
            {/* Founding Class Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-6">
              {foundingClassMembers.map((member, index) => (
                <FoundingClassCard
                  key={index}
                  name={member.name}
                  xHandle={member.xHandle}
                  bio={member.bio}
                  pfp={member.pfp}
                  hoodieNumber={member.hoodieNumber}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Contributors Section */}
        <Card className="mb-8 bg-[#1a1a1a]/80 backdrop-blur-sm border-gray-700">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Flame className="w-6 h-6 text-orange-400" />
              <CardTitle className="text-2xl sm:text-3xl text-orange-400">Top Contributors</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4 text-gray-300 leading-relaxed">
              <p>
                These members consistently went above and beyond — giving feedback, testing new features, helping with course content, reporting bugs, and pushing the vision forward.
              </p>
            </div>
            
            {/* Top Contributors Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              {topContributors.map((contributor, index) => (
                <TopContributorCard
                  key={index}
                  username={contributor.username}
                  description={contributor.description}
                  badge={contributor.badge}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Why We Highlight Section */}
        <Card className="mb-8 bg-[#1a1a1a]/80 backdrop-blur-sm border-gray-700">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Heart className="w-6 h-6 text-pink-400" />
              <CardTitle className="text-2xl sm:text-3xl text-pink-400">Why We Highlight the Community</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-300 leading-relaxed">
            <p>
              Web3 has always been about ownership.
            </p>
            <p className="font-semibold text-pink-300">
              Hoodie Academy takes that seriously — the community isn't the audience; they're co-builders.
            </p>
            <p>
              Recognizing early contributors also helps with:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Trust</li>
              <li>Community pride</li>
              <li>Future holders understanding the culture</li>
            </ul>
            <div className="mt-6 p-4 bg-purple-900/30 border border-purple-500/30 rounded-lg">
              <p className="text-sm text-gray-300 mb-2">
                If you're in the Founding Class and want to rep your role, feel free to add this to your X bio:
              </p>
              <p className="font-semibold text-purple-300 mb-2">
                "Early Contributor — Hoodie Academy"
              </p>
              <Link
                href="https://hoodieacademy.com/preview"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 text-sm inline-flex items-center gap-1"
              >
                Link: https://hoodieacademy.com/preview
                <ExternalLink className="w-3 h-3" />
              </Link>
              <p className="text-xs text-gray-400 mt-2">
                This helps both the Academy and your personal brand.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Easter Egg Section */}
        <Card className="mb-8 bg-gradient-to-r from-purple-900/40 to-pink-900/40 backdrop-blur-sm border-purple-500/30">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Gift className="w-6 h-6 text-purple-400" />
              <CardTitle className="text-2xl sm:text-3xl text-purple-400">Easter Egg for WifHoodie Holders</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-300 leading-relaxed">
            <p>
              If you're a WifHoodie holder, there's something special coming…
            </p>
            <p>
              Very soon, the <Link href="https://retailstar.xyz/" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline transition-colors">Retailstar Mall</Link> universe will open a hidden door.
              Inside it? A place just for Hoodies — a hub, a portal, a small corner of the Mall that only the Academy will fully understand.
            </p>
            <p className="font-semibold text-purple-300 text-lg">
              You'll have your own HoodieHQ sooner than you think.
            </p>
            <p className="text-cyan-300">
              Keep your Hoodie close.
            </p>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <Card className="mb-8 bg-gradient-to-r from-indigo-900/40 to-purple-900/40 backdrop-blur-sm border-indigo-500/30">
          <CardHeader>
            <CardTitle className="text-2xl sm:text-3xl text-indigo-400">Want to Join the Academy?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-300 leading-relaxed">
            <p>
              The public preview gives you a taste of what we're building — tutorials, FAQs, and the T100 course.
            </p>
            <p>
              If you want the full experience — squads, bounties, higher-level modules, and upcoming collabs — you'll need a WifHoodie.
            </p>
            <div className="flex flex-wrap gap-4 mt-6">
              <Link href="/preview">
                <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white">
                  Explore Preview
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="border-indigo-500/50 text-indigo-300 hover:bg-indigo-500/10">
                  Join the Academy
                  <Sparkles className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
            <p className="text-lg font-semibold text-cyan-300 mt-4">
              Class is in session.
            </p>
            <p className="text-lg font-semibold text-cyan-300">
              Are you?
            </p>
          </CardContent>
        </Card>

        {/* Footer Navigation */}
        <footer className="mt-16 pt-8 border-t border-gray-800">
          <div className="flex flex-wrap justify-center gap-6 text-sm mb-4">
            <Link href="/" className="text-indigo-400 hover:text-indigo-300 transition-colors">
              Home
            </Link>
            <span className="text-gray-500">•</span>
            <Link href="/about" className="text-indigo-400 hover:text-indigo-300 transition-colors">
              About
            </Link>
            <span className="text-gray-500">•</span>
            <Link href="/preview" className="text-indigo-400 hover:text-indigo-300 transition-colors">
              Preview
            </Link>
            <span className="text-gray-500">•</span>
            <Link href="/faq" className="text-indigo-400 hover:text-indigo-300 transition-colors">
              FAQ
            </Link>
            <span className="text-gray-500">•</span>
            <Link href="/blog" className="text-indigo-400 hover:text-indigo-300 transition-colors">
              Blog
            </Link>
            <span className="text-gray-500">•</span>
            <Link href="/courses" className="text-indigo-400 hover:text-indigo-300 transition-colors">
              Courses
            </Link>
          </div>
          <div className="text-center text-gray-500 text-xs">
            © {new Date().getFullYear()} Hoodie Academy. All rights reserved.
          </div>
        </footer>
      </div>
    </div>
  );
}

