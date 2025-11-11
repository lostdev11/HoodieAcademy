import { Metadata } from 'next';
import Link from "next/link";
import Image from "next/image";
import PreviewSubmissionForm from "@/components/preview/PreviewSubmissionForm";

export const metadata: Metadata = {
  title: 'Explore Hoodie Academy | Free T100 Preview Course',
  description: 'Get a taste of Hoodie Academy with our free T100 course on RSI, Bollinger Bands, Fibonacci, and candlestick basics. No wallet required.',
  keywords: [
    'free crypto course',
    'technical analysis',
    'RSI trading',
    'Bollinger Bands',
    'Fibonacci levels',
    'candlestick patterns',
    'Web3 education',
    'Hoodie Academy preview',
    'crypto trading basics',
    'free trading course'
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'Explore Hoodie Academy | Free T100 Preview Course',
    description: 'Get a taste of Hoodie Academy with our free T100 course on RSI, Bollinger Bands, Fibonacci, and candlestick basics. No wallet required.',
    type: 'website',
    url: 'https://hoodieacademy.com/preview',
    images: [{
      url: '/images/hoodie-academy-pixel-art-logo.png',
      width: 1200,
      height: 630,
      alt: 'Hoodie Academy Preview - Free T100 Course',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Explore Hoodie Academy | Free T100 Preview Course',
    description: 'Get a taste of Hoodie Academy with our free T100 course on RSI, Bollinger Bands, Fibonacci, and candlestick basics.',
    images: ['/images/hoodie-academy-pixel-art-logo.png'],
  },
  alternates: {
    canonical: 'https://hoodieacademy.com/preview',
  },
};

export default function PreviewPage() {
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
      
      <div className="relative z-20 px-6 py-12 max-w-4xl mx-auto">
        {/* Navigation Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">🎓 Preview Hoodie Academy</h1>
            <p className="text-lg text-gray-300">
              Not ready to connect your wallet yet? No problem. Here's one free course to explore what Hoodie Academy is all about.
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
              href="/faq"
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-700 text-gray-300 rounded-full hover:bg-gray-800 transition-all duration-200 text-sm"
            >
              ❓ FAQ
            </Link>
          </div>
        </div>

        <div className="border border-gray-700 rounded-xl p-6 bg-[#1a1a1a]/80 backdrop-blur-sm">
          <h2 className="text-2xl font-semibold mb-1">T100 🎯 Intro to Indicators</h2>
          <p className="text-indigo-400 mb-2">RSI, BBands, Fibs + Candle Basics</p>
          <p className="text-sm text-gray-300 mb-4">
            Learn the core tools of technical analysis: RSI, Bollinger Bands, Fibonacci levels, and candlestick theory. Start building your edge in the charts — no jargon, no fluff.
          </p>
          <Link
            href="/courses/t100-chart-literacy"
            className="inline-block mt-2 px-4 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-500 transition"
          >
            Start Learning
          </Link>
        </div>

        {/* Preview Submission Form */}
        <div className="mt-8">
          <PreviewSubmissionForm />
        </div>

        {/* Footer Navigation */}
        <footer className="mt-16 pt-8 border-t border-gray-800">
          <div className="flex flex-wrap justify-center gap-6 text-sm mb-4">
            <Link href="/" className="text-indigo-400 hover:text-indigo-300 transition-colors">
              Home
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
