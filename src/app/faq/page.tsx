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
    canonical: '/faq',
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
        <h1 className="text-4xl font-bold mb-6">❓ Hoodie Academy FAQ</h1>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">What is Hoodie Academy?</h2>
          <p className="text-gray-300">
            Hoodie Academy is a Web3 education hub for curious learners, traders, and builders. We use squads, gamification, and real community to teach everything from crypto basics to advanced strategies.
          </p>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Do I need a wallet to access the site?</h2>
          <p className="text-gray-300">
            Only if you want full access. For now, you can check out the <Link href="/preview" className="text-indigo-300 underline">T100 free course preview</Link> — no wallet needed.
          </p>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">How do I join the full Academy?</h2>
          <p className="text-gray-300">
            You'll need to own a <strong>WifHoodie NFT</strong> and connect your wallet on the <Link href="/" className="underline text-indigo-300">main homepage</Link>. Each hoodie unlocks different features, squads, and course paths.
          </p>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Can I start learning for free?</h2>
          <p className="text-gray-300">
            Yep. Head to the <Link href="/preview" className="underline text-indigo-300">Preview Page</Link> to take our free beginner-friendly course on trading indicators.
          </p>
        </div>

        <div className="mt-12 border-t border-gray-700 pt-8 text-sm text-gray-500">
          Need more help? DM us on X or hop in our Discord.
        </div>
      </div>
    </div>
  );
}
