import { Metadata } from 'next';
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: 'FAQ | Hoodie Academy',
  description: 'Find answers about Hoodie Academy access, free content, WifHoodies, and how to get started learning Web3 the right way.',
  keywords: [
    'Hoodie Academy FAQ',
    'Web3 education',
    'NFT access',
    'WifHoodie NFT',
    'crypto learning',
    'blockchain education',
    'free crypto courses',
    'wallet connection',
    'Hoodie Academy help'
  ],
  openGraph: {
    title: 'FAQ | Hoodie Academy',
    description: 'Find answers about Hoodie Academy access, free content, WifHoodies, and how to get started learning Web3 the right way.',
    type: 'website',
    url: 'https://hoodieacademy.com/faq',
    images: [{
      url: '/images/hoodie-academy-pixel-art-logo.png',
      width: 1200,
      height: 630,
      alt: 'Hoodie Academy FAQ - Web3 Education Help',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FAQ | Hoodie Academy',
    description: 'Find answers about Hoodie Academy access, free content, WifHoodies, and how to get started learning Web3.',
    images: ['/images/hoodie-academy-pixel-art-logo.png'],
  },
  alternates: {
    canonical: 'https://hoodieacademy.com/faq',
  },
};

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/Hoodie Dashbaord.png"
          alt="Hoodie Dashboard Background"
          fill
          className="object-cover"
          priority
        />
      </div>
      
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/60 z-10"></div>
      
      <div className="relative z-20 px-6 py-12 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">❓ Hoodie Academy FAQ</h1>
            <p className="text-gray-300 text-lg">
              Everything you need to know about joining, learning, and navigating the WifHoodie ecosystem.
            </p>
          </div>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full hover:from-indigo-500 hover:to-purple-500 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
          >
            📝 View Blog
          </Link>
        </div>

        <div className="space-y-8">
          {/* What is Hoodie Academy */}
          <div className="bg-[#1a1a1a]/80 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-3 text-cyan-400">What is Hoodie Academy?</h2>
            <p className="text-gray-300 leading-relaxed">
              Hoodie Academy is a beginner-friendly Web3 education platform that teaches crypto, NFTs, wallets, trading, and digital culture through gamified courses and squad-based learning. The Academy is built for curious beginners — no hype, no gurus, no jargon walls.
            </p>
          </div>

          {/* What is a WifHoodie */}
          <div className="bg-[#1a1a1a]/80 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-3 text-cyan-400">What is a WifHoodie?</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              <strong>WifHoodie is a 5,500-supply Solana NFT collection that acts as the membership pass to the entire Hoodie Academy ecosystem.</strong>
            </p>
            <p className="text-gray-300 leading-relaxed mb-4">
              Owning one unlocks:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4 mb-4">
              <li>Full Academy access</li>
              <li>All squads (Creators, Decoders, Speakers, Raiders, Rangers)</li>
              <li>Bounties, XP, and student progress tracking</li>
              <li>Advanced courses (T200–T300+)</li>
              <li>Holder-only features and collabs</li>
              <li>Hidden Retailstar Mall zones (HoodieHQ, coming soon)</li>
              <li>Staking + WIFH token rewards on <a href="https://wifhoodie.com" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline">wifhoodie.com</a></li>
              <li>Wardrobe customization on <a href="https://w3skins.com" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline">w3skins.com</a></li>
              <li>Prediction games, prize wheels, trait rerolls & more</li>
            </ul>
            <p className="text-gray-300 leading-relaxed mb-4">
              It's not just a PFP — it's your identity and access key inside the ecosystem.
            </p>
            <Link
              href="/blog/what-is-wifhoodie"
              className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 underline transition-colors"
            >
              👉 Read the Full Guide: "What Is WifHoodie?"
            </Link>
          </div>

          {/* How do I join the full Academy */}
          <div className="bg-[#1a1a1a]/80 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-3 text-cyan-400">How do I join the full Academy?</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              To unlock everything the Academy offers, you'll need:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-gray-300 ml-4 mb-4">
              <li>A Solana wallet</li>
              <li>A WifHoodie NFT</li>
              <li>Connect your wallet on the homepage</li>
            </ol>
            <p className="text-gray-300 leading-relaxed mb-4">
              Once connected, your Hoodie automatically unlocks your squad and learning paths.
            </p>
            <div className="flex flex-wrap gap-3 mt-4">
              <Link
                href="https://magiceden.io"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full hover:from-indigo-500 hover:to-purple-500 transition-all duration-200 text-sm font-semibold"
              >
                👉 Buy a WifHoodie (Magic Eden)
              </Link>
              <Link
                href="/blog/how-to-set-up-phantom-wallet"
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-700 text-gray-300 rounded-full hover:bg-gray-800 transition-all duration-200 text-sm"
              >
                👉 Get a Solana Wallet (Phantom Guide)
              </Link>
            </div>
          </div>

          {/* Where can I buy a WifHoodie */}
          <div className="bg-[#1a1a1a]/80 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-3 text-cyan-400">Where can I buy a WifHoodie?</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Always use trusted NFT marketplaces:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4 mb-4">
              <li><strong>Magic Eden</strong></li>
              <li><strong>Tensor</strong></li>
            </ul>
            <p className="text-gray-300 leading-relaxed">
              Never buy through random DMs or unofficial links.
            </p>
          </div>

          {/* Do I need a wallet to start learning */}
          <div className="bg-[#1a1a1a]/80 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-3 text-cyan-400">Do I need a wallet to start learning?</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Not at first.
            </p>
            <p className="text-gray-300 leading-relaxed mb-4">
              You can explore the <strong>free preview</strong> (T100 Trading Indicators course) without a wallet.
            </p>
            <p className="text-gray-300 leading-relaxed mb-4">
              Full access — squads, XP, bounties, advanced lessons — requires connecting a wallet with a WifHoodie.
            </p>
            <Link
              href="/preview"
              className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 underline transition-colors"
            >
              👉 Try the Free Preview Course
            </Link>
          </div>

          {/* What are squads */}
          <div className="bg-[#1a1a1a]/80 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-3 text-cyan-400">What are squads?</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Squads are your learning tracks inside Hoodie Academy.
            </p>
            <p className="text-gray-300 leading-relaxed mb-4">
              When you join, you commit to one squad for 30 days:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4 mb-4">
              <li><strong>Creators</strong> — art, design, memes, visuals</li>
              <li><strong>Decoders</strong> — technical analysis, security, on-chain literacy</li>
              <li><strong>Speakers</strong> — community building, communication, leadership</li>
              <li><strong>Raiders</strong> — trading, execution, strategic aggression</li>
              <li><strong>Rangers</strong> — research, exploration, cross-ecosystem knowledge</li>
            </ul>
            <p className="text-gray-300 leading-relaxed">
              Each squad has unique bounties, resources, and culture.
            </p>
          </div>

          {/* Is Hoodie Academy free */}
          <div className="bg-[#1a1a1a]/80 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-3 text-cyan-400">Is Hoodie Academy free?</h2>
            <p className="text-gray-300 leading-relaxed">
              The Academy's content is included with your WifHoodie.
            </p>
            <p className="text-gray-300 leading-relaxed mt-2">
              The <strong>only cost</strong> is the NFT itself — no monthly fee, no subscription.
            </p>
          </div>

          {/* What is WIFH and how does it work */}
          <div className="bg-[#1a1a1a]/80 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-3 text-cyan-400">What is WIFH and how does it work?</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              <strong>WIFH is a soft (non-sellable) token you earn through staking on <a href="https://wifhoodie.com" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline">wifhoodie.com</a>.</strong>
            </p>
            <p className="text-gray-300 leading-relaxed mb-4">
              It's used inside the ecosystem for:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4 mb-4">
              <li>Trait rerolls</li>
              <li>Prize wheel spins</li>
              <li>Prediction mini-games</li>
              <li>NFT raffles</li>
              <li>Cosmetic upgrades</li>
              <li>And future in-platform features</li>
            </ul>
            <p className="text-gray-300 leading-relaxed">
              Think of it like V-Bucks or Robux — a utility currency, not a tradeable token.
            </p>
          </div>

          {/* What platforms are part of the WifHoodie ecosystem */}
          <div className="bg-[#1a1a1a]/80 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-3 text-cyan-400">What platforms are part of the WifHoodie ecosystem?</h2>
            
            <div className="space-y-4 mb-4">
              <div>
                <h3 className="text-lg font-semibold text-purple-300 mb-2">
                  1. <a href="https://wifhoodie.com" target="_blank" rel="noopener noreferrer" className="text-purple-300 hover:text-purple-200 underline">wifhoodie.com</a> (Holder Hub)
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  Staking → WIFH tokens → rerolls, games, rewards.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-purple-300 mb-2">
                  2. <a href="https://w3skins.com" target="_blank" rel="noopener noreferrer" className="text-purple-300 hover:text-purple-200 underline">w3skins.com</a> (Wardrobe & Customization)
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  Customize your Hoodie or explore traits for any supported NFT collection.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-purple-300 mb-2">3. Partner Platforms</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                  <li><strong>DeSkins</strong> — DeGods wardrobe</li>
                  <li><strong>MidCrown</strong> — wardrobe + AI</li>
                  <li><strong>GetBeer</strong> — community platform for $BEER</li>
                </ul>
              </div>
            </div>

            <p className="text-gray-300 leading-relaxed mb-4">
              These integrations show the expansion of the ecosystem.
            </p>
            <Link
              href="/blog/what-is-wifhoodie"
              className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 underline transition-colors"
            >
              👉 View the Full WifHoodie Ecosystem Guide
            </Link>
          </div>

          {/* What do I need to get started if I'm totally new to crypto */}
          <div className="bg-[#1a1a1a]/80 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-3 text-cyan-400">What do I need to get started if I'm totally new to crypto?</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Start with these three guides:
            </p>
            <ul className="list-none space-y-2 text-gray-300 mb-4">
              <li>✔ <Link href="/blog/web3-explained-for-beginners" className="text-indigo-400 hover:text-indigo-300 underline">Web3 Explained for Beginners</Link></li>
              <li>✔ <Link href="/blog/how-to-set-up-phantom-wallet" className="text-indigo-400 hover:text-indigo-300 underline">How To Set Up a Phantom Wallet Safely</Link></li>
              <li>✔ <Link href="/blog/how-to-buy-crypto-safely" className="text-indigo-400 hover:text-indigo-300 underline">How to Buy Crypto Safely</Link></li>
            </ul>
            <p className="text-gray-300 leading-relaxed">
              Then take the <strong>T100 Beginner Course</strong> to build confidence.
            </p>
          </div>

          {/* How long are courses */}
          <div className="bg-[#1a1a1a]/80 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-3 text-cyan-400">How long are courses?</h2>
            <p className="text-gray-300 leading-relaxed">
              Each module is short, practical, and designed for busy people.
            </p>
            <p className="text-gray-300 leading-relaxed mt-2">
              You can complete most lessons in 10–15 minutes.
            </p>
          </div>

          {/* Is there a leaderboard or ranking system */}
          <div className="bg-[#1a1a1a]/80 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-3 text-cyan-400">Is there a leaderboard or ranking system?</h2>
            <p className="text-gray-300 leading-relaxed">
              Yes — XP, squads, and bounties all feed into the Academy's ranking system.
            </p>
            <p className="text-gray-300 leading-relaxed mt-2">
              Your progress updates automatically as you complete material.
            </p>
          </div>

          {/* What's HoodieHQ */}
          <div className="bg-[#1a1a1a]/80 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-3 text-cyan-400">What's HoodieHQ?</h2>
            <p className="text-gray-300 leading-relaxed">
              HoodieHQ is a hidden Retailstar Mall zone for WifHoodie holders.
            </p>
            <p className="text-gray-300 leading-relaxed mt-2">
              It's a lore-connected space that will unlock player inventory, meta-progression, and future worldbuilding bonuses.
            </p>
            <p className="text-gray-300 leading-relaxed mt-2 font-semibold text-purple-300">
              Coming soon.
            </p>
          </div>

          {/* I don't own a WifHoodie yet */}
          <div className="bg-[#1a1a1a]/80 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-3 text-cyan-400">I don't own a WifHoodie yet — where should I start?</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Right here:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-gray-300 ml-4">
              <li>Read "What Is WifHoodie?"</li>
              <li>Take the free T100 course</li>
              <li>Set up Phantom</li>
              <li>Buy a Hoodie when you're ready</li>
              <li>Join a squad and jump in</li>
            </ol>
          </div>

          {/* Still Have Questions CTA */}
          <div className="bg-gradient-to-r from-indigo-900/40 to-purple-900/40 backdrop-blur-sm border border-indigo-500/30 rounded-lg p-6 mt-8">
            <h2 className="text-2xl font-semibold mb-4 text-indigo-400">💡 Still Have Questions?</h2>
            <p className="text-gray-300 leading-relaxed mb-6">
              Check out our beginner blog series or hop into the community.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full hover:from-indigo-500 hover:to-purple-500 transition-all duration-200 font-semibold"
              >
                👉 Read the Blog
              </Link>
              <Link
                href="/preview"
                className="inline-flex items-center gap-2 px-6 py-3 border border-gray-700 text-gray-300 rounded-full hover:bg-gray-800 transition-all duration-200"
              >
                👉 Explore Preview
              </Link>
              <Link
                href="https://magiceden.io"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 border border-gray-700 text-gray-300 rounded-full hover:bg-gray-800 transition-all duration-200"
              >
                👉 Get a WifHoodie
              </Link>
            </div>
            <p className="text-lg font-semibold text-cyan-300 mt-6">
              Class is in session.
            </p>
            <p className="text-lg font-semibold text-cyan-300">
              Are you?
            </p>
          </div>
        </div>

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
          <div className="text-center text-gray-500 text-xs mb-4">
            © {new Date().getFullYear()} Hoodie Academy. All rights reserved.
          </div>
          <div className="text-center text-sm text-gray-500">
            Need more help? DM us on X or hop in our Discord.
          </div>
        </footer>
      </div>
    </div>
  );
}
